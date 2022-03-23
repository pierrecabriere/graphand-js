import isEqual from "fast-deep-equal";
import GraphandField from "../GraphandField";

class GraphandFieldJSON extends GraphandField {
  static __fieldType = "JSON";

  fields;

  getter(value, from) {
    if (typeof value !== "object") {
      value = {};
    }

    let res = { ...value };

    const _fields = this.fields || {};
    Object.keys(_fields).forEach((key) => {
      const field = _fields[key];

      if (!field) {
        return;
      }

      if (res[key] === undefined) {
        res[key] = field.defaultValue;
      }

      if (field?.getter) {
        res[key] = field.getter(res[key], from);
      }
    });

    return res;
  }

  setter(value, from) {
    if (typeof value !== "object") {
      value = {};
    }

    let res = { ...value };

    const _fields = this.fields || {};
    Object.keys(_fields).forEach((key) => {
      const field = _fields[key];

      if (!field) {
        return;
      }

      if (field?.setter) {
        res[key] = field.setter(res[key], from);
      }
    });

    return res;
  }

  // const _fields = this.fields || {};
  // const defaults = Object.keys(_fields).reduce((payload, key) => {
  //   const field = _fields[key];
  //   if (field.defaultValue !== undefined) {
  //     payload[key] = field.defaultValue;
  //   }
  //
  //   return payload;
  // }, {});
  //
  // return (
  //   value &&
  //   Object.keys(value).reduce(
  //     (payload, key) => {
  //       if (isEqual(defaults[key], value[key])) {
  //         delete payload[key];
  //       }
  //
  //       return payload;
  //     },
  //     { ...value },
  //   )
  // );
}

export default GraphandFieldJSON;
