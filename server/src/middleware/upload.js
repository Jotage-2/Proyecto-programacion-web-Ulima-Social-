/**
 * Configura Multer para recibir imágenes y limitar archivos inválidos o demasiado grandes.
 */

import multer from "multer";
import { AppError } from "../utils/AppError.js";

// Middleware configurado para recibir una sola imagen en memoria.
export const upload = multer({
  // La imagen se mantiene temporalmente en memoria porque luego se envía directamente a Supabase.
  storage: multer.memoryStorage(),

  // Cada archivo puede pesar como máximo 5 MB.
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new AppError("Solo se permiten imágenes.", 415)),
});
