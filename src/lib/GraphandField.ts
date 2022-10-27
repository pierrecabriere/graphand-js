import DataField from "../models/DataField";
import GraphandModel from "./GraphandModel";

class GraphandField {
  static __fieldType;

  query?: any;
  defaultValue?: any;
  __dataField?: DataField;
  [prop: string]: any;

  constructor(data?: any) {
    Object.assign(this, data);
  }

  getter(value: any, from: GraphandModel) {
    return value;
  }

  setter(value: any, from: GraphandModel) {
    return value;
  }
}

export default GraphandField;
