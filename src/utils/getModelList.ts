import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";
import GraphandModelListPromise from "../lib/GraphandModelListPromise";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import GraphandQuery from "../lib/GraphandQuery";
import { FetchOptions } from "./fetchModel";

type ModelListOptions = {
  fetch: FetchOptions | boolean;
  cache: boolean;
};

function getModelList<T extends typeof GraphandModel>(
  Model: T,
  _q: any,
  _opts: FetchOptions | boolean = true,
): GraphandModelList<InstanceType<T>> | GraphandModelListPromise<InstanceType<T>> {
  const defaultOptions = { fetch: true, cache: true };
  const opts: ModelListOptions = Object.assign({}, defaultOptions, typeof _opts === "object" ? _opts : { fetch: _opts });

  const { fetch, cache } = opts;

  const query = new GraphandQuery(Model, _q);

  let list = query.getCachedList();
  let mapIds = query.ids;

  if (!list && query.ids) {
    if (query.ids instanceof GraphandModelList || query.ids instanceof GraphandModelListPromise) {
      query.ids = query.ids.ids;
    } else if (query.ids instanceof GraphandModel || query.ids instanceof GraphandModelPromise) {
      query.ids = [query.ids._id];
    } else if (typeof query.ids === "string") {
      query.ids = [query.ids];
    }

    const queryKeys = Object.keys(query).filter((key) => ["query", "ids", "pageSize", "page", "populate"].includes(key));
    if (cache && queryKeys.includes("ids") && queryKeys.length === 1) {
      const cacheList = query.ids.map((_id) => Model.get(_id, false));
      if (cacheList.every(Boolean)) {
        list = new GraphandModelList({ model: Model, count: cacheList.length, query }, ...cacheList);
      }
    }
  }

  if (!list && fetch) {
    return new GraphandModelListPromise(
      async (resolve) => {
        try {
          await Model._init();

          let graphandModelList;
          const fetchOpts: FetchOptions = typeof fetch === "object" ? fetch : {};
          fetchOpts.cache = fetchOpts.cache ?? cache;
          const { data } = await query.execute(fetchOpts);
          const storeList = Model._listSubject.getValue();
          if (mapIds) {
            const _list = mapIds?.map((_id) => storeList.find((item) => item._id === _id)).filter((r) => r) || [];
            graphandModelList = new GraphandModelList({ model: Model, count: mapIds.length, query }, ..._list);
          } else {
            const _list = data.data.rows?.map((row) => storeList.find((item) => item._id === row._id)).filter((r) => r) || [];
            graphandModelList = new GraphandModelList({ model: Model, count: data.data.count, query }, ..._list);
          }

          return resolve(graphandModelList);
        } catch (e) {
          console.error(e);
          return resolve(new GraphandModelList({ model: Model, query }));
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
