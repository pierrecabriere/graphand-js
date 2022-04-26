import { AxiosResponse } from "axios";
import copy from "fast-copy";
import { parseQuery } from "../utils";
import fetchModel, { FetchOptions } from "../utils/fetchModel";
import getModelListFromCache from "../utils/getModelListFromCache";
import GraphandModel from "./GraphandModel";

export type GraphandQueryResponse = {
  rows: any[];
  count: number;
  axiosRes: AxiosResponse;
};

class GraphandQuery {
  _model;
  ids: string[];
  query: any;
  sort: any;
  populate: any;
  page: number;
  pageSize: number;

  constructor(Model: typeof GraphandModel, q?: any) {
    this._model = Model;
    Object.defineProperty(this, "_model", { enumerable: false });

    if (q) {
      const { query, ...fields } = q;
      Object.assign(this, fields);
      if (q.query) {
        this.query = parseQuery(q.query);
      }
    }
  }

  getCachedList() {
    return getModelListFromCache(this._model, this);
  }

  clone() {
    const { ids, query, sort, populate, page, pageSize } = this;
    const _clone = new GraphandQuery(this._model);
    Object.assign(_clone, copy({ ids, query, sort, populate, page, pageSize }));
    return _clone;
  }

  async execute(opts?: FetchOptions) {
    const query = this.isMergeable() ? this.clone() : this;
    return fetchModel(this._model, query, opts);
  }

  isMergeable() {
    const queryKeys = Object.keys(this).filter((key) => this[key] && ["query", "ids", "pageSize", "page", "populate"].includes(key));
    return queryKeys.includes("ids") && queryKeys.length === 1;
  }
}

export default GraphandQuery;
