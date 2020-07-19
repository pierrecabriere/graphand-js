import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Webhook extends GraphandModel {
  static apiIdentifier = "webhooks";

  static baseUrl = "/webhooks";

  static queryFields = false;

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      url: new GraphandFieldText({
        name: "Url",
      }),
    };
  }
}

export default Webhook;
