export const getPopulatedPaths = (populateQuery) => {
  if (!populateQuery) {
    return null;
  }

  if (typeof populateQuery === "string") {
    return [populateQuery];
  }

  const _getPopulatedPaths = function (list, arr, prefix) {
    for (const pop of arr) {
      list.push(prefix + pop.path);
      if (!Array.isArray(pop.populate)) {
        continue;
      }
      _getPopulatedPaths(list, pop.populate, prefix + pop.path + ".");
    }
  };

  const ret = [];
  for (const path of Object.keys(populateQuery)) {
    const pop = populateQuery[path];
    if ("string" === typeof pop) {
      ret.push(pop);
      continue;
    } else if (!Array.isArray(pop.populate)) {
      continue;
    }

    _getPopulatedPaths(ret, pop.populate, path + ".");
  }

  return ret;
};
