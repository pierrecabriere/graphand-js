import isEqual from "fast-deep-equal";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

const defaultOptions = { page: 1 };

class ModelObserver {
  select: Function;
  populate: Function;
  sort: Function;
  pageSize: Function;
  page: Function;
  translations: Function;
  query: Function;

  _list = new BehaviorSubject([]);
  _loading = new BehaviorSubject(false);
  _count = new BehaviorSubject(null);

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

  get _initialized() {
    return this.prevList !== undefined;
  }

  get list() {
    return this._list;
  }

  get loading() {
    return this._loading;
  }

  get count() {
    return this._count;
  }

  constructor(options = {}, model) {
    options = Object.assign({}, defaultOptions, options);

    this.model = model;

    this.subjects = Object.keys(this._current).reduce((result: any, key: string) => {
      Object.assign(result, { [key]: new BehaviorSubject(options[key]) });
      return result;
    }, {});

    // @ts-ignore
    const mainObservable = new Observable(async (subscriber) => {
      let prevList;
      let ids;

      const refresh = async () => {
        subscriber.next({ loading: true });
        try {
          const list = await model.getList({ ...this.current, count: true });
          ids = list.ids;
          triggerSubscription({ loading: false, count: list.count });
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
      model._listSubject.subscribe(subscriptionHandler);
    });

    Object.keys(this.subjects).forEach((key) => {
      const subject = this.subjects[key];

      Object.assign(this, {
        [key]: (v) => {
          subject.next(v);
          return this;
        },
      });
    });

    this.mainSubscription = mainObservable.subscribe(({ list, loading, count }) => {
      if (list !== undefined) {
        const parsedList = list.map((i) => i.toJSON());
        if (!isEqual(this.prevList, parsedList)) {
          this.prevList = parsedList;
          this._list.next(list);
        }
      }

      if (loading !== undefined && this.prevLoading !== loading) {
        this.prevLoading = list;
        this._loading.next(loading);
      }

      if (count !== undefined && this.prevCount !== count) {
        this.prevCount = count;
        this._count.next(count);
      }
    });

    this.reload();

    this.model._observers.add(this);
  }

  unobserve() {
    this._list?.complete();
    this._loading?.complete();
    this._count?.complete();
    this.mainSubscription?.unsubscribe();
    this.model._observers.delete(this);
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
