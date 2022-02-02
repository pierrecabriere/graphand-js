export interface ClientOptions {
  host?: string;
  cdn?: string;
  ssl?: boolean;
  unloadTimeout?: number;
  project?: string;
  accessToken?: string;
  refreshToken?: string;
  locale?: string;
  translations?: string[];
  realtime?: boolean;
  mergeQueries?: boolean;
  autoSync?: boolean;
  subscribeFields?: boolean;
  init?: boolean;
  initProject?: boolean;
  initModels?: boolean;
  models?: any[];
  cache?: boolean;
  plugins?: any[];
  socketOptions?: any;
  env?: string;
}
