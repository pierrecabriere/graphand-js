import GraphandField from "../GraphandField";
import GraphandModel from "../GraphandModel";

class GraphandFieldText extends GraphandField {
  static __fieldType = "Text";

  defaultValue;
  required;
  unique;
  sparse;
  minLength;
  maxLength;
  regex;
  regexOptions;
  multiple;
  duplicates;
  options;
  creatable;

  getter(value, from: GraphandModel) {
    if (!value) {
      return value;
    }

    if (this.multiple) {
      return typeof value === "string" ? [value] : value || [];
    } else {
      return Array.isArray(value) ? value[0] : value;
    }
  }

  setter(value) {
    if (!value) {
      return value;
    }

    if (this.multiple) {
      return value && !Array.isArray(value) ? [value] : value;
    } else {
      return value && Array.isArray(value) ? value[0] : value;
    }
  }
}

export default GraphandFieldText;
