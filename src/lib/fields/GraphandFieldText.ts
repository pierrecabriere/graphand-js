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

type string_ = string & Partial<any>;

type GraphandFieldTextDefinitionSingleType<
  Options extends string[],
  Creatable extends boolean = true,
  DefaultType extends any = string_,
> = Options extends string[]
  ? Creatable extends false
    ? Options[number]
    : GraphandFieldTextDefinitionSingleType<Options, false> | DefaultType
  : GraphandFieldTextDefinitionSingleType<[], Creatable, string>;

export type GraphandFieldTextDefinition<
  D extends {
    required?: boolean;
    options?: string[];
    multiple?: boolean;
    creatable?: boolean;
  } = { multiple: false; required: false; creatable: true },
  Required extends boolean = false,
> = Required extends true
  ? D["multiple"] extends true
    ? GraphandFieldTextDefinitionSingleType<D["options"], D["creatable"]>[]
    : GraphandFieldTextDefinitionSingleType<D["options"], D["creatable"]>
  : D["required"] extends true
  ? GraphandFieldTextDefinition<D, true>
  : GraphandFieldTextDefinition<D, true> | undefined;

export default GraphandFieldText;
