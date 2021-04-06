import axios, { AxiosInstance } from "axios";
import md5 from "md5";
import { BehaviorSubject, Subject } from "rxjs";
import io from "socket.io-client";
import Account from "./models/Account";
import Aggregation from "./models/Aggregation";
import Data from "./models/Data";
import DataField from "./models/DataField";
import DataModel from "./models/DataModel";
import EsMapping from "./models/EsMapping";
import Media from "./models/Media";
import Module from "./models/Module";
import Project from "./models/Project";
import Restriction from "./models/Restriction";
import Role from "./models/Role";
import Rule from "./models/Rule";
import Sockethook from "./models/Sockethook";
import Token from "./models/Token";
import User from "./models/User";
import Webhook from "./models/Webhook";
import GraphandError from "./lib/GraphandError";
import GraphandModel from "./lib/GraphandModel";
import Log from "./models/Log";
import * as lib from "./lib";

interface ClientOptions {
  project?: string;
  accessToken?: string;
  locale?: string;
  translations?: string[];
  host?: string;
  cdn?: string;
  realtime?: boolean;
  autoSync?: boolean;
  autoMapQueries?: boolean;
  ssl?: boolean;
  unloadTimeout?: number;
  subscribeFields?: boolean;
  init?: boolean;
}

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
};

class Client {
  _options: ClientOptions;
  _axios: AxiosInstance;
  private _socket: any;
  private _initPromise;
  private _accessToken: string;
  private _locale: string;
  _project: any;
  _models: any = {};
  socketSubject = new Subject();
  mediasQueueSubject = new BehaviorSubject([]);
  initialized = false;

  GraphandModel = GraphandModel.setClient(this);

  static lib = lib;

  constructor(project: string | ClientOptions, options: ClientOptions = {}) {
    options = project && typeof project === "object" ? { ...project, ...options } : options;
    if (typeof project === "string" && !options.project) {
      options.project = project;
    }
    this._options = { ...defaultOptions, ...options };

    this._axios = axios.create({
      baseURL: `${this._options.ssl ? "https" : "http"}://${this._options.project ? `${this._options.project}.` : ""}${this._options.host}`,
    });

    this._axios.interceptors.request.use((config: any) => {
      config.data = config.data || config._data;
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        const token = this.accessToken || this._options.accessToken;
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (/\/users/.test(config.url)) {
        config.baseURL = `${this._options.ssl ? "https" : "http"}://${this._options.host}`;
      }

      return config;
    });

    this._axios.interceptors.response.use(
      (r) => r,
      (error) => {
        try {
          const { errors } = error.response.data;
          error.graphandErrors = error.graphandErrors || [];
          error.graphandErrors = error.graphandErrors.concat(errors.map((e) => GraphandError.fromJSON(e, error.response.status)));
        } catch (e) {}

        return Promise.reject(error.graphandErrors || [new GraphandError(error.message)]);
      },
    );

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

  connectSocket() {
    if (this.socket) {
      return this.socket;
    }

    this._socket = io.connect(`${this._options.ssl ? "https" : "http"}://${this._options.host}`, {
      query: { token: this.accessToken, projectId: this._options.project },
    });

    this._socket.on("/uploads", ({ action, payload }) => {
      const queueItem = this.mediasQueueSubject.value.find((item) => (payload.socket ? item.socket === payload.socket : item.name === payload.name));
      payload.status = action;
      switch (action) {
        case "start":
          this.mediasQueueSubject.next(this.mediasQueueSubject.value.concat(payload));
          break;
        case "end":
        case "aborted":
        case "progress":
          this.mediasQueueSubject.next(this.mediasQueueSubject.value.map((item) => (item === queueItem ? Object.assign(item, payload) : item)));
          break;
      }
    });

    this._socket.on("connect", () => this.socketSubject.next(this._socket));
    this._socket.on("reconnect_error", console.log);

    return this._socket;
  }

  disconnectSocket(triggerSubject = true) {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    delete this._socket;

    if (triggerSubject) {
      this.socketSubject.next(null);
    }
  }

  reconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      delete this._socket;
    }

    this.connectSocket();
  }

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

  extendsModel(Class) {
    const client = this;
    return class extends Class {
      static _client = client;
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
    };
  }

  getModel(scope, options?) {
    try {
      const { 1: slug } = scope.match(/^Data:(.+?)$/);
      return this.getModelByIdentifier(slug, options);
    } catch (e) {
      return this.getGraphandModel(scope, options);
    }
  }

  getModels(scopes, options?) {
    return scopes.map((scope: string) => this.getModel(scope, options));
  }

  getGraphandModel(scope, options?) {
    if (!this._models[scope]) {
      switch (scope) {
        case "Aggregation":
          this._models[scope] = this.extendsModel(Aggregation);
          break;
        case "Module":
          this._models[scope] = this.extendsModel(Module);
          break;
        case "User":
          this._models[scope] = this.extendsModel(User);
          break;
        case "Project":
          this._models[scope] = this.extendsModel(Project);
          break;
        case "Data":
          this._models[scope] = this.extendsModel(Data);
          break;
        case "Account":
          this._models[scope] = this.extendsModel(Account);
          break;
        case "Role":
          this._models[scope] = this.extendsModel(Role);
          break;
        case "Rule":
          this._models[scope] = this.extendsModel(Rule);
          break;
        case "Restriction":
          this._models[scope] = this.extendsModel(Restriction);
          break;
        case "DataField":
          this._models[scope] = this.extendsModel(DataField);
          break;
        case "DataModel":
          this._models[scope] = this.extendsModel(DataModel);
          break;
        case "Media":
          this._models[scope] = this.extendsModel(Media);
          break;
        case "Token":
          this._models[scope] = this.extendsModel(Token);
          break;
        case "Webhook":
          this._models[scope] = this.extendsModel(Webhook);
          break;
        case "Sockethook":
          this._models[scope] = this.extendsModel(Sockethook);
          break;
        case "EsMapping":
          this._models[scope] = this.extendsModel(EsMapping);
          break;
        case "Log":
          this._models[scope] = this.extendsModel(Log);
          break;
        default:
          break;
      }

      this.registerModel(this._models[scope], options);
    }

    return this._models[scope];
  }

  getModelByIdentifier(identifier: string, options = {}) {
    const Model = Object.values(this._models).find((m: any) => m.apiIdentifier === identifier);
    if (Model) {
      return Model;
    }

    if (!this._models[`Data:${identifier}`]) {
      const DataClass = this.extendsModel(Data);
      const Model = class extends DataClass {
        static apiIdentifier = identifier;
      };
      this.registerModel(Model, options);
    }

    return this._models[`Data:${identifier}`];
  }

  getModelByScope(scope: string) {
    return this.getModel(scope);
  }

  get models(): any {
    return new Proxy(this, {
      get: function (oTarget, sKey: string) {
        return oTarget.getGraphandModel(sKey) || oTarget.getModelByIdentifier(sKey);
      },
    });
  }

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(token: string) {
    this.setAccessToken(token);
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

  get socket() {
    return this._socket;
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

    if (!options.force && (this._models[_name]?.__registered || Model.__registered)) {
      return;
    }

    Model.__registered = true;
    this._models[_name] = Model;

    try {
      Model.setClient(this);

      if (options.sync) {
        Model.sync();
      }

      if (options.fieldsIds) {
        Model._fieldsIds = options.fieldsIds;
      }

      Model.init();
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

    this.socketSubject.subscribe((_socket) => _register(_socket));
    this.connectSocket();
  }

  getModelFromScope(scope: string, wait = false) {
    if (/^Data:/.test(scope)) {
      const { 1: slug } = scope.match(/^Data:(.+?)$/);
      return this.getModelByIdentifier(slug);
    }

    return this.models[scope];
  }

  get locale() {
    return this._locale;
  }

  set locale(locale: string) {
    this.setLocale(locale);
  }

  async getStats() {
    const { data } = await this._axios.get("/stats");
    return data && data.data;
  }

  setLocale(locale: string) {
    this._locale = locale;
  }

  static createClient(options: ClientOptions) {
    return new Client(options);
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
}

export default Client;
