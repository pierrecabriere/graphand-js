import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldColor from "../lib/fields/GraphandFieldColor";
import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class DataField extends GraphandModel {
  static apiIdentifier = "data-fields";
  static baseUrl = "/data-fields";
  static scope = "DataField";

  name;
  slug;
  type;
  exclude;
  configuration;

  static get baseFields() {
    return {
      name: new GraphandFieldText({
        name: "Nom",
      }),
      slug: new GraphandFieldText({
        name: "Identifiant",
      }),
      type: new GraphandFieldText({
        name: "Type",
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
      exclude: new GraphandFieldBoolean({ name: "Exclure", defaultValue: false }),
      configuration: new GraphandFieldJSON({ name: "Configuration" }),
      scope: new GraphandFieldScope({ name: "Scope" }),
    };
  }

  toGraphandField() {
    const { constructor } = Object.getPrototypeOf(this);
    const { name, type, exclude, configuration } = this;
    switch (type) {
      case "Text":
      default:
        return new GraphandFieldText({ ...configuration, exclude, name, type });
      case "Relation":
        return new GraphandFieldRelation({
          ...configuration,
          exclude,
          name,
          model: constructor._client.getModel(configuration.ref),
          query: configuration.initialQuery,
        });
      case "Date":
        return new GraphandFieldDate({ ...configuration, exclude, name });
      case "Boolean":
        return new GraphandFieldBoolean({ ...configuration, exclude, name });
      case "Number":
        return new GraphandFieldNumber({ ...configuration, exclude, name });
      case "Color":
        return new GraphandFieldColor({ ...configuration, exclude, name });
      case "JSON":
        return new GraphandFieldJSON({ ...configuration, exclude, name });
    }
  }
}

export default DataField;
