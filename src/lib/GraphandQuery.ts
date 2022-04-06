import { parseQuery } from "../utils";
import fetchModel, { FetchOptions } from "../utils/fetchModel";
import getModelListFromCache from "../utils/getModelListFromCache";
import GraphandModel from "./GraphandModel";

class GraphandQuery {
  _model;
  ids;

  constructor(Model: typeof GraphandModel, q?: any) {
    this._model = Model;
    Object.assign(this, parseQuery(q));
    Object.defineProperty(this, "_model", { enumerable: false });
  }

  getCachedList() {
    return getModelListFromCache(this._model, this);
  }

  execute(opts?: FetchOptions) {
    return fetchModel(this._model, this, opts);
  }
}

export default GraphandQuery;
