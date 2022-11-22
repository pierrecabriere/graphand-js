import verifyScopeFormat from "../../utils/verifyScopeFormat";
import GraphandFieldText, { GraphandFieldTextDefinition } from "./GraphandFieldText";

class GraphandFieldScope extends GraphandFieldText {
  options = [];

  setter(value) {
    if (value !== undefined && value !== null) {
      verifyScopeFormat(value);
    }

    return value;
  }
}

export type GraphandFieldScopeDefinition<T extends any = any> = GraphandFieldTextDefinition<T>;

export default GraphandFieldScope;
