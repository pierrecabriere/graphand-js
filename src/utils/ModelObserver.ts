import isEqual from "fast-deep-equal";
import { Observable, Subject } from "rxjs";

class ModelObserver {
  list;
  count;
  loading;

  select: Function;
  populate: Function;
  sort: Function;
  pageSize: Function;
  page: Function;
  translations: Function;
  query: Function;
  reload: Function;

  private _current: { select?: any; populate?: any; sort?: any; pageSize?: any; page?: any; translations?: any; query?: any } = {};
  get current() {
    return this._current;
  }

  constructor(options, model) {
    const observeKeys = ["select", "populate", "sort", "pageSize", "page", "translations", "query"];

    const subjects: any = observeKeys.reduce((result: object, key: string) => {
      Object.assign(result, { [key]: new Subject() });
      return result;
    }, {});

    // @ts-ignore
    const mainObservable = new Observable(async (subscriber) => {
      let prevList;
      let ids;

      const refresh = async () => {
        subscriber.next({ loading: true });
        const { data } = await model.query(this.current, true, true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        ids = data.data.rows.map((item) => item._id);
        subscriber.next({ loading: false, count: data.data.count });
        triggerSubscription();
      };

      const triggerSubscription = () => {
        if (!ids) {
          return subscriber.next({ list: [] });
        }

        const list = model.getList();
        return subscriber.next({ list: ids.map((id) => list.find((item) => item._id === id)).filter((item) => item) });
      };

      const subscriptionHandler = () => {
        if (!prevList) {
          return;
        }

        const list = model.getList();
        const prevListLength = prevList.length;
        const listLength = list.length;
        if (prevListLength !== listLength || !isEqual(prevList, list)) {
          prevList = list;
          if (prevListLength !== listLength) {
            refresh();
          } else {
            triggerSubscription();
          }
        }
      };

      model.store.subscribe(subscriptionHandler);
      prevList = model.getList();

      Object.keys(subjects).forEach((key) => {
        const subject = subjects[key];

        subject.subscribe({
          next: (v: any) => {
            Object.assign(this.current, { [key]: v });
            refresh();
          },
        });
      });
    });

    this.list = new Observable((subscriber) => {
      let prevList;
      mainObservable.subscribe(({ list }) => {
        if (list !== undefined && !isEqual(prevList, list)) {
          prevList = list;
          subscriber.next(list);
        }
      });
    });

    this.count = new Observable((subscriber) => {
      let prevCount;
      mainObservable.subscribe(({ count }) => {
        if (count !== undefined && !isEqual(prevCount, count)) {
          prevCount = count;
          subscriber.next(count);
        }
      });
    });

    this.loading = new Observable((subscriber) => {
      let prevLoading;
      mainObservable.subscribe(({ loading }) => {
        if (loading !== undefined && !isEqual(prevLoading, loading)) {
          prevLoading = loading;
          subscriber.next(loading);
        }
      });
    });

    this.reload = () => {
      subjects.query?.next(this.current.query);
    };

    Object.keys(subjects).forEach((key) => {
      const subject = subjects[key];

      Object.assign(this, {
        [key]: (v) => {
          if (v !== this.current[key]) {
            setTimeout(() => subject.next(v));
          }
          return this;
        },
      });
    });

    setTimeout(() => {
      Object.keys(subjects).forEach((key) => {
        if (options[key] && options[key] !== this.current[key]) {
          this[key](options[key]);
        }
      });
    });
  }
}

export default ModelObserver;
