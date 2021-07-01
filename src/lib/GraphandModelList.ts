import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelListPromise from "./GraphandModelListPromise";

class GraphandModelList extends Array implements Array<any> {
  _model;
  count;
  _query;

  constructor({ model, count, query }: { model?; count?; query? }, ...elements) {
    if (!elements?.length) {
      elements = [];
    }

    if (!model) {
      // @ts-ignore
      return super(...elements);
    }

    super(...elements);

    this._model = model;
    this.count = count || 0;
    this._query = query;

    Object.defineProperty(this, "_model", { enumerable: false });
    Object.defineProperty(this, "count", { enumerable: false });
    Object.defineProperty(this, "_query", { enumerable: false });
  }

  get ids() {
    return this.toArray()
      .map((item) => item?._id || item)
      .filter(Boolean);
  }

  get model() {
    return this._model || this[0]?.constructor;
  }

  get query() {
    return this._query || { ids: this.ids };
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

  toArray() {
    return new Array(...this);
  }

  clone(concatWith?: GraphandModel | GraphandModelList) {
    const elements = concatWith ? this.toArray().concat(concatWith) : this.toArray();
    return new GraphandModelList(this, ...elements);
  }

  reload() {
    return this.model.getList(this.query);
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevSerial = _this.toArray().map((item) => item.serialize());
      _this.model._listSubject.subscribe(async (_list) => {
        const list = await _this.model.getList(_this.query);
        const serial = list.toArray().map((item) => item.serialize());
        if (prevSerial.length !== serial.length || !isEqual(serial, prevSerial)) {
          prevSerial = serial;
          subscriber.next(list);
        }
      });
    });
    return observable.subscribe.apply(observable, arguments);
  }

  encodeQuery() {
    return this.ids;
  }

  toString() {
    return JSON.stringify(this.ids);
  }

  toJSON() {
    return this.map((i) => i.toJSON?.apply(i) || i);
  }

  static hydrate(data: any, model: any) {
    data = data ?? {};

    if (Array.isArray(data)) {
      const list = data.map((i) => new model(i));
      return new this({ model }, ...list);
    }

    const { __count: count, __query: query, __payload } = data;
    const items = __payload ? __payload.map((i) => model.hydrate(i)) : [];
    return new this({ model, count, query }, ...items);
  }

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
