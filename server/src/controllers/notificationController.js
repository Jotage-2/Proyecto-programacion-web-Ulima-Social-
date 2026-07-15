/**
 * Permite consultar y marcar como leídas las notificaciones del usuario.
 */

import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { publicUser } from "../utils/publicUser.js";
import { parsePositiveBigInt } from "../utils/params.js";

// Devuelve las notificaciones más recientes del usuario y calcula cuántas todavía están sin leer.
export const list = async (req, res) => {
  const n = await prisma.notification.findMany({
    where: { userId: req.user.id },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({
    notifications: n.map((x) => ({ ...x, actor: publicUser(x.actor) })),
    unreadCount: n.filter((x) => !x.isRead).length,
  });
};

// Marca como leída una notificación concreta, verificando que pertenezca al usuario autenticado.
export const readOne = async (req, res) => {
  const n = await prisma.notification.findUnique({
    where: {
      id: parsePositiveBigInt(req.params.id, "identificador de notificación"),
    },
  });

  if (!n || n.userId !== req.user.id)
    throw new AppError("Notificación no encontrada.", 404);

  res.json({
    notification: await prisma.notification.update({
      where: { id: n.id },
      data: { isRead: true, readAt: new Date() },
    }),
  });
};

// Marca en una sola operación todas las notificaciones pendientes del usuario como leídas.
export const readAll = async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  res.json({ message: "Notificaciones marcadas como leídas." });
};
