import ModelEnvScopes from "../enums/model-env-scopes";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Environment extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "environments";
  static baseUrl = "/environments";
  static scope = "Environment";
  static schema = {
    name: new GraphandFieldText({ name: "Nom" }),
    description: new GraphandFieldText({ name: "Description" }),
    cloneFrom: new GraphandFieldRelation({ name: "Cloner depuis", ref: "Environment" }),
    status: new GraphandFieldText({ name: "Status", options: Object.values(ModelEnvScopes) }),
  };

  async merge(opts) {
    const { constructor } = Object.getPrototypeOf(this);
    await constructor._client._axios.post(`/environments/${this._id}/merge`, opts);
  }
}

export default Environment;
