import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Module extends GraphandModel {
  static apiIdentifier = "modules";
  static baseUrl = "/modules";
  static scope = "Module";

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      type: new GraphandFieldText({
        name: "Type",
      }),
      default: new GraphandFieldBoolean({
        name: "Module par défaut",
      }),
      configuration: new GraphandFieldJSON({
        name: "Configuration",
      }),
    };
  }
}

export default Module;
