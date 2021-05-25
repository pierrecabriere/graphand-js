import { BehaviorSubject, Subject } from "rxjs";
import GraphandModel from "../lib/GraphandModel";

const extendsModel = (Class, client?) => {
  if (!(Class?.prototype instanceof GraphandModel)) {
    return Class;
  }

  const extended = class extends Class {};

  extended._extendedAt = new Date();
  extended._client = client;
  extended._cache = {};
  extended._socketSubscription = null;
  extended._fieldsIds = null;
  extended._fields = {};
  extended._fieldsSubscription = null;
  extended._initialized = false;
  extended._fieldsObserver = null;
  extended._registered = false;
  extended._observers = new Set([]);
  extended._socketTriggerSubject = new Subject();
  extended._initPromise = null;
  extended._listSubject = new BehaviorSubject([]);

  return extended;
};

export default extendsModel;
