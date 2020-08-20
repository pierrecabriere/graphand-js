import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";

class Rule extends GraphandModel {
  static apiIdentifier = "rules";

  static baseUrl = "/rules";

  static get baseFields() {
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
          { value: "read", label: "Lire" },
          { value: "update", label: "Modifier" },
          { value: "delete", label: "Supprimer" },
        ],
      }),
      prohibition: new GraphandFieldBoolean({ name: "Interdiction", defaultValue: false }),
      conditions: new GraphandFieldJSON({ name: "Conditions" }),
    };
  }
}

export default Rule;
