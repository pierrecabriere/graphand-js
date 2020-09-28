// @ts-ignore
class GraphandModelPromise extends Promise {
  _id;
  cached;
  model;
  then: Function;
  update: Function;
  delete: Function;

  constructor(executor, model, _id?, cached = false) {
    super(executor);
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
}

export default GraphandModelPromise;
