import { AxiosRequestConfig, AxiosResponse } from "axios";
import { GraphandModel } from "../lib";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandQuery, { GraphandQueryResponse } from "../lib/GraphandQuery";
import { getPopulatedPaths } from "./getPopulatedPaths";
import processPopulate from "./processPopulate";

type FetchOptions = {
  cache?: boolean;
  hooks?: boolean;
  authToken?: string;
  global?: boolean;
  axiosOpts?: AxiosRequestConfig;
  populate?: any;
};

const _queries = {};
const _queryIds = {};
const _queryIdsTimeout = {};

const _handleRequestResult = async (Model: typeof GraphandModel, res: GraphandQueryResponse, query) => {
  const populatedPaths = getPopulatedPaths(query.populate);

  if (populatedPaths?.length) {
    const populatedModels = [];

    const _processPath = (parentModel, path) => {
      const field = parentModel.fields[path];

      if (field instanceof GraphandFieldRelation) {
        const nextModel = Model._client.getModel(field.ref);
        populatedModels.push(nextModel);
        return nextModel;
      }

      return;
    };

    await Promise.all(
      populatedPaths.map(async (path) => {
        if (path.includes(".")) {
          _processPath(Model, path);
        } else {
          const paths = path.split(".");
          await paths.reduce(async (promise, currentPath) => {
            const parentModel = await promise;

            if (!parentModel) {
              return;
            }

            return _processPath(parentModel, currentPath);
          }, Promise.resolve(Model));
        }
      }),
    );

    await Promise.all(populatedModels.map((model) => model._init()));
  }

  if (populatedPaths?.length) {
    const fields = Model.getFields();
    res.rows.forEach((row) => processPopulate(row, fields, Model._client, populatedPaths));
  }

  Model.hydrate(res.rows, true);
};

const _request = async (Model: typeof GraphandModel, query, hooks, cacheKey, opts: FetchOptions = {}): Promise<GraphandQueryResponse> => {
  let axiosRes: AxiosResponse, res: GraphandQueryResponse;

  try {
    const axiosOpts: AxiosRequestConfig<any> = opts.axiosOpts || {};
    // @ts-ignore
    axiosOpts.global = opts.global ?? Model.isGlobal;
    let singleId, params;
    if (query?.ids?.length === 1 && !query?.query) {
      const {
        ids: [_id],
        ..._params
      } = query;

      singleId = _id;
      params = _params;
    } else if (!query?.ids && typeof query?.query?._id === "string" && Object.keys(query.query).length === 1) {
      const {
        query: { _id },
        ..._params
      } = query;

      singleId = _id;
      params = _params;
    }

    if (singleId) {
      const url = `${Model.baseUrl}/${singleId}`;
      axiosRes = await Model._client._axios.get(url, { ...axiosOpts, params });
      res = { axiosRes, rows: [axiosRes.data.data], count: 1 };
    } else {
      const url = Model.queryUrl || `${Model.baseUrl}/query`;
      axiosRes = await Model._client._axios.post(url, query, axiosOpts);
      res = { axiosRes, rows: [], count: 0 };
      if (axiosRes.data.data?.rows) {
        res.rows = axiosRes.data.data.rows;
        res.count = axiosRes.data.data.count;
      } else if (axiosRes.data.data?._id) {
        res.rows = [axiosRes.data.data];
        res.count = 1;
      }
    }

    await _handleRequestResult(Model, res, query);
  } catch (e) {
    if (hooks) {
      await Model.execHook("postQuery", [query, null, e]);
    }

    throw e;
  }

  return res;
};

const fetchModel = async (Model: typeof GraphandModel, query: any, opts?: FetchOptions | boolean): Promise<GraphandQueryResponse> => {
  const modelKey = [Model._client?._options?.project, Model.scope].filter(Boolean).join(",");

  _queryIds[modelKey] = _queryIds[modelKey] || new Set();
  _queryIdsTimeout[modelKey] = _queryIdsTimeout[modelKey] || {};

  const queryIds = _queryIds[modelKey];
  const queryIdsTimeout = _queryIdsTimeout[modelKey];

  const mergeIds = async () => {
    if (Model._client._options.mergeQueries && query.isMergeable() && queryIds.size + query.ids.length < 100) {
      if (queryIdsTimeout) {
        clearTimeout(queryIdsTimeout);
      }

      query.ids.forEach(queryIds.add, queryIds);
      await new Promise((resolve) => setTimeout(resolve));
      query.ids = [...queryIds];
    }

    if (query.isMergeable() && query.ids?.length === 1) {
      query = new GraphandQuery(query._model, { query: { _id: query.ids[0] } });
    }
  };

  const defaultOptions = {
    cache: true,
    hooks: true,
  };

  opts = Object.assign({}, defaultOptions, typeof opts === "object" ? opts : { cache: opts ?? defaultOptions.cache });
  const { cache, hooks } = opts;

  if (typeof query === "string") {
    query = new GraphandQuery(Model, { ids: [query] });
  }

  if (cache && query.isMergeable()) {
    await mergeIds();
  }

  // if (Model.translatable && !query.translations && Model._client._project?.locales?.length) {
  //   query.translations = Model._client._project?.locales;
  // }

  if (hooks) {
    await Model.execHook("preQuery", [query]);
  }

  let res: GraphandQueryResponse;
  const cacheKey = Model.getCacheKey(query);

  if (cache) {
    res = Model._cache[cacheKey];
  }

  if (!res) {
    _queries[modelKey] = _queries[modelKey] || {};
    if (!_queries[modelKey][cacheKey]) {
      _queries[modelKey][cacheKey] = _request(Model, query, hooks, cacheKey, opts);
    }

    try {
      res = await _queries[modelKey][cacheKey];
    } catch (e) {
      delete _queries[modelKey][cacheKey];
      throw e;
    }

    if (hooks) {
      await Model.execHook("postQuery", [query, res]);
    }
  }

  Model._cache[cacheKey] = res;
  delete _queries[modelKey][cacheKey];

  _queryIdsTimeout[modelKey] = setTimeout(() => (_queryIds[modelKey] = new Set()));

  return res;
};

export default fetchModel;
export { FetchOptions };
