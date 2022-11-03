import GraphandClient from "../GraphandClient";
import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";

function hydrateModel<T extends typeof GraphandModel | GraphandClient>(input: T, data: any, upsert = false) {
  data = data ?? {};

  const client: GraphandClient = input instanceof GraphandClient ? input : input._client;
  const Model = (data.__scope ? client?.getModel(data.__scope) || input : input) as typeof GraphandModel;

  switch (data.__type) {
    case "GraphandModelList":
      const list = GraphandModelList.hydrate(data, Model);
      upsert && Model.upsertStore(list);
      return list;
    case "GraphandModel":
      const instance = new Model(data.__payload);
      upsert && Model.upsertStore([instance]);
      return instance;
    default:
      break;
  }

  if (Array.isArray(data)) {
    const rows = data.map((i) => new Model(i));
    const list = new GraphandModelList({ model: Model, rows });
    upsert && Model.upsertStore(list);
    return list;
  } else {
    const instance = new Model(data);
    upsert && Model.upsertStore([instance]);
    return instance;
  }
}

export default hydrateModel;
