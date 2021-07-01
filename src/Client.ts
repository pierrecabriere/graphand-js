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
  locale: undefined,
  translations: undefined,
  realtime: undefined,
  autoMapQueries: false,
  autoSync: false,
  subscribeFields: false,
  init: true,
  initModels: false,
  models: [],
};

class Client implements ClientType {
  static models = models;

  private _initPromise;
  _models;
  _options;
  _axios;
  _project;
  _socketSubject;
  _mediasQueueSubject;
  _initialized;

  constructor(project: string | ClientOptions, options: ClientOptions = {}) {
    options = project && typeof project === "object" ? { ...project, ...options } : options;
    if (typeof project === "string" && !options.project) {
      options.project = project;
    }
    this._options = { ...defaultOptions, ...options };
    this._socketSubject = new Subject();
    this._mediasQueueSubject = new BehaviorSubject([]);
    this._initialized = false;
    this._models = {};

    this._axios = setupAxios(this);

    if (this._options.accessToken) {
      this.accessToken = this._options.accessToken;
    }

    if (this._options.project && this._options.init) {
      this.init();
    }

    if (this._options.realtime) {
      this.connectSocket();
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

  private _socket;

  get socket() {
    return this._socket;
  }

  private _accessToken;

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(token: string) {
    this.setAccessToken(token);
  }

  private _locale;

  async init(force = false) {
    if (force || !this._initPromise) {
      this._initPromise = new Promise(async (resolve, reject) => {
        try {
          // if (this._options.project) {
          //   const Project = this.getModel("Project");
          //
          //   try {
          //     const { data } = await this._axios.get("/projects/current");
          //     this._project = data.data;
          //     Project.upsertStore(new Project(this._project));
          //     if (!this.locale) {
          //       this.locale = this._options.locale || this._project.defaultLocale;
          //     }
          //   } catch (e) {
          //     delete this._initPromise;
          //     console.error(e);
          //     reject("Impossible to init project");
          //     return;
          //   }
          // } else {
          //   this._project = null;
          // }

          if (this._options.initModels) {
            const dataModels = await this.getModel("DataModel").getList({});
            const scopes = ["Account", "Media"].concat(dataModels.map((m) => `Data:${m.slug}`));
            await this.registerModels(this._options.models.concat(scopes), { extend: true });
          } else {
            await this.registerModels(this._options.models, { extend: true });
          }

          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    }

    return await this._initPromise;
  }

  get locale() {
    return this._locale;
  }

  set locale(locale: string) {
    this.setLocale(locale);
  }

  getModels(scopes, options?) {
    return scopes.map((scope: string) => this.getModel(scope, options));
  }

  static createClient(options: ClientOptions) {
    return new Client(options);
  }

  getModelByIdentifier(identifier: string, options: any = {}) {
    const scope = `Data:${identifier}`;
    if (!this._models[scope]) {
      let model = this._options.models.find((m: any) => m.scope === scope);
      if (model) {
        options.extend = options.extend ?? true;
      } else {
        model = class extends Data {};
        model.apiIdentifier = identifier;
      }

      this.registerModel(model, options);
    }

    return this._models[scope];
  }

  registerModel(Model: any, options?) {
    if (!Model) {
      return;
    }

    Model = typeof Model === "string" ? this.getModel(Model) : Model;

    if (!Model || !Model.scope) {
      throw new Error(`You tried to register a Model without scope`);
    }

    options = Object.assign({}, { sync: undefined, name: undefined, force: false, fieldsIds: undefined, extend: false }, options);
    options.sync = options.sync ?? this._options.autoSync;

    const _name = options.name || Model.scope;

    if (Model._registeredAt) {
      if (Model._client === this) {
        if (!options.force) {
          console.error(`You tried to register a Model already registered on the same client. Use force option to prevent overriding`, _name);
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
    this._models[_name]._fieldsSubscription = null;
    this._models[_name]._initialized = false;
    this._models[_name]._fieldsObserver = null;
    this._models[_name]._observers = new Set([]);
    this._models[_name]._socketTriggerSubject = new Subject();
    this._models[_name]._initPromise = null;
    this._models[_name]._listSubject = new BehaviorSubject([]);
    this._models[_name]._registeredAt = new Date();

    try {
      if (options.sync) {
        this._models[_name].sync();
      }

      if (options.fieldsIds) {
        this._models[_name]._fieldsIds = options.fieldsIds;
      }

      this._models[_name].init();
    } catch (e) {}

    return this._models[_name];
  }

  async registerModels(modelsList, options: any = {}) {
    const scopes = modelsList.map((model) => (typeof model === "string" ? model : model.scope));
    const fields = await this.getModel("DataField").getList({ query: { scope: { $in: scopes } } });
    await Promise.all(
      modelsList.map(async (model) => {
        const scope = typeof model === "string" ? model : model.scope;
        const fieldsIds = fields.filter((f) => f.scope === scope).map((f) => f._id);
        await this.registerModel(model, { ...options, fieldsIds });
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
          this._axios.post(`/sockethooks/${hook._id}/end`, res ?? payload);
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
      if (!_socket) {
        return;
      }

      socket = _socket;

      if (hook) {
        socket.off(`/hooks/${hook._id}`);
      }

      try {
        hook = await this.getModel("Sockethook").create({
          socket: socket.id,
          scope: model.scope,
          await: _await,
          identifier,
          action,
          timeout,
          priority,
          fields,
        });

        console.error(`sockethook ${hook.identifier} with _id ${hook._id} registered on socket ${socket.id}`);
        socket.on(`/hooks/${hook._id}`, (payload) => _trigger(payload, hook));
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
    this.accessToken = this._options.accessToken || undefined;
    Object.values(this._models).forEach((model: any) => {
      model.clearCache();
    });
  }

  async login(credentials) {
    const {
      data: {
        data: { accessToken },
      },
    } = await this._axios.post("/auth/login", credentials);
    this.accessToken = accessToken;
    return accessToken;
  }

  loginWithGraphand = () => {
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
          this.accessToken = data;
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
  };

  create(options: ClientOptions) {
    return new Client({ ...this._options, ...options });
  }

  clone() {
    return this.create.apply(this, arguments);
  }

  plugin(plugin: Function, options: any = {}) {
    plugin(this, options);
  }

  /* Accessors */

  connectSocket() {
    if (this.socket) {
      return this.socket;
    }

    this._socket = setupSocket(this);

    return this._socket;
  }

  disconnectSocket(triggerSubject = true) {
    if (!this._socket) {
      return;
    }

    this._socket.disconnect();
    delete this._socket;

    if (triggerSubject) {
      this._socketSubject.next(null);
    }
  }

  reconnectSocket() {
    if (this._socket) {
      this._socket.disconnect();
      delete this._socket;
    }

    this.connectSocket();
  }

  getModel(scope, options?) {
    if (typeof scope === "object" && scope?.scope) {
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

  getGraphandModel(scope, options: any = {}) {
    if (!this._models[scope]?._registeredAt) {
      let model = this._options.models.find((m) => m.scope === scope);
      if (model) {
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

  setAccessToken(token: string) {
    this._accessToken = token;

    if (this._options.realtime) {
      if (token) {
        this.reconnectSocket();
      } else {
        this.disconnectSocket();
      }
    }
  }

  setLocale(locale: string) {
    this._locale = locale;
  }
}

export default Client;
