import ModelScopes from "../../enums/model-scopes";
import GraphandField from "../GraphandField";
import GraphandModel from "../GraphandModel";

class GraphandFieldRelation extends GraphandField {
  static __fieldType = "Relation";

  ref: ModelScopes | string;
  multiple?: boolean;
  query;
  _model;

  constructor(data?: any) {
    super(data);

    if (data._model && !data.ref) {
      this.ref = data._model.scope;
    } else if (!data.ref) {
      throw new Error(`Invalid ref ${data.ref} for field`);
    }
  }

  getter(value, from: GraphandModel) {
    if (!value) {
      return;
    }

    if (!this._model || this._model.scope !== this.ref) {
      if (!from) {
        console.error(`Unable to get model from field with value ${value}`, this);
        return null;
      }

      const { constructor } = Object.getPrototypeOf(from);
      const { _client } = constructor;

      this._model = _client.getModel(this.ref);
    }

    if (this.multiple) {
      const ids = typeof value === "string" ? [value] : value.filter(Boolean).map((v) => v._id || v) || [];
      return this._model.getList({ ids });
    } else {
      const id = typeof value === "string" ? value : value._id;
      return this._model.get(id);
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
