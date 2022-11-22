import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import User from "./User";

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
  static envScope = ModelEnvScopes.GLOBAL;
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    users: new GraphandFieldRelation({ ref: "User", multiple: true }),
  };

  name: GraphandFieldTextDefinition<{ required: true }>;
  slug: GraphandFieldTextDefinition<{ required: true }>;
  users: GraphandFieldRelationDefinition<{ model: User; multiple: true; required: true }>;

  async leave() {
    const { data } = await this._model._client._axios.post(`/organizations/${this._id}/leave`);
    this._model.handleUpdatedData([data.data]);
  }
}

export default Organization;
