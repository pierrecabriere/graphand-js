import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelListPromise from "./GraphandModelListPromise";

class GraphandModelList extends Array implements Array<any> {
  _model;
  count;
  _query;

  constructor({ model, count, query }: { model?; count?; query? }, ...elements) {
    if (!elements?.length) {
      elements = [];
    }

    if (!model) {
      // @ts-ignore
      return super(...elements);
    }

    super(...elements);

    this._model = model;
    this.count = count || 0;
    this._query = query;

    Object.defineProperty(this, "_model", { enumerable: false });
    Object.defineProperty(this, "count", { enumerable: false });
    Object.defineProperty(this, "_query", { enumerable: false });
  }

  get ids() {
    return this.toArray()
      .map((item) => item?._id || item)
      .filter(Boolean);
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

  toArray() {
    return new Array(...this);
  }

  clone(concatWith?: GraphandModel | GraphandModelList) {
    const elements = concatWith ? this.toArray().concat(concatWith) : this.toArray();
    return new GraphandModelList(this, ...elements);
  }

  reload() {
    return this.model.getList(this.query);
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = _this.map((item) => item.raw);
      _this.model._listSubject.subscribe(async (_list) => {
        const query = _this.query || { ids: _this.ids };
        const list = await _this.model.getList(query);
        const raw = list.map((item) => item?.raw);
        if (prevRaw.length !== raw.length || !isEqual(raw, prevRaw)) {
          prevRaw = raw;
          subscriber.next(list);
        }
      });
    });
    return observable.subscribe.apply(observable, arguments);
  }

  serialize() {
    return this.ids;
  }

  toString() {
    return JSON.stringify(this.ids);
  }

  toJSON() {
    return this.map((i) => i.toJSON?.apply(i) || i);
  }
}

export default GraphandModelList;
