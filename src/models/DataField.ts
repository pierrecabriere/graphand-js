import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldDate from "../utils/fields/GraphandFieldDate";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandError from "../utils/GraphandError";
import GraphandModel from "../utils/GraphandModel";

class DataField extends GraphandModel {
  static apiIdentifier = "data-fields";

  static baseUrl = "/data-fields";

  private _configurationFields = {};

  name;
  slug;
  type;

  static baseFields = {
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
        { value: "Relation", label: "Relation" },
      ],
    }),
    configuration: new GraphandFieldJSON({
      name: "Configuration",
      assign: false,
    }),
  };

  async getConfigurationFields() {
    const { constructor } = Object.getPrototypeOf(this);
    switch (this.type) {
      case "Relation":
        const models = await constructor._client.models.DataModel.getList();
        const options = models.reduce(
          (scopes, model) => {
            scopes.push({ value: `DataItem:${model._id}`, label: model.name });
            return scopes;
          },
          [
            { value: "Role", label: "Role" },
            { value: "Account", label: "Comptes" },
          ],
        );

        let defaultMultiple = true;
        if (this.raw.configuration.ref === "Account") {
        } else if (this.raw.configuration.ref === "Media") {
        } else {
          const { 1: _id } = this.raw.configuration.ref.match(/^DataItem:(.+?)$/);
          defaultMultiple = (await constructor._client.models.DataModel.get(_id))?.multiple;
        }

        return {
          ref: new GraphandFieldSelect({
            type: GraphandFieldText,
            options,
          }),
          multiple: new GraphandFieldBoolean({
            name: "Multiple",
            defaultValue: defaultMultiple,
          }),
          initialQuery: new GraphandFieldJSON({
            name: "Requête",
          }),
        };
      case "Date":
        return {
          time: new GraphandFieldBoolean({
            name: "Afficher le temps",
            defaultValue: true,
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

  async updateConfiguration() {
    this._configurationFields = await this.getConfigurationFields();
  }

  async toGraphandField() {
    await this.updateConfiguration();
    const { constructor } = Object.getPrototypeOf(this);
    // @ts-ignore
    const { name, type, configuration } = this;
    switch (type) {
      case "Text":
      default:
        return new GraphandFieldText({ name });
      case "Relation":
        let model;
        if (configuration.ref === "Account") {
          model = constructor._client.models.Account;
        } else if (configuration.ref === "Media") {
          model = constructor._client.models.Media;
        } else {
          try {
            const { 1: _id } = configuration.ref.match(/^DataItem:(.+?)$/);
            model = constructor._client.getModelByIdentifier((await constructor._client.models.DataModel.get(_id)).slug);
          } catch (e) {
            throw new GraphandError(`Field ${this.slug} has an invalid ref`);
          }
        }

        return new GraphandFieldRelation({
          name,
          multiple: configuration.multiple,
          model,
          query: configuration.initialQuery,
        });
      case "Date":
        return new GraphandFieldDate({ name, time: configuration.time });
      case "Boolean":
        return new GraphandFieldBoolean({ name });
      case "Number":
        return new GraphandFieldNumber({ name });
    }
  }
}

export default DataField;
