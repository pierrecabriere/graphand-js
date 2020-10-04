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

  list = new Subject();
  loading = new Subject();
  count = new Subject();

  subjectTimeout;
  reloadTimeout;
  mainSubscription: Subscription;
  model;

  prevList;
  prevLoading;
  prevCount;

  subjects: any = {};

  private _current: { select?: any; populate?: any; sort?: any; pageSize?: any; page?: any; translations?: any; query?: any } = {
    select: undefined,
    populate: undefined,
    sort: undefined,
    pageSize: undefined,
    page: 1,
    translations: undefined,
    query: undefined,
  };
  get current() {
    return this._current;
  }

  get initialized() {
    return this.prevList !== undefined;
  }

  constructor(options, model) {
    this.model = model;

    this.subjects = Object.keys(this._current).reduce((result: any, key: string) => {
      Object.assign(result, { [key]: new Subject() });
      return result;
    }, {});

    // @ts-ignore
    const mainObservable = new Observable(async (subscriber) => {
      let prevList;
      let ids;

      const refresh = async () => {
        subscriber.next({ loading: true });
        try {
          const { data } = await model.query(this.current, true, true);
          ids = data.data.rows.map((item) => item._id);
          triggerSubscription({ loading: false, count: data.data.count });
        } catch (e) {
          triggerSubscription({ loading: false });
        }
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

        const list = model.getList();
        const prevListLength = prevList.length;
        const listLength = list.length;
        if (prevListLength !== listLength || !isEqual(prevList, list)) {
          prevList = list;
          refresh();
          // if (prevListLength !== listLength) {
          //   refresh();
          // } else {
          //   triggerSubscription();
          // }
        }
      };

      Object.keys(this.subjects).forEach((key) => {
        const subject = this.subjects[key];

        subject.subscribe({
          next: (v: any) => {
            if (v !== undefined) {
              Object.assign(this._current, { [key]: v });
            } else {
              delete this._current[key];
            }
            this.subjectTimeout && clearTimeout(this.subjectTimeout);
            this.subjectTimeout = setTimeout(() => {
              refresh().then(() => (prevList = model.getList()));
            });
          },
        });
      });

      prevList = model.getList();
      model.listSubject.subscribe(subscriptionHandler);
    });

    Object.keys(this.subjects).forEach((key) => {
      const subject = this.subjects[key];

      Object.assign(this, {
        [key]: (v) => {
          setTimeout(() => subject.next(v));
          return this;
        },
      });
    });

    this.mainSubscription = mainObservable.subscribe(({ list, loading, count }) => {
      if (list !== undefined && !isEqual(this.prevList, list)) {
        this.prevList = list;
        this.list.next(list);
      }

      if (loading !== undefined && this.prevLoading !== loading) {
        this.prevLoading = list;
        this.loading.next(loading);
      }

      if (count !== undefined && this.prevCount !== count) {
        this.prevCount = count;
        this.count.next(count);
      }
    });

    Object.keys(this.subjects).forEach((key) => {
      if (options[key] !== undefined && options[key] !== this.current[key]) {
        this[key](options[key]);
      }
    });

    setTimeout(() => {
      this.reload();
    }, 100);
  }

  unobserve() {
    this.list?.complete();
    this.loading?.complete();
    this.count?.complete();
    this.mainSubscription?.unsubscribe();
  }

  reload(clearCache = false) {
    if (clearCache) {
      this.model.clearCache(this.current);
    }

    this.prevList = null;
    this.prevLoading = null;
    this.prevCount = null;
    this.subjects.query?.next(this.current.query);
  }

  set(options) {
    Object.keys(this.subjects).forEach((key) => {
      if (options[key] !== this.current[key]) {
        this[key](options[key]);
      }
    });
  }
}

export default ModelObserver;
