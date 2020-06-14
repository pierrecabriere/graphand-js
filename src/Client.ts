import axios, { AxiosInstance } from "axios";
import { Subject } from "rxjs";
import io from "socket.io-client";
import Account from "./models/Account";
import Data from "./models/Data";
import Role from "./models/Role";
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
  _project: any;
  _models: any = {};
  socketSubject = new Subject();

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

    if (this._options.project) {
      this._initProject();
    }

    if (this._options.accessToken) {
      this.accessToken = this._options.accessToken;
    }
  }

  private async _initProject() {
    this._project = axios
      .get(`https://api.graphand.io/projects/${this._options.project}`, {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiZ3Vlc3QiLCJpYXQiOjE1NjE0MjA5NDF9.1NFWwau0ume5sIsEBafFltPvyh7x4-LpDMNR8wgI90c",
        },
      })
      .then((res) => {
        this._project = res.data.data;
        if (!this.locale) {
          this.locale = this._project.defaultLocale;
        }
      })
      .catch((e) => {
        throw new Error("Invalid project ID");
      });
  }

  get models() {
    return new Proxy(this, {
      get: function (oTarget, sKey) {
        if (!oTarget._models[sKey]) {
          switch (sKey) {
            case "Data":
              oTarget._models[sKey] = Data.setClient(oTarget);
              break;
            case "Account":
              oTarget._models[sKey] = Account.setClient(oTarget);
              break;
            case "Role":
              oTarget._models[sKey] = Role.setClient(oTarget);
              break;
            default:
              oTarget._models[sKey] = class extends Data {
                static apiIdentifier = sKey;
              };
              break;
          }
        }

        return oTarget._models[sKey].setClient(oTarget);
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

  registerModel(Model: any, options: { sync?: boolean; name?: string } = {}) {
    Model.setClient(this);

    if (options.sync) {
      Model.sync();
    }

    if (options.name) {
      this._models[options.name] = Model;
    }

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

      alert("ok");

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
