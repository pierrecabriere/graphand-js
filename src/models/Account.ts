import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";
import Role from "./Role";

class Account extends GraphandModel {
  static queryFields = true;
  static _currentId = undefined;
  static apiIdentifier = "accounts";
  static baseUrl = "/accounts";
  static scope = "Account";

  firstname;
  lastname;

  static get baseFields() {
    return {
      firstname: new GraphandFieldText({
        name: "Prénom",
      }),
      lastname: new GraphandFieldText({
        name: "Nom",
      }),
      email: new GraphandFieldText({
        name: "Email",
      }),
      password: new GraphandFieldText({
        name: "Mot de passe",
      }),
      user: new GraphandFieldRelation({
        name: "Utilisateur graphand",
        model: "User",
        multiple: false,
      }),
      role: new GraphandFieldRelation({
        name: "Role",
        model: "Role",
        multiple: false,
      }),
    };
  }

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
      data: {
        data: { accessToken },
      },
    } = await this._client._axios.post(`accounts/${id}/generate-token`);
    return accessToken;
  }

  async generateToken() {
    const { constructor } = Object.getPrototypeOf(this);
    return await constructor.generateToken(this._id);
  }

  static async getCurrent(populate = true) {
    if (!this._currentId) {
      this._currentId = this.get("current").then((account) => account?._id || null);
    }

    const id = await this._currentId;
    if (populate) {
      return id && this.get(id);
    }

    return id;
  }
}

export default Account;
