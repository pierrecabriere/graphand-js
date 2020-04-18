import Client from "../Client";
import ConnectableModel from "./ConnectableModel";

class GraphandModel extends ConnectableModel {
  static _client: Client;
  static cache = {};
  static connectConfig = {
    find: (list, item) => item && list.find((i) => i._id === item._id),
    mapDataToList: (data) => (data ? data.rows : []),
    async fetch(...opts) {
      const res = await this.query(...opts);
      return res.data.data;
    },
  };

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

  static async query(query: any, cache: boolean = true, waitRequest: boolean = false, callback?: Function) {
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
            return !list.find((_item) => JSON.stringify(_item) === JSON.stringify(item));
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

  static async delete(payload: GraphandModel|any) {
    try {
      if (payload._id) {
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
    super();

    Object.assign(this, data);
  }

  delete() {
    return Object.getPrototypeOf(this).constructor.delete(this);
  }
}

export default GraphandModel;