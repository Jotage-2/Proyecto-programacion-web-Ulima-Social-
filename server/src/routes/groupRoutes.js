/**
 * Define los endpoints para grupos y sus miembros.
 */

import { Router } from "express";
import * as c from "../controllers/groupController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { groupSchema } from "../validators/commonSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();
r.use(requireAuth);

// Consulta general y creación de grupos.
r.get("/", asyncHandler(c.list));

r.post("/", validate(groupSchema), asyncHandler(c.create));

// Operaciones sobre un grupo específico.
r.get("/:id", asyncHandler(c.getOne));

r.patch("/:id", validate(groupSchema.partial()), asyncHandler(c.update));

r.post("/:id/join", asyncHandler(c.join));

r.delete("/:id/leave", asyncHandler(c.leave));

export default r;
