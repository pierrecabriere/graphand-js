import isEqual from "fast-deep-equal";
import { Observable } from "rxjs";
import GraphandModel from "./GraphandModel";
import GraphandModelListPromise from "./GraphandModelListPromise";

class GraphandModelList extends Array implements Array<any> {
  _model;
  count;
  _query;

  // _socketPath;
  private _observable;
  private _storeSub;
  // private _socketSub;
  // private _socketPathSub;
  // private _socketHandler;
  private _subscriptions;

  constructor({ model, count, query }: { model?; count?; query? }, ...elements) {
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
    this._subscriptions = new Set();

    Object.defineProperty(this, "_model", { enumerable: false });
    Object.defineProperty(this, "count", { enumerable: false });
    Object.defineProperty(this, "_query", { enumerable: false });
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
    return this;
  }

  // get socketPath() {
  //   return this._socketPath.getValue();
  // }

  // async refreshSocketPath() {
  //   await this.model.fetch(this.query, { cache: false, sync: true }).catch(() => null);
  // }

  // _createObservable() {
  //   this._observable = new Observable((subscriber) => {
  //     this._storeSub = this.model._listSubject.subscribe(async (_list) => {
  //       const newList = this.ids.map((_id) => _list.find((item) => item._id === _id)).filter((r) => r);
  //
  //       this.splice(0, this.length, ...newList);
  //       subscriber.next(this);
  //     });
  //
  //     if (this.model._client._options.realtime) {
  //       const _registerSocket = (socket, path?) => {
  //         if (!socket || !path) {
  //           return null;
  //         }
  //
  //         if (this._socketHandler) {
  //           socket.off(path, this._socketHandler);
  //         }
  //
  //         this._socketHandler = (data) => {
  //           const rows = this.model._handleRequestResult(data, this.query);
  //
  //           const cacheKey = this.model.getCacheKey(this.query);
  //           if (this.model._cache && this.model._cache[cacheKey]?.previous?.data) {
  //             this.model._cache[cacheKey].previous.data.data = data;
  //           }
  //
  //           this.splice(0, this.length, ...rows);
  //           this.count = data.count;
  //
  //           subscriber.next(this);
  //         };
  //
  //         return socket.on(path, this._socketHandler);
  //       };
  //
  //       this._socketPathSub = this._socketPath.subscribe((socketPath) => {
  //         if (!socketPath) {
  //           return;
  //         }
  //
  //         const { socket } = this.model._client;
  //         if (socket) {
  //           _registerSocket(socket, socketPath);
  //         }
  //       });
  //
  //       this._socketSub = this.model._client._socketSubject.subscribe((socket) => {
  //         if (!socket) {
  //           return;
  //         }
  //
  //         this.refreshSocketPath();
  //       });
  //
  //       if (this.model._client.socket && this.socketPath) {
  //         _registerSocket(this.model._client.socket, this.socketPath);
  //       }
  //
  //       this.model._client.connectSocket();
  //     }
  //   });
  // }

  createObservable() {
    this._observable = new Observable((subscriber) => {
      let prevSerial = this.toArray().map((item) => JSON.stringify(item.serialize?.apply(item)).normalize());
      this._storeSub = this.model._listSubject.subscribe(() => {
        setTimeout(async () => {
          const list = await this.model.getList(this.query, { cache: true });
          const listArray = list.toArray();

          let reload = false;
          if (prevSerial.length !== listArray.length) {
            reload = true;
            prevSerial = listArray.map((item) => JSON.stringify(item.serialize?.apply(item)).normalize());
          } else {
            const serial = listArray.map((item) => JSON.stringify(item.serialize?.apply(item)).normalize());
            if (!isEqual(serial, prevSerial)) {
              // if (!serial.every((objString) => prevSerial.find((toto) => toto.localeCompare(objString)))) {
              reload = true;
              prevSerial = serial;
            }
          }

          if (reload) {
            this.splice(0, this.length, ...listArray);
            this.count = list.count;

            subscriber.next(this);
          }
        });
      });
    });
  }

  subscribe(opts?) {
    if (!this._observable) {
      this.createObservable();
    }

    const sub = this._observable.subscribe.apply(this._observable, arguments);
    this._subscriptions.add(sub);
    const unsubscribe = sub.unsubscribe;
    sub.unsubscribe = () => {
      unsubscribe.apply(sub);
      this._subscriptions.delete(sub);

      if (!this._subscriptions.size) {
        this._storeSub?.unsubscribe();
        // this._socketSub?.unsubscribe();
        // this._socketPathSub?.unsubscribe();
        // this.socketPath && this.model._client.socket?.off(this.socketPath, this._socketHandler);
        // this._socketPath.next(null);
        delete this._observable;
      }
    };

    sub.next(this);
    return sub;
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
