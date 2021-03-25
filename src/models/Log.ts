import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Log extends GraphandModel {
  static apiIdentifier = "logs";
  static baseUrl = "/logs";
  static scope = "Log";

  static get baseFields() {
    return {
      path: new GraphandFieldText({ name: "Path" }),
      status: new GraphandFieldNumber({ name: "Status" }),
      ip: new GraphandFieldText({ name: "Adresse ip" }),
    };
  }
}

export default Log;
