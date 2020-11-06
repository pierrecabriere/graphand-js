import Client from "../Client";
import Aggregation from "../models/Aggregation";

class AggregationExecutor {
  _id: string;
  vars;
  timeout;
  cached = false;
  promise;
  client: Client;
  res;
  resolve;
  reject;

  static cache = {};
  static timeouts = {};

  static clearCache(cacheKey) {
    if (cacheKey) {
      delete this.cache[cacheKey];
    } else {
      this.cache = {};
    }
  }

  constructor(aggregation: Aggregation, options: { _id?: string; vars?: any; client?: Client }) {
    this._id = options._id || aggregation._id;
    this.vars = options.vars;
    this.client = options.client || Object.getPrototypeOf(aggregation).constructor._client;
    this.run();
  }

  cache(cacheKey: string, timeout: number) {
    const { constructor } = Object.getPrototypeOf(this);
    cacheKey = cacheKey || this.getCacheKey();

    if (this.res !== undefined) {
      constructor.cache[cacheKey] = this.res;
    } else {
      this.cached = true;
      this.run();
    }

    if (timeout) {
      if (constructor.timeouts[cacheKey]) {
        constructor.timeouts[cacheKey].clearTimeout();
      }

      constructor.timeouts[cacheKey] = setTimeout(() => constructor.clearCache(cacheKey));
    }

    return this;
  }

  run() {
    if (this.res !== undefined) {
      return;
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.promise = new Promise((resolve, reject) => {
      this.timeout = setTimeout(async () => {
        try {
          const res = await this.execute();
          resolve(res);
        } catch (e) {
          reject(e);
        }
      });
    });

    return this;
  }

  then() {
    return this.promise.then(...arguments);
  }

  catch() {
    return this.promise.catch(...arguments);
  }

  done() {
    return this.promise.done(...arguments);
  }

  toPromise() {
    return this.promise;
  }

  getCacheKey() {
    return this._id + JSON.stringify(this.vars);
  }

  async execute() {
    const { constructor } = Object.getPrototypeOf(this);
    let cacheKey;
    if (this.cached) {
      cacheKey = this.getCacheKey();
      if (constructor.cache[cacheKey]) {
        return constructor.cache[cacheKey] || {};
      }
    }

    const { data } = await this.client._axios.post(`/aggregations/${this._id}/execute`, this.vars);
    this.res = data;
    if (cacheKey) {
      constructor.cache[cacheKey] = data;
    }

    return data || {};
  }
}

export default AggregationExecutor;
