import ModelScopes from "../enums/model-scopes";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Restriction
 * @augments GraphandModel
 * @classdesc Restriction model. Use {@link Client#getModel client.getModel("Restriction")} to use this model
 */
class Restriction extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "restrictions";
  static baseUrl = "/restrictions";
  static scope = ModelScopes.Restriction;
  static schema = {
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    scope: new GraphandFieldScope(),
    actions: new GraphandFieldText({ multiple: true, options: ["create", "update"] }),
    fields: new GraphandFieldText({ multiple: true }),
    conditions: new GraphandFieldJSON(),
  };
}

export default Restriction;
