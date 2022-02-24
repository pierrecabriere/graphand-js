import GraphandModel from "./GraphandModel";

class GraphandField {
  static __fieldType;

  name;
  defaultValue;
  exclude;
  configuration;

  constructor(data?: any) {
    Object.assign(this, data);
  }

  getter(value: any, from: GraphandModel) {
    return value;
  }

  setter(value: any) {
    return value;
  }
}

export default GraphandField;
