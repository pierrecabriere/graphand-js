import isEqual from "fast-deep-equal";
import _ from "lodash";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import Client from "../Client";
import GraphandFieldDate from "./fields/GraphandFieldDate";
import GraphandFieldId from "./fields/GraphandFieldId";
import GraphandFieldRelation from "./fields/GraphandFieldRelation";
import GraphandModelList from "./GraphandModelList";
import GraphandModelListPromise from "./GraphandModelListPromise";
import GraphandModelPromise from "./GraphandModelPromise";
import ModelObserver from "./ModelObserver";

class GraphandModel {
  _id: string;
  createdAt: Date;
  updatedAt: Date;

  // configurable fields
  static translatable = true;
  static queryFields = false;
  static baseUrl = null;
  static queryUrl = null;
  static baseFields = {};
  static scope = null;

  // private fields
  static _client: Client;
  static cache = {};
  static socketSubscription = null;
  static _fieldsIds = null;
  static _fields = {};
  static _fieldsSubscription = null;
  static initialized = false;
  static _fieldsObserver = null;
  static __registered = false;
  static __initialized = false;
  static observers = new Set([]);
  static defaultFields = true;
  static queryPromises = {};
  static socketTriggerSubject = new Subject();
  static _initPromise = null;
  static _listSubject = null;

  private _data: any = {};
  private _locale = null;
  private _version = 1;
  _fields = {};

  static modelPromise(promise: GraphandModelPromise) {}

  static get listSubject() {
    if (!this._listSubject) {
      this._listSubject = new BehaviorSubject([]);
    }

    return this._listSubject;
  }

  constructor(data: any = {}, locale?: string) {
    data = data instanceof GraphandModel ? data.raw : data;
    this._id = data._id;
    this._data = data;
    this._locale = locale;

    Object.defineProperty(this, "_data", { enumerable: false });
    Object.defineProperty(this, "_locale", { enumerable: false });
    Object.defineProperty(this, "_version", { enumerable: false });
    Object.defineProperty(this, "_fields", { enumerable: false });

    const { constructor } = Object.getPrototypeOf(this);
    if (constructor.queryFields) {
      constructor.fieldsObserver?.list.subscribe(() => {
        this.reloadFields();
      });
    }

    this.reloadFields();
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
    const clone = _.cloneDeep(this);
    clone._version = this._version + 1;
    return clone;
  }

  get(slug, decode = false, fields?) {
    const { constructor } = Object.getPrototypeOf(this);

    let value = _.get(this._data, slug);

    if (constructor.translatable) {
      let locale = this._locale || constructor._client.locale;
      if (
        (locale && constructor._client._project?.locales && !constructor._client._project.locales.includes(locale)) ||
        constructor._client._project?.defaultLocale === locale
      ) {
        locale = undefined;
      }

      if (locale && this._data.translations && this._data.translations[locale] && _.get(this._data.translations[locale], slug) !== undefined) {
        value = _.get(this._data.translations[locale], slug);
      }
    }

    const field = (fields && fields[slug]) || (this._fields && this._fields[slug]);
    if (!field) {
      return undefined;
    }

    if (value === undefined) {
      // value = field ? field.defaultValue : _.get(this._data, slug);
      value = field && field.defaultValue;
    }

    if (field?.getter) {
      value = field.getter(value, this);
      if (decode && field?.setter) {
        value = field.setter(value, this);
      }
    }

    return value;
  }

  set(slug, value, fields?) {
    const { constructor } = Object.getPrototypeOf(this);
    fields = fields || constructor.fields;
    const field = fields[slug];

    if (field?.setter) {
      value = field.setter(value, this);
    }

    _.set(this._data, slug, value);

    this.reloadFields();

    return this;
  }

  assign(values?, upsert = true, updatedAtNow = true) {
    const { constructor } = Object.getPrototypeOf(this);
    const fields = constructor.fields;
    const clone = this.clone();
    if (values) {
      Object.keys(values).forEach((key) => {
        clone.set(key, values[key], fields);
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
        this.set(key, values[key], fields);
      });
    }

    if (updatedAtNow) {
      this.updatedAt = clone.updatedAt;
    }

    return this;
  }

  subscribe() {
    const { constructor } = Object.getPrototypeOf(this);
    const parent = this;
    const observable = new Observable((subscriber) => {
      let prevRaw = parent.raw;
      let prevVersion = parent._version;
      constructor.listSubject.subscribe(async () => {
        const item = await constructor.get(parent._id);
        if (item && (!isEqual(item.raw, prevRaw) || item._version !== prevVersion)) {
          prevRaw = item.raw;
          subscriber.next(item);
        } else if (!item) {
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
    this._fields = constructor.getFields();
    this._fields = constructor.getFields(this);

    Object.keys(this._fields).forEach((slug) => {
      const field = this._fields[slug];
      if (field.assign === false) {
        return;
      }

      Object.defineProperty(this, slug, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: this.get(slug),
      });
    });
    return this._fields;
  }

  static getFields(item?) {
    if (this.queryFields && !this._fieldsSubscription && this._client._options.subscribeFields) {
      this._fieldsSubscription = this.fieldsObserver?.list.subscribe(async (list) => {
        const graphandFields = await Promise.all(list.map((field) => field.toGraphandField()));
        const fields = list.reduce((fields, field, index) => Object.assign(fields, { [field.slug]: graphandFields[index] }), {});
        if (!isEqual(this._fields, fields)) {
          this._fields = fields;
          this.fieldsObserver.list.next(list);
        }
      });
    }

    const baseFields = typeof this.baseFields === "function" ? this.baseFields(item) : this.baseFields;

    let fields = {
      _id: new GraphandFieldId(),
      ...this._fields,
      ...baseFields,
    };

    if (this.defaultFields) {
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

  static setPrototypeFields() {
    const fields = this.fields;
    Object.keys(fields).forEach((slug) => {
      const field = fields[slug];
      if (field.assign === false) {
        return;
      }

      Object.defineProperty(this.prototype, slug, {
        enumerable: true,
        get: function () {
          return this.get(slug);
        },
        set(v) {
          return this.set(slug, v);
        },
      });
    });
  }

  static async init() {
    if (!this.__registered) {
      throw new Error(`Model ${this.scope} is not register. Please use Client.registerModel() before`);
    }

    if (this.initialized) {
      return;
    }

    if (!this._initPromise) {
      this._initPromise = new Promise(async (resolve) => {
        await this._client.init();

        if (this.queryFields && this._client._options.project) {
          const query = this._fieldsIds || { query: { scope: this.scope } };
          const list = await this._client.models.DataField.getList(query);
          const graphandFields = await Promise.all(list.map((field) => field.toGraphandField()));
          this._fields = list.reduce((fields, field, index) => Object.assign(fields, { [field.slug]: graphandFields[index] }), {});
        }

        this.setPrototypeFields();
        Object.defineProperty(this, "name", {
          get() {
            return this.scope;
          },
        });

        this.initialized = true;
        resolve();
      });
    }

    return this._initPromise;
  }

  private static setupSocket(socket?) {
    socket = socket || this._client?.socket;
    if (!socket) {
      return;
    }

    socket.on("/models/" + this.scope, async ({ action, payload }) => {
      if (!payload) {
        return;
      }

      this.socketTriggerSubject.next({ action, payload });

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
    });
  }

  static async handleUpdateCall(payload) {
    return await this._client._axios.patch(this.baseUrl, payload);
  }

  static on(event, trigger, options) {
    this._client.registerHook({ model: this, action: event, trigger, ...options });
  }

  static sync() {
    if (this._client && !this.socketSubscription) {
      this.setupSocket();
      this.socketSubscription = this._client.socketSubject.subscribe((socket) => this.setupSocket(socket));
    }

    return this;
  }

  static unsync() {
    this.socketSubscription.unsubscribe();
    delete this.socketSubscription;
  }

  static reinit() {
    this.cache = {};

    return this.reinitStore();
  }

  static getCacheKey(obj) {
    const { select, populate, sort, pageSize, page, translations, query, ids } = obj;
    return this.scope + JSON.stringify([select, populate, sort, pageSize, page, translations, query, ids]);
  }

  static clearCache(query?, clean = false) {
    if (query) {
      const cacheKey = this.getCacheKey(query);
      if (this.cache[cacheKey]) {
        if (clean) {
          delete this.cache[cacheKey];
        } else {
          delete this.cache[cacheKey].request;
        }
      }
    } else {
      Object.keys(this.cache).forEach((cacheKey: any) => {
        if (clean) {
          delete this.cache[cacheKey];
        } else {
          delete this.cache[cacheKey].request;
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
      .forEach((field) => {
        // @ts-ignore
        field.model && field.model.clearCache();
      });
  }

  static reinitStore() {
    this.listSubject.next([]);

    return this;
  }

  static deleteFromStore(payload, force = false) {
    let refresh = false;
    const _delete = (list, item) => {
      const found = list.find((i) => i._id === item._id);
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
      this.listSubject.next(_list);
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
      this.listSubject.next(_list);
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
      this.listSubject.next(list);
      return true;
    }

    return false;
  }

  static prepareQuery(query?: any) {
    const _decodeInstances = (object) => {
      if (object instanceof GraphandModelList || object instanceof GraphandModelListPromise) {
        object = object.ids;
      } else if (object instanceof GraphandModel || object instanceof GraphandModelPromise) {
        object = [object._id];
      } else if (object && typeof object === "object") {
        Object.keys(object).forEach((key) => {
          _decodeInstances(object[key]);
        });
      }
    };

    _decodeInstances(query);
  }

  static getList() {
    return this.query.apply(this, arguments);
  }

  static query(query?: any, ...params): GraphandModelList | GraphandModelListPromise {
    if (query) {
      const _this = this;

      this.prepareQuery(query);

      if (Array.isArray(query)) {
        query = { ids: query };
      }

      if (query.ids) {
        if (query.ids instanceof GraphandModelList || query.ids instanceof GraphandModelListPromise) {
          query.ids = query.ids.ids;
        } else if (query.ids instanceof GraphandModel || query.ids instanceof GraphandModelPromise) {
          query.ids = [query.ids._id];
        }
      }

      if (query.ids && Object.keys(query).length === 1) {
        const ids = Array.isArray(query.ids) ? query.ids : [query.ids];
        const list = ids.map((_id) => this.get(_id, false));
        if (list.every((i) => i)) {
          return new GraphandModelList({ model: _this, count: list.length, query }, ...list);
        }
      }

      return new GraphandModelListPromise(
        async (resolve) => {
          try {
            const res = await _this.fetch(query, ...params);
            const {
              data: {
                data: { rows, count },
              },
            } = res;
            const storeList = _this.listSubject.getValue();
            const list = rows.map((row) => storeList.find((item) => item._id === row._id)).filter((r) => r);
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

    return new GraphandModelList({ model: this }, ...this.listSubject.getValue());
  }

  static get(_id, fetch = true) {
    if (!_id) {
      return new GraphandModelPromise(async (resolve, reject) => {
        try {
          const res = await this.fetch(null, undefined, true);
          resolve(this.get((res.data.data.rows && res.data.data.rows[0] && res.data.data.rows[0]._id) || res.data.data._id, false));
        } catch (e) {
          reject(e);
        }
      }, this);
    }

    _id = typeof _id === "object" && _id.query?._id ? _id.query._id : _id;
    const item = this.getList().find((item) => item._id === _id);

    if (!item && fetch) {
      return new GraphandModelPromise(
        async (resolve, reject) => {
          let res;
          try {
            res = await this.fetch(_id, undefined, true);
            const id = res.data.data && ((res.data.data.rows && res.data.data.rows[0] && res.data.data.rows[0]._id) || res.data.data._id);
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
        _id,
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

  static getRequest(query, hooks, cacheKey?) {
    let request;
    if (query?.query?._id && typeof query.query._id === "string" && Object.keys(query.query).length === 1) {
      request = (cacheKey?: string) =>
        this._client._axios
          .get(`${this.baseUrl}/${query.query._id}`)
          .then(async (res) => {
            if (res.data?.data) {
              const populatedPaths = this.getPopulatedPaths(query.populate);
              if (populatedPaths?.length) {
                const fields = this.getFields(res.data.data);
                for (const path of populatedPaths) {
                  const field = fields[path];
                  if (!field || !(field instanceof GraphandFieldRelation)) {
                    continue;
                  }

                  const populatedData = _.get(res.data.data, path);
                  if (!populatedData) {
                    continue;
                  }
                  if (field.multiple && Array.isArray(populatedData)) {
                    for (const populatedItem of populatedData) {
                      const _item = new field.model(populatedItem);
                      field.model.upsertStore(_item);
                    }

                    const ids = populatedData.map((i) => i._id);
                    _.set(res.data.data, path, ids);
                  } else {
                    const _item = new field.model(populatedData);
                    field.model.upsertStore(_item);
                    _.set(res.data.data, path, populatedData._id);
                  }
                }
              }

              const item = this.get(res.data.data._id, false) || new this(res.data?.data);
              this.upsertStore(item);
            }

            if (cacheKey) {
              this.cache[cacheKey] = this.cache[cacheKey] || {};
              this.cache[cacheKey].previous = res;
            }

            if (hooks) {
              await this.afterQuery?.call(this, query, res);
            }

            return res;
          })
          .catch(async (e) => {
            delete this.cache[cacheKey];

            if (hooks) {
              await this.afterQuery?.call(this, query, null, e);
            }

            throw e;
          });
    } else {
      request = (cacheKey?: string) =>
        this._client._axios
          .post(this.queryUrl || `${this.baseUrl}/query`, query)
          .then(async (res) => {
            const populatedPaths = this.getPopulatedPaths(query.populate);

            if (res.data?.data?.rows) {
              res.data.data.rows = res.data.data.rows.map((item) => {
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
                    if (field.multiple && Array.isArray(populatedData)) {
                      for (const populatedItem of populatedData) {
                        const _item = new field.model(populatedItem);
                        field.model.upsertStore(_item);
                      }

                      const ids = populatedData.map((i) => i._id);
                      _.set(item, path, ids);
                    } else {
                      const _item = new field.model(populatedData);
                      field.model.upsertStore(_item);
                      _.set(item, path, populatedData._id);
                    }
                  }
                }

                return new this(item);
              });

              let rows = res.data.data.rows || [res.data.data];
              rows = rows.map((item) => (item?._id && this.get(item._id, false)) || item);

              this.upsertStore(rows);
            } else if (res.data.data && typeof res.data.data === "object") {
              if (populatedPaths?.length) {
                const fields = this.getFields(res.data.data);
                for (const path of populatedPaths) {
                  const field = fields[path];
                  if (!field || !(field instanceof GraphandFieldRelation)) {
                    continue;
                  }

                  const populatedData = _.get(res.data.data, path);
                  if (!populatedData) {
                    continue;
                  }
                  if (field.multiple && Array.isArray(populatedData)) {
                    for (const populatedItem of populatedData) {
                      const _item = new field.model(populatedItem);
                      field.model.upsertStore(_item);
                    }

                    const ids = populatedData.map((i) => i._id);
                    _.set(res.data.data, path, ids);
                  } else {
                    const _item = new field.model(populatedData);
                    field.model.upsertStore(_item);
                    _.set(res.data.data, path, populatedData._id);
                  }
                }
              }

              const item = this.get(res.data.data._id, false) || new this(res.data.data);
              this.upsertStore(item);
            }

            if (cacheKey) {
              this.cache[cacheKey] = this.cache[cacheKey] || {};
              this.cache[cacheKey].previous = res;
            }

            if (hooks) {
              await this.afterQuery?.call(this, query, res);
            }

            return res;
          })
          .catch(async (e) => {
            delete this.cache[cacheKey];

            if (hooks) {
              await this.afterQuery?.call(this, query, null, e);
            }

            throw e;
          });
    }

    return request;
  }

  static async fetch(query: any, cache = true, waitRequest = false, callback?: Function, hooks = true) {
    await this.init();

    let _id;

    if (typeof query === "string") {
      query = { query: { _id: query } };
    } else if (!query) {
      query = {};
    }

    if (this.translatable && !query.translations && this._client._project?.locales?.length) {
      query.translations = this._client._project?.locales;
    }

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

    if (_id && this.get(_id, false)) {
      return { data: { data: this.get(_id, false).raw } };
    }

    let res;
    if (cache) {
      const cacheKey = this.getCacheKey(query);
      const request = this.getRequest(query, hooks, cacheKey);

      if (!this.cache[cacheKey]) {
        this.cache[cacheKey] = {
          previous: null,
          request: request(cacheKey),
        };

        res = await this.cache[cacheKey].request;
        callback && callback(res);
      } else if (this.cache[cacheKey].previous && this.cache[cacheKey].request) {
        if (waitRequest) {
          res = await this.cache[cacheKey].request;
          callback && callback(res);
        } else {
          res = this.cache[cacheKey].previous;
          callback && callback(false);

          this.cache[cacheKey].request.then(async (res) => {
            callback && callback(res);
            return res;
          });
        }
      } else if (this.cache[cacheKey].previous && !waitRequest) {
        res = this.cache[cacheKey].previous;
        this.cache[cacheKey].request = request(cacheKey);
        callback && callback(res);

        this.cache[cacheKey].request.then(async (_res) => {
          callback && callback(_res);
          return _res;
        });
      } else {
        if (!this.cache[cacheKey].request) {
          this.cache[cacheKey].request = request(cacheKey);
        }

        res = await this.cache[cacheKey].request;
        callback && callback(res);
      }
    } else {
      const request = this.getRequest(query, hooks);
      res = await request();
      callback && callback(res);
    }

    if (_id && res.data.data?.rows) {
      const row = res.data.data?.rows.find((r) => r._id === _id);
      return { data: { data: row } };
    }

    return res;
  }

  static observe(options: any = {}) {
    return new ModelObserver(options, this);
  }

  static async create(payload, hooks = true) {
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
      const req = this._client._axios
        .post(this.baseUrl, args.payload, args.config)
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
    this.listSubject.next(this.getList());
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

    if (this.translatable && !payload.translations && this._client._project?.locales?.length) {
      payload.translations = this._client._project?.locales;
    }

    if (payload.locale && payload.locale === this._client._project?.defaultLocale) {
      delete payload.locale;
    }

    if (options.hooks) {
      if ((await this.beforeUpdate?.call(this, payload)) === false) {
        return;
      }
    }

    try {
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

    if (constructor.translatable && !payload.translations && constructor._client._project?.locales?.length) {
      payload.translations = constructor._client._project?.locales;
    }

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
      await constructor.update({ ...payload, query: { _id } }, { clearCache: options.clearCache, upsert: options.upsert, hooks: false });
      if (!options.upsert) {
        this.assign();
      }
      this.assign(constructor.get(_id, false).raw, false);

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

  static async delete(payload: GraphandModel | any, hooks = true) {
    await this.init();

    const args = { payload };

    if (hooks) {
      if ((await this.beforeDelete?.call(this, args)) === false) {
        return;
      }
    }

    if (payload instanceof GraphandModel) {
      try {
        const { _id } = payload;
        await this._client._axios.delete(`${this.baseUrl}/${_id}`);

        this.clearCache();
        this.deleteFromStore(payload);

        if (hooks) {
          await this.afterDelete?.call(this, args);
        }
      } catch (e) {
        this.upsertStore(payload);

        if (hooks) {
          await this.afterDelete?.call(this, args, e);
        }

        throw e;
      }
    } else {
      try {
        // @ts-ignore
        await this._client._axios.delete(this.baseUrl, { _data: payload });

        if (hooks) {
          await this.afterDelete?.call(this, args);
        }

        // if (!this.socketSubscription) {
        this.clearCache();
        // }
      } catch (e) {
        if (hooks) {
          await this.afterDelete?.call(this, args, e);
        }

        throw e;
      }
    }

    return true;
  }

  delete() {
    const constructor = this.constructor as any;
    return constructor.delete(this, ...arguments);
  }

  static setClient(client) {
    this._client = client;
    return this;
  }

  get HistoryModel() {
    const parent = this;
    const { constructor } = Object.getPrototypeOf(this);
    const modelName = `${this._id}_history`;
    if (!constructor._client._models[modelName]) {
      const GraphandHistoryModel = require("./GraphandHistoryModel").default;
      const HistoryModel = class extends GraphandHistoryModel {
        static baseUrl = `${constructor.baseUrl}/${parent._id}/history`;
        static queryUrl = `${constructor.baseUrl}/${parent._id}/history`;
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
