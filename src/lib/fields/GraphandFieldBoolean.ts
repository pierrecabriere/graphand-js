import GraphandField from "../GraphandField";

class GraphandFieldBoolean extends GraphandField {
  static __fieldType = "Boolean";

  setter(value) {
    return !!value;
  }
}

export type GraphandFieldBooleanDefinition = boolean | undefined;

export default GraphandFieldBoolean;
