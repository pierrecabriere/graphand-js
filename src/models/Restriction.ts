import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Restriction extends GraphandModel {
  static apiIdentifier = "restrictions";
  static baseUrl = "/restrictions";
  static scope = "Restriction";

  static baseFields(values) {
    const model = values && this._client.getModel(values.scope);
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
        type: GraphandFieldText,
        multiple: true,
        options: ["create", "update"],
      }),
      fields: new GraphandFieldText({
        name: "Champs à restreindre",
        multiple: true,
        options: model
          ? Object.keys(model.fields).map((slug) => ({
              value: slug,
              label: model.fields[slug].name || slug,
            }))
          : [],
      }),
      conditions: new GraphandFieldJSON({ name: "Conditions" }),
    };
  }
}

export default Restriction;
