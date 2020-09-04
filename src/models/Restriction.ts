import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Restriction extends GraphandModel {
  static apiIdentifier = "restrictions";

  static baseUrl = "/restrictions";

  static baseFields(values) {
    const model = values && this._client.getModelFromScope(values.scope);
    return {
      role: new GraphandFieldRelation({
        name: "Rôle",
        model: this._client.models.Role,
        multiple: false,
      }),
      scope: new GraphandFieldScope({
        name: "Scope",
      }),
      actions: new GraphandFieldSelect({
        name: "Actions",
        type: GraphandFieldText,
        multiple: true,
        options: [
          { value: "create", label: "Créer" },
          { value: "update", label: "Modifier" },
        ],
      }),
      fields: new GraphandFieldSelect({
        name: "Champs à restreindre",
        type: GraphandFieldText,
        multiple: true,
        options: model ? Object.keys(model.fields).map((slug) => ({ value: slug, label: model.fields[slug].name || slug })) : [],
      }),
      conditions: new GraphandFieldJSON({ name: "Conditions" }),
    };
  }
}

export default Restriction;
