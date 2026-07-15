/**
 * Define los endpoints para consultar y leer notificaciones.
 */

import { Router } from "express";
import * as c from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();
r.use(requireAuth);

// Consulta y actualización del estado de las notificaciones.
r.get("/", asyncHandler(c.list));

r.patch("/read-all", asyncHandler(c.readAll));

r.patch("/:id/read", asyncHandler(c.readOne));

export default r;
