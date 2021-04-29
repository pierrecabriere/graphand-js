import * as models from "../models";
import GraphandError from "../lib/GraphandError";

const verifyScopeFormat = (scope: string) => {
  if (models[scope]) {
    return true;
  }

  if (/^Data:([a-zA-Z0-9\-_]+?)$/.test(scope)) {
    return true;
  }

  throw new GraphandError(`Scope ${scope} is invalid`);
};

export default verifyScopeFormat;