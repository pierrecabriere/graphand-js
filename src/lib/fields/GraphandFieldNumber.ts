import GraphandField from "../GraphandField";

class GraphandFieldNumber extends GraphandField {
  static __fieldType = "Number";
}

export type GraphandFieldNumberDefinition<
  D extends {
    required?: boolean;
  } = { required: false },
  Required extends boolean = false,
> = Required extends true
  ? number
  : D["required"] extends true
  ? GraphandFieldNumberDefinition<D, true>
  : GraphandFieldNumberDefinition<D, true> | undefined;

export default GraphandFieldNumber;
