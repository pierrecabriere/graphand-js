import GraphandError from "../lib/GraphandError";
import * as models from "../models";

const verifyScopeFormat = (scope: string) => {
  if (Object.values(models).find((m) => m.scope === scope)) {
    return true;
  }

  if (/^Data:([a-zA-Z0-9\-_]+?)$/.test(scope)) {
    return true;
  }

  throw new GraphandError(`Scope ${scope} is invalid`);
};

export default verifyScopeFormat;
