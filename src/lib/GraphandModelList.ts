import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelListPromise from "./GraphandModelListPromise";

class GraphandModelList extends Array implements Array<any> {
  _model;
  count;
  _query;
  _observable;
  _socketSub;
  _storeSub;
  _socketPath;

  constructor({ model, count, query, socketPath }: { model?; count?; query?; socketPath? }, ...elements) {
    if (!elements?.length) {
      elements = [];
    }

    if (!model) {
      // @ts-ignore
      return super(...elements);
    }

    super(...elements);

    this._model = model;
    this.count = count || 0;
    this._query = query;

    Object.defineProperty(this, "_model", { enumerable: false });
    Object.defineProperty(this, "count", { enumerable: false });
    Object.defineProperty(this, "_query", { enumerable: false });

    if (socketPath) {
      this.syncSocket(socketPath);
    }
  }

  get ids() {
    return this.toArray()
      .map((item) => item?._id || item)
      .filter(Boolean);
  }

  get model() {
    return this._model || this[0]?.constructor;
  }

  get query() {
    return this._query || { ids: this.ids };
  }

  get promise() {
    return new GraphandModelListPromise(
      (resolve) => {
        resolve(this);
      },
      this.model,
      this.query,
    );
  }

  toArray() {
    return new Array(...this);
  }

  clone(concatWith?: GraphandModel | GraphandModelList) {
    const elements = concatWith ? this.toArray().concat(concatWith) : this.toArray();
    return new GraphandModelList(this, ...elements);
  }

  async reload() {
    const list = await this.model.getList(this.query);
    this.splice(0, this.length, ...list);
    this.count = list.count;
    return list;
  }

  syncSocket(socketPath?) {
    if (this._observable) {
      return;
    }

    this._observable = new Observable((subscriber) => {
      let storeTimeout;

      const _registerSocket = (_socket, _path?) => {
        if (!_path) {
          return this.model
            .fetch(this.query, { cache: false, sync: true })
            .then(({ data }) => {
              const list = this.model._handleRequestResult(data, this.query);

              this.splice(0, this.length, ...list);
              this.count = data.count;

              _registerSocket(_socket, data.data.socketPath);
            })
            .catch((e) => console.error(e));
        }

        this._socketPath = _path;
        return _socket.on(_path, (data) => {
          const list = this.model._handleRequestResult(data, this.query);
          const cacheKey = this.model.getCacheKey(this.query);
          if (this.model._cache && this.model._cache[cacheKey]?.previous?.data) {
            this.model._cache[cacheKey].previous.data.data = data;
          }

          this.splice(0, this.length, ...list);
          this.count = data.count;

          subscriber.next(this);
        });
      };

      this._socketSub = this.model._client._socketSubject.subscribe((_socket) => _registerSocket(_socket, !this._socketPath && socketPath));

      this._storeSub = this.model._listSubject.subscribe(async (_list) => {
        if (storeTimeout) {
          clearTimeout(storeTimeout);
        }
      });

      if (this.model._client._socket) {
        _registerSocket(this.model._client._socket, socketPath);
      }

      this.model._client.connectSocket();
    });
  }

  syncStore() {
    if (this._observable) {
      return;
    }

    this._socketPath = false;
    this._observable = new Observable((subscriber) => {
      let prevSerial = this.map((item) => JSON.stringify(item.serialize?.apply(item)));
      this._storeSub = this.model._listSubject.subscribe(async (_list) => {
        const list = await this.model.getList(this.query, { syncSocket: false });
        const serial = list.map((item) => JSON.stringify(item.serialize?.apply(item)));
        if (prevSerial.length !== serial.length || !isEqual(serial, prevSerial)) {
          prevSerial = serial;
          subscriber.next(list);
        }
      });
    });
  }

  subscribe(opts?) {
    const defaultOptions = { syncSocket: false };
    opts = Object.assign({}, defaultOptions, typeof opts === "object" ? opts : {});

    if (!this._observable) {
      opts.syncSocket ? this.syncSocket() : this.syncStore();
    }

    const sub = this._observable.subscribe.apply(this._observable, arguments);
    const unsubscribe = sub.unsubscribe;
    sub.unsubscribe = function () {
      unsubscribe.apply(sub);
      this.unsync();
    };
  }

  unsync() {
    this._storeSub?.unsubscribe();
    this._socketSub?.unsubscribe();
    this.model._client._socket?.off(this._socketPath);
    this._socketPath = false;
    delete this._observable;
  }

  encodeQuery() {
    return this.ids;
  }

  toString() {
    return JSON.stringify(this.ids);
  }

  toJSON() {
    return this.map((i) => i.toJSON?.apply(i) || i);
  }

  static hydrate(data: any, model: any) {
    data = data ?? {};

    if (Array.isArray(data)) {
      const list = data.map((i) => new model(i));
      return new this({ model }, ...list);
    }

    const { __count: count, __query: query, __payload } = data;
    const items = __payload ? __payload.map((i) => model.hydrate(i)) : [];
    return new this({ model, count, query }, ...items);
  }

  serialize() {
    return {
      __type: "GraphandModelList",
      __scope: this.model.scope,
      __count: this.count,
      __query: this.query,
      __payload: this.map((i) => i.serialize?.apply(i) || i),
    };
  }
}

export default GraphandModelList;
