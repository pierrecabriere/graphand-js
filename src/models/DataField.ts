import DataFieldTypes from "../enums/data-field-types";
import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandField from "../lib/GraphandField";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class DataField
 * @augments GraphandModel
 * @classdesc DataField model. Use {@link GraphandClient#getModel client.getModel("DataField")} to use this model
 */
class DataField extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "data-fields";
  static baseUrl = "/data-fields";
  static scope = ModelScopes.DataField;
  static envScope = ModelEnvScopes.ENV;
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    type: new GraphandFieldText({ options: Object.values(DataFieldTypes) }),
    exclude: new GraphandFieldBoolean({ defaultValue: false }),
    configuration: new GraphandFieldJSON(),
    scope: new GraphandFieldScope(),
  };

  static Types = DataFieldTypes;

  name;
  slug;
  type: DataFieldTypes;
  exclude;
  configuration;
  scope;

  toGraphandField() {
    const { type, configuration } = this;
    let field: GraphandField;
    switch (type) {
      case "Text":
        field = new GraphandFieldText(configuration);
        break;
      case "Relation":
        field = new GraphandFieldRelation(configuration);
        field.query = configuration.initialQuery;
        break;
      case "Date":
        field = new GraphandFieldDate(configuration);
        break;
      case "Boolean":
        field = new GraphandFieldBoolean(configuration);
        break;
      case "Number":
        field = new GraphandFieldNumber(configuration);
        break;
      case "JSON":
        field = new GraphandFieldJSON(configuration);
        break;
      default:
        field = new GraphandField(configuration);
        break;
    }

    field.__dataField = this;
    return field;
  }
}

export default DataField;
