import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Token extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "tokens";
  static baseUrl = "/tokens";
  static scope = "Token";
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    accessToken: new GraphandFieldText(),
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    expiration: new GraphandFieldDate(),
  };
}

export default Token;
