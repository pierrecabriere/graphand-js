import GraphandModel from "../lib/GraphandModel";
import GraphandModelList from "../lib/GraphandModelList";
import GraphandModelListPromise from "../lib/GraphandModelListPromise";
import GraphandModelPromise from "../lib/GraphandModelPromise";

const _decode = (value) => {
  if (value instanceof GraphandModelList || value instanceof GraphandModelListPromise) {
    return value.ids;
  } else if (value instanceof GraphandModel || value instanceof GraphandModelPromise) {
    return value._id;
  } else if (value && typeof value === "object") {
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

  return Object.keys(payload).reduce((final, key) => Object.assign(final, { [key]: _decode(payload[key]) }), {});
};

export default serialize;
