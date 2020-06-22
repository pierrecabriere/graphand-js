import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";

class GraphandModelList extends Array implements Array<any> {
  model;

  constructor(model, ...elements) {
    super(...elements);
    this.model = model;
  }

  get _ids() {
    return this.map((item) => item?._id).filter((_id) => _id);
  }

  subscribe() {
    if (!this.model) {
      return;
    }

    const parent = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = parent.map((item) => item.raw);
      parent.model.store.subscribe(async () => {
        const list = await parent.model.getList({ query: { _id: { $in: parent._ids } } });
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
