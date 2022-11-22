import Locales from "../enums/locales";
import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import { GraphandModelPromise } from "../lib";
import GraphandFieldNumber, { GraphandFieldNumberDefinition } from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Account from "./Account";
import Organization from "./Organization";
import Role from "./Role";

/**
 * @class Project
 * @augments GraphandModel
 * @classdesc Project model. Use {@link GraphandClient#getModel client.getModel("Project")} to use this model
 */
class Project extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "projects";
  static baseUrl = "/projects";
  static isGlobal = true;
  static scope = ModelScopes.Project;
  static envScope = ModelEnvScopes.GLOBAL;
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    locales: new GraphandFieldText({ multiple: true, options: Object.values(Locales) }),
    defaultLocale: new GraphandFieldText({ options: Object.values(Locales) }),
    defaultRegisterRole: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    accessTokenLifetime: new GraphandFieldNumber(),
    refreshTokenLifetime: new GraphandFieldNumber(),
    organization: new GraphandFieldRelation({ ref: "Organization", multiple: false }),
    owner: new GraphandFieldRelation({ ref: "Account", multiple: false }),
  };

  /**
   * Returns current project
   * @returns {Project|GraphandModelPromise<Project>}
   */
  static getCurrent(): Project | GraphandModelPromise<Project> {
    const client = this._client;
    return this.get(client._options.project);
  }

  name: GraphandFieldTextDefinition<{ required: true }>;
  slug: GraphandFieldTextDefinition<{ required: true }>;
  locales: GraphandFieldTextDefinition<{ multiple: true; required: true }>;
  defaultLocale: GraphandFieldTextDefinition<{ required: true }>;
  defaultRegisterRole: GraphandFieldRelationDefinition<{ model: Role; multiple: false }>;
  accessTokenLifetime: GraphandFieldNumberDefinition<{ required: true }>;
  refreshTokenLifetime: GraphandFieldNumberDefinition<{ required: true }>;
  organization: GraphandFieldRelationDefinition<{ model: Organization; multiple: false; required: true }>;
  plan: any;
  owner: GraphandFieldRelationDefinition<{ model: Account; multiple: false; required: true }>;
}

export default Project;
