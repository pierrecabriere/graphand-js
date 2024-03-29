import EnvironmentStatuses from "../enums/environment-statuses";
import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Environment
 * @augments GraphandModel
 * @classdesc Environment model. Use {@link GraphandClient#getModel client.getModel("Environment")} to use this model
 */
class Environment extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "environments";
  static baseUrl = "/environments";
  static scope = ModelScopes.Environment;
  static envScope = ModelEnvScopes.PROJECT;
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    cloneFrom: new GraphandFieldRelation({ ref: "Environment", multiple: false }),
    status: new GraphandFieldText({ options: Object.values(EnvironmentStatuses) }),
  };

  name: GraphandFieldTextDefinition;
  description: GraphandFieldTextDefinition;
  cloneFrom: GraphandFieldRelationDefinition<{ model: Environment; required: true }>;
  status: EnvironmentStatuses | GraphandFieldTextDefinition<{ required: true }>;

  async merge(opts) {
    const { constructor } = Object.getPrototypeOf(this);
    await constructor._client._axios.post(`/environments/${this._id}/merge`, opts);
  }
}

export default Environment;
