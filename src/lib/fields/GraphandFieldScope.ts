import GraphandFieldSelect from "./GraphandFieldSelect";
import verifyScopeFormat from "../../utils/verifyScopeFormat";

class GraphandFieldScope extends GraphandFieldSelect {
  options = [];

  setter(value) {
    verifyScopeFormat(value);
    return value;
  }
}

export default GraphandFieldScope;
