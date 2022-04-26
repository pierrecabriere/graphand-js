import Client from "../Client";
import { parseQuery } from "../utils";

class AggregationExecutor {
  static cache = {};
  _id: string;
  vars;
  cacheKey;
  client: Client;
  res: any;

  constructor(options: { _id?: string; vars?: any; client?: Client }) {
    this._id = options._id;
    this.vars = options.vars ?? {};
    this.client = options.client;
  }

  static clearCache(cacheKey) {
    if (cacheKey) {
      delete this.cache[cacheKey];
    } else {
      this.cache = {};
    }
  }

  cache(key?: string) {
    this.cacheKey = this.getCacheKey(key);

    return this;
  }

  clearCache(key?) {
    const _cacheKey = this.getCacheKey(key);
    const { constructor } = Object.getPrototypeOf(this);
    return constructor.clearCache(_cacheKey);
  }

  then() {
    return this.execute().then(...arguments);
  }

  catch() {
    return this.execute().catch(...arguments);
  }

  toPromise() {
    return this.execute();
  }

  getCacheKey(key = this.vars) {
    return `${this._id}:${typeof key === "string" ? key : JSON.stringify(key)}`;
  }

  async _exec() {
    const { data } = await this.client._axios.post(`/aggregations/${this._id}/execute`, parseQuery(this.vars));
    this.res = data;
    return data;
  }

  async execute() {
    await this.client._init();

    if (this.cacheKey) {
      const { constructor } = Object.getPrototypeOf(this);
      if (!constructor.cache[this.cacheKey]) {
        constructor.cache[this.cacheKey] = new Promise((resolve, reject) => this._exec().then(resolve).catch(reject));
      }

      return (await constructor.cache[this.cacheKey]) || {};
    }

    return (await this._exec()) || {};
  }
}

export default AggregationExecutor;
