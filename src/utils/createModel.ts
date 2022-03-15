import { GraphandModel } from "../lib";
import parseQuery from "./parseQuery";

const createModel = async (Model: typeof GraphandModel, payload, hooks = true, url: string) => {
  await Model.init();

  const config = { params: {} };

  if (payload.locale && Model._client._project && payload.locale === Model._client._project.defaultLocale) {
    delete payload.locale;
  }

  const args = { payload, config };

  if (hooks) {
    if ((await Model.beforeCreate?.call(Model, args)) === false) {
      return;
    }
  }

  let inserted;
  try {
    args.payload = parseQuery(args.payload);
    const req = Model._client._axios.post(url, args.payload, args.config).then(async (res) => {
      const { data } = res.data;
      const inserted = Array.isArray(data) ? data.map((i) => new Model(i)) : data ? new Model(data) : data;

      Model.clearCache();
      Model.upsertStore(inserted, true);

      if (hooks) {
        await Model.afterCreate?.call(Model, inserted, null, args);
      }

      return inserted;
    });

    const middlewareData = await Model.middlewareCreate?.call(Model, args, req);
    if (middlewareData !== undefined) {
      return middlewareData;
    }
    inserted = await req;
  } catch (e) {
    if (hooks) {
      await Model.afterCreate?.call(Model, null, e, args);
    }

    throw e;
  }

  return inserted;
};

export default createModel;
