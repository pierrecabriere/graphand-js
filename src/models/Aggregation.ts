import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class Aggregation extends GraphandModel {
  static apiIdentifier = "aggregations";

  static baseUrl = "/aggregations";

  static queryFields = false;

  static get baseFields() {
    const models = this._client.models.DataModel.getList();
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

    return {
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      scope: new GraphandFieldSelect({
        name: "Scope",
        type: GraphandFieldText,
        options,
      }),
      pipeline: new GraphandFieldJSON({ name: "Pipeline", defaultValue: [] }),
    };
  }

  async execute(vars) {
    const { constructor } = Object.getPrototypeOf(this);
    const { data } = await constructor._client._axios.post(`/aggregations/${this._id}/execute`, vars);
    return data;
  }
}

export default Aggregation;
