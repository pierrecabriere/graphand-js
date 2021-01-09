import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

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
