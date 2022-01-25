import axios from "axios";
import Client from "../Client";
import GraphandError from "../lib/GraphandError";

const setupAxios = (client: Client) => {
  const options = client._options;
  const axiosClient = axios.create({
    baseURL: `${options.ssl ? "https" : "http"}://${options.project ? `${options.project}.` : ""}${options.host}`,
  });

  axiosClient.interceptors.request.use((config: any) => {
    config.data = config.data || config._data;
    config.headers = config.headers || {};

    if (config.headers.Authorization === undefined) {
      const token = client.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.headers.Authorization === null) {
      delete config.headers.Authorization;
    }

    if (/\/users/.test(config.url)) {
      config.baseURL = `${options.ssl ? "https" : "http"}://${options.host}`;
    }

    return config;
  });

  axiosClient.interceptors.response.use(
    (r) => r,
    (error) => {
      error.graphandErrors = error.graphandErrors || [];

      try {
        const { errors } = error.response.data;
        error.graphandErrors = error.graphandErrors.concat(errors.map((e) => GraphandError.fromJSON(e, error.response.status)));
      } catch (e) {}

      if (!error.config._retry && error.config.url !== "/auth/login" && error.graphandErrors.find((e) => e.code === "expired_token")) {
        return client.refreshToken().then(() => {
          const { config } = error;
          delete config.headers.Authorization;
          config._retry = true;
          return axiosClient.request(config);
        });
      }

      return Promise.reject(error.graphandErrors || [new GraphandError(error.message)]);
    },
  );

  return axiosClient;
};

export default setupAxios;
