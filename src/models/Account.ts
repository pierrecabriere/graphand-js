import ModelEnvScopes from "../enums/model-env-scopes";
import ModelScopes from "../enums/model-scopes";
import GraphandFieldRelation, { GraphandFieldRelationDefinition } from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText, { GraphandFieldTextDefinition } from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import { ownProperty } from "../utils/decorators";
import Role from "./Role";

/**
 * @class Account
 * @augments GraphandModel
 * @classdesc Account model. Use {@link GraphandClient#getModel client.getModel("Account")} to use this model
 */
class Account extends GraphandModel {
  static _customFields = {};

  static queryFields = true;
  static apiIdentifier = "accounts";
  static baseUrl = "/accounts";
  static scope = ModelScopes.Account;
  static envScope = ModelEnvScopes.ENV;
  static schema = {
    firstname: new GraphandFieldText(),
    lastname: new GraphandFieldText(),
    email: new GraphandFieldText(),
    password: new GraphandFieldText(),
    role: new GraphandFieldRelation({ ref: "Role", multiple: false }),
  };

  @ownProperty()
  static _currentId = undefined;

  firstname: GraphandFieldTextDefinition;
  lastname: GraphandFieldTextDefinition;
  email: GraphandFieldTextDefinition<{ required: true }>;
  password: GraphandFieldTextDefinition;
  role: GraphandFieldRelationDefinition<{ model: Role; required: true }>;

  [prop: string]: any;

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }

  /**
   * Get accessToken with credentials & set token to {@link GraphandClient}
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
   * Returns current account
   * @param populate {boolean=}. If false, returns only the current account id
   * @param opts
   * @returns {Account}
   */
  static async getCurrent(populate = true, opts = {}): Promise<Account> {
    if (!this._currentId) {
      const _opts = Object.assign({}, typeof populate === "object" ? populate : {}, opts);
      const account = await this.get({ ..._opts, query: { _id: "current" } });
      this._currentId = account?._id || null;
    }

    const id = await this._currentId;
    if (populate) {
      return id && (await this.get({ query: { _id: id } }));
    }

    return id;
  }

  /**
   * [admin only] Generate a new token for current account
   */
  async generateToken() {
    const { constructor } = Object.getPrototypeOf(this);
    return await constructor.generateToken(this._id);
  }
}

export default Account;
