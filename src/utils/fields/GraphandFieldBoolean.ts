import GraphandField from "../GraphandField";

class GraphandFieldBoolean extends GraphandField {
  setter(value) {
    return !!value;
  }
}

export default GraphandFieldBoolean;
