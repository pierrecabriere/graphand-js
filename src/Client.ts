import { BehaviorSubject, Subject } from "rxjs";
import { ClientOptions, ClientType } from "./interfaces";
import * as lib from "./lib";
import GraphandModel from "./lib/GraphandModel";
import * as models from "./models";
import Data from "./models/Data";
import Sockethook from "./models/Sockethook";
import { extendsModel, setupAxios, setupSocket, verifyScopeFormat } from "./utils";

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
  models: [],
};

class Client implements ClientType {
  static models = models;
  GraphandModel;

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
    this.GraphandModel = GraphandModel.setClient(this);
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
        return oTarget.getGraphandModel(sKey) || oTarget.getModelByIdentifier(sKey);
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
        if (this._options.project) {
          try {
            const { data } = await this._axios.get("/projects/current");
            this._project = data.data;
            this.models.Project.upsertStore(new this.models.Project(this._project));
            if (!this.locale) {
              this.locale = this._options.locale || this._project.defaultLocale;
            }
          } catch (e) {
            delete this._initPromise;
            console.error(e);
            reject("Impossible to init project");
            return;
          }
        } else {
          this._project = null;
        }

        resolve(true);
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

  getModels(scopes, options?) {
    return scopes.map((scope: string) => this.getModel(scope, options));
  }

  static createClient(options: ClientOptions) {
    return new Client(options);
  }

  getModelByIdentifier(identifier: string, options = {}) {
    const Model = Object.values(this._models).find((m: any) => m.apiIdentifier === identifier);
    if (Model) {
      return Model;
    }

    if (!this._models[`Data:${identifier}`]) {
      const DataClass = extendsModel(Data, this);
      const Model = class extends DataClass {
        static apiIdentifier = identifier;
      };
      this.registerModel(Model, options);
    }

    return this._models[`Data:${identifier}`];
  }

  registerModel(Model: any, options?) {
    if (!Model) {
      return;
    }

    if (!Model.scope) {
      console.warn(`You registered a Model without scope`, Model);
      return null;
    }

    options = Object.assign({}, { sync: undefined, name: undefined, force: false, fieldsIds: undefined }, options);
    options.sync = options.sync ?? this._options.autoSync;

    const _name = options.name || Model.scope;

    if (!options.force && this._models[_name]?._registered) {
      return this._models[_name];
    }

    this._models[_name] = extendsModel(Model, this);
    this._models[_name]._registered = true;

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

  async registerModels(modelsList, options?) {
    const scopes = modelsList.map((model) => (typeof model === "string" ? model : model.scope));
    const fields = await this.models.DataField.getList({ query: { scope: { $in: scopes } } });
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

  getModelFromScope(scope: string, wait = false) {
    if (/^Data:/.test(scope)) {
      const { 1: slug } = scope.match(/^Data:(.+?)$/);
      return this.getModelByIdentifier(slug);
    }

    return this.models[scope];
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
    verifyScopeFormat(scope);

    try {
      const { 1: slug } = scope.match(/^Data:([a-zA-Z0-9\-_]+?)$/);
      return this.getModelByIdentifier(slug, options);
    } catch (e) {
      return this.getGraphandModel(scope, options);
    }
  }

  getGraphandModel(scope, options?) {
    if (!this._models[scope]?._registered) {
      const model = this._options.models.find((m) => m.scope === scope) || Object.values(models).find((m) => m.scope === scope);
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

  /* Aliases */

  getModelByScope(scope: string) {
    return this.getModel(scope);
  }
}

export default Client;
