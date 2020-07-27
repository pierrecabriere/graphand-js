import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
import Role from "./Role";

class Account extends GraphandModel {
  static _currentId = undefined;
  static apiIdentifier = "accounts";

  static baseUrl = "/accounts";

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
        model: this._client.models.User,
        multiple: false,
      }),
      role: new GraphandFieldRelation({
        name: "Role",
        model: this._client.models.Role,
        multiple: false,
      }),
    };
  }

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }

  static queryFields = { accountField: true };

  static async login(credentials) {
    return this._client.login(credentials);
  }

  static clearCache() {
    GraphandModel.clearCache.apply(this, arguments);

    this._currentId = undefined;

    return this;
  }

  static async getCurrent() {
    if (!this._currentId) {
      const { data } = await this._client._axios.get(`/accounts/current`);
      this._currentId = data?.data?._id || null;
    }

    return this._currentId && this.get(this._currentId);
  }
}

export default Account;
