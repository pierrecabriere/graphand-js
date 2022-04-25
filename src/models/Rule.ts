import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Rule
 * @augments GraphandModel
 * @classdesc Rule model. Use {@link Client#getModel client.getModel("Rule")} to use this model
 */
class Rule extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "rules";
  static baseUrl = "/rules";
  static scope = ModelScopes.Rule;
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

  role;
  scope;
  actions;
  prohibition;
  conditions;
}

export default Rule;
