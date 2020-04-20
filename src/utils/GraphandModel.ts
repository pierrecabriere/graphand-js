import isEqual from "fast-deep-equal";
import { createStore, Store } from "redux";
import Client from "../Client";

class GraphandModel {
  _id: string;

  static _client: Client;
  static cache = {};
  static _store?: Store;

  static reinit() {
    this.clearCache();
    return this.reinitStore();
  }

  static clearCache() {
    // @ts-ignore
    Object.values(this.cache).forEach((cacheItem) => {
      delete cacheItem.request;
    });

    return this;
  }

  static get store() {
    if (!this._store) {
      const _upsert = (state, item) => {
        const found = state.list.find((i) => i._id === item._id);
        if (found) {
          return {
            ...state,
            list: state.list.map((i) => (i === found ? item : i)),
          };
        }

        return { ...state, list: [...state.list, item] };
      };
      const _update = (state, item, payload) => {
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
        const found = state.list.find((i) => i._id === item._id);
        return { ...state, list: [...state.list.filter((i) => i !== found)] };
      };

      this._store = createStore((state = { list: [] }, { type, target, payload }) => {
        switch (type) {
          case "UPSERT":
            if (Array.isArray(payload)) {
              payload.forEach((item) => (state = _upsert(state, item)));
            } else {
              state = _upsert(state, payload);
            }

            return state;
          case "UPDATE":
            if (target) {
              state = _update(state, target, payload);
            }

            return state;
          case "DELETE":
            state = _delete(state, payload);

            return state;
          case "REINIT":
            return { list: [] };
          default:
            return state;
        }
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

  static getList() {
    return this.store.getState().list;
  }

  static get(_id, fetch = false) {
    if (fetch) {
      return new Promise(async (resolve, reject) => {
        try {
          await this.query(_id, undefined, true);
          resolve(this.get(_id, false));
        } catch (e) {
          reject(e);
        }
      });
    }

    return this.getList().find((item) => item._id === _id);
  }

  static async query(query: any, cache = true, waitRequest = false, callback?: Function) {
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

    const request = (cacheKey?: string) =>
      this._client._axios.post(`${this.baseUrl}/query`, query).then((res) => {
        res.data.data.rows = res.data.data.rows.map((item) => new this(item));
        const { rows } = res.data.data;

        const list = this.getList();
        const modified =
          list.length !== rows.length ||
          !!rows.find((item) => {
            return !list.find((_item) => isEqual(_item, item));
          });

        if (modified) {
          this.upsertStore(rows);
        }

        if (cacheKey) {
          this.cache[cacheKey] = this.cache[cacheKey] || {};
          this.cache[cacheKey].previous = res;
        }

        return res;
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
      } else if (this.cache[cacheKey].previous && !this.cache[cacheKey].request) {
        res = this.cache[cacheKey].previous;
        this.cache[cacheKey].request = request(cacheKey);
        callback && callback(false);

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

  static async delete(payload: GraphandModel | any) {
    try {
      if (payload instanceof GraphandModel) {
        await this._client._axios.delete(this.baseUrl, { data: { query: { _id: payload._id } } });
        this.clearCache();
        this.deleteFromStore(payload);
      } else {
        await this._client._axios.delete(this.baseUrl, { data: payload });
        this.reinit();
      }
    } catch (e) {
      throw e;
    }

    return true;
  }

  static get baseUrl() {
    return null;
  }

  static setClient(client) {
    this._client = client;
    return this;
  }

  constructor(data) {
    Object.assign(this, data);
  }

  async update(payload: any) {
    const { constructor } = Object.getPrototypeOf(this);
    const { data } = await constructor._client._axios.patch(constructor.baseUrl, { query: { _id: this._id }, ...payload });
    const item = new constructor(data.data.rows[0]);
    constructor.upsertStore(item);
    return this;
  }

  delete() {
    return Object.getPrototypeOf(this).constructor.delete(this);
  }
}

export default GraphandModel;
