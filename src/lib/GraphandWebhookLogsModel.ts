import GraphandFieldJSON from "./fields/GraphandFieldJSON";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandModel from "./GraphandModel";

class GraphandWebhookLogsModel extends GraphandModel {
  static get baseFields() {
    return {
      webhook: new GraphandFieldRelation({
        ref: "Webhook",
        multiple: false,
      }),
      request: new GraphandFieldJSON(),
      response: new GraphandFieldJSON(),
    };
  }
}

export default GraphandWebhookLogsModel;
