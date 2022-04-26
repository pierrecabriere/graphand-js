import Client from "../Client";
import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";

function hydrateModel<T extends typeof GraphandModel | Client>(input: T, data: any, upsert = false) {
  data = data ?? {};

  const client: Client = input instanceof Client ? input : input._client;
  const Model = (data.__scope ? client?.getModel(data.__scope) || input : input) as typeof GraphandModel;

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
    Model.upsertStore(Array.isArray(res) ? res : [res]);
  }

  return res;
}

export default hydrateModel;
