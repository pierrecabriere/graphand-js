import { Axios } from "axios";
import { BehaviorSubject } from "rxjs";
import HooksEvents from "./enums/hooks-events";
import ModelScopes from "./enums/model-scopes";
import PluginLifecyclePhases from "./enums/plugin-lifecycle-phases";
import * as lib from "./lib";
import { GraphandError, GraphandModelList, GraphandValidationError } from "./lib";
import GraphandModel from "./lib/GraphandModel";
import GraphandPlugin, { GraphandPluginOptions } from "./lib/GraphandPlugin";
import * as models from "./models";
import {
  Account,
  Aggregation,
  DataField,
  DataModel,
  Environment,
  EsMapping,
  Log,
  Media,
  Module,
  Project,
  Restriction,
  Role,
  Rule,
  Token,
  User,
  Webhook,
} from "./models";
import Data from "./models/Data";
import Sockethook from "./models/Sockethook";
import { setupAxios, setupSocket, verifyScopeFormat } from "./utils";
import hydrateModel from "./utils/hydrateModel";

type GraphandPluginWithConf = [plugin: typeof GraphandPlugin, options: any];

type ClientOptions = {
  host?: string;
  cdn?: string;
  ssl?: boolean;
  project?: string;
  accessToken?: string;
  refreshToken?: string;
  locale?: string;
  translations?: string[];
  realtime?: boolean;
  mergeQueries?: boolean;
  autoSync?: boolean;
  subscribeFields?: boolean;
  init?: boolean;
  initProject?: boolean;
  initModels?: boolean;
  models?: any[];
  cache?: boolean;
  plugins?: (typeof GraphandPlugin | GraphandPluginWithConf)[];
  socketOptions?: any;
  env?: string;
};

const defaultOptions = {
  host: "api.graphand.io",
  cdn: "cdn.graphand.io",
  ssl: true,
  project: undefined,
  accessToken: undefined,
  refreshToken: undefined,
  locale: undefined,
  translations: undefined,
  realtime: undefined,
  mergeQueries: true,
  autoSync: false,
  subscribeFields: false,
  init: true,
  initProject: false,
  initModels: false,
  models: [],
  cache: true,
  plugins: [],
  socketOptions: {},
  env: "master",
};

type ScopedModelType<T> = T extends ModelScopes.Account | "Account"
  ? typeof Account
  : T extends ModelScopes.Aggregation | "Aggregation"
  ? typeof Aggregation
  : T extends ModelScopes.DataField | "DataField"
  ? typeof DataField
  : T extends ModelScopes.DataModel | "DataModel"
  ? typeof DataModel
  : T extends ModelScopes.Environment | "Environment"
  ? typeof Environment
  : T extends ModelScopes.EsMapping | "EsMapping"
  ? typeof EsMapping
  : T extends ModelScopes.Log | "Log"
  ? typeof Log
  : T extends ModelScopes.Media | "Media"
  ? typeof Media
  : T extends ModelScopes.Module | "Module"
  ? typeof Module
  : T extends ModelScopes.Project | "Project"
  ? typeof Project
  : T extends ModelScopes.Restriction | "Restriction"
  ? typeof Restriction
  : T extends ModelScopes.Role | "Role"
  ? typeof Role
  : T extends ModelScopes.Rule | "Rule"
  ? typeof Rule
  : T extends ModelScopes.Sockethook | "Sockethook"
  ? typeof Sockethook
  : T extends ModelScopes.Token | "Token"
  ? typeof Token
  : T extends ModelScopes.User | "User"
  ? typeof User
  : T extends ModelScopes.Webhook | "Webhook"
  ? typeof Webhook
  : typeof Data;

/**
 * @class Client
 * @classdesc Base Graphand Client class
 */
class Client {
  static models = models;
  static lib = lib;
  _uid;
  _options: ClientOptions;
  _axios: Axios;
  _project: Project;
  _socketSubject = new BehaviorSubject(null);
  _mediasQueueSubject = new BehaviorSubject([]);
  _accessTokenSubject;
  _refreshTokenSubject;
  _initialized = false;
  _plugins = new Set<GraphandPlugin<GraphandPluginOptions>>();
  _models: any = {};

  private _initPromise;
  private _registerHooks;
  private _refreshTokenPromise;
  private _locale;

  /**
   * Graphand Client
   * @param project {ClientOptions|string} - Your project _id or client options
   * @param options {ClientOptions=} - Client options
   */
  constructor(project: string | ClientOptions, options: ClientOptions = {}) {
    options = project && typeof project === "object" ? { ...project, ...options } : options;
    if (typeof project === "string" && !options.project) {
      options.project = project;
    }
    options.env = options.env || "master";

    this._registerHooks = new Set();

    this._uid = Date.now();
    this._options = Object.assign({}, defaultOptions, options);
    this._accessTokenSubject = new BehaviorSubject(options.accessToken);
    this._refreshTokenSubject = new BehaviorSubject(options.refreshToken);
    this._axios = setupAxios(this);

    if (this._options.plugins?.length) {
      this._options.plugins.forEach((plugin) => {
        if (Array.isArray(plugin)) {
          const [_plugin, options] = plugin;
          this.plugin(_plugin, options);
        } else {
          this.plugin(plugin);
        }
      });
    }

    if (this._options.realtime) {
      this.connectSocket();
    }

    if (this._options.init) {
      this._init();
    }
  }

  /**
   * Graphand client options
   * @typedef ClientOptions
   * @property [host="api.graphand.io"] {string}
   * @property [cdn="cdn.graphand.io"] {string}
   * @property [ssl=true] {boolean}
   * @property project {string} - The project id to query on
   * @property accessToken {string} - The initial access token
   * @property refreshToken {string} - The initial refresh token,
   * @property locale {string}
   * @property translations {string[]}
   * @property realtime {boolean} - Connect client to the socket
   * @property [mergeQueries=true] {boolean} - Automatically merge queries when querying by _id or ids
   * @property [autoSync=false] {boolean} - Automatically sync all registered models with the socket
   * @property [subscribeFields=false] {boolean} - Subscribe to DataFields
   * @property [init=false] {boolean} - Initialize client at startup
   * @property [initProject=false] {boolean} - Initialize project on construct (not needed if you don't need to use the Project model instance)
   * @property [initModels=false] {boolean} - Automatically init all DataModels at startup
   * @property models {*}: []
   * @property [cache=true] {boolean} - Cache queries
   * @property plugins {*}: []
   * @property socketOptions {*}
   * @property [env="master"] {string} - Graphand environment to query on
   */

  get locale() {
    return this._locale;
  }

  set locale(locale: string) {
    this.setLocale(locale);
  }

  get models(): any {
    return new Proxy(this, {
      get: function (oTarget, sKey: string) {
        try {
          return oTarget.getGraphandModel(sKey as ModelScopes);
        } catch (e) {
          return oTarget.getModelByIdentifier(sKey);
        }
      },
    });
  }

  get socket() {
    return this._socketSubject.getValue();
  }

  set accessToken(token: string) {
    this.setAccessToken(token);
  }

  /**
   * Create new client
   * @param options {ClientOptions}
   * @returns {Client}
   */
  static createClient(options: ClientOptions): Client {
    return new Client(options);
  }

  getAccessToken() {
    return this._accessTokenSubject.getValue();
  }

  getRefreshToken() {
    return this._refreshTokenSubject.getValue();
  }

  async refreshToken() {
    if (this._refreshTokenPromise) {
      return this._refreshTokenPromise;
    }

    const accessToken = this._accessTokenSubject.getValue();
    const refreshToken = this._refreshTokenSubject.getValue();

    if (!accessToken || !refreshToken) {
      this.logout();
      throw new Error();
    }

    this._refreshTokenPromise = new Promise(async (resolve, reject) => {
      try {
        const {
          data: { data },
        } = await this._axios.post(
          "/auth/login",
          { accessToken, refreshToken, method: "refresh" },
          {
            headers: {
              Authorization: null,
            },
          },
        );
        this.setRefreshToken(data.refreshToken);
        this.setAccessToken(data.accessToken);
        resolve(this);
      } catch (e) {
        this.logout();
        reject(e);
      }
    });

    this._refreshTokenPromise.finally(() => (this._refreshTokenPromise = null));

    return this._refreshTokenPromise;
  }

  setRefreshToken(token: string) {
    this._refreshTokenSubject.next(token);
  }

  setAccessToken(token: string) {
    this._accessTokenSubject.next(token);

    if (this._options.realtime) {
      if (token) {
        this.reconnectSocket();
      } else {
        this.disconnectSocket();
      }
    }
  }

  async _init(force = false) {
    if (force || !this._initPromise) {
      this._initPromise = new Promise(async (resolve, reject) => {
        const plugins = Array.from(this._plugins);
        await Promise.all(plugins.map((p) => p.execute(PluginLifecyclePhases.INIT)));

        try {
          await Promise.all([
            (async () => {
              if (this._options.project) {
                if (this._options.initModels) {
                  const [DataModel] = this.getModels(["DataModel"]);
                  const dataModels = (await DataModel.getList({})) as GraphandModelList<DataModel>;
                  const scopes = ["Account", "Media"].concat(dataModels.map((m) => `Data:${m.slug}`));
                  await this.registerModels(this._options.models.concat(scopes), { extend: true });
                } else {
                  await this.registerModels(this._options.models, { extend: true });
                }
              }
            })(),
            (async () => {
              if (this._options.initProject && this._options.project) {
                await this.getModel(ModelScopes.Project).get("current");
              }
            })(),
          ]);
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    }

    return this._initPromise;
  }

  /**
   * Get multiple models at once (multiple {@link Client#getModel})
   * @param scopes {ModelScopes[]|"Data:*"}
   * @param options
   * @returns {GraphandModel.constructor[]}
   */
  getModels<T1 extends ModelScopes | string, T2 extends ModelScopes | string, T3 extends ModelScopes | string, T4 extends ModelScopes | string>(
    scopes: [T1?, T2?, T3?, T4?, ...(string[] | ModelScopes[])],
    options: any = {},
  ): [ScopedModelType<T1>, ScopedModelType<T2>, ScopedModelType<T3>, ScopedModelType<T4>, ...typeof GraphandModel[]] {
    // @ts-ignore
    return scopes.map((scope) => this.getModel(scope, options));
  }

  getModel<T extends ModelScopes | string>(scope: T, options?: any): ScopedModelType<T>;

  /**
   * Get ready-to-use model by scope. Use {@link Client#getModels} to get multiple models at once
   * @param scope {ModelScopes|"Data:*"}
   * @param options
   * @returns {GraphandModel.constructor}
   */
  getModel(scope: ModelScopes | string, options: any = {}): typeof Data {
    verifyScopeFormat(scope);

    try {
      const { 1: slug } = scope.match(/^Data:([a-zA-Z0-9\-_]+?)$/);
      return this.getModelByIdentifier(slug, options);
    } catch (e) {
      return this.getGraphandModel(scope as ModelScopes, options);
    }
  }

  getModelByIdentifier(identifier: string, options: any = {}): typeof Data {
    const scope = `Data:${identifier}`;

    if (!this._models[scope]) {
      const found = this._options.models.find((m: any) =>
        Array.isArray(m) ? m[0] === scope || m[0]?.scope === scope : m === scope || m?.scope === scope,
      );
      if (found && Array.isArray(found) && typeof found[1] === "object") {
        Object.assign(options, found[1]);
      }
      let model = found && Array.isArray(found) ? found[0] : found;

      if (model?.apiIdentifier) {
        options.extend = options.extend ?? true;
      } else {
        const DataConstructorFound = this._options.models.find((m: any) => (Array.isArray(m) ? m[0]?.scope === "Data" : m.scope === "Data")) || Data;
        const DataConstructor = Array.isArray(DataConstructorFound) ? DataConstructorFound[0] : DataConstructorFound;

        model = class extends DataConstructor {};
        model._registeredAt = null;
        model.apiIdentifier = identifier;
      }

      this.registerModel(model, options);
    }

    return this._models[scope];
  }

  registerModel(Model: any, options: any = {}) {
    if (!Model) {
      return;
    }

    if (typeof Model === "string") {
      Model = this.getModel(Model);
    }

    if (!Model || !Model.scope) {
      throw new Error(`You tried to register a Model without scope`);
    }

    if (Model.abstract) {
      return;
    }

    options = Object.assign(
      {},
      {
        sync: undefined,
        name: undefined,
        force: false,
        fieldsIds: undefined,
        extend: false,
      },
      options,
    );
    options.sync = options.sync ?? this._options.autoSync;
    options.cache = options.cache ?? this._options.cache;

    const _name = options.name || Model.scope;

    if (Model._registeredAt) {
      if (Model._client === this) {
        if (!options.force) {
          Model._fieldsIds = options.fieldsIds;
          return Model;
        }
      } else {
        if (!options.force && !options.extend) {
          console.error(
            `You tried to register a Model already registered on another client. Use force option and extend to prevent overriding`,
            _name,
          );
          return Model;
        } else if (options.extend) {
          Model = class extends Model {};
        }
      }
    }

    this._models[_name] = Model;
    this._models[_name]._client = this;
    this._models[_name]._fieldsIds = options.fieldsIds;
    this._models[_name]._registeredAt = new Date();

    try {
      if (options.sync) {
        const syncOpts = typeof options.sync === "object" ? options.sync : undefined;
        this._models[_name].sync(syncOpts);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      this._models[_name]._init();
    } catch (e) {
      console.error(e);
    }

    return this._models[_name];
  }

  async registerModels(list, options: any = {}) {
    const modelsList = list.map((item) => (Array.isArray(item) ? item[0] : item));
    const scopes = modelsList.map((model) => (typeof model === "string" ? model : model.scope));
    const DataField = this.getModel("DataField");
    const dataFields: GraphandModelList<GraphandModel> = (await DataField.getList({
      query: { scope: { $in: scopes } },
      pageSize: 1000,
    })) as GraphandModelList<GraphandModel>;
    const fields = dataFields.toArray();
    await Promise.all(
      modelsList.map(async (model, index) => {
        const scope = typeof model === "string" ? model : model.scope;
        const modelOptions = (Array.isArray(list[index]) && list[index][1]) || {};
        const fieldsIds = fields.filter((f) => f.scope === scope).map((f) => f._id);
        await this.registerModel(model, { ...options, ...modelOptions, fieldsIds });
      }),
    );
  }

  async registerHook({
    identifier,
    model,
    events,
    handler,
    _await,
    timeout,
    priority,
    fields,
  }: {
    identifier?: string;
    model?: typeof GraphandModel;
    events?: HooksEvents | HooksEvents[];
    handler?: any;
    _await?: boolean;
    timeout?: number;
    priority?: number;
    fields?: string[];
  }) {
    await this._init();
    let hook;
    let socket;

    _await = _await === undefined ? handler.constructor.name === "AsyncFunction" : _await;

    if (!identifier) {
      identifier = `${events.toString()}:${model.scope}`;
    }

    if (this._registerHooks.has(identifier)) {
      console.warn(`Duplicate identifier ${identifier} for differents sockethooks`);
    } else {
      this._registerHooks.add(identifier);
    }

    const _trigger = async (payload, hook) => {
      if (hook.await) {
        let res;
        try {
          res = await new Promise(async (resolve, reject) => {
            const resolver = handler(payload, resolve, reject);
            try {
              resolve(await resolver);
            } catch (e) {
              reject(e);
            }
          });
          await this._axios.post(`/sockethooks/${hook._id}/end`, res ?? payload);
        } catch (e) {
          console.error(e);
          this._axios.post(`/sockethooks/${hook._id}/throw`, e);
        }
      } else {
        try {
          handler(payload);
        } catch (e) {
          console.error(e);
        }
      }
    };

    const _register = async (_socket) => {
      if (!_socket?.id) {
        return;
      }

      socket = _socket;

      if (hook) {
        socket.off(`/hooks/${hook._id}`);
      }

      try {
        const Sockethook = this.getModel("Sockethook");
        const payload: any = {
          socket: socket.id,
          scope: model.scope,
          await: _await,
          actions: Array.isArray(events) ? events : [events].filter(Boolean),
          identifier,
          timeout,
          priority,
          fields,
        };

        if (!payload.actions.length) {
          throw new GraphandValidationError("Field actions is required", "actions", GraphandValidationError.Codes.REQUIRED);
        }

        hook = await Sockethook.create(payload);

        socket.off(`/hooks/${hook._id}`);
        socket.on(`/hooks/${hook._id}`, (payload) => _trigger(payload, hook));
        console.log(`sockethook ${hook.identifier} with _id ${hook._id} registered on socket ${socket.id}`);
      } catch (e) {
        console.error(`error registering sockethook`, e);
      }
    };

    this._socketSubject.subscribe((_socket) => _register(_socket));
    // console.log("waiting for socket to connect ...");
    this.connectSocket();
  }

  async getStats() {
    const { data } = await this._axios.get("/stats");
    return data && data.data;
  }

  logout() {
    this.setAccessToken(undefined);
    this.setRefreshToken(undefined);
  }

  async login(credentials) {
    const {
      data: {
        data: { accessToken, refreshToken },
      },
    } = await this._axios.post("/auth/login", credentials, {
      headers: {
        Authorization: null,
      },
    });
    this.setRefreshToken(refreshToken);
    this.setAccessToken(accessToken);
    return this;
  }

  loginWithGraphand() {
    let loginWindow;

    const height = window.outerHeight / 1.3;
    const width = window.outerWidth / 1.7;
    const top = (window.outerHeight - height) / 2;
    const left = (window.outerWidth - width) / 2;

    return new Promise((resolve, reject) => {
      const callback = ({ data }) => {
        window.removeEventListener("message", callback, false);
        timer && clearInterval(timer);
        loginWindow && loginWindow.close();
        if (!data) {
          reject();
        } else {
          this.setAccessToken(data);
          resolve(data);
        }
      };

      window.addEventListener("message", callback);

      loginWindow = window.open(
        `https://graphand.io/auth?project=${this._options.project}`,
        "_blank",
        `fullscreen=no,height=${height},width=${width},top=${top},left=${left}`,
      );

      const timer = setInterval(function () {
        if (loginWindow.closed) {
          reject();
          clearInterval(timer);
        }
      }, 100);
    });
  }

  /**
   * Clone the current client
   * @param options {ClientOptions}
   * @param login {boolean} - Define if the cloned client inherits of its parent access & refresh token
   * @returns {Client}
   */
  clone(options: ClientOptions = {}, login = true): Client {
    const clone = new Client({ ...this._options, ...options });

    if (login) {
      const accessToken = this.getAccessToken();
      const refreshToken = this.getRefreshToken();

      if (accessToken) {
        clone.setAccessToken(accessToken);
      }

      if (refreshToken) {
        clone.setRefreshToken(refreshToken);
      }
    }

    return clone;
  }

  plugin(Plugin: typeof GraphandPlugin, options: any = {}) {
    if (!Plugin.prototype?.execute) {
      throw new GraphandError("Plugin must extends GraphandPlugin class", GraphandError.Codes.INVALID_PLUGIN);
    }

    const plugin = new Plugin(this, options);
    this._plugins.add(plugin);
  }

  /* Accessors */

  connectSocket(force = false) {
    if (!force && this.socket) {
      return this.socket;
    }

    const socket = setupSocket(this);
    this._socketSubject.next(socket);

    return this;
  }

  disconnectSocket() {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();

    return this;
  }

  reconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.connectSocket(true);
  }

  getGraphandModel(scope: ModelScopes, options?: any) {
    if (!this._models[scope]?._registeredAt) {
      const found = this._options.models.find((m) => (Array.isArray(m) ? m[0] === scope || m[0]?.scope === scope : m === scope || m.scope === scope));
      if (found && Array.isArray(found) && typeof found[1] === "object") {
        Object.assign(options, found[1]);
      }
      let model = found && Array.isArray(found) ? found[0] : found;
      if (model?.apiIdentifier) {
        options.extend = options.extend ?? true;
      } else {
        model = Object.values(models).find((m) => m.scope === scope);
        if (!model) {
          throw new Error(`Model ${scope} not found`);
        }
        model = class extends model {};
      }

      this.registerModel(model, options);
    }

    return this._models[scope];
  }

  setLocale(locale: string) {
    this._locale = locale;
  }

  hydrate(data: any, upsert: boolean) {
    return hydrateModel(this, data, upsert);
  }

  /**
   * Destroy the current client
   */
  async detroy() {
    const plugins = Array.from(this._plugins);
    await Promise.all(plugins.map((p) => p.execute(PluginLifecyclePhases.UNINSTALL)));
  }
}

export default Client;
