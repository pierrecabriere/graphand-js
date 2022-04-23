import { faker } from "@faker-js/faker";
import Client from "../src/Client";
import deleteInstance from "./utils/deleteInstance";
import testGraphandModel from "./utils/testGraphandModel";

describe("GraphandModel", () => {
  const { userAccessToken, projectId } = process.env;
  const client = Client.createClient({ project: projectId, accessToken: userAccessToken });
  const [DataModel, DataField] = client.getModels(["DataModel", "DataField"]);
  const dataModel = { current: undefined };
  const dataField = { current: undefined };
  const instance = { current: undefined };

  test("should create dataModel.current", async () => {
    const name = faker.commerce.product();
    const slug = name.toLowerCase();
    dataModel.current = await DataModel.create({ name, slug });
    expect(dataModel.current?._id).toBeDefined();
    expect(dataModel.current.name).toEqual(name);
    expect(dataModel.current.slug).toEqual(slug);
  });

  test("should create field", async () => {
    const name = faker.lorem.word();
    const slug = name.toLowerCase();
    const scope = `Data:${dataModel.current.slug}`;
    dataField.current = await DataField.create({ name, slug, scope, type: DataField.Types.TEXT });
  });

  test("should create instance.current", async () => {
    const input = faker.lorem.sentence();
    const Model = client.getModel(`Data:${dataModel.current.slug}`);

    instance.current = await Model.create({ [dataField.current.slug]: input });
    expect(instance.current?._id).toBeDefined();
    expect(instance.current.get(dataField.current.slug)).toEqual(input);
  });

  testGraphandModel(instance);

  test("should delete instance.current", () => deleteInstance(instance.current));

  test("should delete dataModel.current", () => deleteInstance(dataModel.current));

  test("dataField.current should be deleted", async () => {
    let _res;
    let _status;
    try {
      _res = await DataField.get(dataField.current._id);
    } catch (e) {
      _status = e.response.status;
    }

    expect(_status).toEqual(404);
    expect(_res?._id).toBeUndefined();
  });
});
