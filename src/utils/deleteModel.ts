import { GraphandModel } from "../lib";
import parseQuery from "./parseQuery";

const deleteModel = async (Model: typeof GraphandModel, payload: GraphandModel | any, options) => {
  await Model._init();

  options = Object.assign(
    {},
    {
      hooks: true,
      clearCache: true,
      updateStore: true,
    },
    options,
  );

  const args = { payload };

  if (options.hooks) {
    const responses = await Model.execHook("preDelete", [args]);
    if (responses?.includes(false)) {
      return;
    }
  }

  if (payload instanceof GraphandModel) {
    try {
      const { _id } = payload;
      await Model._client._axios.delete(`${Model.baseUrl}/${_id}`);

      if (options.updateStore) {
        const updated = Model.deleteFromStore([payload]);

        if (updated) {
          Model.clearCache();
        }
      }

      if (options.hooks) {
        await Model.execHook("postDelete", [args]);
      }
    } catch (e) {
      Model.upsertStore([payload]);

      if (options.hooks) {
        await Model.execHook("postDelete", [args, e]);
      }

      throw e;
    }
  } else {
    try {
      if (payload.query) {
        payload.query = parseQuery(payload.query);
      }

      // @ts-ignore
      const { data } = await Model._client._axios.delete(Model.baseUrl, { _data: payload });

      if (!data) {
        return;
      }

      const ids = data.data.ids;

      if (options.updateStore) {
        const updated = Model.deleteFromStore(ids);

        if (updated) {
          Model.clearCache();
        }
      }

      if (options.hooks) {
        await Model.execHook("postDelete", [args]);
      }
    } catch (e) {
      if (options.hooks) {
        await Model.execHook("postDelete", [args, e]);
      }

      throw e;
    }
  }

  return true;
};

export default deleteModel;
