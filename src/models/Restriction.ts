import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Restriction
 * @augments GraphandModel
 * @classdesc Restriction model. Use {@link GraphandClient#getModel client.getModel("Restriction")} to use this model
 */
class Restriction extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "restrictions";
  static baseUrl = "/restrictions";
  static scope = ModelScopes.Restriction;
  static envScope = ModelEnvScopes.ENV;
  static schema = {
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    scope: new GraphandFieldScope(),
    actions: new GraphandFieldText({ multiple: true, options: ["create", "update"] }),
    fields: new GraphandFieldText({ multiple: true, creatable: true }),
    conditions: new GraphandFieldJSON(),
  };

  role;
  scope;
  actions;
  fields;
  conditions;
}

export default Restriction;
