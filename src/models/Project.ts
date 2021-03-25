import GraphandFieldSelect from "../lib/fields/GraphandFieldSelect";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";

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
    };
  }

  static getCurrent() {
    return this._client._options.project && (this.get(this._client._options.project, false) || this.get("current"));
  }
}

export default Project;
