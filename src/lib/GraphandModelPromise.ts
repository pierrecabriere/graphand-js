import GraphandModel from "./GraphandModel";

const _propertiesMiddleware = (fromModel, toModel, middleware) => {
  const fromKeys = Object.getOwnPropertyNames(fromModel.prototype);
  const toKeys = Object.getOwnPropertyNames(toModel.prototype);
  const patchKeys = fromKeys.filter((key) => !toKeys.includes(key) && typeof fromModel.prototype[key] === "function");

  const patch = {};
  patchKeys.forEach((key) => {
    patch[key] = function () {
      return middleware(this, fromModel.prototype[key], arguments);
    };
  });

  return Object.assign(toModel.prototype, patch);
};

class GraphandModelPromise {
  executor: Function;
  cached;
  model;
  promise?;
  query;
  then;

  // @ts-ignore
  constructor(executor, model, query?, cached = false) {
    this.executor = executor;
    this.cached = cached;

    // if (!model || !(model.prototype instanceof GraphandModel)) {
    //   throw new Error("Please provide a valid model");
    // }

    this.model = model;
    this.query = query || {};

    if (model) {
      model.modelPromise?.call(model, this);
    }

    Object.defineProperty(this, "executor", { enumerable: false });
    Object.defineProperty(this, "cached", { enumerable: false });
    Object.defineProperty(this, "model", { enumerable: false });

    if (this._id) {
      Object.defineProperty(this, "_id", { enumerable: true, value: this._id });
    }
    if (this._id) {
      Object.defineProperty(this, "_id", { enumerable: true, value: this._id });
      Object.defineProperty(this, "query", { enumerable: false });
    }
    if (!Object.keys(this.query).length) {
      Object.defineProperty(this, "query", { enumerable: false });
    }
  }

  get _id() {
    const { query } = this;
    const _id = typeof query === "object" && query.query?._id ? query.query._id : query;
    return typeof _id === "string" ? _id : null;
  }

  subscribe() {
    return this.then((res) => res?.subscribe?.apply(res, arguments));
  }

  toString() {
    return this._id;
  }

  serialize() {
    return this._id;
  }

  toPromise() {
    // @ts-ignore
    return new Promise(this.executor);
  }
}

_propertiesMiddleware(Promise, GraphandModelPromise, (item, fn, args) => {
  item.promise = item.promise || item.toPromise();
  return fn.apply(item.promise, args);
});

export default GraphandModelPromise;
