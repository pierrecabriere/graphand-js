import isEqual from "fast-deep-equal";
import GraphandField from "../GraphandField";

class GraphandFieldJSON extends GraphandField {
  fields;

  getter(value) {
    if (Array.isArray(value)) {
      return value;
    }

    const defaultValues = this.fields
      ? Object.keys(this.fields).reduce((payload, key) => {
          if (this.fields[key].defaultValue !== undefined) {
            payload[key] = this.fields[key].defaultValue;
          }

          return payload;
        }, {})
      : {};

    if (typeof value !== "object") {
      value = {};
    }

    return { ...defaultValues, ...value };
  }

  setter(value) {
    return this.fields
      ? Object.keys(this.fields).reduce(
          (payload, key) => {
            if (isEqual(this.fields[key].defaultValue, value[key])) {
              delete payload[key];
            }

            return payload;
          },
          { ...value },
        )
      : value;
  }
}

export default GraphandFieldJSON;
