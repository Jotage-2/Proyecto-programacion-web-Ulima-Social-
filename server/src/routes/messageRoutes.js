/**
 * Define los endpoints de conversaciones y mensajes.
 */

import { Router } from "express";
import * as c from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  conversationSchema,
  messageSchema,
} from "../validators/commonSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();
r.use(requireAuth);

// Conversaciones del usuario autenticado.
r.get("/conversations", asyncHandler(c.list));

r.post("/conversations", validate(conversationSchema), asyncHandler(c.create));

// Mensajes dentro de una conversación concreta.
r.get("/conversations/:id/messages", asyncHandler(c.messages));

r.post(
  "/conversations/:id/messages",
  validate(messageSchema),
  asyncHandler(c.send),
);
r.patch("/conversations/:id/read", asyncHandler(c.markRead));

export default r;
