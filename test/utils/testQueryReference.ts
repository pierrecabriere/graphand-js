import GraphandModel from "../../src/lib/GraphandModel";

const testQueryReference = (instance: { current: GraphandModel }) => {
  let reference;

  test("should return in-cache reference", async () => {
    const { constructor: Model } = Object.getPrototypeOf(instance.current);
    reference = await Model.create({});

    const list = await Model.getList({});
    const found = list.find((i) => i._id === reference._id);
    expect(found).toBeTruthy();
    expect(found?._id).toEqual(reference._id);
    expect(found === reference).toBeTruthy();
    reference = found;

    const list2 = await Model.getList({});
    const found2 = list2.find((i) => i._id === reference._id);
    expect(found2).toBeTruthy();
    expect(found2?._id).toEqual(reference._id);
    expect(found2 === reference).toBeTruthy();
    reference = found2;

    const [found3] = await Model.getList({ query: { _id: { $in: [reference._id] } } });
    expect(found3).toBeTruthy();
    expect(found3?._id).toEqual(reference._id);
    expect(found3 === reference).toBeTruthy();
    reference = found3;

    const found4 = await Model.get(reference._id);
    expect(found4).toBeTruthy();
    expect(found4?._id).toEqual(reference._id);
    expect(found4 === reference).toBeTruthy();
    reference = found4;
  });
};

export default testQueryReference;
