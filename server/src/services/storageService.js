/**
 * Sube imágenes al almacenamiento de Supabase y devuelve su URL pública.
 */

import crypto from "node:crypto";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// Valida que Supabase esté configurado, sube la imagen con un nombre único y devuelve la URL pública resultante.
export const uploadImage = async (file, folder) => {
  if (!supabase)
    throw new AppError("Supabase Storage no está configurado.", 503);

  const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";

  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(env.supabase.bucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error)
    throw new AppError(`No se pudo subir la imagen: ${error.message}`, 500);

  return supabase.storage.from(env.supabase.bucket).getPublicUrl(path).data
    .publicUrl;
};
