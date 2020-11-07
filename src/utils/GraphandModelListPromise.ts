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
      return Array.isArray(this.query.query._id.$in) ? this.query.query._id.$in : [this.query.query._id.$in] ;
    }

    return [];
  }

  get length() {
    return this._ids?.length || null;
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = null;
      _this.model.listSubject.subscribe(async () => {
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
