/**
 * Configura la aplicación Express, sus middlewares globales y las rutas de la API.
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// Prisma puede devolver valores BigInt; esta conversión permite enviarlos correctamente como JSON.
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Construye la aplicación Express sin iniciar todavía el servidor HTTP.
export const createApp = () => {
  const app = express();

  // Se confía en el primer proxy porque el backend puede ejecutarse detrás de servicios como Azure o Render.
  app.set("trust proxy", 1);

  // Helmet agrega encabezados HTTP que reducen riesgos comunes de seguridad.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  // CORS limita las solicitudes del navegador al dominio configurado para el frontend y permite el envío de cookies.
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // Se aceptan cuerpos JSON con un límite de tamaño para evitar solicitudes excesivamente grandes.
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  // El limitador reduce intentos repetidos sobre las rutas de autenticación.
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Endpoint sencillo para comprobar que la API está encendida y responde.
  app.get("/api/health", (req, res) =>
    res.json({ status: "ok", service: "ULimaSocial API" }),
  );

  // Todas las rutas funcionales quedan agrupadas bajo el prefijo /api.
  app.use("/api", routes);

  // Estos middlewares deben ir al final: primero capturan rutas inexistentes y luego centralizan los errores.
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
