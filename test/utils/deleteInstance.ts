import GraphandModel from "../../src/lib/GraphandModel";

const deleteInstance = async (instance: GraphandModel) => {
  const { constructor: Model } = Object.getPrototypeOf(instance);
  const _id = instance._id;
  await instance.delete();
  let _res;
  let _status;
  try {
    _res = await Model.get(_id);
    _status = 200;
  } catch (e) {
    _status = e.response.status;
  }

  expect(_status).toEqual(404);
  expect(_res?._id).toBeUndefined();
};

export default deleteInstance;
