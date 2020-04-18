import GraphandModel from "../utils/GraphandModel";

class Account extends GraphandModel {
  static get baseUrl() {
    return "/accounts";
  }

  static async login(credentials) {
    return this._client.login(credentials);
  }
}

export default Account;