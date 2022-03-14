import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class User extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "users";
  static baseUrl = "/users";
  static scope = "User";
  static schema = {
    firstname: new GraphandFieldText(),
    lastname: new GraphandFieldText(),
    picture: new GraphandFieldText(),
    email: new GraphandFieldText(),
    password: new GraphandFieldText(),
  };

  firstname;
  lastname;

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }
}

export default User;
