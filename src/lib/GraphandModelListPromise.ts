import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelList from "./GraphandModelList";
import GraphandModelPromise from "./GraphandModelPromise";

class GraphandModelListPromise extends GraphandModelPromise {
  private _subscription;

  constructor(executor, model, query) {
    super(executor, model, query);

    if (this.ids) {
      Object.defineProperty(this, "ids", { enumerable: true, get: () => this._ids });
    }
  }

  get _ids() {
    if (this.query?.ids) {
      return Array.isArray(this.query.ids) ? this.query.ids : [this.query.ids];
    }

    return [];
  }

  get ids() {
    if (this.query?.ids) {
      return Array.isArray(this.query.ids) ? this.query.ids : [this.query.ids];
    }

    return [];
  }

  get length() {
    return this.ids?.length || null;
  }

  clone() {
    return new GraphandModelListPromise(this.executor, this.model, this.query);
  }

  concat(concatWith?: GraphandModel | GraphandModelPromise | GraphandModelList | GraphandModelListPromise) {
    const clone = this.clone();
    if (!concatWith) {
      return clone;
    } else if (typeof concatWith !== "object") {
      concatWith = new this.model({ _id: concatWith });
    }

    const concatIds = "ids" in concatWith ? concatWith.ids : [concatWith._id];
    clone.query.ids = clone.query.ids || [];
    clone.query.ids = clone.query.ids.concat(concatIds);

    if ("query" in concatWith && concatWith.query.query) {
      clone.query.query = clone.query.query ? { $or: [clone.query.query, concatWith.query.query] } : concatWith.query.query;
    }

    return clone;
  }

  toJSON() {
    return this.ids;
  }

  encodeQuery() {
    return this.ids;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const _this = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = null;
      _this.model._listSubject.subscribe(async () => {
        const query = _this.query || { ids: _this.ids };
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
