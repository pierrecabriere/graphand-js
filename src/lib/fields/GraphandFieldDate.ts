import GraphandField from "../GraphandField";

class GraphandFieldDate extends GraphandField {
  static __fieldType = "Date";

  time: boolean;

  getter(value) {
    return value && new Date(value);
  }

  setter(value) {
    return value;
  }
}

export type GraphandFieldDateDefinition = Date;

export default GraphandFieldDate;
