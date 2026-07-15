/**
 * Ejecuta esquemas de validación antes de llamar al controlador.
 */

import { AppError } from "../utils/AppError.js";

// Devuelve un middleware que valida body, params o query con Zod.
export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    // safeParse valida sin lanzar una excepción y devuelve los errores de forma estructurada.
    const result = schema.safeParse(req[source]);
    if (!result.success)
      return next(
        new AppError("Datos inválidos.", 422, result.error.flatten()),
      );

    // Se reemplazan los datos originales por la versión validada y normalizada por Zod.
    req[source] = result.data;
    next();
  };
