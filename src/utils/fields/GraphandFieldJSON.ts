import GraphandField from "../GraphandField";

class GraphandFieldJSON extends GraphandField {
  fields;

  getter(value) {
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
}

export default GraphandFieldJSON;
