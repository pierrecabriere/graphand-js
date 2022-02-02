import ModelEnvScopes from "../enums/model-env-scopes";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Environment extends GraphandModel {
  static apiIdentifier = "environments";
  static baseUrl = "/environments";
  static scope = "Environment";

  static get baseFields() {
    return {
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      cloneFrom: new GraphandFieldRelation({
        name: "Cloner depuis",
        model: this._client.getModel("Environment"),
      }),
      status: new GraphandFieldText({ name: "Status", options: Object.values(ModelEnvScopes) }),
    };
  }
}

export default Environment;
