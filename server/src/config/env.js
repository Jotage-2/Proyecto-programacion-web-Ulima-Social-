/**
 * Lee, valida y normaliza las variables de entorno utilizadas por el backend.
 */

import "dotenv/config";
const required = ["DATABASE_URL", "DIRECT_URL", "JWT_SECRET", "CLIENT_URL"];
for (const key of required)
  if (!process.env[key]) throw new Error(`Falta la variable de entorno ${key}`);

// Configuración centralizada de la aplicación.
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  clientUrl: process.env.CLIENT_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: process.env.COOKIE_NAME || "ulimasocial_token",
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 465),
    secure: process.env.EMAIL_SECURE !== "false",
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_APP_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "ulimasocial-media",
  },
  verificationTtl: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15),
  resetTtl: Number(process.env.RESET_CODE_TTL_MINUTES || 15),
};
