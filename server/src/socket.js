/**
 * Configura la comunicación en tiempo real y autentica conexiones de Socket.IO.
 */

import { env } from "./config/env.js";
import { verifyToken } from "./utils/token.js";
import { prisma } from "./config/database.js";
const parseCookie = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .map((v) => v.trim().split("=").map(decodeURIComponent))
      .filter((x) => x.length === 2),
  );

// Autentica cada conexión Socket.IO mediante JWT y conecta al usuario a salas privadas para recibir eventos en tiempo real.
export const configureSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        parseCookie(socket.handshake.headers.cookie)[env.cookieName];
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return next(new Error("No autenticado"));
      socket.user = user;
      next();
    } catch {
      next(new Error("No autenticado"));
    }
  });
  io.on("connection", async (socket) => {
    socket.join(`user:${socket.user.id}`);
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: socket.user.id, leftAt: null },
    });
    for (const m of memberships)
      socket.join(`conversation:${m.conversationId}`);
    socket.on("conversation:join", async (id) => {
      const m = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: BigInt(id),
            userId: socket.user.id,
          },
        },
      });
      if (m && !m.leftAt) socket.join(`conversation:${id}`);
    });
  });
};
