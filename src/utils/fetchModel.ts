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
};

const _queries = {};
const _queryIds = {};
const _queryIdsTimeout = {};

const _handleRequestResult = async (Model: typeof GraphandModel, rows, query) => {
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
    rows.forEach((row) => processPopulate(row, fields, Model._client, populatedPaths));
  }

  return Model.hydrate(rows, true);
};

const _request = async (Model: typeof GraphandModel, query, hooks, cacheKey, opts: FetchOptions = {}): Promise<GraphandQueryResponse> => {
  let axiosRes: AxiosResponse, res: GraphandQueryResponse;

  try {
    const axiosOpts: AxiosRequestConfig = opts.axiosOpts || {};
    axiosOpts.baseURL = opts.global ? `${Model._client._options.ssl ? "https" : "http"}://${Model._client._options.host}` : undefined;
    let singleId, params;
    if (typeof query?.query?._id === "string" && Object.keys(query.query).length === 1) {
      const {
        query: { _id },
        ..._params
      } = query;

      singleId = _id;
      params = _params;
    } else if (query?.ids?.length === 1 && (!query.query || !Object.keys(query.query).length)) {
      const {
        ids: [_id],
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

    await _handleRequestResult(Model, res.rows, query);
  } catch (e) {
    if (hooks) {
      await Model.execHook("postQuery", [query, null, e]);
    }

    throw e;
  }

  return res;
};

const fetchModel = async (Model: typeof GraphandModel, query: any, opts?: FetchOptions | boolean): Promise<GraphandQueryResponse> => {
  _queryIds[Model.scope] = _queryIds[Model.scope] || new Set();
  _queryIdsTimeout[Model.scope] = _queryIdsTimeout[Model.scope] || {};

  const queryIds = _queryIds[Model.scope];
  const queryIdsTimeout = _queryIdsTimeout[Model.scope];

  const mergeIds = async () => {
    if (Model._client._options.mergeQueries && query.isReturnableByIds() && queryIds.size + query.ids.length < 100) {
      if (queryIdsTimeout) {
        clearTimeout(queryIdsTimeout);
      }

      query.ids.forEach(queryIds.add, queryIds);
      await new Promise((resolve) => setTimeout(resolve));
      query.ids = [...queryIds];
    }

    if (query.isReturnableByIds() && query.ids?.length === 1) {
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
    query = { ids: [query] };
  }

  if (cache && typeof query === "object" && "ids" in query) {
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
    _queries[Model.scope] = _queries[Model.scope] || {};
    _queries[Model.scope][cacheKey] = _queries[Model.scope][cacheKey] || _request(Model, query, hooks, cacheKey, opts);
    res = await _queries[Model.scope][cacheKey];

    if (hooks) {
      await Model.execHook("postQuery", [query, res]);
    }
  }

  Model._cache[cacheKey] = res;
  delete _queries[Model.scope][cacheKey];

  _queryIdsTimeout[Model.scope] = setTimeout(() => (_queryIds[Model.scope] = new Set()));

  return res;
};

export default fetchModel;
export { FetchOptions };
