import axios, { AxiosInstance } from "axios";
import { Subject } from "rxjs";
import io from "socket.io-client";
import Account from "./models/Account";
import Data from "./models/Data";
import DataField from "./models/DataField";
import DataModel from "./models/DataModel";
import Role from "./models/Role";
import GraphandError from "./utils/GraphandError";
import GraphandModel from "./utils/GraphandModel";

interface ClientOptions {
  project: string;
  accessToken?: string;
  locales: string[];
  host?: string;
  socket: boolean;
}

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
  loadTimeout;
  prevLoading;

  GraphandModel = GraphandModel.setClient(this);

  constructor(options: ClientOptions) {
    //@ts-ignore
    this._options = options || {};

    this._axios = axios.create({
      baseURL: this._options.host || (this._options.project ? `https://${this._options.project}.api.graphand.io` : "https://api.graphand.io"),
      transformRequest: [
        (data, headers) => {
          const token = this.accessToken || this._options.accessToken;
          headers.Authorization = `Bearer ${token}`;

          return data;
        },
      ].concat(axios.defaults.transformRequest),
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

    this.socketSubject.subscribe({
      next: (reconnect = true) => {
        if (this._socket) {
          this._socket?.disconnect();
          delete this._socket;
        }

        if (reconnect) {
          this._socket = io.connect(this._options.host || "https://api.graphand.io", {
            query: { token: this.accessToken, projectId: this._options.project },
          });
        }
      },
    });

    if (this._options.accessToken) {
      this.accessToken = this._options.accessToken;
    }

    if (this._options.project) {
      this._initProject();
    }
  }

  isLoading() {
    return !!this._loadStack.length;
  }

  get loading() {
    return this.isLoading();
  }

  private load(key) {
    this._loadStack.push(key);
    this.loadTimeout && clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(() => {
      if (this.loading !== this.prevLoading) {
        this.prevLoading = this.loading;
        this.worker.next(this.loading);
      }
    }, 100);
  }

  private unload(key) {
    this._loadStack.splice(this._loadStack.indexOf(key), 1);
    this.loadTimeout && clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(() => {
      if (this.loading !== this.prevLoading) {
        this.prevLoading = this.loading;
        this.worker.next(this.loading);
      }
    }, 100);
  }

  private async _initProject() {
    this.load("project");
    try {
      const { data } = await axios.get(`https://api.graphand.io/projects/${this._options.project}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      this._project = data.data;
      if (!this.locale) {
        this.locale = this._project.defaultLocale;
      }
    } catch (e) {
      throw new Error("Invalid project ID");
    }
    this.unload("project");
  }

  get models(): any {
    return new Proxy(this, {
      get: function (oTarget, sKey) {
        if (!oTarget._models[sKey]) {
          switch (sKey) {
            case "Data":
              oTarget._models[sKey] = Data;
              break;
            case "Account":
              oTarget._models[sKey] = Account;
              break;
            case "Role":
              oTarget._models[sKey] = Role;
              break;
            case "DataField":
              oTarget._models[sKey] = DataField;
              break;
            case "DataModel":
              oTarget._models[sKey] = DataModel;
              break;
            default:
              oTarget._models[sKey] = class extends Data {
                static apiIdentifier = sKey;
              };
              break;
          }

          oTarget.registerModel(oTarget._models[sKey]);
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

  async registerModel(Model: any, options: { sync?: boolean; name?: string } = {}) {
    if (Model.__registered) {
      return;
    }

    this.load(Model);
    Model.setClient(this);

    if (options.sync) {
      Model.sync();
    }

    if (options.name) {
      this._models[options.name] = Model;
    }

    await Model.init();
    this.unload(Model);
    Model.__registered = true;
    return Model;
  }

  connectSocket() {
    this.socketSubject.next();
  }

  disconnectSocket() {
    this.socketSubject.next(false);
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
        loginWindow && loginWindow.close();
        window.removeEventListener("message", callback, false);
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
