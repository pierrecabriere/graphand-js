import { GraphandModel } from "../lib";
import parsePayload from "./parsePayload";

const createModel = async (Model: typeof GraphandModel, payload, hooks = true, url: string) => {
  await Model._init();

  const config = { params: {}, global: Model.isGlobal };

  if (payload.locale && Model._client._project && payload.locale === Model._client._project.defaultLocale) {
    delete payload.locale;
  }

  const args = { payload, config };

  if (hooks) {
    const responses = await Model.execHook("preCreate", [args]);
    if (responses?.includes(false)) {
      return;
    }
  }

  let inserted;
  try {
    args.payload = parsePayload(args.payload);
    const req = Model._client._axios.post(url, args.payload, args.config).then(async (res) => {
      const { data } = res.data;
      const inserted = Model.hydrate(data);

      Model.clearCache();
      Model.upsertStore([inserted], true);

      if (hooks) {
        await Model.execHook("postCreate", [inserted, null, args]);
      }

      return inserted;
    });

    inserted = await req;
  } catch (e) {
    if (hooks) {
      await Model.execHook("postCreate", [null, e, args]);
    }

    throw e;
  }

  return inserted;
};

export default createModel;
