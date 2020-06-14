import isEqual from "fast-deep-equal";
import { Observable, Subject, Subscription } from "rxjs";

class ModelObserver {
  select: Function;
  populate: Function;
  sort: Function;
  pageSize: Function;
  page: Function;
  translations: Function;
  query: Function;
  reload: Function;

  list: Subject<any>;
  loading: Subject<any>;
  count: Subject<any>;

  subjectTimeout;
  mainSubscription: Subscription;

  private _current: { select?: any; populate?: any; sort?: any; pageSize?: any; page?: any; translations?: any; query?: any } = { page: 1 };
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
        ids = data.data.rows.map((item) => item._id);
        triggerSubscription({ loading: false, count: data.data.count });
      };

      const triggerSubscription = (payload = {}) => {
        if (!ids) {
          return subscriber.next({ list: [] });
        }

        const modelList = model.getList();
        const list = ids.map((id) => modelList.find((item) => item._id === id)).filter((item) => item);
        return subscriber.next({ list, ...payload });
      };

      const subscriptionHandler = () => {
        if (!prevList || !ids) {
          return;
        }

        setTimeout(() => {
          const list = model.getList();
          const prevListLength = prevList.length;
          const listLength = list.length;
          if (prevListLength !== listLength || !isEqual(prevList, list)) {
            if (prevListLength < listLength) {
              refresh();
            } else {
              triggerSubscription();

              if (prevListLength !== listLength) {
                refresh();
              }
            }
            prevList = list;
          }
        });
      };

      Object.keys(subjects).forEach((key) => {
        const subject = subjects[key];

        subject.subscribe({
          next: (v: any) => {
            if (v !== undefined) {
              Object.assign(this.current, { [key]: v });
            } else {
              delete this.current[key];
            }
            this.subjectTimeout && clearTimeout(this.subjectTimeout);
            this.subjectTimeout = setTimeout(() => {
              refresh().then(() => (prevList = model.getList()));
            });
          },
        });
      });

      prevList = model.getList();
      model.store.subscribe(subscriptionHandler);
    });

    this.list = new Subject();
    this.loading = new Subject();
    this.count = new Subject();

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

    Object.keys(subjects).forEach((key) => {
      if (options[key] && options[key] !== this.current[key]) {
        this[key](options[key]);
      }
    });

    let prevList;
    let prevLoading;
    let prevCount;
    this.mainSubscription = mainObservable.subscribe(({ list, loading, count }) => {
      if (list !== undefined && !isEqual(prevList, list)) {
        prevList = list;
        this.list.next(list);
      }

      if (loading !== undefined && !isEqual(prevLoading, loading)) {
        prevLoading = list;
        this.loading.next(loading);
      }

      if (count !== undefined && !isEqual(prevCount, count)) {
        prevCount = count;
        this.count.next(count);
      }
    });

    setTimeout(() => {
      if (!this.current.query) {
        this.reload();
      }
    }, 100);
  }

  unobserve() {
    // this.list?.complete();
    // this.loading?.complete();
    // this.count?.complete();
    // this.mainSubscription?.unsubscribe();
  }
}

export default ModelObserver;
