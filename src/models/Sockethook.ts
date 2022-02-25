import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldJSON from "../lib/fields/GraphandFieldJSON";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldScope from "../lib/fields/GraphandFieldScope";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Sockethook extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "sockethooks";
  static baseUrl = "/sockethooks";
  static scope = "Sockethook";
  static schema = {
    identifier: new GraphandFieldText({ name: "Identifiant unique" }),
    action: new GraphandFieldText({ name: "Action" }),
    fields: new GraphandFieldText({ name: "Champs", multiple: true }),
    scope: new GraphandFieldScope({ name: "Scope" }),
    await: new GraphandFieldBoolean({ name: "Attendre le retour" }),
    blocked: new GraphandFieldBoolean({ name: "Bloqué" }),
    timeout: new GraphandFieldNumber({ name: "Timeout" }),
    priority: new GraphandFieldNumber({ name: "Priorité", defaultValue: 0 }),
    hosts: new GraphandFieldJSON({ name: "Hôtes" }),
  };

  identifier;
  action;
  scope;
  await;
  blocked;
  timeout;
  priority;
  revision;
  socket;
  ip;

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

  async ping(waitForReconnections = false) {
    const { constructor } = Object.getPrototypeOf(this);
    try {
      const startTime = new Date().getTime();
      await constructor._client._axios.post(`${constructor.baseUrl}/ping`, {
        ip: this.ip,
        identifier: this.identifier,
        waitForReconnections,
      });

      return new Date().getTime() - startTime;
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
