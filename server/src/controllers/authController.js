/**
 * Gestiona registro, verificación, inicio de sesión y recuperación de contraseña.
 */

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { UserModel } from "../models/userModel.js";
import { AppError } from "../utils/AppError.js";
import { generateCode, hashCode } from "../utils/codes.js";
import { signToken, cookieOptions } from "../utils/token.js";
import { publicUser } from "../utils/publicUser.js";
import {
  sendVerificationEmail,
  sendResetEmail,
} from "../services/emailService.js";
import { uploadImage } from "../services/storageService.js";

// Elimina los códigos anteriores que aún no fueron usados, genera uno nuevo y guarda solo su hash con una fecha de vencimiento.
const issueCode = async (userId, type, ttl) => {
  await prisma.verificationToken.deleteMany({
    where: { userId, type, usedAt: null },
  });

  const code = generateCode();

  await prisma.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash: hashCode(code),
      expiresAt: new Date(Date.now() + ttl * 60000),
    },
  });

  return code;
};

// Crea una cuenta nueva: valida duplicados, cifra la contraseña, guarda al usuario y envía el código de verificación por correo.
export const register = async (req, res) => {
  // Se extraen por separado los campos que necesitan tratamiento especial; el resto de datos del perfil permanece en rest.
  const { email, studentCode, password, ...rest } = req.body;

  if (await UserModel.findByEmail(email))
    throw new AppError("El correo ya está registrado.", 409);

  if (await prisma.user.findUnique({ where: { studentCode } }))
    throw new AppError("El código universitario ya está registrado.", 409);

  const userId = crypto.randomUUID();

  // Cuando el registro incluye una foto, se guarda primero en Supabase y en
  // la base de datos se almacena únicamente la URL pública resultante.
  const profilePicture = req.file
    ? await uploadImage(req.file, `profiles/${userId}`)
    : rest.profilePicture || null;

  const user = await UserModel.create({
    id: userId,
    email,
    studentCode,

    // La contraseña nunca se guarda en texto plano; bcrypt genera un hash con un coste de 12 rondas.
    passwordHash: await bcrypt.hash(password, 12),
    ...rest,
    profilePicture,
  });

  const code = await issueCode(
    user.id,
    "EMAIL_VERIFICATION",
    env.verificationTtl,
  );

  await sendVerificationEmail(user.email, code);
  res.status(201).json({
    message: "Registro creado. Revisa tu correo para verificar la cuenta.",
    email: user.email,
  });
};

// Valida el código de verificación más reciente y, dentro de una transacción, marca el código como usado y la cuenta como verificada.
export const verifyEmail = async (req, res) => {
  const user = await UserModel.findByEmail(req.body.email);

  if (!user) throw new AppError("Usuario no encontrado.", 404);

  // Se consulta únicamente el código vigente más reciente que aún no fue utilizado.
  const token = await prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token || token.tokenHash !== hashCode(req.body.code))
    throw new AppError("Código incorrecto o vencido.", 400);

  // La transacción evita que una operación se guarde si la otra falla.
  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({ where: { id: user.id }, data: { verified: true } }),
  ]);

  res.json({ message: "Cuenta verificada correctamente." });
};

// Genera otro código de verificación únicamente cuando la cuenta existe y todavía no ha sido verificada.
export const resend = async (req, res) => {
  const user = await UserModel.findByEmail(req.body.email);

  if (!user) throw new AppError("Usuario no encontrado.", 404);

  if (user.verified) throw new AppError("La cuenta ya está verificada.", 409);

  const code = await issueCode(
    user.id,
    "EMAIL_VERIFICATION",
    env.verificationTtl,
  );

  await sendVerificationEmail(user.email, code);

  res.json({ message: "Código reenviado." });
};

// Busca al usuario por correo o código universitario, compara la contraseña y crea la cookie de autenticación si la cuenta está habilitada.
export const login = async (req, res) => {
  const user = await UserModel.findByIdentifier(req.body.identifier);

  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    throw new AppError("Correo, código o contraseña incorrectos.", 401);

  if (!user.verified)
    throw new AppError("Primero verifica tu correo institucional.", 403);

  if (user.status !== "ACTIVE")
    throw new AppError("La cuenta no está activa.", 403);

  await UserModel.update(user.id, { lastLoginAt: new Date() });
  res
    .cookie(env.cookieName, signToken(user.id), cookieOptions())
    .json({ user: publicUser(user) });
};

// Cierra la sesión eliminando del navegador la cookie que contiene el token JWT.
export const logout = (req, res) => {
  res
    .clearCookie(env.cookieName, { ...cookieOptions(), maxAge: 0 })
    .json({ message: "Sesión cerrada." });
};

// Devuelve una versión segura del usuario autenticado, sin exponer campos privados como el hash de la contraseña.
export const me = (req, res) => res.json({ user: publicUser(req.user) });

// Inicia la recuperación de contraseña; la respuesta siempre es genérica para no revelar si un correo está registrado.
export const forgot = async (req, res) => {
  const user = await UserModel.findByEmail(req.body.email);

  if (user) {
    const code = await issueCode(user.id, "PASSWORD_RESET", env.resetTtl);
    await sendResetEmail(user.email, code);
  }

  res.json({
    message: "Si el correo existe, recibirás un código de recuperación.",
  });
};

// Comprueba que el código de recuperación exista, no haya sido usado y todavía se encuentre vigente.
export const verifyResetCode = async (req, res) => {
  const user = await UserModel.findByEmail(req.body.email);

  const token =
    user &&
    (await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }));

  if (!token || token.tokenHash !== hashCode(req.body.code))
    throw new AppError("Código incorrecto o vencido.", 400);

  res.json({ message: "Código válido." });
};

// Reemplaza la contraseña por un nuevo hash y marca el código de recuperación como utilizado dentro de una sola transacción.
export const resetPassword = async (req, res) => {
  const user = await UserModel.findByEmail(req.body.email);

  const token =
    user &&
    (await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }));

  if (!token || token.tokenHash !== hashCode(req.body.code))
    throw new AppError("Código incorrecto o vencido.", 400);

  // La transacción garantiza que todas las operaciones se completen juntas.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12) },
    }),
    prisma.verificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  res.json({ message: "Contraseña actualizada." });
};
