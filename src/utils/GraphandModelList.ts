import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModelListPromise from "./GraphandModelListPromise";

class GraphandModelList extends Array implements Array<any> {
  _model;
  count;
  _query;

  constructor({ model, count, query }: { model?; count?; query? }, ...elements) {
    super(...elements);
    this._model = model;
    this.count = count || 0;
    this._query = query;

    Object.defineProperty(this, "_model", { enumerable: false });
    Object.defineProperty(this, "count", { enumerable: false });
    Object.defineProperty(this, "_query", { enumerable: false });
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
    return new GraphandModelListPromise(
      (resolve) => {
        resolve(this);
      },
      this.model,
      this.query,
    );
  }

  // @ts-ignore
  map(mapFn: Function) {
    // @ts-ignore
    return new Array(...this).map(mapFn);
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = _this.map((item) => item.raw);
      _this.model.listSubject.subscribe(async (_list) => {
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

  toString() {
    return JSON.stringify(this.ids);
  }
}

export default GraphandModelList;
