/**
 * Gestiona búsquedas, perfiles y actualización de datos del usuario.
 */

import { UserModel } from "../models/userModel.js";
import { publicUser } from "../utils/publicUser.js";
import { AppError } from "../utils/AppError.js";
import { uploadImage } from "../services/storageService.js";

// Busca usuarios activos y verificados por nombre, apellido, carrera o código universitario, excluyendo al usuario actual.
export const search = async (req, res) =>
  res.json({
    users: (await UserModel.search(String(req.query.q || ""), req.user.id)).map(
      publicUser,
    ),
  });

// Obtiene el perfil público de un usuario por su identificador.
export const getById = async (req, res) => {
  const u = await UserModel.findById(req.params.userId);

  if (!u || u.status !== "ACTIVE")
    throw new AppError("Usuario no encontrado.", 404);

  res.json({ user: publicUser(u) });
};

// Actualiza únicamente los campos de perfil permitidos para el usuario autenticado.
export const updateMe = async (req, res) =>
  res.json({ user: publicUser(await UserModel.update(req.user.id, req.body)) });

// Sube la nueva imagen al almacenamiento y guarda su URL pública en el perfil del usuario.
export const uploadProfilePicture = async (req, res) => {
  if (!req.file) throw new AppError("Selecciona una imagen.", 400);

  const url = await uploadImage(req.file, `profiles/${req.user.id}`);

  res.json({
    user: publicUser(
      await UserModel.update(req.user.id, { profilePicture: url }),
    ),
  });
};
