import { deepEqual } from "fast-equals";
import { Observable, Subscriber, Subscription } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelListPromise from "./GraphandModelListPromise";

/**
 * @class GraphandModelList
 */
class GraphandModelList<T extends GraphandModel> extends Array implements Array<T> {
  count;
  private _observable;
  private _storeSub;
  private _subscriptions;

  constructor({ model, count, query, rows }: { model?; count?; query?; rows? }, ...elements) {
    if (!elements?.length) {
      elements = [];
    }

    if (rows?.length) {
      elements = elements.concat(rows);
    }

    if (!model) {
      // @ts-ignore
      return super(...elements);
    }

    super(...elements);

    this._model = model;
    this.count = count || 0;
    this._query = query;
    this._subscriptions = new Set();

    Object.defineProperty(this, "_model", { enumerable: false });
    Object.defineProperty(this, "count", { enumerable: false });
    Object.defineProperty(this, "_query", { enumerable: false });
  }

  _model;

  get model() {
    return this._model || this[0]?.constructor;
  }

  _query;

  get query() {
    return this._query || { ids: this.ids };
  }

  get ids() {
    return this.toArray()
      .map((item) => item?._id || item)
      .filter(Boolean);
  }

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
      return new this({ model }, ...list);
    }

    const { __count: count, __query: query, __payload } = data;
    const items = __payload ? __payload.map((i) => model.hydrate(i)) : [];
    return new this({ model, count, query }, ...items);
  }

  toArray() {
    return new Array(...this);
  }

  clone(concatWith?: GraphandModel | GraphandModelList<GraphandModel>) {
    const elements = concatWith ? this.toArray().concat(concatWith) : this.toArray();
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
      let prevSerial = this.toArray().map((item) => JSON.stringify(item.serialize?.apply(item)).normalize());
      this._storeSub = this.model._listSubject.subscribe(() => {
        setTimeout(async () => {
          const list = await this.model.getList(this.query, { cache: true });
          const listArray = list.toArray();

          let reload = false;
          if (prevSerial.length !== listArray.length) {
            reload = true;
            prevSerial = listArray.map((item) => JSON.stringify(item.serialize?.apply(item)).normalize());
          } else {
            const serial = listArray.map((item) => JSON.stringify(item.serialize?.apply(item)).normalize());
            if (!deepEqual(serial, prevSerial)) {
              reload = true;
              prevSerial = serial;
            }
          }

          if (reload) {
            this.splice(0, this.length, ...listArray);
            this.count = list.count;

            subscriber.next(this);
          }
        });
      });
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
