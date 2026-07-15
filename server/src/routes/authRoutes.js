/**
 * Define los endpoints públicos y privados del módulo de autenticación.
 */

import { Router } from "express";
import * as c from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  registerSchema,
  loginSchema,
  codeSchema,
  emailSchema,
  resetSchema,
} from "../validators/authSchemas.js";

const r = Router();

// Registro y verificación de la cuenta.
r.post(
  "/register",
  // Multer solo procesa multipart/form-data; las solicitudes JSON continúan funcionando.
  upload.single("image"),
  validate(registerSchema),
  asyncHandler(c.register),
);

r.post("/verify-email", validate(codeSchema), asyncHandler(c.verifyEmail));

r.post("/resend-code", validate(emailSchema), asyncHandler(c.resend));

// Inicio y cierre de sesión.
r.post("/login", validate(loginSchema), asyncHandler(c.login));

r.post("/logout", c.logout);

r.get("/me", requireAuth, c.me);

// Recuperación de contraseña.
r.post("/forgot-password", validate(emailSchema), asyncHandler(c.forgot));

r.post(
  "/verify-reset-code",
  validate(codeSchema),
  asyncHandler(c.verifyResetCode),
);
r.patch(
  "/reset-password",
  validate(resetSchema),
  asyncHandler(c.resetPassword),
);

export default r;
