import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldJSON from "./fields/GraphandFieldJSON";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandFieldText from "./fields/GraphandFieldText";
import GraphandModel from "./GraphandModel";

class GraphandHistoryModel extends GraphandModel {
  static _defaultFields = false;

  static get baseFields() {
    return {
      diffs: new GraphandFieldJSON({
        name: "Changements",
      }),
      date: new GraphandFieldDate({
        name: "Date",
        time: true,
      }),
      kind: new GraphandFieldText({
        name: "Opération",
        options: ["create", "update", "delete"],
      }),
      "metas.account": new GraphandFieldRelation({
        name: "Par",
        ref: "Account",
      }),
    };
  }
}

export default GraphandHistoryModel;
