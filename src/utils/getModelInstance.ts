import { GraphandModel, GraphandModelList } from "../lib";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import GraphandQuery from "../lib/GraphandQuery";
import { FetchOptions } from "./fetchModel";

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
        const { data } = await new GraphandQuery(Model).execute();
        const _id = (data.data.rows && data.data.rows[0] && data.data.rows[0]._id) || data.data._id;
        resolve(Model.get(_id, false));
      } catch (e) {
        reject(e);
      }
    }, Model);
  }

  let _id;
  if (query instanceof GraphandModel) {
    _id = query._id;
    cache = cache ?? true;
  } else if (typeof query === "string") {
    _id = query;
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

  if (!item && fetch) {
    return new GraphandModelPromise<InstanceType<T>>(
      async (resolve, reject) => {
        await Model._init();
        try {
          const q = _id ? { query: { _id } } : { ...query, pageSize: 1 };
          const { data } = await new GraphandQuery(Model, q).execute(fetchOpts);
          let row;

          if (data.data) {
            if (data.data.rows) {
              if (_id) {
                row = data.data.rows.find((row) => row._id === _id);
              } else {
                row = data.data.rows[0];
              }
            } else {
              row = data.data;
            }
          }

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
