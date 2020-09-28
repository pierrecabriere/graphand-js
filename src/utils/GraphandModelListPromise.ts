import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModelPromise from "./GraphandModelPromise";

class GraphandModelListPromise extends GraphandModelPromise {
  model;
  query;

  then: Function;

  private _subscription;

  constructor(executor, model, query) {
    super(executor, model);
    this.model = model;
    this.query = query;
  }

  get _ids() {
    if (this.query?.query?._id?.$in) {
      return this.query?.query?._id?.$in;
    }

    return [];
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = null;
      _this.model.store.subscribe(async () => {
        const query = _this.query || { query: { _id: { $in: _this._ids } } };
        const list = await _this.model.getList(query);
        const raw = list.map((item) => item?.raw);
        if (!isEqual(raw, prevRaw)) {
          prevRaw = raw;
          subscriber.next(list);
        }
      });
    });
    this._subscription = observable.subscribe.apply(observable, arguments);
    return this.then((res) => {
      this._subscription.unsubscribe();
      return res?.subscribe?.apply(res, arguments);
    });
  }
}

export default GraphandModelListPromise;
