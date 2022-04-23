import GraphandModel from "../../src/lib/GraphandModel";

const testGraphandModel_get = (instance: { current: GraphandModel }) => {
  test("clearCache", () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    Model.reinit();
    expect(Model.getList().length).toBeFalsy();
  });

  test("GraphandModel.get", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = await Model.get(_id);

    expect(res?._id).toEqual(instance.current._id);
  });

  test("GraphandModel.get should return instance from cache", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = Model.get(_id);

    expect(res?._id).toEqual(instance.current._id);
    expect(res?.then).toBeUndefined();
  });

  test("GraphandModel.get should not return instance from cache", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = Model.get(_id, true);

    expect(res?._id).toEqual(instance.current._id);
    expect(res?.then).toBeDefined();
  });
};

const testGraphandModel_getList = (instance: { current: GraphandModel }) => {
  test("clearCache", () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    Model.reinit();
    expect(Model.getList().length).toBeFalsy();
  });

  test("GraphandModel.getList", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const list = Model.getList({ ids: [_id], count: true });

    expect(list.then).toBeDefined();

    const res = await list;

    expect(res.length).toEqual(1);
    expect(res.count).toEqual(1);
    expect(res[0]._id).toEqual(instance.current._id);
  });

  test("GraphandModel.getList should return list from cache", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = Model.getList({ ids: [_id], count: true });

    expect(res.then).toBeUndefined();
    expect(res.length).toEqual(1);
    expect(res.count).toEqual(1);
    expect(res[0]._id).toEqual(instance.current._id);
  });

  test("clearCache", () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    expect(Model.getList().length).toBeTruthy();
    Model.reinit();
    expect(Model.getList().length).toBeFalsy();
  });

  test("GraphandModel.get", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = await Model.get(_id);

    expect(res?._id).toEqual(instance.current._id);
  });

  test("GraphandModel.getList should return list from cache", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = Model.getList({ ids: [_id], count: true });

    expect(res.then).toBeUndefined();
    expect(res.length).toEqual(1);
    expect(res.count).toEqual(1);
    expect(res[0]._id).toEqual(instance.current._id);
  });

  test("GraphandModel.getList should not return list from cache", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = Model.getList({ ids: [_id], page: 2 });

    expect(res.then).toBeDefined();
  });
};

const testGraphandModel = (instance: { current: GraphandModel }) => {
  testGraphandModel_get(instance);
  testGraphandModel_getList(instance);
};

export default testGraphandModel;
