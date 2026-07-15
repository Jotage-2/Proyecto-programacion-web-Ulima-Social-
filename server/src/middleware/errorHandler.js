/**
 * Centraliza las respuestas para rutas inexistentes y errores de la aplicación.
 */

import { AppError } from "../utils/AppError.js";

/**
 * Convierte cualquier endpoint inexistente en un error controlado de tipo 404.
 */
export const notFound = (req, res, next) => {
  next(
    new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404),
  );
};

/**
 * Unifica los errores en respuestas JSON y traduce errores conocidos de Zod,
 * Multer y Prisma a mensajes que el frontend puede mostrar directamente.
 */
export const errorHandler = (err, req, res, next) => {
  // Express exige cuatro parámetros para reconocer este middleware como
  // manejador de errores, aunque next no se utilice después de esta línea.
  void next;

  console.error(err);

  if (err?.name === "ZodError") {
    return res.status(422).json({
      message: "Datos inválidos.",
      details: err.flatten?.() || undefined,
    });
  }

  if (err?.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "La imagen supera el tamaño máximo permitido de 5 MB."
        : "No se pudo procesar el archivo enviado.";

    return res.status(422).json({ message });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "La solicitud supera el tamaño máximo permitido.",
    });
  }

  if (err?.code === "P2002") {
    return res.status(409).json({
      message: "Ya existe un registro con esos datos.",
      fields: err.meta?.target,
    });
  }

  if (err?.code === "P2003") {
    return res.status(400).json({
      message: "Uno de los registros relacionados no existe.",
    });
  }

  if (err?.code === "P2025") {
    return res.status(404).json({
      message: "El registro solicitado no existe.",
    });
  }

  const status = err.statusCode || 500;

  return res.status(status).json({
    message: status === 500 ? "Error interno del servidor." : err.message,
    details: err.details || undefined,
  });
};
