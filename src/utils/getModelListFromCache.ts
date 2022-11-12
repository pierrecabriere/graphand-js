import GraphandModel from "../lib/GraphandModel";
import GraphandModelList from "../lib/GraphandModelList";

const getModelListFromCache = <T extends typeof GraphandModel>(model: T, query: any) => {
  const cacheKey = model.getCacheKey(query);
  const cacheEntry = model._cache[cacheKey];
  if (!cacheEntry) {
    return;
  }

  const { rows, count } = cacheEntry;

  const cachedRows = rows.map((r) => model.get(r._id, false));
  if (!cachedRows.every(Boolean)) {
    return;
  }

  return new GraphandModelList<InstanceType<T>>({ model, count, query, rows: cachedRows });
};

export default getModelListFromCache;
