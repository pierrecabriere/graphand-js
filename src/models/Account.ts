import GraphandModel from "../utils/GraphandModel";

class Account extends GraphandModel {
  static apiIdentifier = "accounts";

  static get baseUrl() {
    return "/accounts";
  }

  static async login(credentials) {
    return this._client.login(credentials);
  }

  static async getCurrent() {
    const { data } = await this._client._axios.get(`/accounts/current`);
    return new this(data.data);
  }
}

export default Account;
