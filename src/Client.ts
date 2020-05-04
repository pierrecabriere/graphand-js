import axios, { AxiosInstance } from "axios";
import Account from "./models/Account";
import Data from "./models/Data";
import GraphandModel from "./utils/GraphandModel";

interface ClientOptions {
  project: string;
  accessToken?: string;
  locales: string[];
  host?: string;
}

class Client {
  _options: ClientOptions;
  _axios: AxiosInstance;
  private _accessToken: string;
  private _locale: string;
  _project: any;

  GraphandModel = GraphandModel.setClient(this);
  DataModel = Data.setClient(this);
  AccountModel = Account.setClient(this);

  constructor(options: ClientOptions) {
    //@ts-ignore
    this._options = options || {};

    if (this._options.accessToken) {
      this.accessToken = this._options.accessToken;
    }

    this._axios = axios.create({
      baseURL: this._options.project ? `https://${this._options.project}.api.graphand.io` : this._options.host || "https://api.graphand.io",
      transformRequest: [
        (data, headers) => {
          const token =
            this.accessToken ||
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiZ3Vlc3QiLCJpYXQiOjE1NjE0MjA5NDF9.1NFWwau0ume5sIsEBafFltPvyh7x4-LpDMNR8wgI90c";
          headers.Authorization = `Bearer ${token}`;

          return data;
        },
      ].concat(axios.defaults.transformRequest),
    });

    if (this._options.project) {
      this._initProject();
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

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(token: string) {
    this.setAccessToken(token);
  }

  setAccessToken(token: string) {
    this._accessToken = token;
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

      loginWindow = window.open("https://graphand.io/auth", "_blank", `fullscreen=no,height=${height},width=${width},top=${top},left=${left}`);
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
