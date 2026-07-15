/**
 * Define los endpoints para publicaciones, likes y comentarios.
 */

import { Router } from "express";
import * as c from "../controllers/postController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { postSchema, commentSchema } from "../validators/commonSchemas.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();
r.use(requireAuth);

// Consulta y creación de publicaciones.
r.get("/", asyncHandler(c.list));

r.post(
  "/",
  upload.single("image"),
  (req, res, next) => {
    try {
      req.body.visibility = req.body.visibility || "PUBLIC";
      req.body = postSchema.parse(req.body);
      next();
    } catch (e) {
      next(e);
    }
  },
  asyncHandler(c.create),
);
r.get("/:postId", asyncHandler(c.getOne));

r.patch("/:postId", validate(postSchema.partial()), asyncHandler(c.update));

r.delete("/:postId", asyncHandler(c.remove));

r.post("/:postId/likes", asyncHandler(c.like));

r.delete("/:postId/likes", asyncHandler(c.unlike));

r.post(
  "/:postId/comments",
  validate(commentSchema),
  asyncHandler(c.addComment),
);
r.delete("/comments/:commentId", asyncHandler(c.deleteComment));

export default r;
