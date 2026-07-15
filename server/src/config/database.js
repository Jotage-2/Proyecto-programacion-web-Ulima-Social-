/**
 * Crea y exporta una única instancia de Prisma para acceder a PostgreSQL.
 */

import { PrismaClient } from "@prisma/client";

// Cliente compartido de Prisma.
// Se reutiliza una sola instancia para evitar abrir conexiones nuevas en cada solicitud.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
