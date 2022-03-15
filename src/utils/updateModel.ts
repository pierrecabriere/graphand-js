import { GraphandModel } from "../lib";
import parseQuery from "./parseQuery";

const updateModel = async (Model: typeof GraphandModel, payload, options) => {
  await Model.init();

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
    if ((await Model.beforeUpdate?.call(Model, payload)) === false) {
      return;
    }
  }

  try {
    payload = parseQuery(payload);
    const { data } = await Model.handleUpdateCall(payload);

    if (!data) {
      return data;
    }

    const items = data.data.rows.map((item) => new Model(item));

    if (options.upsert) {
      const upserted = Model.upsertStore(items);

      if (upserted) {
        Model.clearCache();

        items.forEach((item) => item.HistoryModel.clearCache());
      }
    }

    if (options.hooks) {
      await Model.afterUpdate?.call(Model, items, null, payload);
    }

    return items;
  } catch (e) {
    if (options.hooks) {
      await Model.afterUpdate?.call(Model, null, e, payload);
    }

    throw e;
  }
};

export default updateModel;
