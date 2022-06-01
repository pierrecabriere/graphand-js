import ModelScopes from "../enums/model-scopes";
import { GraphandModelPromise } from "../lib";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class User
 * @augments GraphandModel
 * @classdesc User model. Use {@link Client#getModel client.getModel("User")} to use this model
 */
class User extends GraphandModel {
  static _customFields = {};

  static apiIdentifier = "users";
  static baseUrl = "/users";
  static isGlobal = true;
  static scope = ModelScopes.User;
  static schema = {
    firstname: new GraphandFieldText(),
    lastname: new GraphandFieldText(),
    picture: new GraphandFieldText(),
    email: new GraphandFieldText(),
    password: new GraphandFieldText(),
  };

  firstname;
  lastname;
  picture;
  email;
  password;

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }

  /**
   * Returns current user
   * @returns {User|GraphandModelPromise<User>}
   */
  static getCurrent(): User | GraphandModelPromise<User> {
    return this.get("current");
  }
}

export default User;
