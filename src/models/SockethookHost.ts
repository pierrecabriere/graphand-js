import HooksEvents from "../enums/hooks-events";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldDate from "../lib/fields/GraphandFieldDate";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Sockethook
 * @augments GraphandModel
 * @classdesc Sockethook model. Use {@link Client#getModel client.getModel("Sockethook")} to use this model
 */
class SockethookHost extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "sockethookhosts";
  static baseUrl = "/sockethooks/hosts";
  static scope = ModelScopes.SockethookHost;
  static schema = {
    ip: new GraphandFieldText(),
    name: new GraphandFieldText(),
    socket: new GraphandFieldText(),
    connectedAt: new GraphandFieldDate(),
    blocked: new GraphandFieldBoolean(),
  };

  static Events = HooksEvents;

  ip: string;
  name: string;
  socket: string;
  connectedAt: Date;
  blocked;

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

  async block() {
    const initial = !!this.blocked;
    const { constructor } = Object.getPrototypeOf(this);
    this.blocked = true;
    try {
      await constructor._client._axios.post(`${constructor.baseUrl}/${this._id}/block`);
    } catch (e) {
      this.blocked = initial;
      throw e;
    }
  }

  async unblock() {
    const initial = !!this.blocked;
    const { constructor } = Object.getPrototypeOf(this);
    this.blocked = false;
    try {
      await constructor._client._axios.post(`${constructor.baseUrl}/${this._id}/unblock`);
    } catch (e) {
      this.blocked = initial;
      throw e;
    }
  }
}

export default SockethookHost;
