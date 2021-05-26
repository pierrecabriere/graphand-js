import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldSelect from "../lib/fields/GraphandFieldSelect";
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
      actions: new GraphandFieldSelect({
        name: "Actions",
        type: GraphandFieldText,
        multiple: true,
        options: [
          { value: "create", label: "Créer" },
          { value: "read", label: "Lire" },
          { value: "update", label: "Modifier" },
          { value: "delete", label: "Supprimer" },
          { value: "count", label: "Compter" },
          { value: "login", label: "Se connecter" },
          { value: "register", label: "S'inscrire" },
          { value: "execute", label: "Exécuter" },
        ],
      }),
      prohibition: new GraphandFieldBoolean({ name: "Interdiction", defaultValue: false }),
      conditions: new GraphandFieldJSON({ name: "Conditions" }),
    };
  }
}

export default Rule;
