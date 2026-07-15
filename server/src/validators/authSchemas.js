/**
 * Define validaciones para autenticación, verificación y cambio de contraseña.
 */

import { z } from "zod";
const ulimaEmail = z
  .string()
  .email()
  .transform((v) => v.toLowerCase().trim())
  .refine(
    (v) => v.endsWith("@aloe.ulima.edu.pe") || v.endsWith("@ulima.edu.pe"),
    "Usa un correo institucional de la Universidad de Lima.",
  );

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  studentCode: z.string().regex(/^\d{8}$/, "El código debe tener 8 dígitos."),
  email: ulimaEmail,
  password: z.string().min(6).max(100),
  career: z.string().trim().min(2).max(100),
  cycle: z.coerce.string().regex(/^(?:[1-9]|1[0-2])$/),
  profilePicture: z.string().url().optional().or(z.literal("")),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export const codeSchema = z.object({
  email: ulimaEmail,
  code: z.string().regex(/^\d{6}$/),
});

export const emailSchema = z.object({ email: ulimaEmail });

export const resetSchema = codeSchema.extend({
  newPassword: z.string().min(6).max(100),
});
