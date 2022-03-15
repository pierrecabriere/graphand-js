import AggregationExecutor from "../lib/AggregationExecutor";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";

class Aggregation extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "aggregations";
  static baseUrl = "/aggregations";
  static scope = "Aggregation";
  static schema = {
    name: new GraphandFieldText(),
    description: new GraphandFieldText(),
    scope: new GraphandFieldScope(),
    pipeline: new GraphandFieldJSON({ defaultValue: [] }),
    defaultVars: new GraphandFieldJSON(),
    cache: new GraphandFieldBoolean(),
    cacheExpiredToleration: new GraphandFieldBoolean(),
    cacheMaxAge: new GraphandFieldNumber(),
    cacheKey: new GraphandFieldJSON({
      fields: {
        scope: new GraphandFieldScope(),
        conditions: new GraphandFieldJSON(),
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
