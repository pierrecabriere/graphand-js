import ModelScopes from "../enums/model-scopes";
import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

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
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    accessToken: new GraphandFieldText(),
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    expiration: new GraphandFieldDate(),
  };

  name;
  description;
  accessToken;
  role;
  expiration;
}

export default Token;
