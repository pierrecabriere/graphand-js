import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Aggregation extends GraphandModel {
  static apiIdentifier = "aggregations";
  static baseUrl = "/aggregations";
  static queryFields = false;
  static scope = "Aggregation";

  static get baseFields() {
    return {
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      scope: new GraphandFieldScope({ name: "Scope" }),
      pipeline: new GraphandFieldJSON({ name: "Pipeline", defaultValue: [] }),
      defaultVars: new GraphandFieldJSON({ name: "Variables par défaut" }),
    };
  }

  async execute(vars) {
    const { constructor } = Object.getPrototypeOf(this);
    const { data } = await constructor._client._axios.post(`/aggregations/${this._id}/execute`, vars);
    return data;
  }
}

export default Aggregation;
