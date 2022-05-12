import exp = require("constants");
import { GraphandModelAccount } from "../src";
import Client from "../src/Client";

describe("Client.ts", () => {
  describe("Create client", () => {
    test("should returns client instance", () => {
      const client = new Client({});
      expect(client instanceof Client).toBeTruthy();
    });

    test("should returns client instance", () => {
      const client = Client.createClient({});
      expect(client instanceof Client).toBeTruthy();
    });

    test("should clone client instance", () => {
      const client = Client.createClient({});
      const clone = client.clone();
      expect(client instanceof Client).toBeTruthy();
      expect(clone instanceof Client).toBeTruthy();
      expect(clone !== client).toBeTruthy();
    });
  });

  test("should reinit models", async () => {
    const { userAccessToken, projectId } = process.env;
    const client = Client.createClient({ project: projectId, accessToken: userAccessToken });
    const Account = client.getModel("Account");
    const currentAccount = await Account.getCurrent();
    expect(currentAccount).toBeTruthy();
    expect(Account.get(currentAccount._id, false)).toBeTruthy();
    client.reinit();
    expect(Account.get(currentAccount._id, false)).toBeFalsy();
  });

  test("should register model", async () => {
    const Account = class extends GraphandModelAccount {};
    const { userAccessToken, projectId } = process.env;
    const client = Client.createClient({ project: projectId, accessToken: userAccessToken, models: [Account] });
    await client._init();
    expect(Account._client).toEqual(client);
  });
});
