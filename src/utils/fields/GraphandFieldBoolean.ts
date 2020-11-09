import GraphandField from "../GraphandField";

class GraphandFieldBoolean extends GraphandField {
  constructor(data) {
    super(data);
  }

  setter(value) {
    return !!value;
  }
}

export default GraphandFieldBoolean;
