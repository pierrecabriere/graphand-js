import GraphandFieldJSON from "./fields/GraphandFieldJSON";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandModel from "./GraphandModel";

class GraphandWebhookLogsModel extends GraphandModel {
  static get baseFields() {
    return {
      webhook: new GraphandFieldRelation({
        name: "Webhook",
        model: this._client.models.Webhook,
      }),
      request: new GraphandFieldJSON({
        name: "Requête",
      }),
      response: new GraphandFieldJSON({
        name: "Réponse",
      }),
    };
  }
}

export default GraphandWebhookLogsModel;
