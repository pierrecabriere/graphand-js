import AggregationExecutor from "../utils/AggregationExecutor";
import GraphandFieldBoolean from "../utils/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";
import GraphandFieldSelect from "../utils/fields/GraphandFieldSelect";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
import GraphandModelPromise from "../utils/GraphandModelPromise";

class Aggregation extends GraphandModel {
  static apiIdentifier = "aggregations";
  static baseUrl = "/aggregations";
  static scope = "Aggregation";

  static baseFields(values) {
    const model = values && this._client.getModelFromScope(values.clearCacheScope);
    return {
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      scope: new GraphandFieldScope({ name: "Scope" }),
      clearCacheScope: new GraphandFieldScope({ name: "Scope de mise en cache" }),
      clearCacheActions: new GraphandFieldSelect({
        name: "Actions de mise en cache",
        type: GraphandFieldText,
        multiple: true,
        options: [
          { value: "create", label: "Création" },
          { value: "update", label: "Modification" },
          { value: "delete", label: "Suppression" },
        ],
      }),
      clearCacheFields: new GraphandFieldSelect({
        name: "Champs de mise en cache",
        type: GraphandFieldText,
        multiple: true,
        options: model ? Object.keys(model.fields).map((slug) => ({ value: slug, label: model.fields[slug].name || slug })) : [],
      }),
      pipeline: new GraphandFieldJSON({ name: "Pipeline", defaultValue: [] }),
      defaultVars: new GraphandFieldJSON({ name: "Variables par défaut" }),
    };
  }

  execute(vars) {
    return new AggregationExecutor(this, { vars });
  }

  static execute(_id, vars) {
    return new AggregationExecutor(undefined, { _id, vars, client: this._client });
  }

  static modelPromise(promise: GraphandModelPromise) {
    const _this = this;
    // @ts-ignore
    promise.execute = function (vars) {
      return new AggregationExecutor(undefined, { _id: promise._id, vars, client: _this._client });
    };
  }
}

export default Aggregation;
