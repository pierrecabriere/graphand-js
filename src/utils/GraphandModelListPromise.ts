import GraphandModelPromise from "./GraphandModelPromise";

class GraphandModelListPromise extends GraphandModelPromise {
  query;

  then: Function;

  private _observer;

  constructor(executor, model, query) {
    super(executor, model);
    this.query = query;
  }

  get _ids() {
    if (this.query?.query?._id?.$in) {
      return this.query?.query?._id?.$in;
    }

    return [];
  }
}

export default GraphandModelListPromise;
