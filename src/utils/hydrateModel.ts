import { GraphandModel } from "../lib";
import GraphandModelList from "../lib/GraphandModelList";

const hydrateModel = (Model: typeof GraphandModel, data: any) => {
  data = data ?? {};

  Model = data.__scope ? Model._client.getModel(data.__scope) : Model;

  switch (data.__type) {
    case "GraphandModelList":
      return GraphandModelList.hydrate(data, Model);
    case "GraphandModel":
      return new Model(data.__payload);
    default:
      break;
  }

  if (Array.isArray(data)) {
    const list = data.map((i) => new Model(i));
    return new GraphandModelList({ model: Model }, ...list);
  }

  return new Model(data);
};

export default hydrateModel;
