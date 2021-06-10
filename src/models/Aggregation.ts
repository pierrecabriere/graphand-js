import AggregationExecutor from "../lib/AggregationExecutor";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";

class Aggregation extends GraphandModel {
  static apiIdentifier = "aggregations";
  static baseUrl = "/aggregations";
  static scope = "Aggregation";

  static baseFields() {
    return {
      name: new GraphandFieldText({ name: "Nom" }),
      description: new GraphandFieldText({ name: "Description" }),
      scope: new GraphandFieldScope({ name: "Scope" }),
      pipeline: new GraphandFieldJSON({ name: "Pipeline", defaultValue: [] }),
      defaultVars: new GraphandFieldJSON({ name: "Variables par défaut" }),
      cache: new GraphandFieldBoolean({ name: "Activer la mise en cache" }),
      cacheExpiredToleration: new GraphandFieldBoolean({ name: "Tolérer le cache expiré" }),
      cacheMaxAge: new GraphandFieldNumber({ name: "Temps maximal de mise en cache" }),
      cacheKey: new GraphandFieldJSON({
        name: "Requête de la clé de cache",
        fields: {
          scope: new GraphandFieldScope({ name: "Scope" }),
          conditions: new GraphandFieldJSON({ name: "Conditions" }),
        },
      }),
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
