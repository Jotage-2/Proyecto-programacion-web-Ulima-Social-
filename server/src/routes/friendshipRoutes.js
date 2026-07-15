/**
 * Define los endpoints para solicitudes y relaciones de amistad.
 */

import { Router } from "express";
import * as c from "../controllers/friendshipController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();
r.use(requireAuth);

// Consulta y administración de amistades y solicitudes.
r.get("/", asyncHandler(c.list));

r.post("/:userId", asyncHandler(c.send));

r.patch("/:id/accept", asyncHandler(c.accept));

r.patch("/:id/reject", asyncHandler(c.reject));

r.delete("/:id", asyncHandler(c.remove));

export default r;
