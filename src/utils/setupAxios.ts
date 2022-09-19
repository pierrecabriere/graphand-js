import axios from "axios";
import Client from "../Client";
import GraphandError from "../lib/GraphandError";

const setupAxios = (client: Client) => {
  const options = client._options;
  const axiosClient = axios.create();

  axiosClient.interceptors.request.use((config: any) => {
    config.data = config.data || config._data;
    config.headers = config.headers || {};

    if (config.global) {
      config.baseURL = `${options.ssl ? "https" : "http"}://${options.host}`;
      config.params = config.params || {};
      config.params.project = client._options.project;
    } else {
      config.baseURL = client.getBaseURL();
    }

    if (config.headers.Authorization === undefined) {
      const token = client.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.headers.Authorization === null) {
      delete config.headers.Authorization;
    }

    if (config.headers["Content-Environment"] === undefined) {
      config.headers["Content-Environment"] = client._options.env || "master";
    }

    return config;
  });

  axiosClient.interceptors.response.use(
    (r) => r,
    (error) => {
      error.graphandErrors = error.graphandErrors || [];

      try {
        const { data, errors } = error.response.data;
        error.data = data;
        error.graphandErrors = errors.map((e) => GraphandError.fromJSON(e, error.response.status));
      } catch (e) {}

      if (
        error.config &&
        !error.config._retry &&
        error.config.url !== "/auth/login" &&
        error.config.url !== "/auth/confirm" &&
        error.graphandErrors.find((e) => e.code === "expired_token")
      ) {
        return client.refreshToken().then(() => {
          const { config } = error;
          delete config.headers.Authorization;
          config._retry = true;
          return axiosClient.request(config);
        });
      }

      return Promise.reject(error);
    },
  );

  return axiosClient;
};

export default setupAxios;
