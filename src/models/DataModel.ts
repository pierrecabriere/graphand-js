import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class DataModel extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "data-models";
  static baseUrl = "/data-models";
  static scope = "DataModel";
  static schema = {
    name: new GraphandFieldText({ name: "Nom" }),
    nameSingle: new GraphandFieldText({ name: "Nom singulier" }),
    nameMultiple: new GraphandFieldText({ name: "Nom pluriel" }),
    slug: new GraphandFieldText({ name: "Identifiant" }),
    multiple: new GraphandFieldBoolean({ name: "Multiple", defaultValue: true }),
    defaultField: new GraphandFieldRelation({ name: "Champ par défaut", ref: "DataField" }),
  };

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
}

export default DataModel;
