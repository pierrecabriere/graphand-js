// @ts-ignore
class GraphandModelPromise extends Promise {
  _id;

  then: Function;

  constructor(executor, _id?) {
    super(executor);
    if (_id) {
      this._id = _id;
    }
  }

  toString() {
    return this._id;
  }
}

export default GraphandModelPromise;
