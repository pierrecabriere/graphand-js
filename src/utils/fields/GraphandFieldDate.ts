import GraphandField from "../GraphandField";

class GraphandFieldDate extends GraphandField {
  constructor(data) {
    super(data);
  }

  getter(value) {
    return value && new Date(value);
  }
}

export default GraphandFieldDate;
