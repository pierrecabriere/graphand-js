import GraphandModel from "../utils/GraphandModel";

class Aggregation extends GraphandModel {
  static apiIdentifier = "aggregations";

  static baseUrl = "/aggregations";

  static queryFields = false;
}

export default Aggregation;
