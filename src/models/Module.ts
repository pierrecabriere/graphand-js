import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Module
 * @augments GraphandModel
 * @classdesc Module model. Use {@link Client#getModel client.getModel("Module")} to use this model
 */
class Module extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "modules";
  static baseUrl = "/modules";
  static scope = "Module";
  static schema = {
    name: new GraphandFieldText(),
    type: new GraphandFieldText(),
    default: new GraphandFieldBoolean(),
    configuration: new GraphandFieldJSON(),
  };
}

export default Module;
