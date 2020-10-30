import axios, { AxiosInstance } from "axios";
import md5 from "md5";
import { Subject } from "rxjs";
import io from "socket.io-client";
import Account from "./models/Account";
import Aggregation from "./models/Aggregation";
import Data from "./models/Data";
import DataField from "./models/DataField";
import DataModel from "./models/DataModel";
import Media from "./models/Media";
import Module from "./models/Module";
import Project from "./models/Project";
import Restriction from "./models/Restriction";
import Role from "./models/Role";
import Rule from "./models/Rule";
import Token from "./models/Token";
import User from "./models/User";
import Webhook from "./models/Webhook";
import GraphandError from "./utils/GraphandError";
import GraphandModel from "./utils/GraphandModel";

interface ClientOptions {
  project: string;
  accessToken?: string;
  locale: string;
  translations: string[];
  host?: string;
  cdn?: string;
  socket: boolean;
  ssl: boolean;
  unloadTimeout: number;
}

const defaultOptions = {
  host: "api.graphand.io",
  cdn: "cdn.graphand.io",
  ssl: true,
  unloadTimeout: 100,
};

class Client {
  _options: ClientOptions;
  _axios: AxiosInstance;
  private _socket: any;
  private _accessToken: string;
  private _locale: string;
  private _loadStack = [];
  worker = new Subject();
  _project: any;
  _models: any = {};
  socketSubject = new Subject();
  mediasQueue = [];
  mediasQueueSubject = new Subject();
  loadTimeout;
  prevLoading;
  initialized = false;

  GraphandModel = GraphandModel.setClient(this);

  constructor(options: ClientOptions) {
    this._options = Object.assign({}, defaultOptions, options);

    this._axios = axios.create({
      baseURL: `${this._options.ssl ? "https" : "http"}://${this._options.project ? `${this._options.project}.` : ""}${this._options.host}`,
    });

    this._axios.interceptors.request.use((config) => {
      // @ts-ignore
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

    if (this._options.project) {
      this.init();
    }

    if (this._options.socket) {
      this.connectSocket();
    }
  }

  isLoading(key?) {
    return key ? this._loadStack.includes(key) : !!this._loadStack.length;
  }

  get loading() {
    return this.isLoading();
  }

  private load(key) {
    if (this._loadStack.includes(key)) {
      return null;
    }

    this._loadStack.push(key);
    this.loadTimeout && clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(() => {
      if (this.loading !== this.prevLoading) {
        this.prevLoading = this.loading;
        this.worker.next(this.loading);
      }
    });
  }

  private unload(key) {
    this._loadStack.splice(this._loadStack.indexOf(key), 1);
    this.loadTimeout && clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(() => {
      if (this.loading !== this.prevLoading) {
        this.prevLoading = this.loading;
        this.worker.next(this.loading);
      }
    }, this._options.unloadTimeout);
  }

  connectSocket() {
    if (this._socket) {
      this.disconnectSocket(false);
    }

    this._socket = io.connect(`${this._options.ssl ? "https" : "http"}://${this._options.host}`, {
      query: { token: this.accessToken, projectId: this._options.project },
    });

    this.socket.on("connect", () => {
      this.socketSubject.next(this.socket);
    });

    this.socket.on("/uploads", ({ action, payload }) => {
      const queueItem = this.mediasQueue.find((item) => (payload.socket ? item.socket === payload.socket : item.name === payload.name));
      payload.status = action;
      switch (action) {
        case "start":
          this.mediasQueue.push(payload);
          break;
        case "progress":
        case "end":
        case "aborted":
          if (queueItem) {
            Object.assign(queueItem, payload);
          } else {
            this.mediasQueue.push(payload);
          }
      }
      this.mediasQueueSubject.next({ action, payload });
    });
  }

  disconnectSocket(triggerSubject = true) {
    this._socket?.disconnect();
    delete this._socket;

    if (triggerSubject) {
      this.socketSubject.next(null);
    }
  }

  async init() {
    if (this.initialized) {
      return;
    }

    this.load("project");

    if (this._options.project) {
      try {
        const { data } = await this._axios.get("/projects/current");
        this._project = data.data;
        this.models.Project.upsertStore(new this.models.Project(this._project));
        if (!this.locale) {
          this.locale = this._options.locale || this._project.defaultLocale;
        }
      } catch (e) {
        console.error(e);
        throw new Error("Impossible to init project");
      }
    } else {
      this._project = null;
    }

    this.unload("project");

    this.initialized = true;
  }

  reinit() {
    this.initialized = false;

    Object.values(this._models).forEach((model: any) => model.clearCache(undefined, true));

    return this.init();
  }

  extendsModel(Class) {
    return class extends Class {
      static cache = {};
      static _listSubject;
    };
  }

  getModel(sKey) {
    if (!this._models[sKey]) {
      switch (sKey) {
        case "Aggregation":
          this._models[sKey] = this.extendsModel(Aggregation);
          break;
        case "Module":
          this._models[sKey] = this.extendsModel(Module);
          break;
        case "User":
          this._models[sKey] = this.extendsModel(User);
          break;
        case "Project":
          this._models[sKey] = this.extendsModel(Project);
          break;
        case "Data":
          this._models[sKey] = this.extendsModel(Data);
          break;
        case "Account":
          this._models[sKey] = this.extendsModel(Account);
          break;
        case "Role":
          this._models[sKey] = this.extendsModel(Role);
          break;
        case "Rule":
          this._models[sKey] = this.extendsModel(Rule);
          break;
        case "Restriction":
          this._models[sKey] = this.extendsModel(Restriction);
          break;
        case "DataField":
          this._models[sKey] = this.extendsModel(DataField);
          break;
        case "DataModel":
          this._models[sKey] = this.extendsModel(DataModel);
          break;
        case "Media":
          this._models[sKey] = this.extendsModel(Media);
          break;
        case "Token":
          this._models[sKey] = this.extendsModel(Token);
          break;
        case "Webhook":
          this._models[sKey] = this.extendsModel(Webhook);
          break;
        default:
          const DataClass = this.extendsModel(Data);
          const Model = class extends DataClass {
            static apiIdentifier = sKey;
          };
          this.registerModel(Model);
          this._models[sKey] = Model;
          break;
      }
    }

    return this._models[sKey];
  }

  get models(): any {
    return new Proxy(this, {
      get: function (oTarget, sKey) {
        return oTarget.getModel(sKey);
      },
    });
  }

  getModelByIdentifier(identifier: string) {
    const Model = Object.values(this._models).find((m: any) => m.apiIdentifier === identifier);
    return Model || this.models[identifier];
  }

  getModelByScope(scope: string) {
    try {
      const { 1: slug } = scope.match(/^Data:(.+?)$/);
      return this.getModelByIdentifier(slug);
    } catch (e) {
      return this.getModel(scope);
    }
  }

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(token: string) {
    this.setAccessToken(token);
  }

  setAccessToken(token: string) {
    this._accessToken = token;

    if (this._options.socket) {
      if (token) {
        this.connectSocket();
      } else {
        this.disconnectSocket();
      }
    }
  }

  get socket() {
    return this._socket;
  }

  async registerModel(Model: any, options: { sync?: boolean; name?: string; force?: boolean } = {}) {
    options.sync = options.sync ?? this._options.socket;

    if (options.force) {
      Model.__registered = false;
      Model.clearCache();
    }

    if (Model.__registered) {
      return;
    }

    const _name = options.name || Model.scope;

    if (_name) {
      this._models[_name] = Model;
    }

    this.load(Model);
    try {
      Model.setClient(this);

      if (options.sync) {
        Model.sync();
      }

      await Model.init();
      Model.__registered = true;
      // Model.clearCache();
    } catch (e) {}
    this.unload(Model);
    return Model;
  }

  registerHook({ identifier, model, action, trigger, _await, timeout, priority }) {
    let _hook;
    _await = _await === undefined ? trigger.constructor.name === "AsyncFunction" : _await;

    if (!identifier) {
      identifier = md5(trigger.toString());
    }

    const _trigger = async (payload) => {
      if (_hook.await) {
        let res;
        try {
          if (trigger.constructor.name === "AsyncFunction") {
            res = await trigger(payload);
          } else {
            res = await new Promise((resolve, reject) => trigger(payload, resolve, reject));
          }
          this.socket.emit(`/hooks/${_hook.id}/end`, res ?? payload);
        } catch (e) {
          this.socket.emit(`/hooks/${_hook.id}/error`, e);
        }
      } else {
        trigger(payload);
      }
    };

    const _register = async (unregister = true) => {
      if (!this.socket) {
        return;
      }

      if (unregister) {
        _unregister();
      }

      try {
        const {
          data: { data: hook },
        } = await this._axios.post("/sockethooks", {
          socket: this.socket.id,
          on: model.baseUrl,
          await: _await,
          identifier,
          action,
          timeout,
          priority,
        });
        _hook = hook;

        this.socket.on(`/hooks/${_hook.id}`, _trigger);
      } catch (e) {
        console.error(e);
      }
    };

    const _unregister = () => {
      if (!_hook) {
        return;
      }

      this.socket.off(`/hooks/${_hook.id}`);
    };

    this.socketSubject.asObservable().subscribe(() => _register());

    if (!this.socket) {
      this.connectSocket();
    } else {
      _register(false);
    }
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

  setLocale(locale: string) {
    this._locale = locale;
  }

  static createClient(options: ClientOptions) {
    return new Client(options);
  }

  logout() {
    this.accessToken = undefined;
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

  async getStats() {
    const {
      data: { data },
    } = await this._axios.get("/stats");
    return data;
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
        "http://graphand.io.local:3000/auth",
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

  plugin(plugin: Function, options: any = {}) {
    plugin(this, options);
  }
}

export default Client;
