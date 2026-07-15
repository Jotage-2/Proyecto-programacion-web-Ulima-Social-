/**
 * Mantiene una única conexión Socket.IO compartida por toda la aplicación.
 *
 * La autenticación viaja en la misma cookie HTTP usada por la API, por eso se
 * habilita withCredentials y se reutiliza el origen configurado en VITE_API_URL.
 */

import { io } from "socket.io-client";
import { API_URL } from "./api";

const getSocketOrigin = () => {
  try {
    return new URL(API_URL, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
};

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketOrigin(), {
      autoConnect: false,
      withCredentials: true,
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};
