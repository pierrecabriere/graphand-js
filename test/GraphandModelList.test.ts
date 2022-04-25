import Client from "../src/Client";

describe("GraphandModelList", () => {
  const { userAccessToken, projectId } = process.env;
  const client = Client.createClient({ project: projectId, accessToken: userAccessToken });
  const Account = client.getModel("Account");
  const list = Account.getList({});
  const mockCb = jest.fn(() => null);
  const sub = list.subscribe(mockCb);
  let currentAccount;

  it("should subscribe", async () => {
    expect(mockCb).toHaveBeenCalledTimes(0);
    await list;
    expect(mockCb).toHaveBeenCalledTimes(1);
    currentAccount = await Account.getCurrent();
    expect(currentAccount).toBeDefined();
    await currentAccount.update({ set: { firstname: "toto" } });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(mockCb).toHaveBeenCalledTimes(2);
  });

  // it("should detect data change", async () => {
  //   currentAccount.firstname = "toto";
  //   await new Promise((resolve) => setTimeout(resolve, 300));
  //   expect(mockCb).toHaveBeenCalledTimes(2);
  // });

  it("should unsubscribe", async () => {
    sub.unsubscribe();
    await currentAccount.update({ set: { firstname: "bob" } });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(mockCb).toHaveBeenCalledTimes(2);
    mockCb.mockRestore();
  });
});
