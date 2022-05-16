import { faker } from "@faker-js/faker";
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

  test("GraphandModel.getList should return list from cache with ids", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    const res = Model.getList({ ids: [_id], count: true });

    expect(res.then).toBeUndefined();
    expect(res.length).toEqual(1);
    expect(res.count).toEqual(1);
    expect(res[0]._id).toEqual(instance.current._id);
  });

  test("GraphandModel.getList should return list from cache with query", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const list = Model.getList({ query: {}, count: true });

    expect(list.then).toBeDefined();

    const res = await list;

    expect(res.length).toBeTruthy();

    const listFromCache = Model.getList({ query: {}, count: true });

    expect(listFromCache.then).toBeUndefined();
    expect(listFromCache.length).toEqual(res.length);
    expect(listFromCache[0]).toEqual(res[0]);
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

const testGraphandModel_crud = (instance: { current: GraphandModel }) => {
  test("GraphandModel.prototype should update", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const [firstDataField] = await Model.dataFieldsList;

    const input = faker.lorem.sentence();
    await instance.current.update({ set: { [firstDataField.slug]: input } });
    expect(instance.current[firstDataField.slug]).toEqual(input);

    const instanceFromModel = Model.get(instance.current._id);
    expect(instanceFromModel._id).toEqual(instance.current._id);
    expect(instanceFromModel.then).toBeUndefined();
    expect(instanceFromModel.get(firstDataField.slug)).toEqual(input);
  });
};

const testGraphandModel_caching = (instance: { current: GraphandModel }) => {
  test("clearCache", () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    Model.reinit();
    expect(Model.getList().length).toBeFalsy();
  });

  test("GraphandModel.getList should returns list from cache after updating", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const _id = instance.current._id;
    await Model.getList({ query: { _id: { $in: [_id] } }, count: true });

    const [firstDataField] = await Model.dataFieldsList;

    expect(Model.getList({ query: { _id: { $in: [_id] } }, count: true }).then).toBeUndefined();
    await instance.current.update({ set: { [firstDataField.slug]: faker.lorem.sentence() } });
    const list = Model.getList({ query: { _id: { $in: [_id] } }, count: true });
    expect(list.then).toBeDefined();
    await list;

    await instance.current.update({ set: { [firstDataField.slug]: faker.lorem.sentence() } });
    const list2 = Model.getList({ query: { _id: { $in: [_id] } }, count: true });
    expect(list2.then).toBeDefined();
    await list2;
  });
};

const testGraphandModel = (instance: { current: GraphandModel }) => {
  testGraphandModel_get(instance);
  testGraphandModel_getList(instance);
  testGraphandModel_crud(instance);
  testGraphandModel_caching(instance);
};

export default testGraphandModel;
