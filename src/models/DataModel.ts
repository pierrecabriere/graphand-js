import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class DataModel extends GraphandModel {
  static apiIdentifier = "data-models";

  static baseUrl = "/data-models";

  static defaultField = "name";

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      slug: new GraphandFieldText({
        name: "Identifiant",
      }),
      multiple: new GraphandFieldBoolean({
        name: "Multiple",
      }),
    };
  }
}

export default DataModel;
