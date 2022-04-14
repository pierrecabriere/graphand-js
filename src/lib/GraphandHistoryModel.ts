import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldJSON from "./fields/GraphandFieldJSON";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandFieldText from "./fields/GraphandFieldText";
import GraphandModel from "./GraphandModel";

class GraphandHistoryModel extends GraphandModel {
  static get baseFields() {
    return {
      diffs: new GraphandFieldJSON(),
      date: new GraphandFieldDate({ time: true }),
      kind: new GraphandFieldText({ options: ["create", "update", "delete"] }),
      "metas.account": new GraphandFieldRelation({ ref: "Account" }),
    };
  }
}

export default GraphandHistoryModel;
