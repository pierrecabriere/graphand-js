import GraphandField from "../GraphandField";

class GraphandFieldJSON extends GraphandField {
  static __fieldType = "JSON";

  fields;

  getter(value, from) {
    if (typeof value !== "object") {
      value = {};
    }

    const res = { ...value };

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

    if (Object.keys(res)?.length) {
      if (Object.keys(res).every((key) => key == String(parseInt(key)))) {
        return Object.values(res);
      }
    } else if (Array.isArray(value)) {
      return value;
    }

    return res;
  }

  setter(value, from) {
    if (typeof value !== "object") {
      value = {};
    }

    const res = { ...value };

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
}

export type GraphandFieldJSONDefinition<T extends { [key: string]: any }> = T | undefined;

export default GraphandFieldJSON;
