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

  getter(value, from: GraphandModel) {
    return value;
  }

  setter(value) {
    return value;
  }
}

export default GraphandField;
