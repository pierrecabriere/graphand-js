import Client from "../Client";
import Aggregation from "../models/Aggregation";

class AggregationExecutor {
  _id: string;
  vars;
  timeout;
  cacheKey;
  promise;
  client: Client;
  res;

  static cache = {};
  static timeouts = {};

  static clearCache(cacheKey) {
    if (cacheKey) {
      delete this.cache[cacheKey];
      if (this.timeouts[cacheKey]) {
        this.timeouts[cacheKey].clearTimeout();
        delete this.timeouts[cacheKey];
      }
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

  cache(cacheKey?: string, timeout?: number) {
    const { constructor } = Object.getPrototypeOf(this);
    this.cacheKey = cacheKey || this.getCacheKey();

    if (this.res !== undefined) {
      constructor.cache[cacheKey] = this.res;
    } else {
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

  clearCache(cacheKey?) {
    cacheKey = cacheKey || this.cacheKey || this.getCacheKey();
    const { constructor } = Object.getPrototypeOf(this);
    if (cacheKey) {
      return constructor.clearCache(cacheKey);
    }
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
    if (this.cacheKey) {
      if (constructor.cache[this.cacheKey]) {
        return constructor.cache[this.cacheKey] || {};
      }
    }

    const { data } = await this.client._axios.post(`/aggregations/${this._id}/execute`, this.vars);
    this.res = data;
    if (this.cacheKey) {
      constructor.cache[this.cacheKey] = data;
    }

    return data || {};
  }
}

export default AggregationExecutor;
