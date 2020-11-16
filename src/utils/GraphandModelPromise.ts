class GraphandModelPromise {
  _id;
  executor: Function;
  cached;
  model;
  update: Function;
  delete: Function;
  promise?;

  constructor(executor, model, _id?, cached = false) {
    this.executor = executor;
    this.cached = cached;
    if (_id) {
      this._id = _id;
    }
    if (model) {
      this.model = model;

      if (_id) {
        this.update = function () {
          model.update({ _id }, ...arguments);
        };

        this.delete = function () {
          model.delete({ _id }, ...arguments);
        };
      }

      model.modelPromise(this);
    }
  }

  get id() {
    return this._id;
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

  toString() {
    return this._id;
  }

  toPromise() {
    // @ts-ignore
    return new Promise(this.executor);
  }

  then(..._arguments) {
    this.promise = this.promise || this.toPromise();
    return this.promise.then.apply(this.promise, _arguments);
  }

  catch(..._arguments) {
    this.promise = this.promise || this.toPromise();
    return this.promise.catch.apply(this.promise, _arguments);
  }
}

export default GraphandModelPromise;
