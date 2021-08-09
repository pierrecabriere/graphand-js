import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldJSON from "./fields/GraphandFieldJSON";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandModel from "./GraphandModel";
import GraphandFieldText from "./fields/GraphandFieldText";

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
        options: [
          { value: "create", label: "Création" },
          { value: "update", label: "Modification" },
          { value: "delete", label: "Suppression" },
        ],
      }),
      "metas.account": new GraphandFieldRelation({
        name: "Par",
        model: this._client.models.Account,
      }),
    };
  }
}

export default GraphandHistoryModel;
