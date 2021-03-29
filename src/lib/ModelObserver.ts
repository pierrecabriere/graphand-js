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

  private _current: {
    select?: any;
    populate?: any;
    sort?: any;
    pageSize?: number;
    page?: number;
    translations?: any;
    query?: any;
    ids?: string[];
  } = {
    select: undefined,
    populate: undefined,
    sort: undefined,
    pageSize: undefined,
    page: undefined,
    translations: undefined,
    query: undefined,
    ids: undefined,
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
          const { data } = await model.fetch(this.current);
          const rows = data.data?.rows || [data.data];
          ids = rows.map((item) => item._id);
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
        const list = ids.map((id) => modelList.find((item) => item._id === id)).filter(Boolean);
        return subscriber.next({ list, ...payload });
      };

      const subscriptionHandler = (list) => {
        if (!prevList || !ids) {
          return;
        }

        refresh();

        const prevListLength = prevList.length;
        const listLength = list.length;
        const parsedList = list.map((i) => i.toJSON());
        if (prevListLength !== listLength || !isEqual(prevList, parsedList)) {
          prevList = parsedList;
          refresh();
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
            this.subjectTimeout = setTimeout(() => refresh());
          },
        });
      });

      prevList = model.getList().map((i) => i.toJSON());
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
      if (list !== undefined) {
        const parsedList = list.map((i) => i.toJSON());
        if (!isEqual(this.prevList, parsedList)) {
          this.prevList = parsedList;
          this.list.next(list);
        }
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

    this.model.observers.add(this);
  }

  unobserve() {
    this.list?.complete();
    this.loading?.complete();
    this.count?.complete();
    this.mainSubscription?.unsubscribe();

    this.model.observers.delete(this);
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