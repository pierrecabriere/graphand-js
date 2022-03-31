import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";
import GraphandModelListPromise from "../lib/GraphandModelListPromise";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import { FetchOptions } from "./fetchModel";

type QueryOptions = {
  fetch: FetchOptions | boolean;
  cache: boolean;
};

const queryModel = (Model: typeof GraphandModel, query: any, opts: QueryOptions | boolean = true): GraphandModelList | GraphandModelListPromise => {
  if (Array.isArray(query)) {
    query = { ids: query };
  }

  const defaultOptions = { fetch: true, cache: true };
  opts = Object.assign({}, defaultOptions, typeof opts === "object" ? opts : { fetch: opts });

  const { fetch, cache } = opts;

  let list;
  let mapIds;

  if (query.ids) {
    if (query.ids instanceof GraphandModelList || query.ids instanceof GraphandModelListPromise) {
      query.ids = query.ids.ids;
    } else if (query.ids instanceof GraphandModel || query.ids instanceof GraphandModelPromise) {
      query.ids = [query.ids._id];
    } else if (typeof query.ids === "string") {
      query.ids = [query.ids];
    }

    if (cache && "ids" in query && Object.keys(query).length === 1) {
      mapIds = query.ids;
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
          await Model.init();

          let graphandList;
          const { data } = await Model.fetch(query, { cache });
          const storeList = Model._listSubject.getValue();
          if (mapIds) {
            const _list = mapIds?.map((_id) => storeList.find((item) => item._id === _id)).filter((r) => r) || [];
            graphandList = new GraphandModelList({ model: Model, count: mapIds.length, query }, ..._list);
          } else {
            const _list = data.data.rows?.map((row) => storeList.find((item) => item._id === row._id)).filter((r) => r) || [];
            graphandList = new GraphandModelList({ model: Model, count: data.data.count, query }, ..._list);
          }

          return resolve(graphandList);
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
};

export default queryModel;
export { QueryOptions };
