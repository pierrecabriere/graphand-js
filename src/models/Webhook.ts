import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Webhook extends GraphandModel {
  static apiIdentifier = "webhooks";

  static baseUrl = "/webhooks";

  static queryFields = false;

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
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      endpoint: new GraphandFieldText({ name: "Url" }),
      method: new GraphandFieldSelect({
        name: "Méthode",
        type: GraphandFieldText,
        options: [
          { value: "get", label: "GET" },
          { value: "post", label: "POST" },
          { value: "put", label: "PUT" },
          { value: "patch", label: "PATCH" },
          { value: "delete", label: "DELETE" },
        ],
      }),
      scope: new GraphandFieldScope({
        name: "Scope",
      }),
      actions: new GraphandFieldSelect({
        name: "Actions",
        type: GraphandFieldText,
        multiple: true,
        options: [
          { value: "before_create", label: "before_create" },
          { value: "after_create", label: "after_create" },
          { value: "before_update", label: "before_update" },
          { value: "after_update", label: "after_update" },
          { value: "before_delete", label: "before_delete" },
          { value: "after_delete", label: "after_delete" },
          { value: "before_execute", label: "before_execute" },
          { value: "after_execute", label: "after_execute" },
        ],
      }),
      await: new GraphandFieldBoolean({ name: "Attendre le retour", defaultValue: false }),
      timeout: new GraphandFieldNumber({ name: "Timeout", defaultValue: 10000 }),
      priority: new GraphandFieldNumber({ name: "Priorité" }),
    };

    return {
      url: new GraphandFieldText({
        name: "Url",
      }),
    };
  }
}

export default Webhook;
