import Client from "../Client";
import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";

const hydrateModel = (input: typeof GraphandModel | Client, data: any, upsert = false) => {
  data = data ?? {};

  let client: Client = input instanceof Client ? input : input._client;
  let Model: typeof GraphandModel = data.__scope ? client.getModel(data.__scope) : input;

  switch (data.__type) {
    case "GraphandModelList":
      return GraphandModelList.hydrate(data, Model);
    case "GraphandModel":
      return new Model(data.__payload);
    default:
      break;
  }

  let res;
  if (Array.isArray(data)) {
    const list = data.map((i) => new Model(i));
    res = new GraphandModelList({ model: Model }, ...list);
  } else {
    res = new Model(data);
  }

  if (upsert) {
    Model.upsertStore(res);
  }

  return res;
};

export default hydrateModel;
