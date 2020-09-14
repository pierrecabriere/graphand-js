import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";

class User extends GraphandModel {
  static apiIdentifier = "users";
  static baseUrl = "/users";
  static queryFields = false;
  static scope = "User";

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
      picture: new GraphandFieldText({
        name: "Image de profil",
      }),
      email: new GraphandFieldText({
        name: "Email",
      }),
      password: new GraphandFieldText({
        name: "Mot de passe",
      }),
    };
  }

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }
}

export default User;
