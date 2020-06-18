class GraphandField {
  defaultValue;

  constructor(data: any = {}) {
    Object.assign(this, data);
  }

  getter(value) {
    return value;
  }

  setter(value) {
    return value;
  }
}

export default GraphandField;
