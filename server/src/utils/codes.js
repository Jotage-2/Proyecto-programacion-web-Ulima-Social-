/**
 * Genera códigos temporales y crea hashes seguros para almacenarlos.
 */

import crypto from "node:crypto";

// Genera un código numérico aleatorio para verificaciones temporales.
export const generateCode = () => String(crypto.randomInt(100000, 1000000));

// Crea un hash SHA-256 para no guardar códigos sensibles en texto plano.
export const hashCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");
