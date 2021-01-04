import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";

const locales = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "de", label: "Allemand" },
];

class Project extends GraphandModel {
  static apiIdentifier = "projects";
  static baseUrl = "/projects";
  static scope = "Project";

  static baseFields(project) {
    return {
      name: new GraphandFieldText({ name: "Nom" }),
      slug: new GraphandFieldText({ name: "Identifiant" }),
      locales: new GraphandFieldSelect({
        name: "Langues",
        multiple: true,
        options: locales,
      }),
      defaultLocale: new GraphandFieldSelect({
        name: "Langue par défaut",
        options: locales,
      }),
      settings: new GraphandFieldJSON({ name: "Paramètres" }),
      stats: new GraphandFieldJSON({ name: "Stats" }),
    };
  }

  static getCurrent() {
    return this._client._options.project && (this.get(this._client._options.project, false) || this.get("current"));
  }
}

export default Project;
