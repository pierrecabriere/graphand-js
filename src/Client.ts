import axios, { AxiosInstance } from "axios";
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
import GraphandSocketHook from "./utils/GraphandSocketHook";

interface ClientOptions {
  project: string;
  accessToken?: string;
  locale: string;
  translations: string[];
  host?: string;
  socket: boolean;
  ssl: boolean;
  unloadTimeout: number;
}

const defaultOptions = {
  host: "api.graphand.io",
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
          error.graphandErrors = error.graphandErrors.concat(errors.map((e) => GraphandError.fromJSON(e)));
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

    return this.init();
  }

  get models(): any {
    return new Proxy(this, {
      get: function (oTarget, sKey) {
        if (!oTarget._models[sKey]) {
          switch (sKey) {
            case "Aggregation":
              oTarget._models[sKey] = Aggregation;
              oTarget.registerModel(oTarget._models[sKey], { name: "Aggregation" });
              break;
            case "Module":
              oTarget._models[sKey] = Module;
              oTarget.registerModel(oTarget._models[sKey], { name: "Module" });
              break;
            case "User":
              oTarget._models[sKey] = User;
              oTarget.registerModel(oTarget._models[sKey], { name: "User" });
              break;
            case "Project":
              oTarget._models[sKey] = Project;
              oTarget.registerModel(oTarget._models[sKey], { name: "Project" });
              break;
            case "Data":
              oTarget._models[sKey] = Data;
              oTarget.registerModel(oTarget._models[sKey], { name: "Data" });
              break;
            case "Account":
              oTarget._models[sKey] = Account;
              oTarget.registerModel(oTarget._models[sKey], { name: "Account" });
              break;
            case "Role":
              oTarget._models[sKey] = Role;
              oTarget.registerModel(oTarget._models[sKey], { name: "Role" });
              break;
            case "Rule":
              oTarget._models[sKey] = Rule;
              oTarget.registerModel(oTarget._models[sKey], { name: "Rule" });
              break;
            case "Restriction":
              oTarget._models[sKey] = Restriction;
              oTarget.registerModel(oTarget._models[sKey], { name: "Restriction" });
              break;
            case "DataField":
              oTarget._models[sKey] = DataField;
              oTarget.registerModel(oTarget._models[sKey], { name: "DataField" });
              break;
            case "DataModel":
              oTarget._models[sKey] = DataModel;
              oTarget.registerModel(oTarget._models[sKey], { name: "DataModel" });
              break;
            case "Media":
              oTarget._models[sKey] = Media;
              oTarget.registerModel(oTarget._models[sKey], { name: "Media" });
              break;
            case "Token":
              oTarget._models[sKey] = Token;
              oTarget.registerModel(oTarget._models[sKey], { name: "Token" });
              break;
            case "Webhook":
              oTarget._models[sKey] = Webhook;
              oTarget.registerModel(oTarget._models[sKey], { name: "Webhook" });
              break;
            default:
              const Model = class extends Data {
                static apiIdentifier = sKey;
              };
              Object.defineProperty(Model, "name", { value: sKey });
              oTarget.registerModel(Model, { name: sKey.toString() });
              oTarget._models[sKey] = Model;
              break;
          }
        }

        return oTarget._models[sKey];
      },
    });
  }

  getModelByIdentifier(identifier: string) {
    const Model = Object.values(this._models).find((m: any) => m.apiIdentifier === identifier);
    return Model || this.models[identifier];
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
    if (options.force) {
      Model.__registered = false;
      Model.clearCache();
    }

    if (Model.__registered) {
      return;
    }

    const _name = options.name || Model.name;

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

  registerHook({ model, action, trigger, _await, timeout, priority }) {
    let _hook;
    _await = _await === undefined ? trigger.constructor.name === "AsyncFunction" : _await;

    const _trigger = async (payload) => {
      if (_hook.await) {
        let res;
        try {
          if (trigger.constructor.name === "AsyncFunction") {
            // @ts-ignore
            res = await trigger(payload);
          } else {
            res = await new Promise((resolve) => trigger(payload, resolve));
          }
        } catch (e) {
          console.error(e);
        }

        this.socket.emit(`/hooks/${_hook.id}`, res ?? payload);
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

      const {
        data: { data: hook },
      } = await this._axios.post("/sockethooks", { socket: this.socket.id, on: model.baseUrl, await: _await, action, timeout, priority });
      _hook = hook;

      this.socket.on(`/hooks/${_hook.id}`, _trigger);
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
    if (/^DataItem:/.test(scope)) {
      const { 1: _id } = scope.match(/^DataItem:(.+?)$/);
      const model = this.models.DataModel.get(_id, wait);
      return model && this.getModelByIdentifier(model.slug);
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
