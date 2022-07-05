import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Organization
 * @augments GraphandModel
 * @classdesc Organization model. Use {@link Client#getModel client.getModel("Organization")} to use this model
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

  static async invite(id, emailsList: string[]) {
    const {
      data: { data },
    } = await this._client._axios.post(`organizations/${id}/invite`, {
      emailsList,
    });
    return data;
  }

  static async uninvite(id, usersList: string[]) {
    const {
      data: { data },
    } = await this._client._axios.post(`organizations/${id}/uninvite`, {
      usersList,
    });
    return data;
  }

  async invite(emailsList: string[]) {
    const { constructor } = Object.getPrototypeOf(this);
    return await constructor.invite(this._id, emailsList);
  }

  async uninvite(usersList: string[]) {
    const { constructor } = Object.getPrototypeOf(this);
    return await constructor.uninvite(this._id, usersList);
  }
}

export default Organization;
