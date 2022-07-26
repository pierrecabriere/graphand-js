import { Observable, Subscription } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelList from "./GraphandModelList";
import GraphandModelPromise from "./GraphandModelPromise";

class GraphandModelListPromise<T extends GraphandModel> extends GraphandModelPromise<GraphandModelList<T>> {
  _observable;
  _resSub;

  constructor(executor, model: typeof GraphandModel, query?) {
    super(executor, model, query);

    if (this.ids) {
      Object.defineProperty(this, "ids", { enumerable: true, get: () => this._ids });
    }
  }

  /**
   * @readonly
   * @type {string[]}
   * @public
   */
  get _ids() {
    if (this.query?.ids) {
      return Array.isArray(this.query.ids) ? this.query.ids : [this.query.ids];
    }

    return [];
  }

  /**
   * @readonly
   * @type {string[]}
   * @public
   */
  get ids() {
    if (this.query?.ids) {
      return Array.isArray(this.query.ids) ? this.query.ids : [this.query.ids];
    }

    return [];
  }

  get length() {
    return this.ids?.length || null;
  }

  clone() {
    return new GraphandModelListPromise(this.executor, this.model, this.query);
  }

  concat(
    concatWith?: GraphandModel | GraphandModelPromise<GraphandModel> | GraphandModelList<GraphandModel> | GraphandModelListPromise<GraphandModel>,
  ) {
    const clone = this.clone();
    if (!concatWith) {
      return clone;
    } else if (typeof concatWith !== "object") {
      concatWith = new this.model({ _id: concatWith });
    }

    const concatIds = "ids" in concatWith ? concatWith.ids : [concatWith._id];
    clone.query.ids = clone.query.ids || [];
    clone.query.ids = clone.query.ids.concat(concatIds);

    if ("query" in concatWith && concatWith.query.query) {
      clone.query.query = clone.query.query ? { $or: [clone.query.query, concatWith.query.query] } : concatWith.query.query;
    }

    return clone;
  }

  toJSON() {
    return this.ids;
  }

  encodeQuery() {
    return this.ids;
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  createObservable() {
    this._observable = new Observable((subscriber) => {
      this.then((res) => (this._resSub = res?.subscribe?.apply(res, [(r) => subscriber.next(r)])));
    });
  }

  /**
   * Subscribe to the list. The callback will be called each time (an instance inside) the list is updated in store.
   * If the model is synced (realtime), the callback will be called when the list is updated via socket
   * @param callback - The function to call when the list is updated
   */
  subscribe(callback): Subscription {
    if (!this._observable) {
      this.createObservable();
    }

    const sub = this._observable.subscribe(callback);
    const unsubscribe = sub.unsubscribe;
    sub.unsubscribe = () => {
      unsubscribe.apply(sub);
      this._resSub?.unsubscribe();
      delete this._observable;
    };

    return sub;
  }
}

export default GraphandModelListPromise;
