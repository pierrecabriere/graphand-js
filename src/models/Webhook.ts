import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Webhook
 * @augments GraphandModel
 * @classdesc Webhook model. Use {@link GraphandClient#getModel client.getModel("Webhook")} to use this model
 */
class Webhook extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "webhooks";
  static baseUrl = "/webhooks";
  static scope = ModelScopes.Webhook;
  static envScope = ModelEnvScopes.ENV;
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    endpoint: new GraphandFieldText(),
    method: new GraphandFieldText({ options: ["get", "post", "put", "patch", "delete"] }),
    scope: new GraphandFieldScope(),
    actions: new GraphandFieldText({
      multiple: true,
      options: ["before_create", "after_create", "before_update", "after_update", "before_delete", "after_delete", "before_execute", "after_execute"],
    }),
    await: new GraphandFieldBoolean({ defaultValue: false }),
    timeout: new GraphandFieldNumber({ defaultValue: 10000 }),
    priority: new GraphandFieldNumber(),
    active: new GraphandFieldBoolean({ defaultValue: true }),
  };

  name;
  description;
  endpoint;
  method;
  scope;
  actions;
  await;
  timeout;
  priority;
  active;

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
