import ModelScopes from "../enums/model-scopes";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class Data
 * @augments GraphandModel
 * @classdesc Data model. Base class for Data models. Use {@link Client#getModel client.getModel("Data:{slug}")} to use the data model with slug
 */
class Data extends GraphandModel {
  static _customFields = {};

  static queryFields = true;
  static apiIdentifier;

  static get scope(): ModelScopes {
    return (this.apiIdentifier ? `Data:${this.apiIdentifier}` : "Data") as ModelScopes;
  }

  static get baseUrl() {
    return this.apiIdentifier ? `/data/${this.apiIdentifier}` : null;
  }
}

export default Data;
