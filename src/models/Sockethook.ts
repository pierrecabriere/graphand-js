import HooksEvents from "../enums/hooks-events";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
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
  static schema = {
    identifier: new GraphandFieldText(),
    actions: new GraphandFieldText({ multiple: true }),
    fields: new GraphandFieldText({ multiple: true }),
    scope: new GraphandFieldScope(),
    await: new GraphandFieldBoolean(),
    blocked: new GraphandFieldBoolean(),
    timeout: new GraphandFieldNumber(),
    priority: new GraphandFieldNumber({ defaultValue: 0 }),
    hosts: new GraphandFieldRelation({
      ref: "SockethookHost",
      multiple: true,
    }),
  };

  static Events = HooksEvents;

  identifier;
  actions;
  fields;
  scope;
  await;
  blocked;
  timeout;
  priority;
  hosts;

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

  block() {
    return this.update({ set: { blocked: true } }, { preStore: true });
  }

  unblock() {
    return this.update({ set: { blocked: false } }, { preStore: true });
  }
}

export default Sockethook;
