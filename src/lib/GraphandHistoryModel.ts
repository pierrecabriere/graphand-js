import Account from "../models/Account";
import GraphandFieldDate, { GraphandFieldDateDefinition } from "./fields/GraphandFieldDate";
import GraphandFieldJSON, { GraphandFieldJSONDefinition } from "./fields/GraphandFieldJSON";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "./fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "./fields/GraphandFieldText";
import GraphandModel from "./GraphandModel";

class GraphandHistoryModel extends GraphandModel {
  static schema = {
    diffs: new GraphandFieldJSON(),
    date: new GraphandFieldDate({ time: true }),
    kind: new GraphandFieldText({ options: ["create", "update", "delete"] }),
    metas: new GraphandFieldJSON({
      fields: {
        account: new GraphandFieldRelation({ ref: "Account", multiple: false }),
      },
    }),
  };

  diffs: GraphandFieldJSONDefinition;
  date: GraphandFieldDateDefinition;
  kind: GraphandFieldTextDefinition<{ options: ["create", "update", "delete"] }>;
  metas: GraphandFieldJSONDefinition<{ account: GraphandFieldRelationDefinition<{ model: Account }> }>;
}

export default GraphandHistoryModel;
