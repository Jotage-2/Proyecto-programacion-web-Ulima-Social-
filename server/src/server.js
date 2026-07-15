/**
 * Inicia el servidor HTTP, conecta Socket.IO y controla el cierre seguro del proceso.
 */

import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { configureSocket } from "./socket.js";
const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.clientUrl, credentials: true },
});
app.set("io", io);
configureSocket(io);
server.listen(env.port, () =>
  console.log(`ULimaSocial API: http://localhost:${env.port}`),
);

const stop = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
