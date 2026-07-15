/**
 * Configura el cliente de Supabase usado para almacenar imágenes.
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Cliente compartido de Supabase.
// Cuando faltan credenciales, se exporta null para que el servicio de almacenamiento pueda detectar la configuración incompleta.
export const supabase =
  env.supabase.url && env.supabase.key
    ? createClient(env.supabase.url, env.supabase.key, {
        auth: { persistSession: false },
      })
    : null;
