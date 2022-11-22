import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldJSON, { GraphandFieldJSONDefinition } from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope, { GraphandFieldScopeDefinition } from "../lib/fields/GraphandFieldScope";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Role from "./Role";

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

  role: GraphandFieldRelationDefinition<{ model: Role; multiple: false; required: true }>;
  scope: GraphandFieldScopeDefinition<{ required: true }>;
  actions: GraphandFieldTextDefinition<{ multiple: true }>;
  fields: GraphandFieldTextDefinition<{ multiple: true }>;
  conditions: GraphandFieldJSONDefinition;
}

export default Restriction;
