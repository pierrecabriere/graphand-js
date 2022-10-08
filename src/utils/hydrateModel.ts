import GraphandClient from "../GraphandClient";
import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";

function hydrateModel<T extends typeof GraphandModel | GraphandClient>(input: T, data: any, upsert = false) {
  data = data ?? {};

  const client: GraphandClient = input instanceof GraphandClient ? input : input._client;
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
    const rows = data.map((i) => new Model(i));
    res = new GraphandModelList({ model: Model, rows });

    if (upsert) {
      Model.upsertStore(res);
    }
  } else {
    res = new Model(data);

    if (upsert) {
      Model.upsertStore([res]);
    }
  }

  return res;
}

export default hydrateModel;
