import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class DataModel extends GraphandModel {
  static apiIdentifier = "data-models";
  static baseUrl = "/data-models";
  static scope = "DataModel";

  static afterCreate(item, err) {
    if (!err) {
      this._client.models.Module.clearCache();
    }
  }

  static afterUpdate(res, err) {
    if (!err) {
      this._client.models.Module.clearCache();
    }
  }

  static afterDelete(args, err) {
    if (!err) {
      this._client.models.Module.clearCache();
    }
  }

  static baseFields(model) {
    console.log(model);
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      nameSingle: new GraphandFieldText({
        name: "Nom singulier",
      }),
      nameMultiple: new GraphandFieldText({
        name: "Nom pluriel",
      }),
      slug: new GraphandFieldText({
        name: "Identifiant",
      }),
      multiple: new GraphandFieldBoolean({
        name: "Multiple",
        defaultValue: true,
      }),
      defaultField: new GraphandFieldRelation({
        name: "Champ par défaut",
        model: this._client.models.DataField,
        query: model && { scope: `Data:${model.slug}` },
      }),
    };
  }
}

export default DataModel;
