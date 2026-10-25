
import { io, type Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAccessToken = (): string | null => {
  // Match the token storage logic used by the Axios client.
  const sessionAccess = sessionStorage.getItem("accessToken");
  const sessionRefresh = sessionStorage.getItem("refreshToken");

  if (sessionAccess && sessionRefresh) {
    return sessionAccess;
  }

  const localAccess = localStorage.getItem("accessToken");
  const localRefresh = localStorage.getItem("refreshToken");

  if (localAccess && localRefresh) {
    return localAccess;
  }

  return sessionAccess || localAccess || null;
};

let socket: Socket | null = null;

export const connectAdminSocket = (): Socket | null => {
  const token = getAccessToken();

  if (!token || !API_BASE_URL) {
    return null;
  }

  // Reuse an existing connection when possible.
  if (socket) {
    if (socket.connected) {
      return socket;
    }

    socket.auth = { token };

    if (!socket.active) {
      socket.connect();
    }

    return socket;
  }

  // Connect to the backend origin, not the /api/v1 endpoint.
  const socketURL = new URL(
    API_BASE_URL,
    window.location.origin,
  ).origin;

  socket = io(socketURL, {
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.info("ExCart real-time connection established.");
  });

  socket.on("connect_error", (error) => {
    console.error(
      "ExCart real-time connection failed:",
      error.message,
    );
  });

  return socket;
};

export const getAdminSocket = (): Socket | null => socket;

export const disconnectAdminSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
