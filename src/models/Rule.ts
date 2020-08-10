import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Rule extends GraphandModel {
  static apiIdentifier = "rules";

  static baseUrl = "/rules";

  static get baseFields() {
    const models = this._client.models.DataModel.getList();
    const options = models.reduce(
      (scopes, model) => {
        scopes.push({ value: `DataItem:${model._id}`, label: model.name });
        return scopes;
      },
      [
        { value: "Role", label: "Role" },
        { value: "Account", label: "Comptes" },
      ],
    );

    return {
      role: new GraphandFieldRelation({
        name: "Rôle",
        model: this._client.models.Role,
        multiple: false,
      }),
      scope: new GraphandFieldSelect({
        name: "Scope",
        type: GraphandFieldText,
        options,
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
