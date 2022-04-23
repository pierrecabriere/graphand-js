import { get as lodashGet, set as lodashSet } from "lodash";
import Client from "../Client";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";

export const processPopulate = (item: any, fields: any, client: Client, populatedPaths?: string[]) => {
  populatedPaths = populatedPaths ?? Object.keys(fields).filter((key) => fields[key] instanceof GraphandFieldRelation);
  for (const path of populatedPaths) {
    const field = fields[path];
    const populatedData = lodashGet(item, path);

    if (!field || !populatedData || typeof populatedData !== "object") {
      continue;
    }

    const model = client.getModel(field.ref);

    let value;
    if (field.multiple && Array.isArray(populatedData)) {
      const _items = populatedData.map((populatedItem) => new model(populatedItem));
      model.upsertStore(_items);
      value = populatedData.map((i) => i && i._id).filter(Boolean);
    } else {
      const _item = new model(populatedData);
      model.upsertStore(_item);
      value = _item._id;
    }

    lodashSet(item, path, value);
  }

  return item;
};
