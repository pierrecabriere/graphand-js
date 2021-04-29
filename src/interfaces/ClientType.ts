import { ClientOptions } from "./ClientOptions";
import { AxiosInstance } from "axios";
import { BehaviorSubject, Subject } from "rxjs";

export interface ClientType {
  _options: ClientOptions;
  _axios: AxiosInstance;
  _project: any;
  socketSubject: Subject<any>;
  mediasQueueSubject: BehaviorSubject<any>
  GraphandModel: any;
}