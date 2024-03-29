import { faker } from "@faker-js/faker";
import Client from "../src/Client";
import Locales from "../src/enums/locales";
import deleteInstance from "./utils/deleteInstance";

describe("Bootstrap", () => {
  const client = Client.createClient({});
  const [User, Project] = client.getModels(["User", "Project"]);
  let currentUser;
  let currentAccount;
  let project;
  let projectClient: Client;

  test("should login user", async () => {
    await client.login({ email: "test@graphand.io", password: "test123" });
    expect(client.getAccessToken()).toBeDefined();
    expect(client.getRefreshToken()).toBeDefined();
  });

  test("should get current user", async () => {
    currentUser = await User.getCurrent();
    expect(currentUser?._id).toBeDefined();
  });

  test("should create new project", async () => {
    const name = faker.lorem.words(2);
    const slug = faker.lorem.slug();
    const _project = await Project.create({ name, slug, locales: [Locales.FR], defaultLocale: Locales.FR, organization: "62c4c3ea2111bb7955a5a67f" });
    expect(_project?._id).toBeDefined();
    project = _project;
    projectClient = client.clone({ project: project._id });
  });

  test("should get the current project", async () => {
    const _project = await projectClient.getModel("Project").getCurrent();
    expect(_project._id).toEqual(project._id);
  });

  test("should get the current account", async () => {
    currentAccount = await projectClient.getModel("Account").getCurrent();
    expect(currentAccount?._id).toBeDefined();
    expect(currentAccount.raw.user).toEqual(currentUser._id);
  });

  test("current account should be admin", async () => {
    const role = await currentAccount.role;
    expect(role?.admin).toBeTruthy();
  });

  test("should delete the project", () => deleteInstance(project));
});
