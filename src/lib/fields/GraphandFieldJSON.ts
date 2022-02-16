import isEqual from "fast-deep-equal";
import GraphandField from "../GraphandField";

class GraphandFieldJSON extends GraphandField {
  static __fieldType = "JSON";

  fields;

  getter(value) {
    if (Array.isArray(value)) {
      return value;
    }

    const _fields = this.fields || {};
    const defaults = Object.keys(_fields).reduce((payload, key) => {
      const field = _fields[key];
      if (field.defaultValue !== undefined) {
        payload[key] = field.defaultValue;
      }

      return payload;
    }, {});

    if (typeof value !== "object") {
      value = {};
    }

    return { ...defaults, ...value };
  }

  setter(value) {
    const _fields = this.fields || {};
    const defaults = Object.keys(_fields).reduce((payload, key) => {
      const field = _fields[key];
      if (field.defaultValue !== undefined) {
        payload[key] = field.defaultValue;
      }

      return payload;
    }, {});

    return (
      value &&
      Object.keys(value).reduce(
        (payload, key) => {
          if (isEqual(defaults[key], value[key])) {
            delete payload[key];
          }

          return payload;
        },
        { ...value },
      )
    );
  }
}

export default GraphandFieldJSON;
