import GraphandField from "../GraphandField";

class GraphandFieldNumber extends GraphandField {
  static __fieldType = "Number";
}

export type GraphandFieldNumberDefinition = number | undefined;

export default GraphandFieldNumber;
