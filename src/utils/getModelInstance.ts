import { GraphandModel } from "../lib";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import { FetchOptions } from "./fetchModel";

const getModelInstance = (Model: typeof GraphandModel, query: any, fetch: FetchOptions | boolean = true, cache?) => {
  if (!query) {
    return new GraphandModelPromise(async (resolve, reject) => {
      try {
        await Model.init();
        const res = await Model.fetch(null);
        const _id = (res.data.data.rows && res.data.data.rows[0] && res.data.data.rows[0]._id) || res.data.data._id;
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

  // @ts-ignore
  const item = fetchOpts.cache && _id && Model.getList().find((item) => item._id === _id);

  if (!item && fetch) {
    return new GraphandModelPromise(
      async (resolve, reject) => {
        try {
          await Model.init();
          const { data } = await Model.fetch(query, fetchOpts);
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
};

export default getModelInstance;
