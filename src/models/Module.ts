import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Module extends GraphandModel {
  static apiIdentifier = "modules";

  static baseUrl = "/modules";

  static queryFields = false;

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
