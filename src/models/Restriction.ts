import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Restriction extends GraphandModel {
  static apiIdentifier = "restrictions";
  static baseUrl = "/restrictions";
  static scope = "Restriction";
  static schema = {
    role: new GraphandFieldRelation({ name: "Rôle", ref: "Role", multiple: false }),
    scope: new GraphandFieldScope({ name: "Scope" }),
    actions: new GraphandFieldText({ name: "Actions", type: GraphandFieldText, multiple: true, options: ["create", "update"] }),
    fields: new GraphandFieldText({ name: "Champs à restreindre", multiple: true }),
    conditions: new GraphandFieldJSON({ name: "Conditions" }),
  };
}

export default Restriction;
