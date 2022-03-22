import isEqual from "fast-deep-equal";
import _ from "lodash";
import { Observable } from "rxjs";
import Client from "../Client";
import Account from "../models/Account";
import createModel from "../utils/createModel";
import deleteModel from "../utils/deleteModel";
import fetchModel from "../utils/fetchModel";
import { FetchOptions } from "../utils/fetchModel";
import getModelInstance from "../utils/getModelInstance";
import hydrateModel from "../utils/hydrateModel";
import parseQuery from "../utils/parseQuery";
import { processPopulate } from "../utils/processPopulate";
import queryModel, { QueryOptions } from "../utils/queryModel";
import updateModel from "../utils/updateModel";
import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldId from "./fields/GraphandFieldId";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandField from "./GraphandField";
import GraphandModelList from "./GraphandModelList";

class GraphandModel {
  // configurable fields
  static translatable = true;
  static queryFields = false;
  static baseUrl = null;
  static queryUrl = null;
  static schema = {};
  static scope = "GraphandModelAbstract";

  static _client: Client;
  static _socketSubscription;
  static _fieldsIds = null;
  static _dataFields = {};
  static _cache;
  static _initialized = false;
  static _fieldsList = null;
  static _registeredAt;
  static _observers;
  static _socketTriggerSubject;
  static _initPromise;
  static _listSubject;
  static _defaultFields = true;
  static _socketOptions;
  static _customFields = {};
  static _cachedFields;

  // private fields
  private _data: any = {};
  private _locale = null;
  private _version = 1;

  private _observable;
  private _storeSub;
  private _subscriptions = new Set();

  // other fields
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Account;
  updatedBy: Account;

  static universalPrototypeMethods = [];

  // hooks
  static beforeQuery;
  static afterQuery;
  static beforeCreate;
  static middlewareCreate;
  static afterCreate;
  static beforeUpdate;
  static afterUpdate;
  static beforeDelete;
  static afterDelete;

  static hydrate(data: any, upsert?: boolean) {
    return hydrateModel(this, data, upsert);
  }

  static sync(opts: any = {}) {
    let force = typeof opts === "boolean" ? opts : opts.force ?? false;
    this._socketOptions = opts;

    if (force || (this._client && !this._socketSubscription)) {
      this._socketSubscription = this._client._socketSubject.subscribe((socket) => this.setupSocket(socket));
    }

    return this;
  }

  static get fieldsList() {
    if (!this.queryFields) {
      return;
    }

    const DataField = this._client.getModel("DataField");

    if (!this._fieldsList) {
      const query = this._fieldsIds ? { ids: this._fieldsIds } : { query: { scope: this.scope } };
      this._fieldsList = DataField.getList(query);
    }

    return this._fieldsList;
  }

  static setPrototypeFields(assignTo?: any) {
    const fields = this.getFields();
    const properties = Object.keys(fields)
      .filter((slug) => slug !== "_id")
      .reduce((final, slug) => {
        const field = fields[slug];
        if (!field || field.assign === false) {
          return final;
        }

        final[slug] = {
          enumerable: true,
          configurable: true,
          get: function () {
            return this.get(slug);
          },
          set(v) {
            return this.set(slug, v);
          },
        };

        return final;
      }, {});

    assignTo = assignTo ?? this.prototype;
    Object.defineProperties(assignTo, properties);
  }

  static getCustomFields() {
    return {};
  }

  static get(query: any, fetch: FetchOptions | boolean = true, cache?) {
    return getModelInstance(this, query, fetch, cache);
  }

  static getFields(cache = true) {
    if (cache && this._cachedFields) {
      return this._cachedFields;
    }

    if (!this._registeredAt || !this._client) {
      throw new Error(`Model ${this.scope} is not register. Please use Client.registerModel() before`);
    }

    let fields: any = {
      _id: new GraphandFieldId(),
      ...this._dataFields,
      ...this.schema,
    };

    if (this._defaultFields) {
      fields = {
        ...fields,
        createdBy: new GraphandFieldRelation({
          ref: "Account",
          multiple: false,
        }),
        createdAt: new GraphandFieldDate({
          time: true,
        }),
        updatedBy: new GraphandFieldRelation({
          ref: "Account",
          multiple: false,
        }),
        updatedAt: new GraphandFieldDate({
          time: true,
        }),
      };
    }

    const customFields = Object.keys(this._customFields).reduce((final, slug) => {
      const input = this._customFields[slug];
      const field = typeof input === "function" ? input(fields) : input;

      if (field && !(field instanceof GraphandField)) {
        console.warn(`Field ${slug} is not an instance of GraphandField`);
        return final;
      }

      final[slug] = field;
      return final;
    }, {});

    if (Object.keys(customFields).length) {
      Object.assign(fields, customFields);
    }

    this._cachedFields = fields;
    return fields;
  }

  static customField(slug, field) {
    this._customFields[slug] = field;
    return this;
  }

  static customFields(fields = {}) {
    this._customFields = fields;
    return this;
  }

  static get fields() {
    return this.getFields();
  }

  static async init(force = false) {
    if (!this._registeredAt || !this._client) {
      throw new Error(`Model ${this.scope} is not register. Please use Client.registerModel() before`);
    }

    if (this._initialized) {
      return;
    }

    Object.defineProperty(this, "name", { value: this.scope });

    if (force || !this._initPromise) {
      this._initPromise = new Promise(async (resolve, reject) => {
        try {
          if (this.queryFields) {
            await this._client.init();

            let fieldsList;
            if (this._client._options.subscribeFields) {
              fieldsList = await this.fieldsList;
              fieldsList.subscribe((list) => this.setDataFields(list));
            }

            if (this._client._options.project) {
              await this.setDataFields(fieldsList);
            }
          }

          this._cachedFields = null;
          this.setPrototypeFields();

          this._initialized = true;

          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    }

    return this._initPromise;
  }

  static async setDataFields(dataFields?: any) {
    dataFields = dataFields ?? (await this.getDataFields());
    const graphandFields = dataFields.map((field) => field.toGraphandField());
    this._dataFields = dataFields.reduce((final, field, index) => Object.assign(final, { [field.slug]: graphandFields[index] }), {});
    return this._dataFields;
  }

  static async getDataFields() {
    const query = this._fieldsIds ? { ids: this._fieldsIds } : { query: { scope: this.scope } };
    return await this._client.getModel("DataField").getList(query);
  }

  static setupSocket(socket?) {
    socket = socket || this._client?.socket;
    if (!socket || !socket.id) {
      return;
    }

    const path = "/models/" + this.scope;
    const trigger = async ({ action, payload }) => {
      if (!payload) {
        return;
      }

      if (typeof this._socketOptions?.handleSocketTrigger === "function") {
        const res = await this._socketOptions.handleSocketTrigger({ action, payload });
        if (res === false) {
          return;
        }
      }

      this._socketTriggerSubject.next({ action, payload });

      let updated;
      switch (action) {
        case "create":
          updated = this.upsertStore(payload.map((item) => new this(item)));
          break;
        case "update":
          updated = this.upsertStore(payload.map((item) => new this(item)));
          break;
        case "delete":
          updated = this.deleteFromStore(payload);
          break;
      }

      if (updated) {
        this.clearCache();
      }
    };

    socket.off(path);
    socket.on(path, trigger);
  }

  static async handleUpdateCall(payload) {
    return await this._client._axios.patch(this.baseUrl, payload);
  }

  static on(event, trigger, options: any = {}) {
    this._client.registerHook({ model: this, action: event, trigger, _await: options.await, ...options });
  }

  static unsync() {
    this._socketSubscription.unsubscribe();
    delete this._socketSubscription;
    this._listSubject.unsubscribe();
  }

  static reinit() {
    this._cache = {};
    return this.reinitStore();
  }

  static getCacheKey({ populate, sort, pageSize, page, translations, query, ids, count }) {
    return this.scope + JSON.stringify([populate || 0, sort || 0, pageSize || 0, page || 0, translations || 0, query || 0, ids || 0, !!count]);
  }

  static clearCache(query?, clean = false) {
    if (query) {
      const cacheKey = this.getCacheKey(query);
      if (this._cache[cacheKey]) {
        if (clean) {
          delete this._cache[cacheKey];
        } else {
          delete this._cache[cacheKey].request;
        }
      }
    } else {
      Object.keys(this._cache).forEach((cacheKey: any) => {
        if (clean) {
          delete this._cache[cacheKey];
        } else {
          delete this._cache[cacheKey].request;
        }
      });
    }

    if (clean) {
      this.reinitStore();
    }

    return this;
  }

  static clearRelationsCache() {
    const fields = this.getFields();
    Object.values(fields)
      .filter((field) => field instanceof GraphandFieldRelation)
      .forEach((field: any) => {
        const model = this._client.getModel(field.ref);
        if (model !== this) {
          model?.clearCache();
        }
      });
  }

  static reinitStore() {
    this._listSubject.next([]);

    return this;
  }

  static deleteFromStore(payload, force = false) {
    let refresh = false;
    const _delete = (list, item) => {
      const _id = typeof item === "string" ? item : item._id;
      const found = list.find((i) => i._id === _id);
      if (found) {
        refresh = true;
      }
      return [...list.filter((i) => i !== found)];
    };

    let _list: any = this.getList();
    if (Array.isArray(payload)) {
      payload.forEach((item) => (_list = _delete(_list, item)));
    } else {
      _list = _delete(_list, payload);
    }

    if (force || refresh) {
      this.clearRelationsCache();
      this._listSubject.next(_list);
      return true;
    }

    return false;
  }

  static upsertStore(payload, force = false) {
    let refresh = false;
    const _upsert = (list, item) => {
      const found = list.find((i) => i._id === item._id);

      if (!found) {
        refresh = true;
        return list.concat(item);
      }

      if (force || item.updatedAt > found.updatedAt) {
        refresh = true;
        found.assign(item._data, false, false);
        return list;
      }

      return list;
    };

    let _list = this.getList();
    if (Array.isArray(payload)) {
      payload.forEach((item) => (_list = _upsert(_list, item)));
    } else {
      _list = _upsert(_list, payload);
    }

    if (refresh) {
      this.clearRelationsCache();
      this._listSubject.next(_list);
      return true;
    }

    return false;
  }

  static getList(query?: any, opts: QueryOptions | boolean = true) {
    if (!query) {
      const list = this._listSubject.getValue();
      return new GraphandModelList({ model: this }, ...list);
    }

    return queryModel(this, query, opts);
  }

  static query(query: any, opts: QueryOptions | boolean = true) {
    return queryModel(this, query, opts);
  }

  static async fetch(query: any, opts: FetchOptions | boolean = true) {
    return fetchModel(this, query, opts);
  }

  static async count(query?: any, ...params): Promise<number> {
    if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    } else {
      query = parseQuery(query);
    }

    const { data } = await this._client._axios.post(`${this.baseUrl}/count`, query);
    return parseInt(data.data, 10);
  }

  static async create(payload, hooks = true, url = this.baseUrl) {
    return createModel(this, payload, hooks, url);
  }

  static refreshList() {
    this._listSubject.next(this.getList());
  }

  static async update(payload, options) {
    return updateModel(this, payload, options);
  }

  async update(payload: any, options) {
    options = Object.assign(
      {},
      {
        hooks: true,
        clearCache: false,
        preStore: false,
        upsert: undefined,
        revertOnError: undefined,
      },
      options,
    );

    options.upsert = options.upsert ?? !options.preStore;
    options.revertOnError = options.revertOnError ?? options.preStore;

    const constructor = this.constructor as any;

    // if (constructor.translatable && !payload.translations && constructor._client._project?.locales?.length) {
    //   payload.translations = constructor._client._project?.locales;
    // }

    if (constructor.translatable && payload.locale === undefined && this._locale) {
      payload.locale = this._locale;
    }

    if (options.hooks) {
      if ((await constructor.beforeUpdate?.call(constructor, payload, this)) === false) {
        return;
      }
    }

    const _id = payload._id || this._id;
    let backup = this.clone();

    if (options.preStore) {
      this.assign(payload.set);
    }

    if (this.isTemporary()) {
      console.warn("You tried to update a temporary document");
      return this;
    }

    try {
      await constructor.update(
        { ...payload, query: { _id } },
        {
          clearCache: options.clearCache,
          upsert: options.upsert,
          hooks: false,
        },
      );

      if (options.upsert) {
        this.assign(constructor.get(_id, false)?.raw, false);
      } else {
        this.assign(null, false);
      }

      if (options.hooks) {
        await constructor.afterUpdate?.call(constructor, constructor.get(_id), null, payload);
      }
    } catch (e) {
      if (options.revertOnError) {
        constructor.upsertStore(backup);
      }

      if (options.hooks) {
        await constructor.afterUpdate?.call(constructor, null, e, payload);
      }

      throw e;
    }

    return this;
  }

  static async delete(payload: GraphandModel | any, options) {
    return deleteModel(this, payload, options);
  }

  static get HistoryModel() {
    const modelName = `${this.scope}_history`;
    const parent = this;
    if (!this._client._models[modelName]) {
      const GraphandHistoryModel = require("./GraphandHistoryModel").default;
      const HistoryModel = class extends GraphandHistoryModel {
        static baseUrl = `${parent.baseUrl}/history`;
        static queryUrl = `${parent.baseUrl}/history`;

        static get scope() {
          return modelName;
        }
      };

      this._client.registerModel(HistoryModel, { name: modelName });
    }

    return this._client.models[modelName];
  }

  // constructor

  constructor(data: any = {}) {
    const { constructor } = Object.getPrototypeOf(this);

    if (!constructor._registeredAt || !constructor._client) {
      throw new Error(`Model ${constructor.scope} is not register. Please use Client.registerModel() before`);
    }

    if (!constructor._initialized) {
      console.warn(`Model ${constructor.scope} is not initialized yet. You should wait Model.init() berore create instances`);
    }

    if (data instanceof GraphandModel) {
      return data.clone();
    }

    this._id = data._id || `_${Date.now()}`;
    this._data = Object.assign({}, data);

    Object.defineProperty(this, "_data", { enumerable: false });
    Object.defineProperty(this, "_locale", { enumerable: false });
    Object.defineProperty(this, "_version", { enumerable: false });

    if (constructor.queryFields && constructor._client._options.subscribeFields) {
      constructor.init().then(() => constructor.fieldsList.subscribe(() => setTimeout(() => constructor.setPrototypeFields(this))));
    } else {
      constructor.setPrototypeFields(this);
    }
  }

  // getters

  get raw() {
    return this._data;
  }

  get _translations() {
    const { constructor } = Object.getPrototypeOf(this);

    const translations = this._data.translations ? Object.keys(this._data.translations) : [];
    return translations.concat(constructor._client._project?.defaultLocale);
  }

  get HistoryModel() {
    const { constructor } = Object.getPrototypeOf(this);
    const modelName = `${constructor.scope}_${this._id}_history`;
    const parent = this;
    if (!constructor._client._models[modelName]) {
      const GraphandHistoryModel = require("./GraphandHistoryModel").default;
      const HistoryModel = class extends GraphandHistoryModel {
        static baseUrl = `${constructor.baseUrl}/${parent._id}/history`;
        static queryUrl = `${constructor.baseUrl}/${parent._id}/history`;

        static get scope() {
          return modelName;
        }
      };

      constructor._client.registerModel(HistoryModel, { name: modelName });
    }

    return constructor._client.models[modelName];
  }

  // helpers

  populate(paths?) {
    const { constructor } = Object.getPrototypeOf(this);
    this._data = processPopulate(this._data, constructor.getFields(), constructor._client, paths);
    return this;
  }

  translate(locale) {
    const { constructor } = Object.getPrototypeOf(this);

    if (constructor.translatable) {
      this._locale = locale;
    }

    return this;
  }

  clone(locale?) {
    const { constructor } = Object.getPrototypeOf(this);
    const clone = new constructor(_.cloneDeep(this.raw));
    if (locale) {
      clone.translate(locale);
    }
    return clone;
  }

  get(slug, decode = false, _locale = this._locale, fallback = true) {
    const { constructor } = Object.getPrototypeOf(this);

    const field = constructor.getFields()[slug];
    if (!field) {
      return undefined;
    }

    let value = _.get(this._data, slug);

    if (constructor.translatable) {
      let locale = _locale || constructor._client.locale;
      if (locale && constructor._client._project?.locales?.includes(locale) && locale !== constructor._client._project.defaultLocale) {
        const translationValue = _.get(this._data, `translations.${locale}.${slug}`);
        value = fallback && translationValue !== undefined ? value : translationValue;
      }
    }

    if (value === undefined) {
      value = field.defaultValue;
    }

    if (field?.getter) {
      value = field.getter(value, this);
      if (decode && field?.setter) {
        value = field.setter(value, this);
      }
    }

    return value;
  }

  set(slug, value, upsert) {
    const { constructor } = Object.getPrototypeOf(this);

    const field = constructor.getFields()[slug];

    upsert = upsert ?? (field && !["_id", "createdAt", "createdBy", "updatedAt", "updatedBy"].includes(slug));

    if (field?.setter) {
      value = field.setter(value, this);
    }

    if (upsert) {
      return this.assign({ [slug]: value });
    } else {
      _.set(this._data, slug, value);
    }

    return this;
  }

  assign(values?, upsert = true, updatedAtNow = true) {
    const { constructor } = Object.getPrototypeOf(this);
    const clone = this.clone();

    if (updatedAtNow) {
      clone.updatedAt = new Date();
    }

    if (upsert) {
      if (values) {
        Object.keys(values).forEach((key) => {
          clone.set(key, values[key], false);
        });
      }

      constructor.upsertStore(clone);
    }

    if (values) {
      Object.keys(values).forEach((key) => {
        this.set(key, values[key], false);
      });
    }

    if (updatedAtNow) {
      this.updatedAt = clone.updatedAt;
    }

    return this;
  }

  createObservable() {
    const { constructor } = Object.getPrototypeOf(this);
    this._observable = new Observable((subscriber) => {
      let prev = this.clone();
      this._storeSub = constructor._listSubject.subscribe((_list) => {
        setTimeout(async () => {
          const item = prev.isTemporary() ? _list.find((i) => i._id === prev._id) : await constructor.get(prev._id);
          if (!item || !isEqual(item.raw, prev.raw)) {
            if (item) {
              prev = item.clone();
            }
            subscriber.next(item);
          }
        });
      });
    });
  }

  subscribe(...args) {
    if (!this._observable) {
      this.createObservable();
    }

    const sub = this._observable.subscribe(...args);
    this._subscriptions.add(sub);
    const unsubscribe = sub.unsubscribe;
    sub.unsubscribe = () => {
      unsubscribe.apply(sub);
      this._subscriptions.delete(sub);

      if (!this._subscriptions.size) {
        this._storeSub?.unsubscribe();
        delete this._observable;
      }
    };

    sub.next(this);
    return sub;
  }

  isTemporary() {
    return this._id.startsWith("_");
  }

  reloadFields() {
    const { constructor } = Object.getPrototypeOf(this);

    constructor.setPrototypeFields(this);
  }

  delete(options) {
    const constructor = this.constructor as any;
    return constructor.delete(this, options);
  }

  encodeQuery() {
    return this._id;
  }

  refresh() {
    const { constructor } = Object.getPrototypeOf(this);
    const newItem = constructor.get(this._id, false);
    this.assign(newItem, false);
    return this;
  }

  // serialization

  serialize() {
    const { constructor } = Object.getPrototypeOf(this);

    return { __type: "GraphandModel", __scope: constructor.scope, __payload: this._data };
  }

  static async serializeModel(clearCache = false) {
    const dataFields = await this.getDataFields();
    return JSON.stringify({
      fieldsIds: this._fieldsIds,
      fields: dataFields?.toJSON(),
    });
  }

  static rebuildModel(serial) {
    if (!this._registeredAt || !this._client) {
      throw new Error(`Model ${this.scope} is not register. Please use Client.registerModel() before`);
    }

    const DataField = this._client.getModel("DataField");

    const { fields, fieldsIds } = JSON.parse(serial);
    this._fieldsIds = fieldsIds;

    const dataFields = fields.map((f) => DataField.hydrate(f));
    this.setDataFields(dataFields);
  }

  static async serializeFromId(_id) {
    await this.init();

    const [res, modelSerial] = await Promise.all([this.fetch(_id).then((r) => JSON.stringify(r.data.data)), this.serializeModel()]);

    return {
      res,
      modelSerial,
    };
  }

  static rebuildFromSerial(serial) {
    const { res, modelSerial } = serial;

    this.rebuildModel(modelSerial);
    const data = JSON.parse(res);
    return this.hydrate(data);
  }

  // format

  toObject() {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.getFields();
    return Object.keys(fields).reduce((final, slug) => Object.assign(final, { [slug]: this.get(slug) }), {});
  }

  toJSON() {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.getFields();
    return Object.keys(fields).reduce((final, slug) => Object.assign(final, { [slug]: this.get(slug, true) }), {});
  }

  toString() {
    return this._id;
  }

  toPromise() {
    const { constructor } = Object.getPrototypeOf(this);
    return constructor.get(this._id).toPromise();
  }
}

export default GraphandModel;
