import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean, { GraphandFieldBooleanDefinition } from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON, { GraphandFieldJSONDefinition } from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope, { GraphandFieldScopeDefinition } from "../lib/fields/GraphandFieldScope";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Role from "./Role";

/**
 * @class Rule
 * @augments GraphandModel
 * @classdesc Rule model. Use {@link GraphandClient#getModel client.getModel("Rule")} to use this model
 */
class Rule extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "rules";
  static baseUrl = "/rules";
  static scope = ModelScopes.Rule;
  static envScope = ModelEnvScopes.ENV;
  static schema = {
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    scope: new GraphandFieldScope(),
    actions: new GraphandFieldText({
      multiple: true,
      options: ["create", "read", "update", "delete", "count", "login", "register", "execute"],
    }),
    prohibition: new GraphandFieldBoolean({ defaultValue: false }),
    conditions: new GraphandFieldJSON(),
  };

  role: GraphandFieldRelationDefinition<{ model: Role; multiple: false; required: true }>;
  scope: GraphandFieldScopeDefinition<{ required: true }>;
  actions: GraphandFieldTextDefinition<{ multiple: true }>;
  prohibition: GraphandFieldBooleanDefinition;
  conditions: GraphandFieldJSONDefinition;
}

export default Rule;
