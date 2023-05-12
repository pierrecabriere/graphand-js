import { Observable, Subscription } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelListPromise from "./GraphandModelListPromise";

/**
 * @class GraphandModelList
 */
class GraphandModelList<T extends GraphandModel> extends Array<T> {
  count;
  private _observable;
  private _storeSub;
  private _subscriptions;

  constructor({ model, count, query, rows }: { model?; count?; query?; rows? }, ...elements) {
    if (!elements?.length) {
      elements = [];
    }

    if (!model) {
      // @ts-ignore
      return Array.from(elements);
    }

    super(...elements);

    if (rows?.length) {
      this.push(...rows);
    }

    this._model = model;
    this.count = count || 0;
    this._query = query;
    this._subscriptions = new Set();

    Object.defineProperty(this, "_model", { enumerable: false });
    Object.defineProperty(this, "count", { enumerable: false });
    Object.defineProperty(this, "_query", { enumerable: false });
  }

  _model;
  _query;

  /**
   * @readonly
   * @type {GraphandModel}
   * @public
   */
  get model() {
    return this._model || this[0]?.constructor;
  }

  /**
   * @readonly
   * @type {any}
   * @public
   */
  get query() {
    return this._query || { ids: this.ids };
  }

  /**
   * @readonly
   * @type {string[]}
   * @public
   */
  get ids() {
    return this.toArray()
      .map((item) => item?._id || String(item))
      .filter(Boolean) as string[];
  }

  /**
   * @readonly
   * @type {GraphandModelListPromise}
   * @public
   */
  get promise() {
    return new GraphandModelListPromise(
      (resolve) => {
        resolve(this);
      },
      this.model,
      this.query,
    );
  }

  /**
   * Hydrate GraphandModelList from serialized data
   * @param data {any} - Serialized data
   * @returns {GraphandModelList}
   */
  static hydrate(data: any, model: any) {
    if (!model) {
      throw new Error(`You need to provide a model to hydrate a new GraphandModelList`);
    }

    data = data ?? {};

    if (Array.isArray(data)) {
      const list = data.map((i) => new model(i));
      return new GraphandModelList({ model }, ...list);
    }

    const { __count: count, __query: query, __payload } = data;
    const items = __payload ? __payload.map((i) => model.hydrate(i)) : [];
    return new GraphandModelList({ model, count, query }, ...items);
  }

  toArray() {
    return new Array<T>(...this);
  }

  clone(concatWith?: T | GraphandModelList<T>) {
    let concatArray: ConcatArray<T>;
    if (Array.isArray(concatWith)) {
      concatArray = concatWith.toArray?.() || concatWith;
    } else if (concatWith) {
      concatArray = [concatWith];
    }

    const elements = concatArray?.length ? this.toArray().concat(concatArray) : this.toArray();
    return new GraphandModelList(this, ...elements);
  }

  async reload() {
    const list = await this.model.getList(this.query);
    this.splice(0, this.length, ...list);
    this.count = list.count;
    return this;
  }

  createObservable() {
    this._observable = new Observable((subscriber) => {
      let prevLastUpdated = this.map((i) => i.updatedAt).sort((a, b) => b.getTime() - a.getTime())[0];

      const _updater = async () => {
        await new Promise((resolve) => setTimeout(resolve));
        const list = await this.model.getList(this.query);
        const lastUpdated = list.map((i) => i.updatedAt).sort((a, b) => b - a)[0];

        if (this.length !== list.length || this.count !== list.count || lastUpdated > prevLastUpdated) {
          prevLastUpdated = lastUpdated;

          this.splice(0, this.length, ...list.toArray());
          this.count = list.count;

          subscriber.next(this);
        }
      };

      this._storeSub = this.model._listSubject.subscribe(_updater);
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
    this._subscriptions.add(sub);
    const unsubscribe = sub.unsubscribe;
    sub.unsubscribe = () => {
      unsubscribe.apply(sub);
      this._subscriptions.delete(sub);

      if (!this._subscriptions.size) {
        this._storeSub?.unsubscribe();
        delete this._observable;
      }
    };

    sub.next(this);
    return sub;
  }

  encodeQuery() {
    return this.ids;
  }

  toString(): string {
    return JSON.stringify(this.ids);
  }

  toJSON() {
    return this.map((i) => i.toJSON?.apply(i) || i);
  }

  /**
   * Serialize list. Serialized data could be hydrated with GraphandModel.hydrate
   * @returns {Object}
   */
  serialize() {
    return {
      __type: "GraphandModelList",
      __scope: this.model.scope,
      __count: this.count,
      __query: this.query,
      __payload: this.map((i) => i.serialize?.apply(i) || i),
    };
  }
}

export default GraphandModelList;
