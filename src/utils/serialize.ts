import GraphandModel from "../lib/GraphandModel";
import GraphandModelList from "../lib/GraphandModelList";
import GraphandModelListPromise from "../lib/GraphandModelListPromise";
import GraphandModelPromise from "../lib/GraphandModelPromise";

const _decode = (value) => {
  if (
    value instanceof GraphandModelList ||
    value instanceof GraphandModelListPromise ||
    value instanceof GraphandModel ||
    value instanceof GraphandModelPromise
  ) {
    return value.serialize();
  } else if (value && typeof value === "object" && Object.keys(value).length) {
    if (Array.isArray(value)) {
      return value.map((v) => _decode(v));
    } else {
      return serialize(value);
    }
  }

  return value;
};

const serialize = (payload) => {
  if (payload.constructor.name === "FormData") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return {};
  }

  const res = Object.keys(payload).reduce((final, key) => Object.assign(final, { [key]: _decode(payload[key]) }), {});
  return JSON.parse(JSON.stringify(res));
};

export default serialize;
