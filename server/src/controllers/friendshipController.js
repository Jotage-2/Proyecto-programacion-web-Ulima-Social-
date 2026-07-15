/**
 * Gestiona solicitudes de amistad y cambios de estado entre usuarios.
 */

import { prisma } from "../config/database.js";
import { FriendshipModel } from "../models/friendshipModel.js";
import { AppError } from "../utils/AppError.js";
import { publicUser } from "../utils/publicUser.js";
import { createNotification } from "../services/notificationService.js";
import { parsePositiveInt } from "../utils/params.js";

// Separa las relaciones del usuario en tres grupos: amistades aceptadas, solicitudes enviadas y solicitudes recibidas.
export const list = async (req, res) => {
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: req.user.id }, { addresseeId: req.user.id }] },
    include: { requester: true, addressee: true },
    orderBy: { updatedAt: "desc" },
  });

  const friends = [],
    sent = [],
    received = [];

  for (const f of rows) {
    const other = publicUser(
      f.requesterId === req.user.id ? f.addressee : f.requester,
    );
    const item = { ...other, friendshipId: f.id, status: f.status };
    if (f.status === "ACCEPTED") friends.push(item);
    else if (f.status === "PENDING" && f.requesterId === req.user.id)
      sent.push(item);
    else if (f.status === "PENDING") received.push(item);
  }

  res.json({ friends, sentRequests: sent, receivedRequests: received });
};

// Crea una solicitud de amistad y genera una notificación para el usuario que la recibe.
export const send = async (req, res) => {
  const target = req.params.userId;

  if (target === req.user.id)
    throw new AppError("No puedes agregarte a ti mismo.", 400);

  const targetUser = await prisma.user.findUnique({ where: { id: target } });

  if (!targetUser || targetUser.status !== "ACTIVE" || !targetUser.verified)
    throw new AppError("Usuario no encontrado.", 404);

  if (await FriendshipModel.findBetween(req.user.id, target))
    throw new AppError("Ya existe una relación o solicitud.", 409);

  const f = await FriendshipModel.create(req.user.id, target);

  await createNotification(
    {
      userId: target,
      actorId: req.user.id,
      type: "FRIEND_REQUEST",
      entityType: "friendship",
      entityId: String(f.id),
      content: "Te envió una solicitud de amistad.",
    },
    req.app.get("io"),
  );

  res.status(201).json({ friendship: f });
};

// Acepta una solicitud pendiente únicamente cuando el usuario autenticado es quien la recibió.
export const accept = async (req, res) => {
  const f = await FriendshipModel.findOwned(
    parsePositiveInt(req.params.id, "identificador de amistad"),
    req.user.id,
  );

  if (!f || f.addresseeId !== req.user.id || f.status !== "PENDING")
    throw new AppError("Solicitud no válida.", 404);

  const updated = await FriendshipModel.update(f.id, "ACCEPTED");

  await createNotification(
    {
      userId: f.requesterId,
      actorId: req.user.id,
      type: "FRIEND_ACCEPTED",
      entityType: "friendship",
      entityId: String(f.id),
      content: "Aceptó tu solicitud de amistad.",
    },
    req.app.get("io"),
  );

  res.json({ friendship: updated });
};

// Rechaza una solicitud pendiente y elimina la relación para permitir una solicitud futura.
export const reject = async (req, res) => {
  const f = await FriendshipModel.findOwned(
    parsePositiveInt(req.params.id, "identificador de amistad"),
    req.user.id,
  );

  if (!f || f.addresseeId !== req.user.id)
    throw new AppError("Solicitud no encontrada.", 404);

  await FriendshipModel.remove(f.id);

  res.json({ message: "Solicitud rechazada." });
};

// Elimina una amistad o solicitud existente siempre que el usuario autenticado forme parte de ella.
export const remove = async (req, res) => {
  const f = await FriendshipModel.findOwned(
    parsePositiveInt(req.params.id, "identificador de amistad"),
    req.user.id,
  );

  if (!f) throw new AppError("Relación no encontrada.", 404);

  await FriendshipModel.remove(f.id);

  res.json({ message: "Relación eliminada." });
};
