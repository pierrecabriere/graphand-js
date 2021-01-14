import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandFieldNumber from "../utils/fields/GraphandFieldNumber";
import GraphandModel from "../utils/GraphandModel";

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
      indexCount: new GraphandFieldNumber({ name: "Taille de l'index" })
    };
  }

  async count(query) {
    const { constructor } = Object.getPrototypeOf(this);
    const {
      data: { data },
    } = await constructor._client._axios.post(`/elasticsearch/${this._id}/count`, query);
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
