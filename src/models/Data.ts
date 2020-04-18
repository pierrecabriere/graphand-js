import GraphandModel from "../utils/GraphandModel";

class Data extends GraphandModel {
  static apiIdentifier;

  static get baseUrl() {
    return `/data/${this.apiIdentifier}`;
  }
}

export default Data;