import { Observable } from "rxjs";

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
  model;
  promise?;
  query;
  then;

  _observable;
  _resSub;

  constructor(executor, model, query?) {
    this.executor = executor;

    // if (!model || !(model.prototype instanceof GraphandModel)) {
    //   throw new Error("Please provide a valid model");
    // }

    this.model = model;
    this.query = query || {};

    if (model) {
      model.universalPrototypeMethods.forEach((slug) => {
        this[slug] = model.prototype[slug].bind(this);
      });
    }

    Object.defineProperty(this, "executor", { enumerable: false });
    Object.defineProperty(this, "model", { enumerable: false });

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

  toString() {
    return this._id;
  }

  encodeQuery() {
    return this._id;
  }

  toPromise() {
    // @ts-ignore
    return new Promise(this.executor);
  }

  createObservable() {
    this._observable = new Observable((subscriber) => {
      this.then((res) => (this._resSub = res?.subscribe?.apply(res, [(r) => subscriber.next(r)])));
    });
  }

  subscribe() {
    if (!this._observable) {
      this.createObservable();
    }

    const sub = this._observable.subscribe.apply(this._observable, arguments);
    const unsubscribe = sub.unsubscribe;
    sub.unsubscribe = () => {
      unsubscribe.apply(sub);
      this._resSub?.unsubscribe();
      delete this._observable;
    };

    return sub;
  }
}

_propertiesMiddleware(Promise, GraphandModelPromise, (item, fn, args) => {
  item.promise = item.promise || item.toPromise();
  return fn.apply(item.promise, args);
});

export default GraphandModelPromise;
