import AggregationExecutor from "../lib/AggregationExecutor";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";

class Aggregation extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "aggregations";
  static baseUrl = "/aggregations";
  static scope = "Aggregation";
  static schema = {
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

  static universalPrototypeMethods = ["execute"];

  static execute(_id, vars) {
    return new AggregationExecutor({ _id, vars, client: this._client });
  }

  execute(vars) {
    // @ts-ignore
    const client = this instanceof GraphandModelPromise ? this.model._client : Object.getPrototypeOf(this).constructor._client;
    return new AggregationExecutor({ _id: this._id, vars, client });
  }
}

export default Aggregation;
