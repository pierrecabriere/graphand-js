import { AxiosRequestConfig } from "axios";
import { GraphandModel } from "../lib";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import { getPopulatedPaths } from "./getPopulatedPaths";
import parseQuery from "./parseQuery";
import { processPopulate } from "./processPopulate";

interface FetchOptions {
  cache?: boolean;
  callback?: (any) => any;
  hooks?: boolean;
  authToken?: string;
  global?: boolean;
  axiosOpts?: AxiosRequestConfig;
}

const _queryIds = {};
const _queryIdsTimeout = {};

const _handleRequestResult = async (Model: typeof GraphandModel, data, query) => {
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

    await Promise.all(populatedModels.map((model) => model.init()));
  }

  let _rows = data?.rows ? data.rows : data?._id ? [data] : [];
  if (populatedPaths?.length) {
    const fields = Model.getFields();
    _rows.forEach((_row) => processPopulate(_row, fields, Model._client, populatedPaths));
  }

  const rows = _rows.map((item) => {
    const found = item?._id && Model.get(item._id, false);
    if (!found) {
      return new Model(item);
    }

    found.assign(item);
    return found;
  });

  Model.upsertStore(rows);

  return rows;
};

const _request = async (Model: typeof GraphandModel, query, hooks, cacheKey?, opts: FetchOptions = {}) => {
  let res;

  try {
    const axiosOpts: AxiosRequestConfig = opts.axiosOpts || {};
    axiosOpts.baseURL = opts.global ? `${Model._client._options.ssl ? "https" : "http"}://${Model._client._options.host}` : undefined;
    const isSimpleQuery = typeof query?.query?._id === "string" && Object.keys(query.query).length === 1;
    if (isSimpleQuery) {
      const {
        query: { _id },
        ...params
      } = query;
      const url = `${Model.baseUrl}/${_id}`;
      res = await Model._client._axios.get(url, { ...axiosOpts, params });
    } else {
      const url = Model.queryUrl || `${Model.baseUrl}/query`;
      res = await Model._client._axios.post(url, query, axiosOpts);
    }

    await _handleRequestResult(Model, res.data.data, query);
  } catch (e) {
    delete Model._cache[cacheKey];

    if (hooks) {
      await Model.afterQuery?.call(Model, query, null, e);
    }

    throw e;
  }

  if (cacheKey) {
    Model._cache[cacheKey] = Model._cache[cacheKey] || {};
    Model._cache[cacheKey].previous = res;
  }

  if (hooks) {
    await Model.afterQuery?.call(Model, query, res);
  }

  return res;
};

const fetchModel = async (Model: typeof GraphandModel, query: any, opts: FetchOptions | boolean) => {
  _queryIds[Model.scope] = _queryIds[Model.scope] || new Set();
  _queryIdsTimeout[Model.scope] = _queryIdsTimeout[Model.scope] || {};

  const queryIds = _queryIds[Model.scope];
  const queryIdsTimeout = _queryIdsTimeout[Model.scope];

  query = parseQuery(query);

  const defaultOptions = {
    cache: true,
    callback: undefined,
    hooks: true,
  };

  opts = Object.assign({}, defaultOptions, typeof opts === "object" ? opts : { cache: opts ?? defaultOptions.cache });
  const { cache, callback, hooks } = opts;

  if (cache && typeof query === "object" && "ids" in query) {
    if (Model._client._options.mergeQueries && Object.keys(query).length === 1 && queryIds.size + query.ids.length < 100) {
      if (queryIdsTimeout) {
        clearTimeout(queryIdsTimeout);
      }

      query.ids.forEach(queryIds.add, queryIds);
      await new Promise((resolve) => setTimeout(resolve));
      query = { ids: [...queryIds] };
    }

    if (Object.keys(query).length === 1 && Object.keys(query.ids).length === 1) {
      query = { query: { _id: query.ids[0] } };
    }
  } else if (typeof query === "string") {
    query = { query: { _id: query } };
  }

  // if (Model.translatable && !query.translations && Model._client._project?.locales?.length) {
  //   query.translations = Model._client._project?.locales;
  // }

  if (hooks) {
    await Model.beforeQuery?.call(Model, query);
  }

  if (!cache) {
    return await _request(Model, query, hooks, undefined, opts);
  }

  let res;
  const cacheKey = Model.getCacheKey(query);
  const cacheEntry = Model._cache[cacheKey];

  try {
    if (!cacheEntry) {
      Model._cache[cacheKey] = {
        previous: null,
        request: _request(Model, query, hooks, cacheKey, opts),
      };

      res = await Model._cache[cacheKey].request;
      callback?.call(callback, res);
    } else {
      if (cacheEntry.previous) {
        callback?.call(callback, cacheEntry.previous);
      }

      if (!cacheEntry.request) {
        cacheEntry.request = _request(Model, query, hooks, cacheKey, opts);
      }

      res = await cacheEntry.request;
    }
  } catch (e) {
    if (e.data) {
      res = e.response;
    } else {
      throw e;
    }

    if (e.graphandErrors) {
      console.error(e.graphandErrors);
    }
  }

  _queryIdsTimeout[Model.scope] = setTimeout(() => (_queryIds[Model.scope] = new Set()));
  callback?.call(callback, res);

  return res;
};

export default fetchModel;
export { FetchOptions };
