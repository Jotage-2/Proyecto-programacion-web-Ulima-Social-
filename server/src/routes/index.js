/**
 * Reúne todos los routers de la API bajo un único router principal.
 */

import { Router } from "express";
import auth from "./authRoutes.js";
import users from "./userRoutes.js";
import posts from "./postRoutes.js";
import friendships from "./friendshipRoutes.js";
import groups from "./groupRoutes.js";
import messages from "./messageRoutes.js";
import notifications from "./notificationRoutes.js";
const r = Router();
r.use("/auth", auth);

r.use("/users", users);

r.use("/posts", posts);

r.use("/friendships", friendships);

r.use("/groups", groups);

r.use("/", messages);

r.use("/notifications", notifications);
export default r;
