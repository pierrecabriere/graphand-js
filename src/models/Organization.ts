import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Organization
 * @augments GraphandModel
 * @classdesc Organization model. Use {@link GraphandClient#getModel client.getModel("Organization")} to use this model
 */
class Organization extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "organizations";
  static baseUrl = "/organizations";
  static isGlobal = true;
  static scope = ModelScopes.Organization;
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    users: new GraphandFieldRelation({ ref: "User", multiple: true }),
  };

  name;
  slug;
  users;

  async leave() {
    const { constructor } = Object.getPrototypeOf(this);
    const { data } = await constructor._client._axios.post(`/organizations/${this._id}/leave`);
    constructor.handleUpdatedData([data.data]);
  }
}

export default Organization;
