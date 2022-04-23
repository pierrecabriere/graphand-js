import Client from "../Client";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class DataModel
 * @augments GraphandModel
 * @classdesc DataModel model. Use {@link Client#getModel client.getModel("DataModel")} to use this model
 */
class DataModel extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "data-models";
  static baseUrl = "/data-models";
  static scope = "DataModel";
  static schema = {
    name: new GraphandFieldText(),
    nameSingle: new GraphandFieldText(),
    nameMultiple: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    multiple: new GraphandFieldBoolean({ defaultValue: true }),
    defaultField: new GraphandFieldRelation({ ref: "DataField" }),
  };
}

DataModel.hook("postDelete", ({ payload }) => {
  const clients = new Set();

  if (Array.isArray(payload)) {
    payload.forEach((p) => clients.add(p.constructor._client));
  } else {
    clients.add(payload.constructor._client);
  }

  clients.forEach((client: Client) => {
    const DataField = client.getModel("DataField");
    DataField.reinit();
  });
});

export default DataModel;
