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
}

export default Account;
