/**
 * Construye y envía correos de verificación y recuperación mediante Nodemailer.
 */

import nodemailer from "nodemailer";
import { env } from "../config/env.js";
const transporter =
  env.email.user && env.email.password
    ? nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        secure: env.email.secure,
        auth: { user: env.email.user, pass: env.email.password },
      })
    : null;

// Crea y emite un mensaje a los participantes de la conversación.
const send = async (to, subject, code, purpose) => {
  if (!transporter) {
    console.log(`[EMAIL DEV] ${purpose} para ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: env.email.from,
    to,
    subject,
    html: `<div style="font-family:Arial;padding:24px"><h2 style="color:#f97316">ULimaSocial</h2><p>${purpose}</p><div style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</div><p>Este código vence pronto. Si no lo solicitaste, ignora este correo.</p></div>`,
  });
};

// Envía al usuario el código necesario para verificar su cuenta.
export const sendVerificationEmail = (to, code) =>
  send(
    to,
    "Verifica tu cuenta de ULimaSocial",
    code,
    "Tu código de verificación es:",
  );

// Envía al usuario el código para recuperar su contraseña.
export const sendResetEmail = (to, code) =>
  send(
    to,
    "Recupera tu contraseña de ULimaSocial",
    code,
    "Tu código de recuperación es:",
  );
