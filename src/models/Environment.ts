import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Environment
 * @augments GraphandModel
 * @classdesc Environment model. Use {@link Client#getModel client.getModel("Environment")} to use this model
 */
class Environment extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "environments";
  static baseUrl = "/environments";
  static scope = ModelScopes.Environment;
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    cloneFrom: new GraphandFieldRelation({ ref: "Environment" }),
    status: new GraphandFieldText({ options: Object.values(ModelEnvScopes) }),
  };

  name;
  description;
  cloneFrom;
  status;

  async merge(opts) {
    const { constructor } = Object.getPrototypeOf(this);
    await constructor._client._axios.post(`/environments/${this._id}/merge`, opts);
  }
}

export default Environment;
