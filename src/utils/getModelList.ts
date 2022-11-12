import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";
import GraphandModelListPromise from "../lib/GraphandModelListPromise";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import GraphandQuery from "../lib/GraphandQuery";
import { FetchOptions } from "./fetchModel";

type ModelListOptions = {
  fetch?: FetchOptions | boolean;
  cache?: boolean;
  log?: boolean;
};

function getModelList<T extends typeof GraphandModel>(
  Model: T,
  _q: any,
  _opts: FetchOptions | boolean = true,
): GraphandModelList<InstanceType<T>> | GraphandModelListPromise<InstanceType<T>> {
  if (!Model._client) {
    throw new Error(`Model ${Model.scope} is not registered`);
  }

  const defaultOptions = { fetch: true, cache: true };
  const opts: ModelListOptions = Object.assign({}, defaultOptions, typeof _opts === "object" ? _opts : { fetch: _opts });

  const { fetch, cache } = opts;

  const query = new GraphandQuery(Model, _q);

  let list: GraphandModelList<InstanceType<T>> = query.getCachedList();

  if (!list && query.ids) {
    if (query.ids instanceof GraphandModelList || query.ids instanceof GraphandModelListPromise) {
      query.ids = query.ids.ids;
    } else if (query.ids instanceof GraphandModel || query.ids instanceof GraphandModelPromise) {
      query.ids = [query.ids._id];
    } else if (typeof query.ids === "string") {
      query.ids = [query.ids];
    }

    if (cache && query.isMergeable()) {
      const cacheList = query.ids.map((_id) => Model.get(_id, false));
      if (cacheList.every(Boolean)) {
        list = new GraphandModelList<InstanceType<T>>({ model: Model, count: cacheList.length, query, rows: cacheList });
      }
    }
  }

  if (!list && fetch) {
    return new GraphandModelListPromise<InstanceType<T>>(
      async (resolve) => {
        try {
          await Model._init();

          let graphandModelList;
          const fetchOpts: FetchOptions = typeof fetch === "object" ? fetch : {};
          fetchOpts.cache = fetchOpts.cache ?? cache;
          const { rows, count } = await query.execute(fetchOpts);
          const storeList = Model._listSubject.getValue();

          if (query.isMergeable()) {
            const _list = query.ids?.map((_id) => storeList.find((item) => item._id === _id)).filter(Boolean) || [];
            graphandModelList = new GraphandModelList<InstanceType<T>>({ model: Model, count: _list.length, query, rows: _list });
          } else {
            const _list = rows.map((row) => storeList.find((item) => item._id === row._id)).filter(Boolean) || [];
            graphandModelList = new GraphandModelList<InstanceType<T>>({ model: Model, count, query, rows: _list });
          }

          return resolve(graphandModelList);
        } catch (e) {
          console.error(e);
          return resolve(new GraphandModelList<InstanceType<T>>({ model: Model, query }));
        }
      },
      Model,
      query,
    );
  }

  return list;
}

export default getModelList;
export { ModelListOptions };
