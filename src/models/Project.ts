import Locales from "../enums/locales";
import ModelScopes from "../enums/model-scopes";
import { GraphandModelPromise } from "../lib";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Role from "./Role";

/**
 * @class Project
 * @augments GraphandModel
 * @classdesc Project model. Use {@link Client#getModel client.getModel("Project")} to use this model
 */
class Project extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "projects";
  static baseUrl = "/projects";
  static isGlobal = true;
  static scope = ModelScopes.Project;
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    locales: new GraphandFieldText({ multiple: true, options: Object.values(Locales) }),
    defaultLocale: new GraphandFieldText({ options: Object.values(Locales) }),
    defaultRegisterRole: new GraphandFieldRelation({ ref: "Role", multiple: false }),
    accessTokenLifetime: new GraphandFieldNumber(),
    refreshTokenLifetime: new GraphandFieldNumber(),
  };

  /**
   * Returns current project
   * @returns {Project|GraphandModelPromise<Project>}
   */
  static getCurrent(): Project | GraphandModelPromise<Project> {
    const client = this._client;
    return this.get(client._options.project);
  }

  name;
  slug;
  locales;
  defaultLocale;
  defaultRegisterRole;
  accessTokenLifetime;
  refreshTokenLifetime;
  organization;
  plan;
}

export default Project;
