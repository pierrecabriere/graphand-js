export interface ClientOptions {
  project?: string;
  accessToken?: string;
  locale?: string;
  translations?: string[];
  host?: string;
  cdn?: string;
  realtime?: boolean;
  autoSync?: boolean;
  autoMapQueries?: boolean;
  ssl?: boolean;
  unloadTimeout?: number;
  subscribeFields?: boolean;
  init?: boolean;
}