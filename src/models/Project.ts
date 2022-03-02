import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

const locales = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "de", label: "Allemand" },
];

class Project extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "projects";
  static baseUrl = "/projects";
  static scope = "Project";
  static schema = {
    name: new GraphandFieldText({ name: "Nom" }),
    slug: new GraphandFieldText({ name: "Identifiant" }),
    locales: new GraphandFieldText({ name: "Langues", multiple: true, options: locales }),
    defaultLocale: new GraphandFieldText({ name: "Langue par défaut", options: locales }),
    settings: new GraphandFieldJSON({ name: "Paramètres" }),
    accessTokenLifetime: new GraphandFieldNumber({ name: "accessTokenLifetime" }),
    refreshTokenLifetime: new GraphandFieldNumber({ name: "refreshTokenLifetime" }),
  };

  static getCurrent() {
    return this.get("current");
  }
}

export default Project;
