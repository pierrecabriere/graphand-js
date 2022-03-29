import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Role from "./Role";

class Account extends GraphandModel {
  static _customFields = {};

  static queryFields = true;
  static _currentId = undefined;
  static apiIdentifier = "accounts";
  static baseUrl = "/accounts";
  static scope = "Account";
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

  static async login(credentials) {
    return this._client.login(credentials);
  }

  static clearCache() {
    GraphandModel.clearCache.apply(this, arguments);

    this._currentId = undefined;

    return this;
  }

  static register(payload, hooks = true) {
    return this.create(payload, hooks, `auth/register`);
  }

  static async generateToken(id: string) {
    const {
      data: { data },
    } = await this._client._axios.post(`accounts/${id}/generate-token`);
    return data;
  }

  async generateToken() {
    const { constructor } = Object.getPrototypeOf(this);
    return await constructor.generateToken(this._id);
  }

  static async getCurrent(populate = true, opts) {
    if (!this._currentId) {
      const _opts = Object.assign({}, typeof populate === "object" ? populate : {}, opts);
      this._currentId = this.get({ ..._opts, query: { _id: "current" } }).then((account) => account?._id || null);
    }

    const id = await this._currentId;
    if (populate) {
      return id && this.get({ query: { _id: id } });
    }

    return id;
  }
}

export default Account;
