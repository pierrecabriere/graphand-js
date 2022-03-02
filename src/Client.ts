import { ObjectID } from "bson";
import { BehaviorSubject, Subject } from "rxjs";
import { ClientOptions, ClientType } from "./interfaces";
import * as lib from "./lib";
import * as models from "./models";
import Data from "./models/Data";
import Sockethook from "./models/Sockethook";
import { setupAxios, setupSocket, verifyScopeFormat } from "./utils";

const defaultOptions = {
  host: "api.graphand.io",
  cdn: "cdn.graphand.io",
  ssl: true,
  unloadTimeout: 100,
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

class Client implements ClientType {
  static models = models;

  private _initPromise;
  private _registerHooks;
  private _refreshTokenPromise;

  _uid;
  _models;
  _options;
  _axios;
  _project;
  _socketSubject;
  _mediasQueueSubject;
  _accessTokenSubject;
  _refreshTokenSubject;
  _initialized;

  constructor(project: string | ClientOptions, options: ClientOptions = {}) {
    options = project && typeof project === "object" ? { ...project, ...options } : options;
    if (typeof project === "string" && !options.project) {
      options.project = project;
    }
    options.env = options.env || "master";

    this._registerHooks = new Set();

    this._uid = new ObjectID().toString();
    this._options = { ...defaultOptions, ...options };
    this._socketSubject = new BehaviorSubject(null);
    this._mediasQueueSubject = new BehaviorSubject([]);
    this._accessTokenSubject = new BehaviorSubject(options.accessToken);
    this._refreshTokenSubject = new BehaviorSubject(options.refreshToken);
    this._initialized = false;
    this._models = {};
    this._axios = setupAxios(this);

    if (this._options.accessToken) {
      this.setRefreshToken(this._options.accessToken);
    }

    if (this._options.project && this._options.init) {
      this.init();
    }

    if (this._options.realtime) {
      this.connectSocket();
    }

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
  }

  get models(): any {
    return new Proxy(this, {
      get: function (oTarget, sKey: string) {
        try {
          return oTarget.getGraphandModel(sKey);
        } catch (e) {
          return oTarget.getModelByIdentifier(sKey);
        }
      },
    });
  }

  static lib = lib;

  get socket() {
    return this._socketSubject.getValue();
  }

  getAccessToken() {
    return this._accessTokenSubject.getValue();
  }

  getRefreshToken() {
    return this._refreshTokenSubject.getValue();
  }

  set accessToken(token: string) {
    this.setAccessToken(token);
  }

  async refreshToken() {
    if (this._refreshTokenPromise) {
      return this._refreshTokenPromise;
    }

    const accessToken = this._accessTokenSubject.getValue();
    const refreshToken = this._refreshTokenSubject.getValue();

    if (!accessToken || !refreshToken) {
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

    this._refreshTokenPromise.finally(() => delete this._refreshTokenPromise);

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

  private _locale;

  async init(force = false) {
    if (force || !this._initPromise) {
      this._initPromise = new Promise(async (resolve, reject) => {
        try {
          const [Project] = this.getModels(["Project"]);
          await Promise.all([
            (async () => {
              if (this._options.project) {
                if (this._options.initModels) {
                  const [DataModel] = this.getModels(["DataModel"]);
                  const dataModels = await DataModel.getList({});
                  const scopes = ["Account", "Media"].concat(dataModels.map((m) => `Data:${m.slug}`));
                  await this.registerModels(this._options.models.concat(scopes), { extend: true });
                } else {
                  await this.registerModels(this._options.models, { extend: true });
                }
              }
            })(),
            (async () => {
              if (this._options.initProject && this._options.project) {
                await Project.getCurrent();
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

  get locale() {
    return this._locale;
  }

  set locale(locale: string) {
    this.setLocale(locale);
  }

  getModels(scopes, options: any = {}) {
    return scopes.map((scope: string) => this.getModel(scope, options));
  }

  static createClient(options: ClientOptions) {
    return new Client(options);
  }

  getModelByIdentifier(identifier: string, options: any = {}) {
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

    options = Object.assign({}, { sync: undefined, name: undefined, force: false, fieldsIds: undefined, extend: false }, options);
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
    this._models[_name]._cache = {};
    this._models[_name]._socketSubscription = null;
    this._models[_name]._fieldsIds = options.fieldsIds;
    this._models[_name]._dataFields = {};
    this._models[_name]._fieldsList = null;
    this._models[_name]._initialized = false;
    this._models[_name]._observers = new Set([]);
    this._models[_name]._socketTriggerSubject = new Subject();
    this._models[_name]._initPromise = null;
    this._models[_name]._listSubject = options.cache ? new BehaviorSubject([]) : null;
    this._models[_name]._registeredAt = new Date();
    this._models[_name]._socketOptions = null;
    this._models[_name]._queryIds = new Set();
    this._models[_name]._queryIdsTimeout = null;
    this._models[_name]._cachedFields = null;

    try {
      if (options.sync) {
        const syncOpts = typeof options.sync === "object" ? options.sync : undefined;
        this._models[_name].sync(syncOpts);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      this._models[_name].init();
    } catch (e) {
      console.error(e);
    }

    return this._models[_name];
  }

  async registerModels(list, options: any = {}) {
    const modelsList = list.map((item) => (Array.isArray(item) ? item[0] : item));
    const scopes = modelsList.map((model) => (typeof model === "string" ? model : model.scope));
    const DataField = this.getModel("DataField");
    const fields = (await DataField.getList({ query: { scope: { $in: scopes } }, pageSize: 1000 })).toArray();
    await Promise.all(
      modelsList.map(async (model, index) => {
        const scope = typeof model === "string" ? model : model.scope;
        const modelOptions = (Array.isArray(list[index]) && list[index][1]) || {};
        const fieldsIds = fields.filter((f) => f.scope === scope).map((f) => f._id);
        await this.registerModel(model, { ...options, ...modelOptions, fieldsIds });
      }),
    );
  }

  async registerHook({ identifier, model, action, trigger, _await, timeout, priority, fields }) {
    await this.init();
    let hook;
    let socket;

    _await = _await === undefined ? trigger.constructor.name === "AsyncFunction" : _await;

    if (!identifier) {
      identifier = `${action}:${model.scope}`;
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
          res = await new Promise((resolve, reject) => {
            const resolver = trigger(payload, resolve, reject);
            if (typeof resolver.then === "function") {
              resolver.then(resolve);
            }
            if (typeof resolver.catch === "function") {
              resolver.catch(reject);
            }
          });
          await this._axios.post(`/sockethooks/${hook._id}/end`, res ?? payload);
        } catch (e) {
          console.error(e);
          this._axios.post(`/sockethooks/${hook._id}/throw`, e);
        }
      } else {
        try {
          trigger(payload);
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
        hook = await Sockethook.create({
          socket: socket.id,
          scope: model.scope,
          await: _await,
          identifier,
          action,
          timeout,
          priority,
          fields,
        });

        socket.off(`/hooks/${hook._id}`);
        socket.on(`/hooks/${hook._id}`, (payload) => _trigger(payload, hook));
        console.log(`sockethook ${hook.identifier} with _id ${hook._id} registered on socket ${socket.id}`);
      } catch (e) {
        console.error(`error registering sockethook`, e);
      }
    };

    this._socketSubject.subscribe((_socket) => _register(_socket));
    this.connectSocket();
  }

  async getStats() {
    const { data } = await this._axios.get("/stats");
    return data && data.data;
  }

  logout() {
    this.setAccessToken(undefined);
    this.setRefreshToken(undefined);
    Object.values(this._models).forEach((model: any) => {
      model.clearCache();
    });
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

  create(options: ClientOptions) {
    return new Client({ ...this._options, ...options });
  }

  clone() {
    return this.create.apply(this, arguments);
  }

  plugin(_plugin: Function, options: any = {}) {
    if (typeof _plugin !== "function") {
      return;
    }

    _plugin.apply(this, [this, options]);
  }

  /* Accessors */

  connectSocket(force = false) {
    if (!force && this.socket) {
      return this.socket;
    }

    const socket = setupSocket(this);

    return this._socketSubject.next(socket);
  }

  disconnectSocket(triggerSubject = true) {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();

    if (triggerSubject) {
      this._socketSubject.next(null);
    }
  }

  reconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.connectSocket(true);
  }

  getModel(scope, options: any = {}) {
    if (scope?.scope) {
      scope = scope.scope;
    }

    verifyScopeFormat(scope);

    try {
      const { 1: slug } = scope.match(/^Data:([a-zA-Z0-9\-_]+?)$/);
      return this.getModelByIdentifier(slug, options);
    } catch (e) {
      return this.getGraphandModel(scope, options);
    }
  }

  getGraphandModel(scope, options?: any) {
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
}

export default Client;
