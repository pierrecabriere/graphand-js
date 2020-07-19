import isEqual from "fast-deep-equal";
import { createStore, Store } from "redux";
import { Observable } from "rxjs";
import Client from "../Client";
import Account from "../models/Account";
import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldId from "./fields/GraphandFieldId";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandModelList from "./GraphandModelList";
import GraphandModelListPromise from "./GraphandModelListPromise";
import GraphandModelPromise from "./GraphandModelPromise";
import ModelObserver from "./ModelObserver";

class GraphandModel {
  _id: string;

  static _client: Client;
  static cache = {};
  static translatable = true;
  static _store?: Store;
  static baseUrl;
  static queryUrl;
  static prevListLength?: number;
  static socketSubscription = null;
  private static _fields = {};
  private static _fieldsSubscription;
  static baseFields = {};
  static queryFields;
  static _fieldsObserver;
  static __registered = false;
  static __initialized = false;
  private _data: any = {};

  constructor(data: any = {}) {
    this._id = data._id;
    this._data = data;
  }

  get(slug, decode = false, fields) {
    const { constructor } = Object.getPrototypeOf(this);
    fields = fields || constructor.fields;
    const field = fields[slug];
    let value = this._data[slug];

    if (constructor.translatable) {
      let locale = constructor._client.locale;
      if (locale && constructor._client._project?.locales && !constructor._client._project.locales.includes(locale)) {
        locale = undefined;
      }

      if (locale && this._data.translations && this._data.translations[locale] && this._data.translations[locale][slug] !== undefined) {
        value = this._data.translations[locale][slug];
      }
    }

    if (value === undefined) {
      value = field ? field.defaultValue : this[slug];
    }

    if (field?.getter) {
      value = field.getter(value, this);
      if (decode && field?.setter) {
        value = field.setter(value, this);
      }
    }

    return value;
  }

  set(slug, value, fields?) {
    const { constructor } = Object.getPrototypeOf(this);
    fields = fields || constructor.fields;
    const field = fields[slug];

    if (field?.setter) {
      value = field.setter(value, this);
    }

    this._data[slug] = value;

    return this;
  }

  assign(values) {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.fields;
    Object.keys(values).forEach((key) => {
      this.set(key, values[key], fields);
    });

    return this;
  }

  subscribe() {
    const { constructor } = Object.getPrototypeOf(this);
    const parent = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = parent.raw;
      constructor.store.subscribe(async () => {
        const item = await constructor.get(parent._id);
        if (item && !isEqual(item.raw, prevRaw)) {
          prevRaw = item.raw;
          subscriber.next(item);
        } else if (!item) {
          subscriber.next(item);
        }
      });
    });
    return observable.subscribe.apply(observable, arguments);
  }

  get raw() {
    return this._data;
  }

  static get fieldsObserver() {
    if (!this.queryFields) {
      return;
    }

    if (!this._fieldsObserver) {
      this._fieldsObserver = this._client.models.DataField.observe({ query: this.queryFields });
    }

    return this._fieldsObserver;
  }

  static getFields(item?) {
    if (this.queryFields && !this._fieldsSubscription) {
      this._fieldsSubscription = this.fieldsObserver.list.subscribe(async (list) => {
        const graphandFields = await Promise.all(list.map((field) => field.toGraphandField()));
        const fields = list.reduce((fields, field, index) => Object.assign(fields, { [field.slug]: graphandFields[index] }), {});
        if (!isEqual(this._fields, fields)) {
          this._fields = fields;
          this.fieldsObserver.list.next(list);
        }
      });
    }

    const baseFields = typeof this.baseFields === "function" ? this.baseFields(item) : this.baseFields;

    return {
      _id: new GraphandFieldId(),
      ...this._fields,
      ...baseFields,
      createdBy: new GraphandFieldRelation({
        name: "Créé par",
        model: this._client.models.Account,
        multiple: false,
      }),
      createdAt: new GraphandFieldDate({
        name: "Créé à",
      }),
      updatedBy: new GraphandFieldRelation({
        name: "Modifié par",
        model: this._client.models.Account,
        multiple: false,
      }),
      updatedAt: new GraphandFieldDate({
        name: "Modifié à",
      }),
    };
  }

  static get fields() {
    return this.getFields();
  }

  static setPrototypeFields() {
    const fields = this.fields;
    Object.keys(fields).forEach((slug) => {
      const field = fields[slug];
      if (field.assign === false) {
        return;
      }

      Object.defineProperty(this.prototype, slug, {
        configurable: true,
        get: function () {
          return this.get(slug, false, fields);
        },
        set(v) {
          this._data[slug] = v;
        },
      });
    });
  }

  static async init() {
    if (this.queryFields) {
      const list = await this._client.models.DataField.getList({ page: 1, query: this.queryFields });
      const graphandFields = await Promise.all(list.map((field) => field.toGraphandField()));
      this._fields = list.reduce((fields, field, index) => Object.assign(fields, { [field.slug]: graphandFields[index] }), {});
    }

    this.setPrototypeFields();
  }

  private static setupSocket() {
    if (!this._client?.socket) {
      return;
    }

    this._client.socket.on(this.baseUrl, ({ action, payload }) => {
      switch (action) {
        case "create":
          this.clearCache();
          this.upsertStore(payload.map((item) => new this(item)));
          break;
        case "update":
          this.upsertStore(payload.map((item) => new this(item)));
          break;
        case "delete":
          this.clearCache();
          this.deleteFromStore(payload);
          break;
      }
    });
  }

  static sync() {
    if (this._client && !this.socketSubscription) {
      this.setupSocket();
      this.socketSubscription = this._client.socketSubject.asObservable().subscribe(() => this.setupSocket());
    }

    return this;
  }

  static unsync() {
    this.socketSubscription.unsubscribe();
    delete this.socketSubscription;
  }

  static reinit() {
    this.cache = {};

    return this.reinitStore();
  }

  static clearCache(query?) {
    if (query) {
      const cacheKey = `${this.name}:${JSON.stringify(query)}`;
      this.cache[cacheKey] && delete this.cache[cacheKey].request;
    } else {
      Object.values(this.cache).forEach((cacheItem: any) => {
        delete cacheItem.request;
      });
    }

    return this;
  }

  static get store() {
    if (!this._store) {
      const _upsert = (state, item) => {
        const _upsertObject = (input, found) => {
          Object.keys(input.constructor.fields).forEach((key) => {
            if (typeof input.raw[key] === "string" && found.raw[key] && typeof found.raw[key] === "object" && found.raw[key]._id === input.raw[key]) {
              item[key] = found.raw[key];
            } else if (item[key] && typeof item[key] === "object" && found.raw[key] && typeof found.raw[key] === "object") {
              _upsertObject(item[key], found.raw[key]);
            } else if (
              (typeof input.raw[key] === "string" &&
                found.raw[key] &&
                typeof found.raw[key] === "object" &&
                found.raw[key]._id &&
                found.raw[key]._id !== input.raw[key]) ||
              (input.raw[key] &&
                typeof input.raw[key] === "object" &&
                input.raw[key]._id &&
                found.raw[key] &&
                typeof found.raw[key] === "object" &&
                found.raw[key]._id &&
                found.raw[key]._id !== input.raw[key]._id)
            ) {
              this.clearCache();
              state.list = [];
            }
          });
        };

        state.list = state.list || [];
        const found = state.list.find((i) => i._id === item._id);
        if (found) {
          // _upsertObject(item, found);

          return {
            ...state,
            list: state.list.map((i) => (i === found ? item : i)),
          };
        }

        return { ...state, list: [...state.list, item] };
      };
      const _update = (state, item, payload) => {
        state.list = state.list || [];
        const found = state.list.find((i) => i._id === item._id);
        if (found) {
          return {
            ...state,
            list: state.list.map((i) => {
              if (i === found) {
                Object.assign(i, payload);
              }

              return i;
            }),
          };
        }

        return state;
      };
      const _delete = (state, item) => {
        state.list = state.list || [];
        const found = state.list.find((i) => i._id === item._id);
        return { ...state, list: [...state.list.filter((i) => i !== found)] };
      };

      this._store = createStore((state: { list: GraphandModel[] } = { list: null }, { type, target, payload }) => {
        switch (type) {
          case "UPSERT":
            if (Array.isArray(payload)) {
              payload.forEach((item) => (state = _upsert(state, item)));
            } else {
              state = _upsert(state, payload);
            }
            break;
          case "UPDATE":
            if (target) {
              state = _update(state, target, payload);
            }
            break;
          case "DELETE":
            if (Array.isArray(payload)) {
              payload.forEach((item) => (state = _delete(state, item)));
            } else {
              state = _delete(state, payload);
            }
            break;
          case "REINIT":
            state = { list: [] };
            break;
          default:
            break;
        }

        return state;
      });
    }

    return this._store;
  }

  static reinitStore() {
    this.store.dispatch({
      type: "REINIT",
    });

    return this;
  }

  static deleteFromStore(payload) {
    this.store.dispatch({
      type: "DELETE",
      payload,
    });
  }

  static upsertStore(payload) {
    this.store.dispatch({
      type: "UPSERT",
      payload,
    });
  }

  static updateStore(target, payload) {
    this.store.dispatch({
      type: "UPDATE",
      target,
      payload,
    });
  }

  static getList(query?: any, ...params): GraphandModelList {
    if (query) {
      const parent = this;
      // @ts-ignore
      return new GraphandModelListPromise(async (resolve, reject) => {
        try {
          const {
            data: {
              data: { rows },
            },
          } = await parent.query(query, ...params);
          const storeList = parent.store.getState().list;
          const list = rows.map((row) => storeList.find((item) => item._id === row._id)).filter((r) => r);
          resolve(new GraphandModelList(parent, ...list));
        } catch (e) {
          reject(e);
        }
      }, query);
    }

    return new GraphandModelList(this, ...(this.store.getState().list || []));
  }

  static get(_id, fetch = true) {
    if (!_id) {
      return new GraphandModelPromise(async (resolve, reject) => {
        try {
          const res = await this.query(null, undefined, true);
          resolve(this.get((res.data.data.rows && res.data.data.rows[0] && res.data.data.rows[0]._id) || res.data.data._id, false));
        } catch (e) {
          reject(e);
        }
      });
    }

    const item = this.getList().find((item) => item._id === _id);

    if (!item && fetch) {
      return new GraphandModelPromise(async (resolve, reject) => {
        try {
          const res = await this.query(_id, undefined, true);
          resolve(this.get((res.data.data.rows && res.data.data.rows[0] && res.data.data.rows[0]._id) || res.data.data._id, false));
        } catch (e) {
          reject(e);
        }
      }, _id);
    }

    return item && new GraphandModelPromise((resolve) => resolve(item), item._id);
  }

  static async query(query: any, cache = true, waitRequest = false, callback?: Function, hooks = true) {
    await this._client._project;

    if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    }

    // return from cache if request id
    // if (query.query && query.query._id && typeof query.query._id === "string") {
    //   const item = this.getList().find((item) => item._id === query.query._id);
    //   if (item) {
    //     return { data: { data: { rows: [item], count: 1 } } };
    //   }
    // }

    // if (this.translatable && this._client._project?.locales?.length) {
    //   query.translations = this._client._project?.locales;
    // }

    if (hooks) {
      await this.beforeQuery?.call(this, query);
    }

    const request = (cacheKey?: string) =>
      this._client._axios
        .post(this.queryUrl || `${this.baseUrl}/query`, query)
        .then(async (res) => {
          if (res.data?.data?.rows) {
            res.data.data.rows = res.data.data.rows.map((item) => new this(item));

            const rows = res.data.data.rows || [res.data.data];

            const list = this.getList();
            const modified =
              list.length !== rows.length ||
              !!rows.find((item) => {
                return !list.find((_item) => isEqual(_item, item));
              });

            if (modified) {
              this.upsertStore(rows);
            }
          } else {
            res.data.data = new this(res.data.data);
            const list = this.getList();
            const modified = !isEqual(list[0], res.data.data);

            if (modified) {
              this.upsertStore(res.data.data);
            }
          }

          if (cacheKey) {
            this.cache[cacheKey] = this.cache[cacheKey] || {};
            this.cache[cacheKey].previous = res;
          }

          if (hooks) {
            await this.afterQuery?.call(this, query, res);
          }

          return res;
        })
        .catch(async (e) => {
          delete this.cache[cacheKey];

          if (hooks) {
            await this.afterQuery?.call(this, query, null, e);
          }

          throw e;
        });

    let res;
    if (cache) {
      const cacheKey = `${this.name}:${JSON.stringify(query)}`;

      if (!this.cache[cacheKey]) {
        this.cache[cacheKey] = {
          previous: null,
          request: request(cacheKey),
        };

        res = await this.cache[cacheKey].request;
        callback && callback(res);
      } else if (this.cache[cacheKey].previous && this.cache[cacheKey].request) {
        if (waitRequest) {
          res = await this.cache[cacheKey].request;
          callback && callback(res);
        } else {
          res = this.cache[cacheKey].previous;
          callback && callback(false);

          this.cache[cacheKey].request.then(async (res) => {
            callback && callback(res);
            return res;
          });
        }
      } else if (this.cache[cacheKey].previous && !waitRequest) {
        res = this.cache[cacheKey].previous;
        this.cache[cacheKey].request = request(cacheKey);
        callback && callback(res);

        this.cache[cacheKey].request.then(async (_res) => {
          callback && callback(_res);
          return _res;
        });
      } else {
        if (!this.cache[cacheKey].request) {
          this.cache[cacheKey].request = request(cacheKey);
        }

        res = await this.cache[cacheKey].request;
        callback && callback(res);
      }
    } else {
      res = await request();
      callback && callback(res);
    }

    return res;
  }

  static observe(options: any = {}) {
    return new ModelObserver(options, this);
  }

  static async create(payload, hooks = true) {
    const config = { params: {} };

    if (payload.locale && this._client._project && payload.locale === this._client._project.defaultLocale) {
      delete payload.locale;
    }

    const args = { payload, config };

    if (hooks) {
      await this.beforeCreate?.call(this, args);
    }

    let item;
    try {
      const req = this._client._axios
        .post(this.baseUrl, args.payload, args.config)
        .then(async (res) => {
          item = new this(res.data.data);
          if (!this.socketSubscription) {
            this.clearCache();
            this.upsertStore(item);
          }

          if (hooks) {
            await this.afterCreate?.call(this, item, null, args);
          }

          return item;
        })
        .catch(async (e) => {
          if (hooks) {
            await this.afterCreate?.call(this, null, e, args);
          }

          throw e;
        });

      const middlewareData = await this.middlewareCreate?.call(this, args, req);
      if (middlewareData !== undefined) {
        return middlewareData;
      }
      item = await req;
    } catch (e) {
      if (hooks) {
        await this.afterCreate?.call(this, null, e, args);
      }

      throw e;
    }

    return item;
  }

  static async update(query, payload, hooks = true, clearCache = false) {
    if (this.translatable && this._client._project) {
      payload.translations = this._client._project.locales;
    }

    if (payload.locale && this._client._project && payload.locale === this._client._project.defaultLocale) {
      delete payload.locale;
    }

    if (hooks) {
      if ((await this.beforeUpdate?.call(this, payload)) === false) {
        return;
      }
    }

    try {
      const { data } = await this._client._axios.patch(this.baseUrl, { query, ...payload });
      if (!data) {
        return;
      }

      const items = data.data.rows.map((item) => new this(item));

      if (clearCache) {
        this.clearCache();
      }

      if (!this.socketSubscription) {
        this.upsertStore(items);
      }

      if (hooks) {
        await this.afterUpdate?.call(this, items, null, payload);
      }
    } catch (e) {
      if (hooks) {
        await this.afterUpdate?.call(this, null, e, payload);
      }

      throw e;
    }
  }

  async update(payload: any, preStore = false, hooks = true, clearCache = false) {
    const constructor = this.constructor as any;

    if (hooks) {
      if ((await constructor.beforeUpdate?.call(constructor, payload, this)) === false) {
        return;
      }
    }

    const _id = payload._id || this._id;

    if (preStore) {
      const _item = new constructor({ ...this, ...payload });
      constructor.upsertStore(_item);
    }

    try {
      await constructor.update({ _id }, payload, false, clearCache);

      if (hooks) {
        await constructor.afterUpdate?.call(this, constructor.get(_id), null, payload);
      }
    } catch (e) {
      if (preStore) {
        constructor.upsertStore(this);
      }

      if (hooks) {
        await constructor.afterUpdate?.call(this, null, e, payload);
      }

      throw e;
    }

    return this;
  }

  static async delete(payload: GraphandModel | any, hooks = true) {
    const args = { payload };

    if (hooks) {
      await this.beforeDelete?.call(this, args);
    }

    if (payload instanceof GraphandModel) {
      try {
        await this._client._axios.delete(this.baseUrl, { data: { query: { _id: payload._id } } });
        if (!this.socketSubscription) {
          this.clearCache();
          this.deleteFromStore(payload);
        }
        if (hooks) {
          await this.afterDelete?.call(this, args);
        }
      } catch (e) {
        if (!this.socketSubscription) {
          this.upsertStore(payload);
        }

        if (hooks) {
          await this.afterDelete?.call(this, args, e);
        }

        throw e;
      }
    } else {
      try {
        await this._client._axios.delete(this.baseUrl, { data: payload });
        if (hooks) {
          await this.afterDelete?.call(this, args);
        }
        this.clearCache();
      } catch (e) {
        if (hooks) {
          await this.afterDelete?.call(this, args, e);
        }

        throw e;
      }
    }

    return true;
  }

  delete() {
    const constructor = this.constructor as any;
    return constructor.delete(this, ...arguments);
  }

  static setClient(client) {
    this._client = client;
    return this;
  }

  // hooks
  static beforeQuery;
  static afterQuery;
  static beforeCreate;
  static middlewareCreate;
  static afterCreate;
  static beforeUpdate;
  static afterUpdate;
  static beforeDelete;
  static afterDelete;
}

export default GraphandModel;
