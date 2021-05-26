import isEqual from "fast-deep-equal";
import _ from "lodash";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import Client from "../Client";
import serialize from "../utils/serialize";
import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldId from "./fields/GraphandFieldId";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandModelList from "./GraphandModelList";
import GraphandModelListPromise from "./GraphandModelListPromise";
import GraphandModelPromise from "./GraphandModelPromise";
import ModelObserver from "./ModelObserver";

class GraphandModel {
  // configurable fields
  static translatable = true;
  static queryFields = false;
  static baseUrl = null;
  static queryUrl = null;
  static baseFields = {};
  static scope = null;

  // protected static fields
  protected static _client: Client;
  protected static _socketSubscription;
  protected static _fieldsIds = null;
  protected static _fields = {};
  protected static _cache;
  protected static _fieldsSubscription = null;
  protected static _initialized = false;
  protected static _fieldsObserver;
  protected static _registeredAt;
  protected static _observers;
  protected static _socketTriggerSubject;
  protected static _initPromise;
  protected static _listSubject;
  protected static _defaultFields = true;

  // private fields
  private _data: any = {};
  private _locale = null;
  private _version = 1;
  private _fields = {};

  // other fields
  _id: string;
  createdAt: Date;
  updatedAt: Date;

  static modelPromise(promise: GraphandModelPromise) {}

  static hydrate(data: any, _fields?) {
    return new this(data, _fields);
  }

  constructor(data: any, _fields?) {
    const { constructor } = Object.getPrototypeOf(this);

    if (!constructor._registeredAt || !constructor._client) {
      throw new Error(`Model ${constructor.scope} is not register. Please use Client.registerModel() before`);
    }

    if (data instanceof GraphandModel) {
      return data.clone();
    }

    data = Object.assign({}, data);

    this._id = data._id;
    this._data = data;

    this._fields = _fields || constructor.getFields() || {};
    this.reloadFields();

    Object.defineProperty(this, "_data", { enumerable: false });
    Object.defineProperty(this, "_locale", { enumerable: false });
    Object.defineProperty(this, "_version", { enumerable: false });
    Object.defineProperty(this, "_fields", { enumerable: false });

    if (constructor.queryFields) {
      constructor.fieldsObserver?.list.subscribe(() => this.reloadFields());
    }
  }

  translate(locale) {
    const { constructor } = Object.getPrototypeOf(this);

    if (constructor.translatable) {
      this._locale = locale;
    }

    return this;
  }

  get _translations() {
    const { constructor } = Object.getPrototypeOf(this);

    const translations = this._data.translations ? Object.keys(this._data.translations) : [];
    return translations.concat(constructor._client._project?.defaultLocale);
  }

  clone(locale?) {
    const { constructor } = Object.getPrototypeOf(this);
    const clone = new constructor(_.cloneDeep(this.raw), this._fields);
    if (locale) {
      clone.translate(locale);
    }
    clone._version = this._version;
    return clone;
  }

  get(slug, decode = false, _locale = this._locale, fallback = true) {
    const { constructor } = Object.getPrototypeOf(this);

    const field = this._fields[slug];
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

  set(slug, value) {
    const field = this._fields[slug];

    if (field?.setter) {
      value = field.setter(value, this);
    }

    _.set(this._data, slug, value);

    return this;
  }

  assign(values?, upsert = true, updatedAtNow = true) {
    const { constructor } = Object.getPrototypeOf(this);
    const clone = this.clone();
    if (values) {
      Object.keys(values).forEach((key) => {
        clone.set(key, values[key]);
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
        this.set(key, values[key]);
      });
    }

    if (updatedAtNow) {
      this.updatedAt = clone.updatedAt;
    }

    return this;
  }

  subscribe() {
    const { constructor } = Object.getPrototypeOf(this);
    let prev = this.clone();
    const observable = new Observable((subscriber) => {
      constructor._listSubject.subscribe(async () => {
        const item = await constructor.get(prev._id);
        if (!item || item._version > prev._version || !isEqual(item.raw, prev.raw)) {
          if (item) {
            prev = item.clone();
          }
          subscriber.next(item);
        }
      });
    });
    return observable.subscribe.apply(observable, arguments);
  }

  get raw() {
    return this._data;
  }

  static get fieldsObserver() {
    if (!this.queryFields) {
      return;
    }

    if (!this._fieldsObserver && this._client._options.project) {
      this._fieldsObserver = this._client.models.DataField.observe().query({ scope: this.scope });
    }

    return this._fieldsObserver;
  }

  reloadFields() {
    const { constructor } = Object.getPrototypeOf(this);
    this._fields = constructor.getFields(this) || {};

    const properties = Object.keys(this._fields).reduce((final, slug) => {
      const field = this._fields[slug];
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

    Object.defineProperties(this, properties);

    return this._fields;
  }

  static setPrototypeFields() {
    const fields = this.getFields();

    const properties = Object.keys(fields).reduce((final, slug) => {
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

    Object.defineProperties(this.prototype, properties);
  }

  static getFields(item?) {
    if (this.queryFields && !this._fieldsSubscription && this._client._options.subscribeFields) {
      this._fieldsSubscription = this.fieldsObserver?.list.subscribe(async (list) => {
        const graphandFields = await Promise.all(list.map((field) => field.toGraphandField()));
        const fields = list.reduce((fields, field, index) => Object.assign(fields, { [field.slug]: graphandFields[index] }), {});
        if (!isEqual(this._fields, fields)) {
          this._fields = fields;
          this.setPrototypeFields();
          this.fieldsObserver.list.next(list);
        }
      });
    }

    const baseFields = typeof this.baseFields === "function" ? this.baseFields.bind(this)(item) : this.baseFields;

    let fields = {
      _id: new GraphandFieldId(),
      ...this._fields,
      ...baseFields,
    };

    if (this._defaultFields) {
      fields = {
        ...fields,
        createdBy: new GraphandFieldRelation({
          name: "Créé par",
          model: this._client.models.Account,
          multiple: false,
        }),
        createdAt: new GraphandFieldDate({
          name: "Créé à",
          time: true,
        }),
        updatedBy: new GraphandFieldRelation({
          name: "Modifié par",
          model: this._client.models.Account,
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

  static get fields() {
    return this.getFields();
  }

  static async init() {
    if (!this._registeredAt || !this._client) {
      throw new Error(`Model ${this.scope} is not register. Please use Client.registerModel() before`);
    }

    if (this._initialized) {
      return;
    }

    if (!this._initPromise) {
      this._initPromise = new Promise(async (resolve, reject) => {
        try {
          await this._client.init();

          if (this.queryFields && this._client._options.project) {
            const query = this._fieldsIds || { query: { scope: this.scope } };
            const list = await this._client.getModel("DataField").getList(query);
            const graphandFields = await Promise.all(list.map((field) => field.toGraphandField()));
            this._fields = list.reduce((fields, field, index) => Object.assign(fields, { [field.slug]: graphandFields[index] }), {});
            this.setPrototypeFields();
          }

          Object.defineProperty(this, "name", { value: this.scope });

          this._initialized = true;
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    }

    return this._initPromise;
  }

  private static setupSocket(socket?) {
    socket = socket || this._client?.socket;
    if (!socket || !socket.id) {
      return;
    }

    const path = "/models/" + this.scope;
    const trigger = async ({ action, payload }) => {
      if (!payload) {
        return;
      }

      this._socketTriggerSubject.next({ action, payload });

      setTimeout(() => {
        switch (action) {
          case "create":
            this.upsertStore(payload.map((item) => new this(item))) && this.clearCache();
            break;
          case "update":
            this.upsertStore(payload.map((item) => new this(item))) && this.clearCache();
            break;
          case "delete":
            this.deleteFromStore(payload) && this.clearCache();
            break;
        }
      });
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

  static sync(force = false) {
    if (force || (this._client && !this._socketSubscription)) {
      this.setupSocket();
      this._socketSubscription = this._client._socketSubject.subscribe((socket) => this.setupSocket(socket));
    }

    return this;
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

  static getCacheKey({ select, populate, sort, pageSize, page, translations, query, ids }) {
    return this.scope + JSON.stringify([select, populate, sort, pageSize, page, translations, query, ids]);
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
    Object.values(this.getFields())
      .filter((field) => field instanceof GraphandFieldRelation)
      .forEach((field: any) => {
        const model = typeof field.model === "string" ? this._client.getModel(field.model) : field.model;
        model?.clearCache();
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

  static getList(...args) {
    return this.query.apply(this, args);
  }

  static query(query?: any, cache = true, ...params): GraphandModelList | GraphandModelListPromise {
    if (query) {
      // if (Array.isArray(query)) {
      //   query = { ids: query };
      // }

      // if (query.ids) {
      //   if (query.ids instanceof GraphandModelList || query.ids instanceof GraphandModelListPromise) {
      //     query.ids = query.ids.ids;
      //   } else if (query.ids instanceof GraphandModel || query.ids instanceof GraphandModelPromise) {
      //     query.ids = [query.ids._id];
      //   } else if (typeof query.ids === "string") {
      //     query.ids = [query.ids];
      //   }
      //
      //   if (Object.keys(query).length === 1 && "ids" in query) {
      //     const list = query.ids.map((_id) => this.get(_id, false));
      //     if (list.every(Boolean)) {
      //       return new GraphandModelList({ model: this, count: list.length, query }, ...list);
      //     }
      //   }
      // }

      const _this = this;
      return new GraphandModelListPromise(
        async (resolve) => {
          try {
            const {
              data: {
                data: { rows, count },
              },
            } = await _this.fetch(query, cache, ...params);
            const storeList = _this._listSubject.getValue();
            const list = rows?.map((row) => storeList.find((item) => item._id === row._id)).filter((r) => r) || [];
            resolve(new GraphandModelList({ model: _this, count, query }, ...list));
          } catch (e) {
            console.error(e);
            resolve([]);
          }
        },
        this,
        query,
      );
    }

    const list = this._listSubject.getValue();
    return new GraphandModelList({ model: this }, ...list);
  }

  static get(query, fetch = true, cache = true) {
    if (!query) {
      return new GraphandModelPromise(async (resolve, reject) => {
        try {
          const res = await this.fetch(null);
          resolve(this.get((res.data.data.rows && res.data.data.rows[0] && res.data.data.rows[0]._id) || res.data.data._id, false));
        } catch (e) {
          reject(e);
        }
      }, this);
    }

    const _id =
      query instanceof GraphandModel
        ? query._id
        : typeof query === "object" && query.query?._id
        ? query.query._id
        : typeof query === "string"
        ? query
        : null;

    const item = cache && this.getList().find((item) => item._id === _id);

    if (!item && fetch) {
      return new GraphandModelPromise(
        async (resolve, reject) => {
          let res;
          try {
            res = await this.fetch(query, cache);
            const data = res.data.data && ((res.data.data.rows && res.data.data.rows[0]) || res.data.data);
            if (!cache) {
              resolve(data && this.hydrate(data));
            }

            const id = data && data._id;
            if (id) {
              resolve(this.get(id, false));
            } else {
              resolve(null);
            }
          } catch (e) {
            reject(e);
          }
        },
        this,
        query,
      );
    }

    return fetch ? new GraphandModelPromise((resolve) => resolve(item), this, item._id, true) : item;
  }

  static getPopulatedPaths(populateQuery) {
    if (!populateQuery) {
      return null;
    }

    if (typeof populateQuery === "string") {
      return [populateQuery];
    }

    const _getPopulatedPaths = function (list, arr, prefix) {
      for (const pop of arr) {
        list.push(prefix + pop.path);
        if (!Array.isArray(pop.populate)) {
          continue;
        }
        _getPopulatedPaths(list, pop.populate, prefix + pop.path + ".");
      }
    };

    const ret = [];
    for (const path of Object.keys(populateQuery)) {
      const pop = populateQuery[path];
      if ("string" === typeof pop) {
        ret.push(pop);
        continue;
      } else if (!Array.isArray(pop.populate)) {
        continue;
      }

      _getPopulatedPaths(ret, pop.populate, path + ".");
    }

    return ret;
  }

  static async _request(query, hooks, cacheKey?) {
    let res;

    try {
      const isSimpleQuery =
        query?.query?._id && typeof query.query._id === "string" && Object.keys(query).length === 1 && Object.keys(query.query).length === 1;
      if (isSimpleQuery) {
        const url = `${this.baseUrl}/${query.query._id}`;
        res = await this._client._axios.get(url);

        if (res.data?.data) {
          const item = this.get(res.data.data._id, false) || new this(res.data?.data);
          this.upsertStore(item);
        }
      } else {
        const url = this.queryUrl || `${this.baseUrl}/query`;
        res = await this._client._axios.post(url, query);
        const { data } = res;

        const _processPopulate = (item) => {
          const populatedPaths = this.getPopulatedPaths(query.populate);
          if (populatedPaths?.length) {
            const fields = this.getFields(item);
            for (const path of populatedPaths) {
              const field = fields[path];
              if (!field || !(field instanceof GraphandFieldRelation)) {
                continue;
              }

              const populatedData = _.get(item, path);
              if (!populatedData) {
                continue;
              }

              let value;
              if (field.multiple && Array.isArray(populatedData)) {
                const _items = populatedData.map((populatedItem) => new field.model(populatedItem));
                field.model.upsertStore(_items);
                value = populatedData.map((i) => i && i._id).filter(Boolean);
              } else {
                const _item = new field.model(populatedData);
                field.model.upsertStore(_item);
                value = _item._id;
              }

              _.set(item, path, value);
            }
          }
        };

        if (data?.data?.rows) {
          data.data.rows = data.data.rows.map((item) => {
            _processPopulate(item);
            return new this(item);
          });

          let rows = data.data.rows || [data.data];
          rows = rows.map((item) => (item?._id && this.get(item._id, false)) || item);

          this.upsertStore(rows);
        } else if (data.data && typeof data.data === "object") {
          _processPopulate(data.data);

          const item = this.get(data.data._id, false) || new this(data.data);
          this.upsertStore(item);
        }
      }
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

  static async fetch(query: any, cache = true, callback?: Function, hooks = true) {
    await this.init();

    if (Array.isArray(query)) {
      query = { ids: query };
    } else if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    } else {
      query = serialize(query);
    }

    // if (this.translatable && !query.translations && this._client._project?.locales?.length) {
    //   query.translations = this._client._project?.locales;
    // }

    if (
      this._client._options.autoMapQueries &&
      query.query?._id?.$in &&
      Object.keys(query.query).length === 1 &&
      Object.keys(query.query._id).length === 1
    ) {
      query.ids = query.query._id.$in;
    }

    if (hooks) {
      await this.beforeQuery?.call(this, query);
    }

    if (!cache) {
      return await this._request(query, hooks);
    }

    let res;
    const cacheKey = this.getCacheKey(query);
    const cacheEntry = this._cache[cacheKey];

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

    callback && callback(res);
    return res;
  }

  static async count(query?: any, ...params): Promise<number> {
    await this.init();

    if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    } else {
      query = serialize(query);
    }

    const { data } = await this._client._axios.post(`${this.baseUrl}/count`, query);
    return parseInt(data.data, 10);
  }

  static observe(options: any = {}) {
    return new ModelObserver(options, this);
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

    let item;
    try {
      args.payload = serialize(args.payload);
      const req = this._client._axios
        .post(url, args.payload, args.config)
        .then(async (res) => {
          item = new this(res.data.data);

          this.clearCache();
          this.upsertStore(item);

          if (hooks) {
            await this.afterCreate?.call(this, item, null, args);
          }

          return item;
        })
        .catch(async (e) => {
          if (hooks) {
            await this.afterCreate?.call(this, null, e, args);
          }

          throw e;
        });

      const middlewareData = await this.middlewareCreate?.call(this, args, req);
      if (middlewareData !== undefined) {
        return middlewareData;
      }
      item = await req;
    } catch (e) {
      if (hooks) {
        await this.afterCreate?.call(this, null, e, args);
      }

      throw e;
    }

    return item;
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
      payload = serialize(payload);
      const { data } = await this.handleUpdateCall(payload);

      if (!data) {
        return;
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
        this.assign(constructor.get(_id, false).raw, false);
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
        payload = serialize(payload);

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

  delete(options) {
    const constructor = this.constructor as any;
    return constructor.delete(this, options);
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

  get publicUrls() {
    return new Proxy(this, {
      get: function (oTarget, sKey) {
        const { constructor } = Object.getPrototypeOf(oTarget);
        if (!constructor._client) {
          return null;
        }

        const cdnUri = `${constructor._client._options.ssl ? "https" : "http"}://${constructor._client._options.cdn}`;
        return `${cdnUri}/public/${constructor._client._options.project}/${oTarget.raw[sKey]}`;
      },
    });
  }

  toObject() {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.getFields(this);
    return Object.keys(fields).reduce((final, slug) => Object.assign(final, { [slug]: this.get(slug) }), {});
  }

  toJSON() {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.getFields(this);
    return Object.keys(fields).reduce((final, slug) => Object.assign(final, { [slug]: this.get(slug, true) }), {});
  }

  toString() {
    return this._id;
  }

  serialize() {
    return this._id;
  }

  toPromise() {
    const { constructor } = Object.getPrototypeOf(this);
    return constructor.get(this._id).toPromise();
  }

  refresh() {
    const { constructor } = Object.getPrototypeOf(this);
    const newItem = constructor.get(this._id, false);
    this.assign(newItem, false);
    return this;
  }

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
}

export default GraphandModel;
