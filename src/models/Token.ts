import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Token extends GraphandModel {
  static apiIdentifier = "tokens";
  static baseUrl = "/tokens";
  static scope = "Token";

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      description: new GraphandFieldText({ name: "Description" }),
      accessToken: new GraphandFieldText({
        name: "Clé d'accès",
      }),
      role: new GraphandFieldRelation({
        name: "Rôle",
        model: "Role",
        multiple: false,
      }),
      expiration: new GraphandFieldDate({
        name: "Date d'expiration",
      }),
    };
  }
}

export default Token;
