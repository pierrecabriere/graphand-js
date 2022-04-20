import { faker } from "@faker-js/faker";
import Client from "../src/Client";
import Locales from "../src/enums/locales";

describe("Workflow", () => {
  const client = Client.createClient({});
  const [User, Project] = client.getModels(["User", "Project"]);
  let currentUser;
  let project;
  let projectClient;

  it("should login user", async () => {
    await client.login({ email: "test@graphand.io", password: "test123" });
    expect(client.getAccessToken()).toBeDefined();
    expect(client.getRefreshToken()).toBeDefined();
  });

  it("should get current user", async () => {
    currentUser = await User.get("current");
    expect(currentUser?._id).toBeDefined();
  });

  it("should create new project", async () => {
    const name = faker.lorem.words(2);
    const slug = faker.lorem.slug();
    project = await Project.create({ name, slug, locales: [Locales.FR], defaultLocale: Locales.FR });
    expect(project?._id).toBeDefined();
  });

  it("should get the project by id", async () => {
    const _project = await Project.get(project._id);
    expect(_project._id).toEqual(project._id);
    projectClient = client.clone({ project: project._id });
  });

  it("should get the current project", async () => {
    const _project = await projectClient.getModel("Project").getCurrent();
    expect(_project._id).toEqual(project._id);
  });

  it("should get the current account", async () => {
    const _account = await projectClient.getModel("Account").getCurrent();
    expect(_account?._id).toBeDefined();
    expect(_account.raw.user).toEqual(currentUser._id);
  });

  it("should delete the project", async () => {
    const _id = project._id;
    await project.delete();
    let _project;
    let _status;
    try {
      _project = await Project.get(_id);
    } catch (e) {
      _status = e.response.status;
    }

    expect(_status).toEqual(404);
    expect(_project?._id).toBeUndefined();
  });
});
