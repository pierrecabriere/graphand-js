import { GraphandModel, GraphandModelList } from "../lib";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import GraphandQuery from "../lib/GraphandQuery";
import { FetchOptions } from "./fetchModel";
import isId from "./isId";

function getModelInstance<T extends typeof GraphandModel>(
  Model: T,
  query?: any,
  fetch?: FetchOptions | boolean,
  cache?,
): InstanceType<T> | GraphandModelPromise<InstanceType<T>> {
  cache = cache ?? !fetch;
  fetch = fetch ?? true;

  if (!query) {
    return new GraphandModelPromise(async (resolve, reject) => {
      await Model._init();
      try {
        const { rows } = await new GraphandQuery(Model).execute();
        const _id = rows[0]._id;
        resolve(Model.get(_id, false));
      } catch (e) {
        reject(e);
      }
    }, Model);
  }

  let _id;
  if (query instanceof GraphandModel) {
    _id = query._id;
    query = { query: { _id } };
    cache = cache ?? true;
  } else if (typeof query === "string") {
    _id = query;
    query = { query: { _id } };
    cache = cache ?? true;
  } else if (typeof query === "object" && query.query?._id && typeof query.query._id === "string") {
    _id = query.query._id;
    cache = cache ?? Object.keys(query).length === 1;
  } else {
    cache = cache ?? true;
  }

  const fetchOpts: FetchOptions = typeof fetch === "object" ? fetch : {};
  fetchOpts.cache = fetchOpts.cache ?? cache;

  let item;
  if (fetchOpts.cache && _id) {
    const modelList = Model.getList() as GraphandModelList<InstanceType<T>>;
    item = modelList.find((item) => item._id === _id);
  }

  if (item && fetchOpts.populate) {
    // TODO : check if all populate fields are already populated
    item = null;
  }

  if (!item && fetch) {
    return new GraphandModelPromise<InstanceType<T>>(
      async (resolve, reject) => {
        await Model._init();

        try {
          const _isId = isId(_id);
          const q = _isId ? { ids: [_id] } : { ...query, pageSize: 1 };
          const { rows } = await new GraphandQuery(Model, q).execute(fetchOpts);
          const row = _isId ? rows.find((row) => row._id === _id) : rows[0];

          if (row?._id) {
            let item;

            if (cache) {
              item = Model.get(row?._id, false);
            }

            item = item || new Model(row);

            return resolve(item);
          }

          return resolve(null);
        } catch (e) {
          reject(e);
        }
      },
      Model,
      query,
    );
  }

  return item;
}

export default getModelInstance;
