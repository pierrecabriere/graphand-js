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
      return;
    }

    if (this.multiple) {
      const ids = typeof value === "string" ? [value] : value.map((v) => v._id || v) || [];
      return this.model.getList({ ids });
    } else {
      const id = typeof value === "string" ? value : value._id;
      return this.model.get(id);
    }
  }

  setter(value) {
    if (!value) {
      return value;
    }

    if (this.multiple) {
      return value?._ids?.map((v) => v._id || v) || value?.map((v) => v._id || v) || value;
    } else {
      return value?._id || value;
    }
  }
}

export default GraphandFieldRelation;
