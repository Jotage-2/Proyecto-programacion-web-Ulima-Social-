/**
 * Firma y verifica JWT, y define las opciones de la cookie de sesión.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Crea un JWT con el identificador del usuario.
export const signToken = (id) =>
  jwt.sign({ sub: id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// Valida un JWT y devuelve su contenido.
export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

// Centraliza las opciones de seguridad y duración de la cookie.
export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});
