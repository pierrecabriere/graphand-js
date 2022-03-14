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
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    scope: new GraphandFieldScope(),
    fields: new GraphandFieldJSON(),
    settings: new GraphandFieldJSON(),
    externalHost: new GraphandFieldBoolean(),
    host: new GraphandFieldText(),
    conditions: new GraphandFieldJSON(),
    defaultQuery: new GraphandFieldJSON({
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
