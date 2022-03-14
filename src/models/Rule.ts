import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Rule extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "rules";
  static baseUrl = "/rules";
  static scope = "Rule";
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
}

export default Rule;
