import { AxiosInstance } from "axios";
import { BehaviorSubject, Subject } from "rxjs";
import { ClientOptions } from "./ClientOptions";

export interface ClientType {
  _options: ClientOptions;
  _axios: AxiosInstance;
  _project: any;
  _socketSubject: Subject<any>;
  _mediasQueueSubject: BehaviorSubject<any>;
  GraphandModel: any;
}
