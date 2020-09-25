import GraphandFieldRelation from "../utils/fields/GraphandFieldRelation";
import GraphandFieldText from "../utils/fields/GraphandFieldText";
import GraphandModel from "../utils/GraphandModel";
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

  static async login(credentials) {
    return this._client.login(credentials);
  }

  static clearCache() {
    GraphandModel.clearCache.apply(this, arguments);

    this._currentId = undefined;

    return this;
  }

  static async register(payload, hooks = true) {
    const config = { params: {} };

    if (payload.locale && this._client._project && payload.locale === this._client._project.defaultLocale) {
      delete payload.locale;
    }

    const args = { payload, config };

    if (hooks) {
      if ((await this.beforeCreate?.call(this, args)) === false) {
        return;
      }
    }

    let item;
    try {
      const req = this._client._axios
        .post(`auth/register`, args.payload, args.config)
        .then(async (res) => {
          item = new this(res.data.data);
          if (!this.socketSubscription) {
            this.clearCache();
            this.upsertStore(item);
          }

          if (hooks) {
            await this.afterCreate?.call(this, item, null, args);
          }

          return item;
        })
        .catch(async (e) => {
          if (hooks) {
            await this.afterCreate?.call(this, null, e, args);
          }

          throw e;
        });

      const middlewareData = await this.middlewareCreate?.call(this, args, req);
      if (middlewareData !== undefined) {
        return middlewareData;
      }
      item = await req;
    } catch (e) {
      if (hooks) {
        await this.afterCreate?.call(this, null, e, args);
      }

      throw e;
    }

    return item;
  }

  static async getCurrent() {
    if (!this._currentId) {
      this._currentId = this.get("current").then((account) => account?._id || null);
    }

    const id = await this._currentId;
    return id && this.get(id);
  }
}

export default Account;
