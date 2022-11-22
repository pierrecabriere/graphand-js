import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean, { GraphandFieldBooleanDefinition } from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Role
 * @augments GraphandModel
 * @classdesc Role model. Use {@link GraphandClient#getModel client.getModel("Role")} to use this model
 */
class Role extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "roles";
  static baseUrl = "/roles";
  static scope = ModelScopes.Role;
  static envScope = ModelEnvScopes.PROJECT;
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    admin: new GraphandFieldBoolean(),
    level: new GraphandFieldNumber(),
    inherits: new GraphandFieldRelation({
      ref: "Role",
      multiple: true,
    }),
  };

  name: GraphandFieldTextDefinition;
  description: GraphandFieldTextDefinition;
  admin: GraphandFieldBooleanDefinition;
  level;
  inherits: GraphandFieldRelationDefinition<{ model: Role; multiple: true; required: true }>;
}

export default Role;
