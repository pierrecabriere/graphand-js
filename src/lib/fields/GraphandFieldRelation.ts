import ModelScopes from "../../enums/model-scopes";
import { GraphandModelMedia } from "../../index";
import GraphandField from "../GraphandField";
import GraphandModel from "../GraphandModel";
import GraphandModelList from "../GraphandModelList";
import GraphandModelListPromise from "../GraphandModelListPromise";
import GraphandModelPromise from "../GraphandModelPromise";

class GraphandFieldRelation extends GraphandField {
  static __fieldType = "Relation";

  required?: boolean;
  unique?: boolean;
  sparse?: boolean;
  ref: ModelScopes | string;
  multiple?: boolean;
  duplicates?: boolean;
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

    let model = this._model;
    if (!model) {
      if (!from) {
        console.error(`Unable to get model from field with value ${value}`, this);
        return null;
      }

      const { constructor } = Object.getPrototypeOf(from);
      const { _client } = constructor;

      model = _client.getModel(this.ref);
    }

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

export type GraphandFieldRelationDefinition<T extends GraphandModel = GraphandModel, M extends boolean = true> =
  | (M extends true
      ? GraphandModelList<T> | GraphandModelListPromise<T>
      : T extends GraphandModelMedia
      ? T | (GraphandModelPromise<T> & { getUrl: typeof GraphandModelMedia.prototype.getUrl })
      : T | GraphandModelPromise<T>)
  | undefined;

export default GraphandFieldRelation;
