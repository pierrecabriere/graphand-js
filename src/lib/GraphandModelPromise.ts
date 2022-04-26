import { Observable, Subscription } from "rxjs";

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

class GraphandModelPromise<T> implements Promise<T> {
  executor;
  model;
  promise?;
  query;
  then;
  catch;
  finally;
  [Symbol.toStringTag];

  _observable;
  _resSub;

  constructor(executor, model, query?) {
    const self = this;

    self.executor = executor;

    // if (!model || !(model.prototype instanceof GraphandModel)) {
    //   throw new Error("Please provide a valid model");
    // }

    self.model = model;
    self.query = query || {};

    if (model) {
      model._universalPrototypeMethods.forEach((slug) => {
        self[slug] = model.prototype[slug].bind(self);
      });
    }

    Object.defineProperty(self, "executor", { enumerable: false });
    Object.defineProperty(self, "model", { enumerable: false });

    if (self._id) {
      Object.defineProperty(self, "_id", { enumerable: true, value: self._id });
      Object.defineProperty(self, "query", { enumerable: false });
    }
    if (!Object.keys(self.query).length) {
      Object.defineProperty(self, "query", { enumerable: false });
    }
  }

  get _id() {
    const { query } = this;
    const _id = typeof query === "object" && query.query?._id ? query.query._id : query;
    return typeof _id === "string" ? _id : null;
  }

  toString(): string {
    return this._id;
  }

  encodeQuery() {
    return this._id;
  }

  toPromise() {
    return new Promise(this.executor);
  }

  createObservable() {
    this._observable = new Observable((subscriber) => {
      this.then((res) => (this._resSub = res?.subscribe?.apply(res, [(r) => subscriber.next(r)])));
    });
  }

  subscribe(callback): Subscription {
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
