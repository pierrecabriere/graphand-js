import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModelListPromise from "./GraphandModelListPromise";
import GraphandModel from "./GraphandModel";
import GraphandModelPromise from "./GraphandModelPromise";

const _propertiesMiddleware = (fromModel, toModel, middleware) => {
  const fromKeys = Object.getOwnPropertyNames(fromModel.prototype);
  const toKeys = Object.getOwnPropertyNames(toModel.prototype);
  const patchKeys = fromKeys.filter((key) => !toKeys.includes(key) && typeof fromModel.prototype[key] === "function");

  const patch = {};
  patchKeys.forEach((key) => {
    patch[key] = function() {
      return middleware(this, fromModel.prototype[key], arguments, key);
    }
  })

  return Object.assign(toModel.prototype, patch);
};

class GraphandModelList extends Array implements Array<any> {
  _model;
  count;
  _query;

  constructor({ model, count, query }: { model?; count?; query? }, ...elements) {
    if (!elements?.length) {
      elements = [];
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
    return this.map((item) => item?._id || item).filter(Boolean);
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

  clone(concatWith?: GraphandModel | GraphandModelPromise | GraphandModelList | GraphandModelListPromise) {
    const elements = concatWith ? this.toArray().concat(concatWith) : this.toArray();
    return new GraphandModelList(this, ...elements);
  }

  // @ts-ignore
  concat(concatWith?: GraphandModel | GraphandModelPromise | GraphandModelList | GraphandModelListPromise) {
    // @ts-ignore
    if (!(concatWith instanceof GraphandModel) && !(concatWith instanceof GraphandModelPromise) && !(concatWith instanceof GraphandModelList) && !(concatWith instanceof GraphandModelListPromise)) {
      return Array.prototype.concat.apply(this, arguments);
    }

    if (!concatWith) {
      return this.clone();
    } else if (typeof concatWith !== "object") {
      concatWith = new this.model({ _id: concatWith });
    }

    const clone = this.clone(concatWith);

    const concatIds = "ids" in concatWith ? concatWith.ids : [concatWith._id];
    clone.query.ids = clone.query.ids || [];
    clone.query.ids = clone.query.ids.concat(concatIds);

    if ("query" in concatWith && concatWith.query.query) {
      clone.query.query = clone.query.query ? { $or: [clone.query.query, concatWith.query.query] } : concatWith.query.query;
    }

    return clone;
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = _this.map((item) => item.raw);
      _this.model._listSubject.subscribe(async (_list) => {
        const query = _this.query || { ids: _this.ids };
        const list = await _this.model.getList(query);
        const raw = list.map((item) => item?.raw);
        if (prevRaw.length !== raw.length || !isEqual(raw, prevRaw)) {
          prevRaw = raw;
          subscriber.next(list);
        }
      });
    });
    return observable.subscribe.apply(observable, arguments);
  }

  serialize() {
    return this.ids;
  }

  toString() {
    return JSON.stringify(this.ids);
  }
}

export default GraphandModelList;
