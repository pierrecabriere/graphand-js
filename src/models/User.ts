import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class User extends GraphandModel {
  static apiIdentifier = "users";
  static baseUrl = "/users";
  static scope = "User";
  static schema = {
    firstname: new GraphandFieldText({ name: "Prénom" }),
    lastname: new GraphandFieldText({ name: "Nom" }),
    picture: new GraphandFieldText({ name: "Image de profil" }),
    email: new GraphandFieldText({ name: "Email" }),
    password: new GraphandFieldText({ name: "Mot de passe" }),
  };

  firstname;
  lastname;

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }
}

export default User;
