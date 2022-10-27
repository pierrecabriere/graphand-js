import GraphandField from "../GraphandField";
import GraphandModel from "../GraphandModel";

class GraphandFieldText extends GraphandField {
  static __fieldType = "Text";

  required?: boolean;
  unique?: boolean;
  sparse?: boolean;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  regexOptions?: string;
  multiple?: boolean;
  duplicates?: boolean;
  options?: string[];
  creatable?: boolean;

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

export type GraphandFieldTextDefinition<M extends boolean = false> = M extends true ? string[] : string;

export default GraphandFieldText;
