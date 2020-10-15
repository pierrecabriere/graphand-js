import GraphandField from "../GraphandField";

class GraphandFieldDate extends GraphandField {
  constructor(data) {
    super(data);
  }

  getter(value) {
    return value && new Date(value);
  }

  setter(value) {
    return value && (typeof value === "string" ? value : value.toISOString());
  }
}

export default GraphandFieldDate;
