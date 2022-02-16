import _ from "lodash";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";

export const processPopulate = (item, fields, populatedPaths?) => {
  populatedPaths = populatedPaths ?? Object.keys(fields).filter((key) => fields[key] instanceof GraphandFieldRelation);
  for (const path of populatedPaths) {
    const field = fields[path];
    const populatedData = _.get(item, path);

    if (!field || !populatedData || typeof populatedData !== "object") {
      continue;
    }

    let value;
    if (field.multiple && Array.isArray(populatedData)) {
      const _items = populatedData.map((populatedItem) => new field.model(populatedItem));
      field.model.upsertStore(_items);
      value = populatedData.map((i) => i && i._id).filter(Boolean);
    } else {
      const _item = new field.model(populatedData);
      field.model.upsertStore(_item);
      value = _item._id;
    }

    _.set(item, path, value);
  }

  return item;
};
