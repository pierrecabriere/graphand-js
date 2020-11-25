import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldColor from "../utils/fields/GraphandFieldColor";
import GraphandFieldDate from "../utils/fields/GraphandFieldDate";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class DataField extends GraphandModel {
  static apiIdentifier = "data-fields";
  static baseUrl = "/data-fields";
  static scope = "DataField";

  name;
  slug;
  type;
  configuration;

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      slug: new GraphandFieldText({
        name: "Identifiant",
      }),
      type: new GraphandFieldSelect({
        name: "Type",
        type: GraphandFieldText,
        options: [
          { value: "Text", label: "Texte" },
          { value: "Number", label: "Nombre" },
          { value: "Boolean", label: "Booléen" },
          { value: "Relation", label: "Relation" },
          { value: "Color", label: "Couleur" },
          { value: "Date", label: "Date" },
          { value: "JSON", label: "JSON" },
        ],
      }),
      configuration: new GraphandFieldJSON({
        name: "Configuration",
      }),
      scope: new GraphandFieldScope({
        name: "Scope",
      }),
    };
  }

  async toGraphandField() {
    const { constructor } = Object.getPrototypeOf(this);
    const { name, type, configuration } = this;
    switch (type) {
      case "Text":
      default:
        return new GraphandFieldText({ ...configuration, name, type });
      case "Relation":
        return new GraphandFieldRelation({
          ...configuration,
          name,
          model: constructor._client.getModelByScope(configuration.ref),
          query: configuration.initialQuery,
        });
      case "Date":
        return new GraphandFieldDate({ ...configuration, name });
      case "Boolean":
        return new GraphandFieldBoolean({ ...configuration, name });
      case "Number":
        return new GraphandFieldNumber({ ...configuration, name });
      case "Color":
        return new GraphandFieldColor({ ...configuration, name });
      case "JSON":
        return new GraphandFieldJSON({ ...configuration, name });
    }
  }
}

export default DataField;
