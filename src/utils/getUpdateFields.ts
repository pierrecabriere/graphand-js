const getUpdateFields = (payload) => {
  if (!payload) {
    return [];
  }

  const {
    $currentDate: currentDateFields,
    $inc: incFields,
    $min: minFields,
    $max: maxFields,
    $mul: mulFields,
    $rename: renameFields,
    $set: setFields,
    $setOnInsert: setOnInsertFields,
    $unset: unsetFields,
    $addToSet: addToSetFields,
    $pop: popFields,
    $pull: pullFields,
    $push: pushFields,
    $pullAll: pullAllFields,
    ...otherFields
  } = payload;

  return [
    ...Object.keys(currentDateFields || {}),
    ...Object.keys(incFields || {}),
    ...Object.keys(minFields || {}),
    ...Object.keys(maxFields || {}),
    ...Object.keys(mulFields || {}),
    ...Object.keys(renameFields || {}),
    ...Object.keys(setFields || {}),
    ...Object.keys(setOnInsertFields || {}),
    ...Object.keys(unsetFields || {}),
    ...Object.keys(otherFields || {}),
    ...Object.keys(addToSetFields || {}),
    ...Object.keys(popFields || {}),
    ...Object.keys(pullFields || {}),
    ...Object.keys(pushFields || {}),
    ...Object.keys(pullAllFields || {}),
  ]
}

export default getUpdateFields;