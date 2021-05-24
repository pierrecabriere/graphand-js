import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";

class EsMapping extends GraphandModel {
  static apiIdentifier = "elasticsearch";
  static baseUrl = "/elasticsearch";
  static scope = "EsMapping";

  static get baseFields() {
    return {
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      scope: new GraphandFieldScope({ name: "Scope" }),
      fields: new GraphandFieldJSON({ name: "Mapping des champs" }),
      settings: new GraphandFieldJSON({ name: "Paramètres de l'index" }),
      externalHost: new GraphandFieldBoolean({ name: "Utiliser un hôte externe" }),
      host: new GraphandFieldText({ name: "Hôte" }),
      conditions: new GraphandFieldJSON({ name: "Conditions" }),
    };
  }

  async count(query) {
    const { constructor } = Object.getPrototypeOf(this);
    const {
      data: { data },
    } = await constructor._client._axios.post(`/elasticsearch/${this._id}/index-count`, query);
    return data;
  }

  static async search(id, query) {
    const {
      data: { data },
    } = await this._client._axios.post(`/elasticsearch/${id}/search`, query);
    return data;
  }

  async search(query) {
    const { constructor } = Object.getPrototypeOf(this);
    const {
      data: { data },
    } = await constructor._client._axios.post(`/elasticsearch/${this._id}/search`, query);
    return data;
  }

  async sync(query) {
    const { constructor } = Object.getPrototypeOf(this);
    await constructor._client._axios.post(`/elasticsearch/${this._id}/sync`, query);
  }
}

export default EsMapping;
