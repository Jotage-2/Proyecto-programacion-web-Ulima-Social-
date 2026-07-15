/**
 * Guarda notificaciones en la base de datos y las emite en tiempo real.
 */

import { prisma } from "../config/database.js";
import { publicUser } from "../utils/publicUser.js";

// Guarda una notificación y, cuando existe una conexión Socket.IO, la envía inmediatamente al usuario destinatario.
export const createNotification = async (data, io) => {
  const n = await prisma.notification.create({
    data,
    include: { actor: true },
  });

  // Nunca se envía el modelo User completo por Socket.IO.
  const notification = {
    ...n,
    actor: publicUser(n.actor),
  };

  io?.to(`user:${data.userId}`).emit("notification:new", notification);

  return notification;
};
