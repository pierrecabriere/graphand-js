import isEqual from "fast-deep-equal";
import _ from "lodash";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import Client from "../Client";
import Account from "../models/Account";
import createModel from "../utils/createModel";
import extendableMember from "../utils/decorators";
import deleteModel from "../utils/deleteModel";
import { FetchOptions } from "../utils/fetchModel";
import getModelInstance from "../utils/getModelInstance";
import getModelList, { ModelListOptions } from "../utils/getModelList";
import hydrateModel from "../utils/hydrateModel";
import parseQuery from "../utils/parseQuery";
import { processPopulate } from "../utils/processPopulate";
import updateModel, { updateModelInstance } from "../utils/updateModel";
import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldId from "./fields/GraphandFieldId";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandField from "./GraphandField";
import GraphandModelList from "./GraphandModelList";
import GraphandModelPromise from "./GraphandModelPromise";

interface Query {
  query?: any;
  ids?: string[];
  sort?: string | any;
  page?: number;
  pageSize?: number;
}

class AbstractGraphandModel {
  static __proto__: any;
}

/**
 * @class GraphandModel
 */
class GraphandModel extends AbstractGraphandModel {
  /**
   * Model fetching options
   * @typedef Query
   * @property query {Object=} - A mongo query, cf. graphand API documentation
   * @property ids {string[]=} - A list of ids to query
   * @property sort {string|Object=}
   * @property page {number=}
   * @property pageSize {number=}
   */

  /**
   * Model fetching options
   * @typedef FetchOptions
   * @property cache {boolean}
   * @property hooks {boolean}
   * @property authToken {string}
   * @property global {boolean}
   * @property axiosOpts {AxiosRequestConfig}
   */

  /**
   * Model getList options
   * @typedef ModelListOptions
   * @property fetch {FetchOptions|boolean}
   * @property cache {boolean}
   */

  // configurable fields
  static translatable = true;
  static queryFields = false;
  static baseUrl = null;
  static queryUrl = null;
  static schema = {};
  static scope = "GraphandModelAbstract";
  static defaultFields = true;
  static initialize?: () => any;

  /** @member {Client} */
  @extendableMember()
  static _client: Client;
  @extendableMember()
  static _socketSubscription;
  @extendableMember()
  static _fieldsIds;
  @extendableMember(() => ({}))
  static _dataFields;
  @extendableMember(() => ({}))
  static _cache;
  @extendableMember()
  static _initialized;
  @extendableMember()
  static _dataFieldsList;
  @extendableMember()
  static _registeredAt;
  @extendableMember(() => new Set())
  static _observers;
  @extendableMember(() => new Subject())
  static _socketTriggerSubject;
  @extendableMember()
  static _initPromise;
  @extendableMember(() => new BehaviorSubject([]))
  static _listSubject;
  @extendableMember(() => ({}))
  static _socketOptions;
  @extendableMember(() => ({}), (a, b) => ({ ...a, ...b }))
  static _customFields;
  @extendableMember()
  static _cachedFields;
  @extendableMember(() => ({}))
  static _hooks;
  @extendableMember(() => new Set())
  static _queryIds;
  @extendableMember()
  static _queryIdsTimeout;

  _data: any = {};
  _locale = null;
  _version = 1;
  _observable;
  _storeSub;
  _subscriptions = new Set();

  _id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Account;
  updatedBy: Account;

  static _universalPrototypeMethods = [];

  /**
   * Hydrate GraphandModel or GraphandModelList from serialized data
   * @param data {any} - Serialized data
   * @param upsert {boolean} - Upsert hydrated data in store
   * @returns {GraphandModel|GraphandModelList}
   */
  static hydrate(data: any, upsert?: boolean) {
    return hydrateModel(this, data, upsert);
  }

  /**
   * Description of the function
   * @callback GraphandModel.sync.handleSocketTrigger
   * @params opts {Object}
   * @param opts.action {string} Action
   * @param opts.payload {string} Payload
   * @returns {boolean|void}
   */

  /**
   * Sync the current Model with the client socket
   * @param opts {Object}
   * @param opts.handleSocketTrigger {GraphandModel.sync.handleSocketTrigger} - middleware to allow or disallow the model to proceed data when receiving on socket
   * @param opts.force {boolean} - force Model to resubscribe on socket (even if already subscribed)
   */
  static sync(opts: { handleSocketTrigger?: ({ action, payload }) => boolean | void; force?: boolean } = {}) {
    let force = typeof opts === "boolean" ? opts : opts.force ?? false;
    this._socketOptions = opts;

    if (force || (this._client && !this._socketSubscription)) {
      this._socketSubscription = this._client._socketSubject.subscribe((socket) => this.setupSocket(socket));
    }

    return this;
  }

  /**
   * Returns the DataField list of the model
   * @member {GraphandModelList}
   */
  static get dataFieldsList() {
    if (!this.queryFields) {
      return;
    }

    const DataField = this._client.getModel("DataField");

    if (!this._dataFieldsList) {
      const query = this._fieldsIds && !this._client._options.subscribeFields ? { ids: this._fieldsIds } : { query: { scope: this.scope } };
      this._dataFieldsList = DataField.getList(query);
    }

    return this._dataFieldsList;
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

  /**
   * Returns a GraphandModel (or Promise) of the model
   * @param query {string|Query} - the requested _id or the request query (see api doc)
   * @param opts
   * @returns {GraphandModel|GraphandModelPromise}
   */
  static get<T extends FetchOptions | boolean>(query: string | Query, fetch?: T, cache?): T extends false ? GraphandModel : GraphandModelPromise {
    return getModelInstance(this, query, fetch, cache);
  }

  static getFields(cache = true) {
    if (cache && this._cachedFields) {
      return this._cachedFields;
    }

    if (!this._registeredAt || !this._client) {
      throw new Error(`Model ${this.scope} is not registered. Please use Client.registerModel() before`);
    }

    let fields: any = {
      _id: new GraphandFieldId(),
      ...this._dataFields,
      ...this.schema,
    };

    if (this.defaultFields) {
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

  /**
   * Add a custom field to Model
   * @param slug {string} - The field identifier
   * @param field {GraphandField} - The GraphandField instance
   */
  static customField(slug, field) {
    this._customFields[slug] = field;
    return this;
  }

  /**
   * Add multiple customFields
   * @param fields {Object.<string, number>} - example: { customField: new GraphandFieldText() }
   */
  static customFields(fields = {}) {
    this._customFields = fields;
    return this;
  }

  static get fields() {
    return this.getFields();
  }

  static async _init(force = false) {
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
            await this._client._init();

            if (this._client._options.subscribeFields) {
              await new Promise<void>((resolve) => {
                this.dataFieldsList.subscribe((list) => {
                  this.setDataFields(list);
                  resolve();
                });
              });
            } else if (this._client._options.project) {
              await this.setDataFields();
            }
          }

          this._cachedFields = null;
          this.setPrototypeFields();

          if (this.initialize) {
            await this.initialize();
          }

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
    dataFields = dataFields ?? (await this.dataFieldsList);
    const graphandFields = dataFields.map((field) => field.toGraphandField());
    this._dataFields = dataFields.reduce((final, field, index) => Object.assign(final, { [field.slug]: graphandFields[index] }), {});
    this._cachedFields = null;
    return this._dataFields;
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

  /**
   * Description of the function
   * @callback GraphandModel.on.handler
   * @params payload {Object} - The payload sent by the server
   * @param resolve {string} - Callback to resolve the handler and validate the sockethook workflow
   * @param reject {string} - Callback to reject the handler and put error in the sockethook workflow
   * @returns {*|void}
   */

  /**
   * Register a new sockethook on the model (need admin token)
   * @param event {string} - The event that will trigger the sockethook
   * @param handler {GraphandModel.on.handler}
   * @param options
   */
  static on(event, handler, options: any = {}) {
    this._client.registerHook({ model: this, action: event, handler, _await: options.await, ...options });
  }

  static unsync() {
    this._socketSubscription.unsubscribe();
    delete this._socketSubscription;
    this._listSubject.unsubscribe();
  }

  /**
   * Reinitialize the model (clear cache & empty store)
   */
  static reinit() {
    this._cache = {};
    return this.reinitStore();
  }

  static getCacheKey({ populate, sort, pageSize, page, translations, query, ids, count }) {
    return this.scope + JSON.stringify([populate || 0, sort || 0, pageSize || 0, page || 0, translations || 0, query || 0, ids || 0, !!count]);
  }

  /**
   * Clear the local cache for the model
   * @param query {any} - If specified, clear only the cache for this query
   * @param clean {boolean} - Default false. If true, the local model store will be reinitialized
   */
  static clearCache(query?, clean = false) {
    if (query) {
      const cacheKey = this.getCacheKey(query);
      delete this._cache[cacheKey];
    } else {
      this._cache = {};
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
        if (field.ref !== this.scope) {
          const model = this._client.getModel(field.ref);
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
      // this.clearRelationsCache();
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
      // this.clearRelationsCache();
      this._listSubject.next(_list);
      return true;
    }

    return false;
  }

  /**
   * Returns a GraphandModelList (or Promise) of the model
   * @param query {Query} - the request query (see api doc)
   * @param opts
   * @returns {GraphandModelList|GraphandModelListPromise}
   */
  static getList(query?: undefined, opts?: ModelListOptions | boolean): GraphandModelList;
  static getList(query: Query, opts?: ModelListOptions | boolean): GraphandModelList | GraphandModelPromise {
    if (!query) {
      const list = this._listSubject.getValue();
      return new GraphandModelList({ model: this }, ...list);
    }

    return getModelList(this, query, opts);
  }

  static query(query: any, opts: ModelListOptions | boolean = true) {
    return getModelList(this, query, opts);
  }

  /**
   * Returns a Promise that resolves the number of results for the given query
   * @param query {Query} - the request query (see api doc)
   * @returns {number}
   */
  static async count(query?: Query): Promise<number> {
    if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    }

    query = parseQuery(query);

    const { data } = await this._client._axios.post(`${this.baseUrl}/count`, query);
    return parseInt(data.data, 10);
  }

  /**
   * Create and persist a new instance of the model
   * @param payload {Object|Object[]} - The payload to persist in a new instance. You can profite an array to create multiple instances
   * @param hooks {boolean} - Enable or disable hooks, default true
   * @returns {GraphandModel}
   */
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
    await updateModelInstance(this, payload, options);
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

  /**
   * Create a new instance of GraphandModel. If getting an instance as data, the instance will be cloned
   * @param data {*}
   * @return {GraphandModel}
   */
  constructor(data: any = {}) {
    super();

    const { constructor } = Object.getPrototypeOf(this);

    if (!constructor._registeredAt || !constructor._client) {
      throw new Error(`Model ${constructor.scope} is not register. Please use Client.registerModel() before`);
    }

    if (!constructor._initialized) {
      console.warn(`Model ${constructor.scope} is not initialized yet. You should wait Model._init() before call constructor`);
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
      constructor._init().then(() => constructor.dataFieldsList.subscribe(() => setTimeout(() => constructor.setPrototypeFields(this))));
    } else {
      constructor.setPrototypeFields(this);
    }
  }

  // getters

  /**
   * Returns raw data of instance
   * @returns {*}
   */
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

  /**
   * Clone the instance
   * @param locale
   */
  clone(locale?) {
    const { constructor } = Object.getPrototypeOf(this);
    const clone = new constructor(_.cloneDeep(this.raw));
    if (locale) {
      clone.translate(locale);
    }
    return clone;
  }

  /**
   * Model instance getter. Returns the value for the specified key
   * @param slug {string} - The key (field slug) to get
   * @param decode {boolean=false}
   * @param _locale
   * @param fallback
   */
  get(slug, decode = false, _locale = this._locale, fallback = true) {
    const { constructor } = Object.getPrototypeOf(this);

    const field = constructor.fields[slug];
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

  /**
   * Model instance setter. Set value for the specified key
   * @param slug {string} - The key (field slug) to get
   * @param value {*}
   * @param upsert - Define if the setter will trigger a store upsertion action
   */
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

  /**
   * Subscribe to the instance. The callback will be called each time the instance is updated in store.
   * If the model is synced (realtime), the callback will be called when the instance is updated via socket
   * @param callback - The function to call when the instance is updated
   */
  subscribe(callback) {
    if (!this._observable) {
      this.createObservable();
    }

    const sub = this._observable.subscribe(callback);
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

  getInvertedRelation(model: typeof GraphandModel, query, opts, ...args) {
    const { constructor } = Object.getPrototypeOf(this);
    model = typeof model === "string" ? constructor._client.getModel(model) : model;
    query = typeof query === "object" ? query : { [query]: this._id };
    return model.getList({ ...opts, query }, ...args);
  }

  // serialization

  /**
   * Serialize instance. Serialized data could be hydrated with GraphandModel.hydrate
   * @returns {Object}
   */
  serialize() {
    const { constructor } = Object.getPrototypeOf(this);

    return { __type: "GraphandModel", __scope: constructor.scope, __payload: this._data };
  }

  static async serializeModel(clearCache = false) {
    const dataFields = await this.dataFieldsList;
    return JSON.stringify({
      fieldsIds: this._fieldsIds,
      fields: dataFields?.toJSON(),
    });
  }

  static rebuildModel(serial) {
    // if (!this._registeredAt || !this._client) {
    //   throw new Error(`Model ${this.scope} is not register. Please use Client.registerModel() before`);
    // }
    //
    // const DataField = this._client.getModel("DataField");
    //
    // const { fields, fieldsIds } = JSON.parse(serial);
    // this._fieldsIds = fieldsIds;
    //
    // const dataFields = fields.map((f) => DataField.hydrate(f));
    // this.setDataFields(dataFields);
  }

  static async serializeFromId(_id) {
    await this._init();

    const [obj, modelSerial] = await Promise.all([this.get(_id), this.serializeModel()]);

    return {
      res: obj.serialize(),
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

  /**
   * Returns JSON-serialized object
   * @return {Object}
   */
  toJSON() {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.getFields();
    return Object.keys(fields).reduce((final, slug) => {
      return Object.assign(final, { [slug]: this.get(slug, true) });
    }, {});
  }

  toString() {
    return this._id;
  }

  toPromise() {
    const { constructor } = Object.getPrototypeOf(this);
    return constructor.get(this._id).toPromise();
  }

  static async execHook(event: string, args: any) {
    const hook = this.getHook(event);
    if (!hook?.length) {
      return;
    }

    return Promise.all(hook.map((fn) => fn.apply(this, args)));
  }

  static getHook(event) {
    const hook = this._hooks[event] ? [...this._hooks[event]] : [];

    if ("getHook" in super.__proto__) {
      return hook.concat(super.__proto__.getHook(event));
    }

    return hook;
  }

  static hook(event, callback) {
    this._hooks[event] = this._hooks[event] || new Set();
    this._hooks[event].add(callback);
  }
}

export default GraphandModel;
