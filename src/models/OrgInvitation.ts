import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Organization from "./Organization";

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
  static envScope = ModelEnvScopes.GLOBAL;
  static schema = {
    email: new GraphandFieldText(),
    organization: new GraphandFieldRelation({ ref: "Organization", multiple: false }),
  };

  email: GraphandFieldTextDefinition;
  organization: GraphandFieldRelationDefinition<{ model: Organization; required: true }>;

  async accept() {
    const { constructor } = Object.getPrototypeOf(this);
    await constructor._client._axios.post(`/organizations/invitations/${this._id}/accept`);
  }
}

export default OrgInvitation;
