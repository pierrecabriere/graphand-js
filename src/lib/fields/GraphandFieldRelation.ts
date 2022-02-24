import GraphandField from "../GraphandField";
import GraphandModel from "../GraphandModel";

class GraphandFieldRelation extends GraphandField {
  static __fieldType = "Relation";

  ref;
  multiple;
  query;

  constructor(data?: any) {
    super(data);

    if (!data.ref) {
      throw new Error(`Invalid ref ${data.ref} for field`);
    }
  }

  getter(value, from: GraphandModel) {
    if (!value || !from) {
      return;
    }

    const { constructor } = Object.getPrototypeOf(from);
    const { _client } = constructor;

    const model = _client.getModel(this.ref);
    if (this.multiple) {
      const ids = typeof value === "string" ? [value] : value.filter(Boolean).map((v) => v._id || v) || [];
      return model.getList({ ids });
    } else {
      const id = typeof value === "string" ? value : value._id;
      return model.get(id);
    }
  }

  setter(value) {
    if (!value) {
      return value;
    }

    if (this.multiple) {
      return value?._ids?.map((v) => v._id || v) || value?.filter(Boolean).map((v) => v._id || v) || value;
    } else {
      return value?._id || value;
    }
  }
}

export default GraphandFieldRelation;
