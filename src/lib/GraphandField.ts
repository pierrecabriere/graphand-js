import GraphandModel from "./GraphandModel";

class GraphandField {
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
