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
      return parseQuery(value);
    }
  }

  return value;
};

const parseQuery = (payload) => {
  if (!payload) {
    return {};
  }

  if (payload.constructor?.name === "FormData") {
    return payload;
  }

  if (typeof payload === "string" && !payload.match(/^[0-9a-fA-F]{24}$/)) {
    return payload;
  }

  if (Array.isArray(payload) && payload.every((row) => typeof row === "string" || row?._id)) {
    payload = { ids: payload };
  } else if (typeof payload === "string" && payload.match(/^[0-9a-fA-F]{24}$/)) {
    payload = { ids: [payload] };
  } else if (
    payload.payload?._id?.$in &&
    Object.keys(payload.payload).length === 1 &&
    Object.keys(payload.payload._id).length === 1 &&
    Object.keys(payload.payload._id.$in).length === 1
  ) {
    payload = { ids: [payload.payload._id] };
  } else if (payload.payload?._id?.$in && Object.keys(payload.payload).length === 1 && Object.keys(payload.payload._id).length === 1) {
    payload.ids = payload.payload._id.$in;
  }

  let res;

  if (Array.isArray(payload)) {
    res = payload.map((row) => _decode(row));
  } else {
    res = Object.keys(payload).reduce((final, key) => Object.assign(final, { [key]: _decode(payload[key]) }), {});
  }

  return res;
};

export default parseQuery;
