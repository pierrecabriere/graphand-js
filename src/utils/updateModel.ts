import { GraphandModel } from "../lib";
import parsePayload from "./parsePayload";
import parseQuery from "./parseQuery";

const updateModel = async (Model: typeof GraphandModel, payload, options) => {
  await Model._init();

  options = Object.assign(
    {},
    {
      hooks: true,
      clearCache: true,
      upsert: true,
    },
    options,
  );

  // if (Model.translatable && !payload.translations && Model._client._project?.locales?.length) {
  //   payload.translations = Model._client._project?.locales;
  // }

  if (payload.locale && payload.locale === Model._client._project?.defaultLocale) {
    delete payload.locale;
  }

  if (options.hooks) {
    const responses = await Model.execHook("preUpdate", [payload]);
    if (responses?.includes(false)) {
      return;
    }
  }

  try {
    if (payload.query) {
      payload.query = parseQuery(payload.query);
    }

    if (payload.set) {
      payload.set = parsePayload(payload.set);
    }

    const { data } = await Model.handleUpdateCall(payload);

    if (!data) {
      return data;
    }

    const items = Model.hydrate(data.data.rows);

    if (options.upsert) {
      const upserted = Model.upsertStore(items);

      if (upserted) {
        Model.clearCache();

        items.forEach((item) => item.HistoryModel.clearCache());
      }
    }

    if (options.hooks) {
      await Model.execHook("postUpdate", [items, null, payload]);
    }

    return items;
  } catch (e) {
    if (options.hooks) {
      await Model.execHook("postUpdate", [null, e, payload]);
    }

    throw e;
  }
};

const updateModelInstance = async (instance: GraphandModel, payload, options) => {
  options = Object.assign(
    {},
    {
      hooks: true,
      clearCache: false,
      upsert: undefined,
      preStore: false,
      revertOnError: undefined,
    },
    options,
  );

  options.upsert = options.upsert ?? !options.preStore;
  options.revertOnError = options.revertOnError ?? options.preStore;

  const constructor = instance.constructor as typeof GraphandModel;

  // if (constructor.translatable && !payload.translations && constructor._client._project?.locales?.length) {
  //   payload.translations = constructor._client._project?.locales;
  // }

  if (constructor.translatable && payload.locale === undefined && instance._locale) {
    payload.locale = instance._locale;
  }

  if (options.hooks) {
    const responses = await constructor.execHook("preUpdate", [payload, instance]);
    if (responses?.includes(false)) {
      return;
    }
  }

  const _id = payload._id || instance._id;
  const backup = instance.clone();

  if (options.preStore) {
    instance.assign(payload.set);
  }

  if (instance.isTemporary()) {
    console.warn("You tried to update a temporary document");
    return instance;
  }

  try {
    await updateModel(
      constructor,
      { ...payload, query: { _id } },
      {
        clearCache: options.clearCache,
        upsert: options.upsert,
        hooks: false,
      },
    );

    if (options.upsert) {
      const found = constructor.get(_id, false);

      if (found) {
        instance.assign(found.raw, false);
      }
    } else {
      instance.assign(null, false);
    }

    if (options.hooks) {
      await constructor.execHook("postUpdate", [constructor.get(_id), null, payload]);
    }
  } catch (e) {
    if (options.revertOnError) {
      constructor.upsertStore([backup]);
    }

    if (options.hooks) {
      await constructor.execHook("postUpdate", [e, payload]);
    }

    throw e;
  }
};

export default updateModel;
export { updateModelInstance };
