import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Role
 * @augments GraphandModel
 * @classdesc Role model. Use {@link Client#getModel client.getModel("Role")} to use this model
 */
class Role extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "roles";
  static baseUrl = "/roles";
  static scope = "Role";
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    admin: new GraphandFieldBoolean(),
    level: new GraphandFieldNumber(),
    inherits: new GraphandFieldRelation({
      ref: "Role",
      multiple: true,
    }),
    modules: new GraphandFieldRelation({
      ref: "Module",
      multiple: true,
    }),
  };
}

export default Role;
