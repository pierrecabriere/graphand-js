import isEqual from "fast-deep-equal";
import { createStore, Store } from "redux";
import Client from "../Client";
import ModelObserver from "./ModelObserver";

class GraphandModel {
  _id: string;
  translations: any[];

  static _client: Client;
  static cache = {};
  static translatable = true;
  static _store?: Store;
  static baseUrl;
  static queryUrl;
  static prevListLength?: number;
  static socketSubscription = null;

  constructor(data) {
    try {
      Object.assign(this, data);
    } catch (e) {
      console.error(e);
    }

    return new Proxy(this, {
      get: (target, key) => {
        switch (key) {
          case "constructor":
            return target.constructor;
          case "_id":
            return target._id;
          case "__raw":
            return target;
          default:
            break;
        }

        const { constructor } = Object.getPrototypeOf(this);

        if (constructor.translatable) {
          let locale = constructor._client.locale;
          if (locale && constructor._client._project?.locales && !constructor._client._project.locales.includes(locale)) {
            locale = undefined;
          }

          if (locale && target.translations && target.translations[locale] && target.translations[locale][key] !== undefined) {
            return target.translations[locale][key];
          }
        }

        return target[key];
      },
      ownKeys: (target) => {
        return Reflect.ownKeys(target).filter((key: string) => !/^__/.test(key) && !["translations"].includes(key));
      },
    });
  }

  private static setupSocket() {
    if (!this._client?.socket) {
      return;
    }

    this._client.socket.on(this.baseUrl, ({ action, payload }) => {
      switch (action) {
        case "create":
          this.upsertStore(payload.map((item) => new this(item)));
          break;
        case "update":
          this.upsertStore(payload.map((item) => new this(item)));
          break;
        case "delete":
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

  static clearCache() {
    Object.values(this.cache).forEach((cacheItem: any) => {
      delete cacheItem.request;
    });

    return this;
  }

  static get store() {
    if (!this._store) {
      const _upsert = (state, item) => {
        const _upsertObject = (input, payload) => {
          Object.keys(input).forEach((key) => {
            if (typeof input[key] === "string" && payload[key] && typeof payload[key] === "object" && payload[key]._id === input[key]) {
              item[key] = payload[key];
            } else if (item[key] && typeof item[key] === "object" && payload[key] && typeof payload[key] === "object") {
              _upsertObject(item[key], payload[key]);
            } else if (
              (typeof input[key] === "string" &&
                payload[key] &&
                typeof payload[key] === "object" &&
                payload[key]._id &&
                payload[key]._id !== input[key]) ||
              (input[key] &&
                typeof input[key] === "object" &&
                input[key]._id &&
                payload[key] &&
                typeof payload[key] === "object" &&
                payload[key]._id &&
                payload[key]._id !== input[key]._id)
            ) {
              this.clearCache();
              state.list = [];
            }
          });
        };

        state.list = state.list || [];
        const found = state.list.find((i) => i._id === item._id);
        if (found) {
          _upsertObject(item, found);

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
        const prevList = state.list;
        const wasInitialized = !!prevList;
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

        if (wasInitialized && prevList.length !== state.list.length) {
          this.clearCache();
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

  static getList(query?: object) {
    if (query) {
      const parent = this;
      return new Promise(async (resolve, reject) => {
        try {
          const {
            data: {
              data: { rows },
            },
          } = await parent.query(query);
          const list = parent.getList();
          resolve(rows.map((row) => list.find((item) => item._id === row._id)));
        } catch (e) {
          reject(e);
        }
      });
    }

    return this.store.getState().list || [];
  }

  static get(_id, fetch = false) {
    const item = this.getList().find((item) => item._id === _id);

    if (!item && fetch) {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await this.query(_id, undefined, true);
          resolve(this.get((res.data.data.rows && res.data.data.rows[0]._id) || res.data.data._id, false));
        } catch (e) {
          reject(e);
        }
      });
    }

    return item;
  }

  static async query(query: any, cache = true, waitRequest = false, callback?: Function, hooks = true) {
    await this._client._project;

    if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    }

    // return from cache if request id
    if (query.query && query.query._id && typeof query.query._id === "string") {
      const item = this.getList().find((item) => item._id === query.query._id);
      if (item) {
        return { data: { data: { rows: [item], count: 1 } } };
      }
    }

    if (this.translatable) {
      query.translations = this._client._project?.locales;
    }

    if (hooks) {
      await this.beforeQuery?.call(this, query);
    }

    const request = (cacheKey?: string) =>
      this._client._axios
        .post(this.queryUrl || `${this.baseUrl}/query`, query)
        .then(async (res) => {
          if (res.data.data.rows) {
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

  static async update(query, payload, hooks = true) {
    if (this.translatable && this._client._project) {
      payload.translations = this._client._project.locales;
    }

    if (payload.locale && this._client._project && payload.locale === this._client._project.defaultLocale) {
      delete payload.locale;
    }

    if (hooks) {
      await this.beforeUpdate?.call(this, payload);
    }

    try {
      const { data } = await this._client._axios.patch(this.baseUrl, { query, ...payload });
      const items = data.data.rows.map((item) => new this(item));
      if (!this.socketSubscription) {
        this.upsertStore(items);
      }

      if (hooks) {
        await this.afterUpdate?.call(this, items);
      }
    } catch (e) {
      if (hooks) {
        await this.afterUpdate?.call(this, null, e);
      }

      throw e;
    }
  }

  async update(payload: any, preStore = false, hooks = true) {
    const constructor = this.constructor as any;

    if (hooks) {
      await constructor.beforeUpdate?.call(constructor, payload);
    }

    const _id = payload._id || this._id;

    if (preStore) {
      const _item = new constructor({ ...this, ...payload });
      constructor.upsertStore(_item);
    }

    try {
      await constructor.update({ _id }, payload, false);

      if (hooks) {
        await constructor.afterUpdate?.call(this, constructor.get(_id));
      }
    } catch (e) {
      if (preStore) {
        constructor.upsertStore(this);
      }

      if (hooks) {
        await constructor.afterUpdate?.call(this, null, e);
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
    return constructor.delete(this);
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
