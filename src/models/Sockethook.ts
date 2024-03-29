import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import ServerHooksEvents from "../enums/server-hooks-events";
import GraphandFieldBoolean, { GraphandFieldBooleanDefinition } from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldScope, { GraphandFieldScopeDefinition } from "../lib/fields/GraphandFieldScope";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Sockethook
 * @augments GraphandModel
 * @classdesc Sockethook model. Use {@link GraphandClient#getModel client.getModel("Sockethook")} to use this model
 */
class Sockethook extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "sockethooks";
  static baseUrl = "/sockethooks";
  static scope = ModelScopes.Sockethook;
  static envScope = ModelEnvScopes.PROJECT;
  static schema = {
    identifier: new GraphandFieldText(),
    actions: new GraphandFieldText({ multiple: true }),
    fields: new GraphandFieldText({ multiple: true }),
    scope: new GraphandFieldScope(),
    await: new GraphandFieldBoolean(),
    timeout: new GraphandFieldNumber(),
    priority: new GraphandFieldNumber({ defaultValue: 0 }),
  };

  static Events = ServerHooksEvents;

  identifier: GraphandFieldTextDefinition<{ required: true }>;
  actions: GraphandFieldTextDefinition<{ multiple: true }>;
  fields: GraphandFieldTextDefinition<{ multiple: true }>;
  scope: GraphandFieldScopeDefinition<{ required: true }>;
  await: GraphandFieldBooleanDefinition;
  timeout;
  priority;

  static async handleUpdateCall(payload) {
    if (payload.query._id) {
      if (payload.set.blocked === true) {
        return await this._client._axios.post(`${this.baseUrl}/${payload.query._id}/block`);
      } else if (payload.set.blocked === false) {
        return await this._client._axios.post(`${this.baseUrl}/${payload.query._id}/unblock`);
      }
    }

    return super.handleUpdateCall.apply(this, arguments);
  }

  /**
   * Ping current sockethook
   * @returns {number} - time in ms
   */
  async ping() {
    const { constructor } = Object.getPrototypeOf(this);
    try {
      const { data } = await constructor._client._axios.get(`${constructor.baseUrl}/${this._id}/ping`);
      return data.data;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get current selected host for sockethook
   */
  async selectedHost() {
    const { constructor } = Object.getPrototypeOf(this);
    try {
      const { data } = await constructor._client._axios.get(`${constructor.baseUrl}/${this._id}/selected-host`);
      return data.data;
    } catch (e) {
      return false;
    }
  }

  block() {
    return this.update({ set: { blocked: true } }, { preStore: true });
  }

  unblock() {
    return this.update({ set: { blocked: false } }, { preStore: true });
  }
}

export default Sockethook;
