import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldDate from "../utils/fields/GraphandFieldDate";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
import instantiate = WebAssembly.instantiate;

class DataField extends GraphandModel {
  static apiIdentifier = "data-fields";

  static baseUrl = "/data-fields";

  static defaultField = "name";

  private _configurationFields = {};

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
      }),
      configuration: new GraphandFieldText({
        name: "Type",
        assign: false,
      }),
    };
  }

  async getConfigurationFields() {
    const { constructor } = Object.getPrototypeOf(this);
    switch (this.type) {
      case "Relation":
        return {
          model: new GraphandFieldRelation({
            name: "Modèle",
            model: constructor._client.models.DataModel,
            multiple: false,
          }),
          multiple: new GraphandFieldBoolean({
            name: "Multiple",
            defaultValue: (await constructor._client.models.DataModel.get(this.raw.configuration?.model)).multiple,
          }),
          initialQuery: new GraphandFieldJSON({
            name: "Requête",
          }),
        };
      default:
        return {};
    }
  }

  get configuration() {
    const configurationFields = this._configurationFields;
    const defaults = Object.keys(configurationFields).reduce((payload, key) => {
      const field = configurationFields[key];
      if (field.defaultValue !== undefined) {
        payload[key] = field.defaultValue;
      }

      return payload;
    }, {});
    return { ...defaults, ...this.raw.configuration };
  }

  type: string;

  async toGraphandField() {
    this._configurationFields = await this.getConfigurationFields();
    const { constructor } = Object.getPrototypeOf(this);
    // @ts-ignore
    const { name, type, configuration } = this;
    switch (type) {
      case "Text":
      default:
        return new GraphandFieldText({ name });
      case "Account":
        return new GraphandFieldRelation({
          name,
          multiple: configuration.multiple,
          model: constructor._client.models.Account,
        });
      case "Relation":
        return new GraphandFieldRelation({
          name,
          multiple: configuration.multiple,
          model: constructor._client.getModelByIdentifier((await constructor._client.models.DataModel.get(configuration.model)).slug),
        });
      case "Date":
        return new GraphandFieldDate({ name });
      case "Boolean":
        return new GraphandFieldBoolean({ name });
    }
  }
}

export default DataField;
