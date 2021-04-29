import { Subject } from "rxjs";

const extendsModel = (Class, client?) => {
  return class extends Class {
    static _client = client;
    static cache = {};
    static socketSubscription = null;
    static _fieldsIds = null;
    static _fields = {};
    static _fieldsSubscription = null;
    static initialized = false;
    static _fieldsObserver = null;
    static __registered = false;
    static __initialized = false;
    static observers = new Set([]);
    static defaultFields = true;
    static queryPromises = {};
    static socketTriggerSubject = new Subject();
    static _initPromise = null;
    static _listSubject = null;
  };
};

export default extendsModel;