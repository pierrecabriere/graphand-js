import io from "socket.io-client";
import GraphandClient from "../GraphandClient";

const setupSocket = (client: GraphandClient) => {
  const endpoint = `${client._options.ssl ? "https" : "http"}://${client._options.host}`;
  let hostname = client._options.socketOptions?.hostname;
  if (!hostname) {
    try {
      hostname = process.env.HOSTNAME || require("os")?.hostname();
    } catch (e) {}
  }

  const socket = io(endpoint, {
    ...(client._options.socketOptions?.managerOptions || {}),
    query: {
      token: client.getAccessToken(),
      project: client._options.project,
      env: client._options.env || "master",
      hostname,
    },
  });

  socket.on("ping", () => socket.emit("pong"));

  socket.on("replaceUid", () => {
    console.log(`Disconnecting socket ${socket.id} because of duplicate connection ...`);
    socket.close();
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
      case "error":
        client._mediasQueueSubject.next(client._mediasQueueSubject.value.map((item) => (item === queueItem ? Object.assign(item, payload) : item)));
        break;
    }
  });

  socket.on("connect", () => client._socketSubject.next(socket));
  socket.on("disconnect", () => client._socketSubject.next(null));

  socket.on("connect_error", (e) => console.error("connect_error", e));
  socket.on("reconnect_error", (e) => console.error("reconnect_error", e));
  socket.on("reconnect_failed", (e) => console.error("reconnect_failed", e));
  socket.on("connect_timeout", (e) => console.error("connect_timeout", e));

  return socket;
};

export default setupSocket;
