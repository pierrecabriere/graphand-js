class GraphandModelPromise {
  executor: Function;
  cached;
  model;
  promise?;
  query;

  constructor(executor, model, query?, cached = false) {
    this.executor = executor;
    this.cached = cached;

    this.model = model;
    this.query = query || {};

    model.modelPromise(this);

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

  translate(locale) {
    if (locale) {
      return this.then((res) => res?.translate?.call(res, locale));
    }

    return this;
  }

  subscribe() {
    return this.then((res) => res?.subscribe?.apply(res, arguments));
  }

  update() {
    return this.then((i) => i.update?.apply(i, arguments));
  }

  delete() {
    return this.then((i) => i.update?.apply(i, arguments));
  }

  then(..._arguments) {
    this.promise = this.promise || this.toPromise();
    return this.promise.then.apply(this.promise, _arguments);
  }

  catch(..._arguments) {
    this.promise = this.promise || this.toPromise();
    return this.promise.catch.apply(this.promise, _arguments);
  }

  toString() {
    return this._id;
  }

  toPromise() {
    // @ts-ignore
    return new Promise(this.executor);
  }
}

export default GraphandModelPromise;
