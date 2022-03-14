import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Log extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "logs";
  static baseUrl = "/logs";
  static scope = "Log";
  static schema = {
    path: new GraphandFieldText(),
    status: new GraphandFieldNumber(),
    ip: new GraphandFieldText(),
  };
}

export default Log;
