import GraphandModel from "../lib/GraphandModel";

class Data extends GraphandModel {
  protected static _customFields = {};

  static queryFields = true;
  static apiIdentifier;

  static get scope() {
    return this.apiIdentifier ? `Data:${this.apiIdentifier}` : "Data";
  }

  static get baseUrl() {
    return this.apiIdentifier ? `/data/${this.apiIdentifier}` : null;
  }
}

export default Data;
