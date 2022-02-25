import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class EsMapping extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "elasticsearch";
  static baseUrl = "/elasticsearch";
  static scope = "EsMapping";
  static schema = {
    name: new GraphandFieldText({ name: "Nom" }),
    description: new GraphandFieldText({ name: "Description" }),
    scope: new GraphandFieldScope({ name: "Scope" }),
    fields: new GraphandFieldJSON({ name: "Mapping des champs" }),
    settings: new GraphandFieldJSON({ name: "Paramètres de l'index" }),
    externalHost: new GraphandFieldBoolean({ name: "Utiliser un hôte externe" }),
    host: new GraphandFieldText({ name: "Hôte" }),
    conditions: new GraphandFieldJSON({ name: "Conditions" }),
    defaultQuery: new GraphandFieldJSON({
      name: "Requête par défaut",
      defaultValue: {
        query_string: {
          query: "*{q}*",
        },
      },
    }),
  };

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

    let req;
    if (typeof query === "string") {
      req = constructor._client._axios.get(`/elasticsearch/${this._id}/search`, {
        params: { q: query },
      });
    } else {
      req = constructor._client._axios.post(`/elasticsearch/${this._id}/search`, query);
    }

    const {
      data: { data },
    } = await req;

    return data;
  }

  async sync(query) {
    const { constructor } = Object.getPrototypeOf(this);
    await constructor._client._axios.post(`/elasticsearch/${this._id}/sync`, query);
  }
}

export default EsMapping;
