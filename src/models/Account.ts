import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Role from "./Role";

/**
 * @class Account
 * @augments GraphandModel
 * @classdesc Account model. Use {@link Client#getModel client.getModel("Account")} to use this model
 */
class Account extends GraphandModel {
  static _customFields = {};

  static queryFields = true;
  static _currentId = undefined;
  static apiIdentifier = "accounts";
  static baseUrl = "/accounts";
  static scope = ModelScopes.Account;
  static schema = {
    firstname: new GraphandFieldText(),
    lastname: new GraphandFieldText(),
    email: new GraphandFieldText(),
    password: new GraphandFieldText(),
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
  };

  firstname;
  lastname;

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }

  /**
   * Get accessToken with credentials & set token to {@link Client}
   * @param credentials {Object} - Credentials sent to api
   */
  static async login(credentials) {
    return this._client.login(credentials);
  }

  static clearCache() {
    GraphandModel.clearCache.apply(this, arguments);

    this._currentId = undefined;

    return this;
  }

  /**
   * Register new account
   * @param payload {Object}
   * @param hooks {boolean=}
   */
  static register(payload, hooks = true) {
    return this.create(payload, hooks, `auth/register`);
  }

  /**
   * [admin only] Generate a new token for account with id
   * @param id {string}
   * @returns {string}
   */
  static async generateToken(id: string) {
    const {
      data: { data },
    } = await this._client._axios.post(`accounts/${id}/generate-token`);
    return data;
  }

  /**
   * [admin only] Generate a new token for current account
   */
  async generateToken() {
    const { constructor } = Object.getPrototypeOf(this);
    return await constructor.generateToken(this._id);
  }

  /**
   * Returns current account
   * @param populate {boolean=}. If false, returns only the current account id
   * @param opts
   * @returns {Account}
   */
  static async getCurrent(populate = true, opts = {}) {
    if (!this._currentId) {
      const _opts = Object.assign({}, typeof populate === "object" ? populate : {}, opts);
      const account = await this.get({ ..._opts, query: { _id: "current" } });
      this._currentId = account?._id || null;
    }

    const id = await this._currentId;
    if (populate) {
      return id && this.get({ query: { _id: id } });
    }

    return id;
  }
}

export default Account;
