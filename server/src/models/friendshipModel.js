/**
 * Agrupa las consultas de Prisma relacionadas con amistades.
 */

import { prisma } from "../config/database.js";

// Operaciones de acceso a datos para amistades.
export const FriendshipModel = {
  findBetween: (a, b) =>
    prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    }),
  create: (a, b) =>
    prisma.friendship.create({ data: { requesterId: a, addresseeId: b } }),
  findOwned: (id, userId) =>
    prisma.friendship.findFirst({
      where: { id, OR: [{ requesterId: userId }, { addresseeId: userId }] },
    }),
  update: (id, status) =>
    prisma.friendship.update({ where: { id }, data: { status } }),
  remove: (id) => prisma.friendship.delete({ where: { id } }),
};
