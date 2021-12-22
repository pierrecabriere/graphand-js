import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Rule extends GraphandModel {
  static apiIdentifier = "rules";
  static baseUrl = "/rules";
  static scope = "Rule";

  static get baseFields() {
    return {
      role: new GraphandFieldRelation({
        name: "Rôle",
        model: this._client.getModel("Role"),
        multiple: false,
      }),
      scope: new GraphandFieldScope({
        name: "Scope",
      }),
      actions: new GraphandFieldText({
        name: "Actions",
        multiple: true,
        options: ["create", "read", "update", "delete", "count", "login", "register", "execute"],
      }),
      prohibition: new GraphandFieldBoolean({ name: "Interdiction", defaultValue: false }),
      conditions: new GraphandFieldJSON({ name: "Conditions" }),
    };
  }
}

export default Rule;
