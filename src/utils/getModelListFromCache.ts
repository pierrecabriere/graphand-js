import GraphandModel from "../lib/GraphandModel";
import GraphandModelList from "../lib/GraphandModelList";

const getModelListFromCache = (model: typeof GraphandModel, query: any) => {
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

  return new GraphandModelList({ model, count, query, rows: cachedRows });
};

export default getModelListFromCache;
