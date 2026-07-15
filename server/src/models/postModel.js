/**
 * Agrupa las consultas de Prisma relacionadas con publicaciones.
 */

import { prisma } from "../config/database.js";

// Relaciones necesarias para construir una publicación completa en la API.
const include = {
  author: true,
  likes: true,
  comments: {
    where: { deletedAt: null },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  },
};

/**
 * Construye el filtro de visibilidad del feed.
 *
 * El usuario siempre puede ver sus propias publicaciones. Las publicaciones
 * públicas son visibles para todos los usuarios autenticados y las de tipo
 * FRIENDS solamente para amistades aceptadas.
 */
const buildVisibilityFilter = ({ viewerId, friendIds = [] }) => ({
  OR: [
    { authorId: viewerId },
    { visibility: "PUBLIC" },
    {
      visibility: "FRIENDS",
      authorId: { in: friendIds },
    },
  ],
});

// Operaciones de acceso a datos para publicaciones.
export const PostModel = {
  list: ({ authorId, viewerId, friendIds = [] }) =>
    prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(authorId ? { authorId } : {}),
        ...buildVisibilityFilter({ viewerId, friendIds }),
      },
      include,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),

  find: (id) =>
    prisma.post.findFirst({
      where: { id, deletedAt: null },
      include,
    }),

  create: (data) => prisma.post.create({ data, include }),

  update: (id, data) =>
    prisma.post.update({
      where: { id },
      data,
      include,
    }),

  remove: (id) =>
    prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
};
