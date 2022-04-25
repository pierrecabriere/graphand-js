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
    return value.encodeQuery();
  } else if (value && typeof value === "object" && Object.keys(value).length) {
    if (Array.isArray(value)) {
      return value.map(_decode);
    } else {
      return parsePayload(value);
    }
  }

  return value;
};

const parsePayload = (payload) => {
  if (!payload) {
    return {};
  }

  if (payload.constructor?.name === "FormData") {
    return payload;
  }

  let res;

  if (Array.isArray(payload)) {
    res = payload.map((row) => _decode(row));
  } else {
    res = Object.keys(payload).reduce((final, key) => Object.assign(final, { [key]: _decode(payload[key]) }), {});
  }

  return res;
};

export default parsePayload;
