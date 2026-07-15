# ULimaSocial Server

API REST con Node.js, Express, Prisma, PostgreSQL de Supabase, JWT en cookie `httpOnly`, Nodemailer, Supabase Storage y Socket.IO.

## Configuración

```bash
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Completa `.env` con las conexiones de PostgreSQL, un `JWT_SECRET`, la configuración SMTP y la clave `service_role` de Supabase. No subas `.env` al repositorio.

## Supabase Storage

Crea un bucket público con el nombre configurado en `SUPABASE_STORAGE_BUCKET`. El valor predeterminado es `ulimasocial-media`.

El backend organiza los archivos en:

- `profiles/<userId>/`
- `posts/<userId>/`

## Endpoints principales

### Autenticación

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-code`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-code`
- `PATCH /api/auth/reset-password`

### Perfiles

- `GET /api/users/search?q=...`
- `GET /api/users/:userId`
- `PATCH /api/users/me`
- `PATCH /api/users/me/profile-picture`

### Red social

- `/api/posts`
- `/api/friendships`
- `/api/groups`
- `/api/conversations`
- `/api/notifications`

## Tiempo real

Socket.IO utiliza la misma cookie JWT que la API.

Eventos emitidos:

- `message:new`
- `notification:new`

## Base de datos

`schema.prisma` está mapeado a las tablas existentes en minúscula. No ejecutes `prisma migrate dev` directamente contra producción sin revisar la migración generada.

Utiliza:

```bash
npx prisma generate
```

Usa `npx prisma db pull` solamente cuando la estructura real de PostgreSQL haya cambiado y quieras actualizar el esquema Prisma.
