import GraphandModel from "../../src/lib/GraphandModel";

const testHooks = (instance: { current: GraphandModel }) => {
  let instances = [];

  test("should hook on delete each", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const payload = Array(3).fill({});
    instances = await Model.create(payload);

    const preDeleteCallback = jest.fn(() => null);
    const postDeleteCallback = jest.fn(() => null);

    Model.hook("preDelete", preDeleteCallback);
    Model.hook("postDelete", postDeleteCallback);

    await Promise.all(instances.map((i) => i.delete()));

    expect(preDeleteCallback).toHaveBeenCalledTimes(instances.length);
    expect(postDeleteCallback).toHaveBeenCalledTimes(instances.length);
  });

  test("should hook on delete multiple", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const payload = Array(3).fill({});
    instances = await Model.create(payload);

    const preDeleteCallback = jest.fn(() => null);
    const postDeleteCallback = jest.fn(() => null);

    Model.hook("preDelete", preDeleteCallback);
    Model.hook("postDelete", postDeleteCallback);

    await Model.delete({ ids: instances.map((i) => i._id) });

    expect(preDeleteCallback).toHaveBeenCalledTimes(1);
    expect(postDeleteCallback).toHaveBeenCalledTimes(1);
  });

  test("inherits from GraphandModel hooks", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const payload = Array(3).fill({});
    instances = await Model.create(payload);

    const preDeleteCallback = jest.fn(() => null);
    const postDeleteCallback = jest.fn(() => null);

    GraphandModel.hook("preDelete", preDeleteCallback);
    GraphandModel.hook("postDelete", postDeleteCallback);

    await Model.delete({ ids: instances.map((i) => i._id) });

    expect(preDeleteCallback).toHaveBeenCalledTimes(1);
    expect(postDeleteCallback).toHaveBeenCalledTimes(1);
  });
};

export default testHooks;
