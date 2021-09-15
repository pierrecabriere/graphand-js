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
    if (!config.headers.Authorization) {
      const token = client.accessToken || options.accessToken;
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (/\/users/.test(config.url)) {
      config.baseURL = `${options.ssl ? "https" : "http"}://${options.host}`;
    }

    return config;
  });

  axiosClient.interceptors.response.use(
    (r) => r,
    (error) => {
      try {
        const { errors } = error.response.data;
        error.graphandErrors = error.graphandErrors || [];
        error.graphandErrors = error.graphandErrors.concat(errors.map((e) => GraphandError.fromJSON(e, error.response.status)));
      } catch (e) {}

      return Promise.reject(error.graphandErrors || [new GraphandError(error.message)]);
    },
  );

  return axiosClient;
};

export default setupAxios;
