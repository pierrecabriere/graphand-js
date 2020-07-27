import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class DataModel extends GraphandModel {
  static apiIdentifier = "data-models";

  static baseUrl = "/data-models";

  static baseFields(model) {
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
      defaultField: new GraphandFieldRelation({
        name: "Champ par défaut",
        model: this._client.models.DataField,
        query: { model: model?._id },
      }),
    };
  }
}

export default DataModel;
