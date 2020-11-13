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

  private _configurationFields = {};

  name;
  slug;
  type;

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
        assign: false,
      }),
      scope: new GraphandFieldScope({
        name: "Scope",
      }),
    };
  }

  async getConfigurationFields() {
    const { constructor } = Object.getPrototypeOf(this);
    switch (this.type) {
      case "Relation":
        const models = await constructor._client.models.DataModel.getList();
        const options = models.reduce(
          (scopes, model) => {
            scopes.push({ value: `Data:${model.slug}`, label: model.name });
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
          const { 1: slug } = this.raw.configuration.ref.match(/^Data:(.+?)$/);
          defaultMultiple = (await constructor._client.models.DataModel.get({ query: { slug } }))?.multiple;
        }

        return {
          ref: new GraphandFieldSelect({
            name: "Réf",
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
    try {
      this._configurationFields = await this.getConfigurationFields();
    } catch (e) {}
  }

  async toGraphandField() {
    await this.updateConfiguration();
    const { constructor } = Object.getPrototypeOf(this);
    // @ts-ignore
    const { name, type, configuration } = this;
    switch (type) {
      case "Text":
      default:
        return new GraphandFieldText({ name, type, configuration });
      case "Relation":
        return new GraphandFieldRelation({
          name,
          multiple: configuration.multiple,
          model: constructor._client.getModelByScope(configuration.ref),
          query: configuration.initialQuery,
        });
      case "Date":
        return new GraphandFieldDate({ name, time: configuration.time });
      case "Boolean":
        return new GraphandFieldBoolean({ name });
      case "Number":
        return new GraphandFieldNumber({ name });
      case "Color":
        return new GraphandFieldColor({ name });
      case "JSON":
        return new GraphandFieldJSON({ name });
    }
  }
}

export default DataField;
