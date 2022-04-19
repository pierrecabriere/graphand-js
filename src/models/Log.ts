import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Log
 * @augments GraphandModel
 * @classdesc Log model. Use {@link Client#getModel client.getModel("Log")} to use this model
 */
class Log extends GraphandModel {
  static _customFields = {};

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
