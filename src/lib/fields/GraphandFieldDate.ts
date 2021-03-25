import GraphandField from "../GraphandField";

class GraphandFieldDate extends GraphandField {
  getter(value) {
    return value && new Date(value);
  }

  setter(value) {
    return value;
  }
}

export default GraphandFieldDate;
