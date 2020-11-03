import GraphandFieldJSON from "../utils/fields/GraphandFieldJSON";
import GraphandFieldScope from "../utils/fields/GraphandFieldScope";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
import GraphandModelPromise from "../utils/GraphandModelPromise";
import AggregationExecutor from "../utils/AggregationExecutor";

class Aggregation extends GraphandModel {
  static apiIdentifier = "aggregations";
  static baseUrl = "/aggregations";
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
