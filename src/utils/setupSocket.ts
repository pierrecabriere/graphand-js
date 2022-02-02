import io from "socket.io-client";
import Client from "../Client";

const setupSocket = (client: Client) => {
  const endpoint = `${client._options.ssl ? "https" : "http"}://${client._options.host}`;
  const socket = io.connect(endpoint, {
    ...client._options.socketOptions,
    query: { token: client.getAccessToken(), projectId: client._options.project, env: client._options.env || "master" },
  });

  socket.on("/uploads", ({ action, payload }) => {
    const queueItem = client._mediasQueueSubject.value.find((item) => (payload.socket ? item.socket === payload.socket : item.name === payload.name));
    payload.status = action;
    switch (action) {
      case "start":
        client._mediasQueueSubject.next(client._mediasQueueSubject.value.concat(payload));
        break;
      case "end":
      case "aborted":
      case "progress":
        client._mediasQueueSubject.next(client._mediasQueueSubject.value.map((item) => (item === queueItem ? Object.assign(item, payload) : item)));
        break;
    }
  });

  socket.on("connect", () => client._socketSubject.next(socket));
  socket.on("reconnect_error", console.log);

  return socket;
};

export default setupSocket;
