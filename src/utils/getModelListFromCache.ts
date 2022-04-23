import GraphandModel from "../lib/GraphandModel";
import GraphandModelList from "../lib/GraphandModelList";

const getModelListFromCache = (Model: typeof GraphandModel, query: any) => {
  const cacheKey = Model.getCacheKey(query);
  const cacheEntry = Model._cache[cacheKey];
  if (!cacheEntry?.data?.data) {
    return;
  }

  let rows, count;
  if (cacheEntry.data.data._id) {
    rows = [cacheEntry.data.data];
    count = 1;
  } else {
    rows = cacheEntry.data.data.rows;
    count = cacheEntry.data.data.count;
  }

  const ids = rows.map((r) => r._id);
  const cacheList = ids.map((_id) => Model.get(_id, false));
  if (cacheList.every(Boolean)) {
    return new GraphandModelList({ model: Model, count: count || cacheList.length, query }, ...cacheList);
  }
};

export default getModelListFromCache;
