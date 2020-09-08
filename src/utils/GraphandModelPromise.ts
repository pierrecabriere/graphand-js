// @ts-ignore
class GraphandModelPromise extends Promise {
  _id;
  cached;
  then: Function;

  constructor(executor, _id?, cached = false) {
    super(executor);
    this.cached = cached;
    if (_id) {
      this._id = _id;
    }
  }

  translate(locale) {
    if (locale) {
      return this.then((res) => res?.translate?.call(res, locale));
    }

    return this;
  }

  toString() {
    return this._id;
  }
}

export default GraphandModelPromise;
