/**
 * Agrupa las consultas de Prisma relacionadas con usuarios.
 */

import { prisma } from "../config/database.js";

// Operaciones de acceso a datos para usuarios.
export const UserModel = {
  create: (data) => prisma.user.create({ data }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email) =>
    prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    }),
  findByIdentifier: (identifier) =>
    prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { studentCode: identifier },
        ],
      },
    }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  search: (q, excludeId) =>
    prisma.user.findMany({
      where: {
        id: { not: excludeId },
        status: "ACTIVE",
        verified: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { studentCode: { contains: q } },
          { career: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 30,
      orderBy: { name: "asc" },
    }),
};
