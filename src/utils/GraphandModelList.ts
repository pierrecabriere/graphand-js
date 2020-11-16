import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";

class GraphandModelList extends Array implements Array<any> {
  _model;
  count;
  _query;

  constructor({ model, count, query }: { model?; count?; query? }, ...elements) {
    super(...elements);
    this._model = model;
    this.count = count || 0;
    this._query = query;
  }

  get ids() {
    return this.map((item) => item?._id).filter((_id) => _id);
  }

  get model() {
    return this._model || this[0]?.constructor;
  }

  get query() {
    return this._query || { ids: this.ids };
  }

  get promise() {
    return this.model.getList(this.query);
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = _this.map((item) => item.raw);
      _this.model.listSubject.subscribe(async () => {
        const query = _this.query || { ids: _this.ids };
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
