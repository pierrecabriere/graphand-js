import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Environment extends GraphandModel {
  static apiIdentifier = "environments";
  static baseUrl = "/environments";
  static scope = "Environment";

  static get baseFields() {
    return {
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      scopes: new GraphandFieldScope({
        name: "Scopes",
        multiple: true,
      }),
    };
  }
}

export default Environment;
