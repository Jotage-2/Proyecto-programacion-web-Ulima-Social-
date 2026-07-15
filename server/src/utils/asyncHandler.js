/**
 * Adapta controladores asíncronos para enviar sus errores al middleware global.
 */

// Captura rechazos de promesas y los reenvía al manejador global de errores.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
