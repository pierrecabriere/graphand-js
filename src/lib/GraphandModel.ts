import { ObjectID } from "bson";
import isEqual from "fast-deep-equal";
import _ from "lodash";
import { Observable } from "rxjs";
import Client from "../Client";
import Account from "../models/Account";
import { getPopulatedPaths } from "../utils/getPopulatedPaths";
import parseQuery from "../utils/parseQuery";
import { processPopulate } from "../utils/processPopulate";
import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldId from "./fields/GraphandFieldId";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandModelList from "./GraphandModelList";
import GraphandModelListPromise from "./GraphandModelListPromise";
import GraphandModelPromise from "./GraphandModelPromise";

class GraphandModel {
  // configurable fields
  static translatable = true;
  static queryFields = false;
  static baseUrl = null;
  static queryUrl = null;
  static schema = {};
  static scope = "GraphandModelAbstract";

  protected static _client: Client;
  protected static _socketSubscription;
  protected static _fieldsIds = null;
  protected static _dataFields = {};
  protected static _cache;
  protected static _initialized = false;
  protected static _fieldsList = null;
  protected static _registeredAt;
  protected static _observers;
  protected static _socketTriggerSubject;
  protected static _initPromise;
  protected static _listSubject;
  protected static _defaultFields = true;
  protected static _socketOptions;
  protected static _queryIds = new Set();
  protected static _queryIdsTimeout;

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

  static hydrate(data: any, fields?) {
    data = data ?? {};

    const Model = data.__scope ? this._client.getModel(data.__scope) : this;

    switch (data.__type) {
      case "GraphandModelList":
        return GraphandModelList.hydrate(data, Model);
      case "GraphandModel":
        return new Model(data.__payload, fields);
      default:
        break;
    }

    if (Array.isArray(data)) {
      const list = data.map((i) => new this(i));
      return new GraphandModelList({ model: this }, ...list);
    }

    return new this(data);
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
    const fields = this.fields;
    const properties = Object.keys(fields)
      .filter((slug) => slug !== "_id")
      .reduce((final, slug) => {
        const field = fields[slug];
        if (field.assign === false) {
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

  static get(query, fetch = true, cache?) {
    if (!query) {
      return new GraphandModelPromise(async (resolve, reject) => {
        try {
          await this.init();
          const res = await this.fetch(null);
          const _id = (res.data.data.rows && res.data.data.rows[0] && res.data.data.rows[0]._id) || res.data.data._id;
          resolve(this.get(_id, false));
        } catch (e) {
          reject(e);
        }
      }, this);
    }

    let _id;
    if (query instanceof GraphandModel) {
      _id = query._id;
      cache = cache ?? true;
    } else if (typeof query === "string") {
      _id = query;
      cache = cache ?? true;
    } else if (typeof query === "object" && query.query?._id && typeof query.query._id === "string") {
      _id = query.query._id;
      cache = cache ?? Object.keys(query).length === 1;
    } else {
      cache = cache ?? true;
    }

    const item = cache && _id && this.getList().find((item) => item._id === _id);

    if (!item && fetch) {
      return new GraphandModelPromise(
        async (resolve, reject) => {
          try {
            await this.init();
            const { data } = await this.fetch(query, { cache });
            let row;

            if (data.data) {
              if (data.data.rows) {
                if (_id) {
                  row = data.data.rows.find((row) => row._id === _id);
                } else {
                  row = data.data.rows[0];
                }
              } else {
                row = data.data;
              }
            }

            if (row?._id) {
              let item;

              if (cache) {
                item = this.get(row?._id, false);
              }

              item = item || new this(row);

              return resolve(item);
            }

            return resolve(null);
          } catch (e) {
            reject(e);
          }
        },
        this,
        query,
      );
    }

    return item;
  }

  static get fields() {
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
          name: "Créé par",
          ref: "Account",
          multiple: false,
        }),
        createdAt: new GraphandFieldDate({
          name: "Créé à",
          time: true,
        }),
        updatedBy: new GraphandFieldRelation({
          name: "Modifié par",
          ref: "Account",
          multiple: false,
        }),
        updatedAt: new GraphandFieldDate({
          name: "Modifié à",
          time: true,
        }),
      };
    }

    return fields;
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

            if (this._client._options.subscribeFields) {
              this.fieldsList.subscribe(async (list) => {
                const graphandFields = await Promise.all(list.map((field) => field.toGraphandField()));
                const fields = list.reduce((fields, field, index) => Object.assign(fields, { [field.slug]: graphandFields[index] }), {});
                if (!isEqual(this._dataFields, fields)) {
                  this._dataFields = fields;
                  this.setPrototypeFields();
                }
              });
            }

            if (this._client._options.project) {
              await this.setDataFields();
            }
          }

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

      // setTimeout(() => {
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
      // });
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
    const fields = this.fields;
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
        return list.map((i) => (i === found ? item : i));
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

  static updateStore(target, payload) {
    const _update = (_list, item, payload) => {
      const found = _list.find((i) => i._id === item._id);
      if (found) {
        return _list.map((i) => {
          if (i === found) {
            Object.assign(i, payload);
          }

          return i;
        });
      }

      return _list;
    };

    let list = _update(this.getList(), target, payload);

    if (!isEqual(this.getList(), list)) {
      this.clearRelationsCache();
      this._listSubject.next(list);
      return true;
    }

    return false;
  }

  static getList(query?: any) {
    if (!query) {
      const list = this._listSubject.getValue();
      return new GraphandModelList({ model: this }, ...list);
    }

    return this.query.apply(this, arguments);
  }

  static query(query: any, opts: { fetch: boolean; cache: boolean } | boolean = true): GraphandModelList | GraphandModelListPromise {
    if (Array.isArray(query)) {
      query = { ids: query };
    }

    const defaultOptions = { fetch: true, cache: true };
    opts = Object.assign({}, defaultOptions, typeof opts === "object" ? opts : { fetch: opts });

    const { fetch, cache } = opts;

    let list;
    let mapIds;

    if (query.ids) {
      if (query.ids instanceof GraphandModelList || query.ids instanceof GraphandModelListPromise) {
        query.ids = query.ids.ids;
      } else if (query.ids instanceof GraphandModel || query.ids instanceof GraphandModelPromise) {
        query.ids = [query.ids._id];
      } else if (typeof query.ids === "string") {
        query.ids = [query.ids];
      }

      if (cache && "ids" in query && Object.keys(query).length === 1) {
        mapIds = query.ids;
        const cacheList = query.ids.map((_id) => this.get(_id, false));
        if (cacheList.every(Boolean)) {
          list = new GraphandModelList({ model: this, count: cacheList.length, query }, ...cacheList);
        }
      }
    }

    if (!list && fetch) {
      return new GraphandModelListPromise(
        async (resolve) => {
          try {
            await this.init();

            let graphandList;
            const { data } = await this.fetch(query, { cache });
            const storeList = this._listSubject.getValue();
            if (mapIds) {
              const _list = mapIds?.map((_id) => storeList.find((item) => item._id === _id)).filter((r) => r) || [];
              graphandList = new GraphandModelList({ model: this, count: mapIds.length, query }, ..._list);
            } else {
              const _list = data.data.rows?.map((row) => storeList.find((item) => item._id === row._id)).filter((r) => r) || [];
              graphandList = new GraphandModelList({ model: this, count: data.data.count, query }, ..._list);
            }

            return resolve(graphandList);
          } catch (e) {
            console.error(e);
            return resolve(new GraphandModelList({ model: this, query }));
          }
        },
        this,
        query,
      );
    }

    return list;
  }

  static _handleRequestResult(data, query) {
    const populatedPaths = getPopulatedPaths(query.populate);

    let _rows = data?.rows ? data.rows : data?._id ? [data] : [];
    if (populatedPaths?.length) {
      const fields = this.fields;
      _rows.forEach((_row) => processPopulate(_row, fields, this._client, populatedPaths));
    }

    const rows = _rows.map((item) => {
      const found = item?._id && this.get(item._id, false);
      if (!found) {
        return new this(item);
      }

      found.assign(item);
      return found;
    });

    this.upsertStore(rows);

    return rows;
  }

  static async _request(query, hooks, cacheKey?) {
    let res;

    try {
      const isSimpleQuery = typeof query?.query?._id === "string" && Object.keys(query.query).length === 1;
      if (isSimpleQuery) {
        const {
          query: { _id },
          ...params
        } = query;
        const url = `${this.baseUrl}/${_id}`;
        res = await this._client._axios.get(url, { params });
      } else {
        const url = this.queryUrl || `${this.baseUrl}/query`;
        res = await this._client._axios.post(url, query);
      }

      this._handleRequestResult(res.data.data, query);
    } catch (e) {
      delete this._cache[cacheKey];

      if (hooks) {
        await this.afterQuery?.call(this, query, null, e);
      }

      throw e;
    }

    if (cacheKey) {
      this._cache[cacheKey] = this._cache[cacheKey] || {};
      this._cache[cacheKey].previous = res;
    }

    if (hooks) {
      await this.afterQuery?.call(this, query, res);
    }

    return res;
  }

  static async fetch(query: any, opts: boolean | any = true) {
    query = parseQuery(query);

    const defaultOptions = {
      cache: true,
      callback: undefined,
      hooks: true,
      sync: false,
    };

    opts = Object.assign({}, defaultOptions, typeof opts === "object" ? opts : { cache: opts ?? defaultOptions.cache });
    const { cache, callback, hooks } = opts;

    if (cache && typeof query === "object" && "ids" in query) {
      if (this._client._options.mergeQueries && Object.keys(query).length === 1 && this._queryIds.size + query.ids.length < 100) {
        if (this._queryIdsTimeout) {
          clearTimeout(this._queryIdsTimeout);
        }

        query.ids.forEach(this._queryIds.add, this._queryIds);
        await new Promise((resolve) => setTimeout(resolve));
        query = { ids: [...this._queryIds] };
      }

      if (Object.keys(query).length === 1 && Object.keys(query.ids).length === 1) {
        query = { query: { _id: query.ids[0] } };
      }
    } else if (typeof query === "string") {
      query = { query: { _id: query } };
    }

    // if (this.translatable && !query.translations && this._client._project?.locales?.length) {
    //   query.translations = this._client._project?.locales;
    // }

    if (hooks) {
      await this.beforeQuery?.call(this, query);
    }

    if (!cache) {
      return await this._request(query, hooks);
    }

    let res;
    const cacheKey = this.getCacheKey(query);
    const cacheEntry = this._cache[cacheKey];

    try {
      if (!cacheEntry) {
        this._cache[cacheKey] = {
          previous: null,
          request: this._request(query, hooks, cacheKey),
        };

        res = await this._cache[cacheKey].request;
        callback?.call(callback, res);
      } else {
        if (cacheEntry.previous) {
          callback?.call(callback, cacheEntry.previous);
        }

        if (!cacheEntry.request) {
          cacheEntry.request = this._request(query, hooks, cacheKey);
        }

        res = await cacheEntry.request;
      }
    } catch (e) {
      if (e.data) {
        res = e.response;
      } else {
        throw e;
      }

      if (e.graphandErrors) {
        console.error(e.graphandErrors);
      }
    }

    this._queryIdsTimeout = setTimeout(() => (this._queryIds = new Set()));
    callback?.call(callback, res);

    return res;
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
    await this.init();

    const config = { params: {} };

    if (payload.locale && this._client._project && payload.locale === this._client._project.defaultLocale) {
      delete payload.locale;
    }

    const args = { payload, config };

    if (hooks) {
      if ((await this.beforeCreate?.call(this, args)) === false) {
        return;
      }
    }

    let inserted;
    try {
      args.payload = parseQuery(args.payload);
      const req = this._client._axios.post(url, args.payload, args.config).then(async (res) => {
        const { data } = res.data;
        const inserted = Array.isArray(data) ? data.map((i) => new this(i)) : data ? new this(data) : data;

        this.clearCache();
        this.upsertStore(inserted, true);

        if (hooks) {
          await this.afterCreate?.call(this, inserted, null, args);
        }

        return inserted;
      });

      const middlewareData = await this.middlewareCreate?.call(this, args, req);
      if (middlewareData !== undefined) {
        return middlewareData;
      }
      inserted = await req;
    } catch (e) {
      if (hooks) {
        await this.afterCreate?.call(this, null, e, args);
      }

      throw e;
    }

    return inserted;
  }

  static refreshList() {
    this._listSubject.next(this.getList());
  }

  static async update(payload, options) {
    await this.init();

    options = Object.assign(
      {},
      {
        hooks: true,
        clearCache: true,
        upsert: true,
      },
      options,
    );

    // if (this.translatable && !payload.translations && this._client._project?.locales?.length) {
    //   payload.translations = this._client._project?.locales;
    // }

    if (payload.locale && payload.locale === this._client._project?.defaultLocale) {
      delete payload.locale;
    }

    if (options.hooks) {
      if ((await this.beforeUpdate?.call(this, payload)) === false) {
        return;
      }
    }

    try {
      payload = parseQuery(payload);
      const { data } = await this.handleUpdateCall(payload);

      if (!data) {
        return data;
      }

      const items = data.data.rows.map((item) => new this(item));

      if (options.upsert) {
        const upserted = this.upsertStore(items);

        if (upserted) {
          this.clearCache();

          items.forEach((item) => item.HistoryModel.clearCache());
        }
      }

      if (options.hooks) {
        await this.afterUpdate?.call(this, items, null, payload);
      }

      return items;
    } catch (e) {
      if (options.hooks) {
        await this.afterUpdate?.call(this, null, e, payload);
      }

      throw e;
    }
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
    await this.init();

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
      if ((await this.beforeDelete?.call(this, args)) === false) {
        return;
      }
    }

    if (payload instanceof GraphandModel) {
      try {
        const { _id } = payload;
        await this._client._axios.delete(`${this.baseUrl}/${_id}`);

        if (options.updateStore) {
          const updated = this.deleteFromStore(payload);

          if (updated) {
            this.clearCache();
          }
        }

        if (options.hooks) {
          await this.afterDelete?.call(this, args);
        }
      } catch (e) {
        this.upsertStore(payload);

        if (options.hooks) {
          await this.afterDelete?.call(this, args, e);
        }

        throw e;
      }
    } else {
      try {
        payload = parseQuery(payload);

        // @ts-ignore
        const { data } = await this._client._axios.delete(this.baseUrl, { _data: payload });

        if (!data) {
          return;
        }

        const ids = data.data.ids;

        if (options.updateStore) {
          const updated = this.deleteFromStore(ids);

          if (updated) {
            this.clearCache();
          }
        }

        if (options.hooks) {
          await this.afterDelete?.call(this, args);
        }
      } catch (e) {
        if (options.hooks) {
          await this.afterDelete?.call(this, args, e);
        }

        throw e;
      }
    }

    return true;
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

    this._id = data._id || `_${new ObjectID().toString()}`;
    this._data = Object.assign({}, data);

    Object.defineProperty(this, "_data", { enumerable: false });
    Object.defineProperty(this, "_locale", { enumerable: false });
    Object.defineProperty(this, "_version", { enumerable: false });

    if (constructor.queryFields && constructor._client._options.subscribeFields) {
      constructor.init().then(() => constructor.fieldsList.subscribe(() => constructor.setPrototypeFields(this)));
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
    this._data = processPopulate(this._data, constructor.fields, constructor._client, paths);
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
    clone._version = this._version;
    return clone;
  }

  get(slug, decode = false, _locale = this._locale, fallback = true) {
    const { constructor } = Object.getPrototypeOf(this);

    // const fields = constructor.getFields(this);
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

  set(slug, value, upsert) {
    const { constructor } = Object.getPrototypeOf(this);

    const field = constructor.fields[slug];

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
    if (values) {
      Object.keys(values).forEach((key) => {
        clone.set(key, values[key], false);
      });
    }

    if (updatedAtNow) {
      clone.updatedAt = new Date();
    }

    if (upsert) {
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
          if (!item || item._version > prev._version || !isEqual(item.raw, prev.raw)) {
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
      fields: dataFields.toJSON(),
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
    const fields = constructor.fields;
    return Object.keys(fields).reduce((final, slug) => Object.assign(final, { [slug]: this.get(slug) }), {});
  }

  toJSON() {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.fields;
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
