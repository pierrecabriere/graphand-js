import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
import Role from "./Role";

class Account extends GraphandModel {
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

  static async getCurrent() {
    const { data } = await this._client._axios.get(`/accounts/current`);
    return data.data ? new this(data.data) : null;
  }
}

export default Account;
