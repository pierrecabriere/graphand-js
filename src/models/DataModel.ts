import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class DataModel extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "data-models";
  static baseUrl = "/data-models";
  static scope = "DataModel";
  static schema = {
    name: new GraphandFieldText(),
    nameSingle: new GraphandFieldText(),
    nameMultiple: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    multiple: new GraphandFieldBoolean({ defaultValue: true }),
    defaultField: new GraphandFieldRelation({ ref: "DataField" }),
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
