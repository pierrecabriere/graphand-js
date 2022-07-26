import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class OrgInvitation
 * @augments GraphandModel
 */
class OrgInvitation extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "orginvitations";
  static baseUrl = "/organizations/invitations";
  static isGlobal = true;
  static scope = ModelScopes.OrgInvitation;
  static schema = {
    email: new GraphandFieldText(),
    organization: new GraphandFieldRelation({ ref: "Organization", multiple: false }),
  };

  email;
  organization;

  async accept() {
    const { constructor } = Object.getPrototypeOf(this);
    await constructor._client._axios.post(`/organizations/invitations/${this._id}/accept`);
  }
}

export default OrgInvitation;
