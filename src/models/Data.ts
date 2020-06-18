import GraphandModel from "../utils/GraphandModel";

class Data extends GraphandModel {
  static apiIdentifier;

  static get baseUrl() {
    return `/data/${this.apiIdentifier}`;
  }

  static get queryFields() {
    return { model: { $subquery: { slug: this.apiIdentifier } } };
  }
}

export default Data;
