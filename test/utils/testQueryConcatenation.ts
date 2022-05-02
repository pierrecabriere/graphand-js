import GraphandModel from "../../src/lib/GraphandModel";

const testQueryConcatenation = (instance: { current: GraphandModel }) => {
  let instances = [];

  test("should create multiple instances", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const payload = Array(10).fill({});
    instances = await Model.create(payload);
    expect(instances.length).toEqual(10);
    expect(instances.every((i) => i._id)).toBeTruthy();
  });

  test("clearCache", () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    Model.reinit();
    expect(Model.getList().length).toBeFalsy();
  });

  test("should concat queries", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    const last = instances[9];
    const groups = Array(3)
      .fill(null)
      .reduce((final, _, index) => {
        const group = instances.slice(index * 3, (index + 1) * 3);
        return [...final, group];
      }, []);

    const spyPost = jest.spyOn(Model._client._axios, "post");
    const spyGet = jest.spyOn(Model._client._axios, "get");

    const [resLast, resGroups] = await Promise.all([
      Model.get(last._id),
      Promise.all(
        groups.map((group) => {
          const ids = group.map((i) => i._id);
          return Model.getList({ ids });
        }),
      ),
    ]);

    const ids = [resLast?._id, ...resGroups.reduce((final, group) => final.concat(group.toArray().map((i) => i._id)), [])];
    expect(ids.length).toEqual(10);
    expect(ids.every((_id) => instances.find((i) => i._id === _id))).toBeTruthy();

    expect(spyPost).toHaveBeenCalledTimes(1);
    expect(spyGet).toHaveBeenCalledTimes(0);
    spyPost.mockRestore();
    spyGet.mockRestore();
  });
};

export default testQueryConcatenation;
