import GraphandField from "../GraphandField";

class GraphandFieldRelation extends GraphandField {
  model;
  multiple;
  query;
  defaultField;

  constructor(data) {
    super(data);
  }

  getter(value) {
    return this.model.get(value);
  }
}

export default GraphandFieldRelation;
