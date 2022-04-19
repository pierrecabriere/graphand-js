import Locales from "../enums/locales";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Project
 * @augments GraphandModel
 * @classdesc Project model. Use {@link Client#getModel client.getModel("Project")} to use this model
 */
class Project extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "projects";
  static baseUrl = "/projects";
  static scope = "Project";
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    locales: new GraphandFieldText({ multiple: true, options: Object.values(Locales) }),
    defaultLocale: new GraphandFieldText({ options: Object.values(Locales) }),
    accessTokenLifetime: new GraphandFieldNumber(),
    refreshTokenLifetime: new GraphandFieldNumber(),
  };

  /**
   * returns current project
   * @returns {Promise<Project>}
   */
  static getCurrent() {
    return this.get("current");
  }
}

export default Project;
