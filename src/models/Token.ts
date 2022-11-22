import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Role from "./Role";

/**
 * @class Token
 * @augments GraphandModel
 * @classdesc Token model. Use {@link GraphandClient#getModel client.getModel("Token")} to use this model
 */
class Token extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "tokens";
  static baseUrl = "/tokens";
  static scope = ModelScopes.Token;
  static envScope = ModelEnvScopes.PROJECT;
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    accessToken: new GraphandFieldText(),
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    expiration: new GraphandFieldDate(),
  };

  name: GraphandFieldTextDefinition;
  description: GraphandFieldTextDefinition;
  accessToken: GraphandFieldTextDefinition<{ required: true }>;
  role: GraphandFieldRelationDefinition<{ model: Role; required: true }>;
  expiration;
}

export default Token;
