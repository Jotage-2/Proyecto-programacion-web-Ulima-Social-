/**
 * Convierte identificadores recibidos por URL a tipos numéricos seguros.
 *
 * Prisma lanza errores internos cuando recibe NaN o una cadena que no puede
 * convertirse a BigInt. Estas funciones permiten responder con un error 400
 * comprensible antes de ejecutar una consulta a la base de datos.
 */

import { AppError } from "./AppError.js";

export const parsePositiveInt = (value, fieldName = "identificador") => {
  const rawValue = String(value ?? "").trim();

  if (!/^\d+$/.test(rawValue)) {
    throw new AppError(`El ${fieldName} no es válido.`, 400);
  }

  const parsedValue = Number(rawValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new AppError(`El ${fieldName} no es válido.`, 400);
  }

  return parsedValue;
};

export const parsePositiveBigInt = (value, fieldName = "identificador") => {
  const rawValue = String(value ?? "").trim();

  if (!/^\d+$/.test(rawValue) || rawValue === "0") {
    throw new AppError(`El ${fieldName} no es válido.`, 400);
  }

  return BigInt(rawValue);
};
