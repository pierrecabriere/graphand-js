import verifyScopeFormat from "../../utils/verifyScopeFormat";
import GraphandFieldText from "./GraphandFieldText";

class GraphandFieldScope extends GraphandFieldText {
  options = [];

  setter(value) {
    if (value !== undefined && value !== null) {
      verifyScopeFormat(value);
    }

    return value;
  }
}

export default GraphandFieldScope;
