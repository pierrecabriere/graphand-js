import GraphandModel from "../lib/GraphandModel";

class Data extends GraphandModel {
  static queryFields = true;
  static apiIdentifier;

  static get scope() {
    return `Data:${this.apiIdentifier}`;
  }

  static get baseUrl() {
    return `/data/${this.apiIdentifier}`;
  }
}

export default Data;
