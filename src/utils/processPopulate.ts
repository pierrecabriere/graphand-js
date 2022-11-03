import { get as lodashGet, set as lodashSet } from "lodash";
import GraphandClient from "../GraphandClient";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelList from "../lib/GraphandModelList";

function processPopulate(item: any, fields: any, client: GraphandClient, populatedPaths?: string[]) {
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
      const _items = model.hydrate(populatedData, true) as GraphandModelList<GraphandModel>;
      value = [..._items].map((i) => i && i._id).filter(Boolean);
    } else {
      const _item = model.hydrate(populatedData, true) as GraphandModel;
      value = _item._id;
    }

    lodashSet(item, path, value);
  }

  return item;
}

export default processPopulate;
