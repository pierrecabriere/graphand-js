import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";

class GraphandModelList extends Array implements Array<any> {
  model;
  count;
  query;

  constructor({ model, count, query }: { model?; count?; query? }, ...elements) {
    super(...elements);
    this.model = model;
    this.count = count || 0;
    this.query = query;
  }

  get _ids() {
    return this.map((item) => item?._id).filter((_id) => _id);
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = _this.map((item) => item.raw);
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
    return observable.subscribe.apply(observable, arguments);
  }
}

export default GraphandModelList;
