import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

const locales = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "de", label: "Allemand" },
];

class Project extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "projects";
  static baseUrl = "/projects";
  static scope = "Project";
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    locales: new GraphandFieldText({ multiple: true, options: locales }),
    defaultLocale: new GraphandFieldText({ options: locales }),
    accessTokenLifetime: new GraphandFieldNumber(),
    refreshTokenLifetime: new GraphandFieldNumber(),
  };

  static getCurrent() {
    return this.get("current");
  }
}

export default Project;
