# ULimaSocial

Red social académica para estudiantes de la Universidad de Lima.

El proyecto está dividido en dos aplicaciones:

- `client/`: frontend desarrollado con React, Vite y Tailwind CSS.
- `server/`: API desarrollada con Node.js, Express, Prisma, PostgreSQL de Supabase, Nodemailer, Supabase Storage y Socket.IO.

## Funcionalidades conectadas

El frontend utiliza la API para las siguientes operaciones:

- Registro, verificación de correo, inicio y cierre de sesión.
- Recuperación y cambio de contraseña.
- Consulta y edición de perfiles.
- Búsqueda de estudiantes.
- Publicaciones, likes y comentarios.
- Solicitudes y relaciones de amistad.
- Creación, consulta y membresía de grupos.
- Conversaciones y mensajes.
- Notificaciones y eventos en tiempo real.

`localStorage` se utiliza únicamente para conservar la preferencia de tema claro u oscuro. Los datos funcionales de la red social se guardan en PostgreSQL.

## Requisitos

- Node.js compatible con Vite 7.
- Una base PostgreSQL compatible con el esquema de `server/prisma/schema.prisma`.
- Un proyecto de Supabase para PostgreSQL y almacenamiento de imágenes.
- Una cuenta SMTP, por ejemplo Gmail con contraseña de aplicación, para enviar códigos por correo.

## Configurar el backend

```bash
cd server
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Completa `server/.env` antes de iniciar el servidor. No ejecutes migraciones destructivas contra una base en producción sin revisar previamente los cambios.

## Configurar el frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Por defecto, el frontend espera la API en `http://localhost:3000/api`.

## Inicio local

Abre dos terminales:

```bash
# Terminal 1
cd server
npm run dev
```

```bash
# Terminal 2
cd client
npm run dev
```

Después abre la dirección indicada por Vite, normalmente `http://localhost:5173`.

## Variables sensibles

Los archivos `.env` no deben subirse a GitHub ni compartirse en entregables. El proyecto incluye ejemplos sin credenciales reales:

- `client/.env.example`
- `server/.env.example`

## Validaciones realizadas en esta entrega

- Build de producción del frontend mediante `npm run build`.
- Validación de sintaxis de todos los archivos JavaScript del backend mediante `node --check`.
- Revisión de contratos entre los servicios React y las respuestas de Express.
- Búsqueda de persistencia funcional en `localStorage` y datos demo.

La generación del cliente Prisma debe ejecutarse en un equipo con acceso a los binarios oficiales de Prisma. En el entorno donde se preparó este ZIP, esa descarga externa no estuvo disponible.
