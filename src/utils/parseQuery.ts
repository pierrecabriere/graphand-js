import GraphandModel from "../lib/GraphandModel";
import GraphandModelList from "../lib/GraphandModelList";
import GraphandModelListPromise from "../lib/GraphandModelListPromise";
import GraphandModelPromise from "../lib/GraphandModelPromise";
import isId from "./isId";

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

const parseQuery = (input) => {
  if (!input) {
    return {};
  }

  if (isId(input)) {
    return { _id: input };
  }

  if (Array.isArray(input) && input.every((row) => typeof row === "string" || row?._id)) {
    const ids = input.map((row) => row._id || row);
    input = { _id: { $in: ids } };
  }

  let res;

  if (Array.isArray(input)) {
    res = input.map((row) => _decode(row));
  } else {
    res = Object.keys(input).reduce((final, key) => Object.assign(final, { [key]: _decode(input[key]) }), {});
  }

  return res;
};

export default parseQuery;
