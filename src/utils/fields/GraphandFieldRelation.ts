import GraphandField from "../GraphandField";
import GraphandModel from "../GraphandModel";

class GraphandFieldRelation extends GraphandField {
  model;
  multiple;
  query;
  defaultField;

  constructor(data) {
    super(data);
  }

  getter(value, from: GraphandModel) {
    if (!value) {
      return value;
    }

    if (this.multiple) {
      const ids = value?.map((v) => v._id || v) || [];
      return this.model.getList({ query: { _id: { $in: ids } } });
    } else {
      const id = value?._id || value;
      return this.model.get(id);
    }
  }

  setter(value) {
    if (!value) {
      return value;
    }

    if (this.multiple) {
      return value?._ids?.map((v) => v._id || v) || value?.map((v) => v._id || v);
    } else {
      return value?._id || value;
    }
  }
}

export default GraphandFieldRelation;
