/**
 * Protege rutas privadas verificando el token de autenticación del usuario.
 */

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/token.js";
import { AppError } from "../utils/AppError.js";

// Extrae el JWT desde la cookie o el encabezado Authorization, lo valida y carga al usuario activo en req.user.
export const requireAuth = async (req, res, next) => {
  try {
    // Primero se revisa el encabezado Bearer; después se usa la cookie como opción principal del navegador.
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.[env.cookieName] || bearer;
    if (!token) throw new AppError("No autenticado.", 401);

    // verifyToken comprueba la firma y la fecha de expiración antes de devolver el contenido del JWT.
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE")
      throw new AppError("Sesión inválida.", 401);

    // Los controladores posteriores pueden acceder al usuario autenticado mediante req.user.
    req.user = user;
    next();
  } catch (e) {
    next(e.statusCode ? e : new AppError("Sesión inválida o vencida.", 401));
  }
};
