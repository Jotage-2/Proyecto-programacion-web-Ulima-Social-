/**
 * Define los endpoints de búsqueda y gestión de perfiles.
 */

import { Router } from "express";
import * as c from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../validators/commonSchemas.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();
r.use(requireAuth);

// Búsqueda y consulta de perfiles.
r.get("/search", asyncHandler(c.search));

// Edición del perfil del usuario autenticado.
r.patch("/me", validate(profileSchema), asyncHandler(c.updateMe));

r.patch(
  "/me/profile-picture",
  upload.single("image"),
  asyncHandler(c.uploadProfilePicture),
);
r.get("/:userId", asyncHandler(c.getById));

export default r;
