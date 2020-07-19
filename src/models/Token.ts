import GraphandFieldDate from "../utils/fields/GraphandFieldDate";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Token extends GraphandModel {
  static apiIdentifier = "tokens";

  static baseUrl = "/tokens";

  static queryFields = false;

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      accessToken: new GraphandFieldText({
        name: "Clé d'accès",
      }),
      role: new GraphandFieldRelation({
        name: "Rôle",
        model: this._client.models.Role,
        multiple: false,
      }),
      expiration: new GraphandFieldDate({
        name: "Date d'expiration",
      }),
    };
  }
}

export default Token;
