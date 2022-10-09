import ModelScopes from "../enums/model-scopes";
import { GraphandModelPromise } from "../lib";
import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

/**
 * @class User
 * @augments GraphandModel
 * @classdesc User model. Use {@link GraphandClient#getModel client.getModel("User")} to use this model
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
    job: new GraphandFieldText(),
    status: new GraphandFieldText(),
    email: new GraphandFieldText(),
    password: new GraphandFieldText(),
    invite: new GraphandFieldBoolean(),
  };

  firstname;
  lastname;
  picture;
  job;
  email;
  password;
  status;
  invite;

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }

  /**
   * Register new user
   * @param payload {Object}
   * @param hooks {boolean=}
   */
  static register(payload, hooks = true) {
    return this.create(payload, hooks, `auth/register`);
  }

  /**
   * Returns current user
   * @returns {User|GraphandModelPromise<User>}
   */
  static getCurrent(): User | GraphandModelPromise<User> {
    return this.get("current");
  }
}

User.hook("preUpdate", (args) => {
  if (args.payload && !args.payload.append && args.payload.picture) {
    if (args.payload?.picture?.getAsFile) {
      args.payload.picture = args.payload.picture.getAsFile();
    }

    const formData = new FormData();
    const { query, set, picture } = args.payload;
    query && formData.append("query", JSON.stringify(query));
    set && formData.append("set", JSON.stringify(set));
    formData.append("picture", picture);

    args.config.headers = args.config.headers || {};
    args.config.headers["Content-Type"] = "multipart/form-data";

    args._rawPayload = args.payload;
    args.payload = formData;
  }
});

export default User;
