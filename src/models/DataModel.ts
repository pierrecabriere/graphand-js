import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandClient from "../GraphandClient";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class DataModel
 * @augments GraphandModel
 * @classdesc DataModel model. Use {@link GraphandGraphandClient#getModel client.getModel("DataModel")} to use this model
 */
class DataModel extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "data-models";
  static baseUrl = "/data-models";
  static scope = ModelScopes.DataModel;
  static envScope = ModelEnvScopes.ENV;
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    multiple: new GraphandFieldBoolean({ defaultValue: true }),
    configuration: new GraphandFieldJSON(),
  };

  name;
  slug;
  multiple;
  configuration;
}

DataModel.hook("postCreate", (inserted, e) => {
  if (e) {
    return;
  }

  const clients = new Set();

  if (Array.isArray(inserted)) {
    inserted.forEach((p) => clients.add(p.constructor._client));
  } else {
    clients.add(inserted.constructor._client);
  }

  clients.forEach((client: GraphandClient) => {
    const [Module] = client.getModels(["Module"]);
    Module.reinit();
  });
});

DataModel.hook("postDelete", ({ payload }, e) => {
  if (e) {
    return;
  }

  const clients = new Set();

  if (Array.isArray(payload)) {
    payload.forEach((p) => clients.add(p.constructor._client));
  } else {
    clients.add(payload.constructor._client);
  }

  clients.forEach((client: GraphandClient) => {
    const [DataField, Module] = client.getModels(["DataField", "Module"]);
    DataField.reinit();
    Module.reinit();
  });
});

export default DataModel;
