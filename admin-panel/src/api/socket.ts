
import { io, type Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAccessToken = (): string | null => {
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

const notifyRealtimeEvent = (
  eventName: string,
  detail?: unknown,
): void => {
  window.dispatchEvent(
    new CustomEvent(eventName, { detail }),
  );
};

export const connectAdminSocket = (): Socket | null => {
  const token = getAccessToken();

  if (!token || !API_BASE_URL) {
    console.warn(
      "ExCart real-time connection skipped: access token or API URL is missing.",
    );
    return null;
  }

  if (socket) {
    if (socket.connected) {
      return socket;
    }

    // Update authentication before reconnecting.
    socket.auth = { token };

    if (!socket.active) {
      socket.connect();
    }

    return socket;
  }

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

    // Notify the app after initial connection and reconnection.
    notifyRealtimeEvent("excart:reconnected");
  });

  socket.on("data:changed", (payload: unknown) => {
    console.info(
      "[ExCart] Received data:changed event:",
      payload,
    );

    notifyRealtimeEvent("excart:data-changed", payload);
  });

  socket.on("connect_error", (error) => {
    console.error(
      "ExCart real-time connection failed:",
      error.message,
    );
  });

  socket.on("disconnect", (reason) => {
    console.warn(
      "ExCart real-time connection disconnected:",
      reason,
    );
  });

  return socket;
};

export const getAdminSocket = (): Socket | null => socket;

export const disconnectAdminSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
