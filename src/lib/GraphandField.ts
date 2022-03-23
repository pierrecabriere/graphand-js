import GraphandModel from "./GraphandModel";

class GraphandField {
  static __fieldType;

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
