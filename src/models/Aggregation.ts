import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import AggregationExecutor from "../lib/AggregationExecutor";
import GraphandFieldBoolean, { GraphandFieldBooleanDefinition } from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON, { GraphandFieldJSONDefinition } from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber, { GraphandFieldNumberDefinition } from "../lib/fields/GraphandFieldNumber";
import GraphandFieldScope, { GraphandFieldScopeDefinition } from "../lib/fields/GraphandFieldScope";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import GraphandModelPromise from "../lib/GraphandModelPromise";

/**
 * @class Aggregation
 * @augments GraphandModel
 * @classdesc Aggregation model. Use {@link GraphandClient#getModel client.getModel("Aggregation")} to use this model
 */
class Aggregation extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "aggregations";
  static baseUrl = "/aggregations";
  static scope = ModelScopes.Aggregation;
  static envScope = ModelEnvScopes.ENV;
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

  static _promiseAvailableMethods = ["execute"];

  name: GraphandFieldTextDefinition;
  description: GraphandFieldTextDefinition;
  scope: GraphandFieldScopeDefinition;
  pipeline: GraphandFieldJSONDefinition;
  defaultVars: GraphandFieldJSONDefinition;
  cache: GraphandFieldBooleanDefinition;
  cacheExpiredToleration: GraphandFieldBooleanDefinition;
  cacheMaxAge: GraphandFieldNumberDefinition;
  cacheKey: GraphandFieldJSONDefinition<{
    fields: {
      scope: GraphandFieldScopeDefinition;
      conditions: GraphandFieldJSONDefinition;
    };
  }>;

  /**
   * Execute aggregation by id
   * @param _id {string} - Id of aggregation
   * @param vars {Object=} - Values sent to api (used as params for target aggregation)
   */
  static execute<T extends any>(_id, vars) {
    return new AggregationExecutor<T>({ _id, vars, client: this._client });
  }

  /**
   * Execute current aggregation
   * @param vars {Object=} - Values sent to api (used as params for target aggregation)
   */
  execute<T extends any>(vars) {
    const client = this instanceof GraphandModelPromise ? this.model._client : Object.getPrototypeOf(this).constructor._client;
    return new AggregationExecutor<T>({ _id: this._id, vars, client });
  }
}

export default Aggregation;
