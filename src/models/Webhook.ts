import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Webhook extends GraphandModel {
  static apiIdentifier = "webhooks";
  static baseUrl = "/webhooks";
  static scope = "Webhook";

  static get baseFields() {
    const models = this._client.models.DataModel.getList();
    const options = models.reduce(
      (scopes, model) => {
        scopes.push({ value: `Data:${model.slug}`, label: model.name });
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
      method: new GraphandFieldText({
        name: "Méthode",
        options: ["get", "post", "put", "patch", "delete"],
      }),
      scope: new GraphandFieldScope({
        name: "Scope",
      }),
      actions: new GraphandFieldText({
        name: "Actions",
        multiple: true,
        options: [
          "before_create",
          "after_create",
          "before_update",
          "after_update",
          "before_delete",
          "after_delete",
          "before_execute",
          "after_execute",
        ],
      }),
      await: new GraphandFieldBoolean({ name: "Attendre le retour", defaultValue: false }),
      timeout: new GraphandFieldNumber({ name: "Timeout", defaultValue: 10000 }),
      priority: new GraphandFieldNumber({ name: "Priorité" }),
      active: new GraphandFieldBoolean({ name: "Actif", defaultValue: true }),
    };
  }

  get LogsModel() {
    const parent = this;
    const { constructor } = Object.getPrototypeOf(this);
    const modelName = `${this._id}_logs`;
    if (!constructor._client._models[modelName]) {
      const GraphandWebhookLogsModel = require("../lib/GraphandWebhookLogsModel").default;
      const LogsModel = class extends GraphandWebhookLogsModel {
        static baseUrl = `${constructor.baseUrl}/${parent._id}/logs`;
        static queryUrl = `${constructor.baseUrl}/${parent._id}/logs`;
      };

      constructor._client.registerModel(LogsModel, { name: modelName });
    }

    return constructor._client.models[modelName];
  }
}

export default Webhook;
