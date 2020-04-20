import axios, { AxiosInstance } from "axios";
import Account from "./models/Account";
import Data from "./models/Data";

interface ClientOptions {
  project: string;
  accessToken?: string;
}

interface ConnectOptions {
  name: string;
  baseQuery: object;
  list: boolean;
  mapDataToList: Function;
  find: Function;
  cache: boolean;
  init: boolean;
}

class Client {
  _options: ClientOptions;
  _axios: AxiosInstance;
  private _accessToken: string;
  private _models = {};

  DataModel = Data.setClient(this);
  AccountModel = Account.setClient(this);

  constructor(options: ClientOptions) {
    this._options = options;

    if (!/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(this._options.project)) {
      throw new Error("Invalid project ID");
    }

    if (this._options.accessToken) {
      this.accessToken = this._options.accessToken;
    }

    this._axios = axios.create({
      baseURL: `https://${this._options.project}.api.graphand.io`,
      transformRequest: [
        (data, headers) => {
          if (this.accessToken) {
            headers.Authorization = `Bearer ${this.accessToken}`;
          }

          return data;
        },
      ].concat(axios.defaults.transformRequest),
    });
  }

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(token) {
    this._accessToken = token;
  }

  static createClient(options: ClientOptions) {
    return new Client(options);
  }

  async login(credentials) {
    const {
      data: { accessToken },
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

  connectData(slug: string, options: ConnectOptions) {
    if (!this._models[slug]) {
      this._models[slug] = class extends this.DataModel {
        static apiIdentifier = slug;
      };
      Object.defineProperty(this._models[slug], "name", { value: `GraphandModel<${slug}>` });
    }

    return this._models[slug].connect((options && options.name) || slug, options);
  }

  connectAccounts(options: ConnectOptions) {
    return this.AccountModel.connect((options && options.name) || "accounts", options);
  }
}

export default Client;
