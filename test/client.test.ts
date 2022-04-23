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
});
