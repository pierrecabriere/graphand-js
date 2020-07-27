import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Project extends GraphandModel {
  static apiIdentifier = "projects";

  static baseUrl = "/projects";

  static baseFields = {
    name: new GraphandFieldText({ name: "Nom" }),
    slug: new GraphandFieldText({ name: "Identifiant" }),
  };

  static getCurrent() {
    return this._client._options.project && this.get(this._client._options.project);
  }
}

export default Project;
