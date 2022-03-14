import DataFieldTypes from "../enums/data-field-types";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandField from "../lib/GraphandField";
import GraphandModel from "../lib/GraphandModel";

class DataField extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "data-fields";
  static baseUrl = "/data-fields";
  static scope = "DataField";
  static schema = {
    name: new GraphandFieldText(),
    slug: new GraphandFieldText(),
    type: new GraphandFieldText({ options: Object.values(DataFieldTypes) }),
    exclude: new GraphandFieldBoolean({ defaultValue: false }),
    configuration: new GraphandFieldJSON(),
    scope: new GraphandFieldScope(),
  };

  name;
  slug;
  type;
  exclude;
  configuration;
  scope;

  toGraphandField() {
    const { type, configuration } = this;
    let field;
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
