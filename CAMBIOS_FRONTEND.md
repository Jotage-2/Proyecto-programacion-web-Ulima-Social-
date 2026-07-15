# Conexión entre frontend y backend

## Resumen

Se reemplazaron los datos funcionales simulados y la persistencia temporal del navegador por llamadas a la API Express y operaciones guardadas mediante Prisma.

No se modificó la lógica visual principal del proyecto. Los cambios se concentraron en centralizar los contratos HTTP, normalizar las respuestas y conectar los componentes ya existentes.

## Módulos conectados

### Autenticación

- Registro real en `POST /api/auth/register`.
- Foto opcional enviada como `multipart/form-data` y almacenada en Supabase Storage.
- Verificación de correo y reenvío de código.
- Login mediante cookie JWT `httpOnly`.
- Recuperación de contraseña con validación real del código antes del cambio.
- Restauración de sesión mediante `GET /api/auth/me`.

### Usuarios y perfiles

- Búsqueda de estudiantes mediante `/api/users/search`.
- Consulta de perfiles públicos por ID.
- Edición del perfil del usuario autenticado.
- Cambio de foto mediante archivo, sin guardar Base64 en PostgreSQL.

### Publicaciones

- Feed consultado desde la tabla `posts`.
- Respeto de las visibilidades `PUBLIC`, `FRIENDS` y `PRIVATE` en el backend.
- Creación y eliminación lógica de publicaciones.
- Likes persistidos en `post_likes`.
- Comentarios persistidos en `comments`.
- Datos del autor normalizados antes de enviarse al cliente.

### Amistades

- Listado de amigos, solicitudes recibidas y solicitudes enviadas.
- Envío, aceptación, rechazo, cancelación y eliminación de amistades.
- Notificaciones al enviar o aceptar solicitudes.

### Grupos

- Consulta y creación de grupos.
- Registro automático del creador como `OWNER` en `group_members`.
- Unión y salida de grupos públicos.
- Los grupos privados muestran que requieren invitación y no ejecutan una solicitud imposible de unión directa.

### Mensajes

- Consulta y creación de conversaciones.
- Reutilización de conversaciones directas existentes.
- Consulta, envío y lectura de mensajes.
- Validación de participantes antes de crear una conversación.
- Recepción de mensajes mediante Socket.IO.

### Notificaciones

- Consulta de notificaciones desde PostgreSQL.
- Lectura individual y lectura total.
- Recepción de nuevas notificaciones mediante Socket.IO.

## Archivos centrales

- `client/src/services/api.js`: llamadas HTTP del frontend.
- `client/src/services/socket.js`: conexión Socket.IO compartida.
- `client/src/context/FriendsContext.jsx`: estado de amistades sincronizado con la API.
- `client/src/context/GroupsContext.jsx`: estado de grupos sincronizado con la API.
- `client/src/hooks/usePosts.js`: publicaciones, likes y comentarios.
- `server/src/controllers/`: reglas HTTP y coordinación con Prisma.
- `server/src/models/`: consultas reutilizables de usuarios, amistades y publicaciones.
- `server/src/services/notificationService.js`: persistencia y emisión de notificaciones.

## Persistencia local restante

Solo el tema claro u oscuro utiliza `localStorage`. No se guardan allí cuentas, publicaciones, amistades, grupos, conversaciones ni mensajes.

## Tabla todavía sin interfaz funcional

La tabla `group_invitations` existe en Prisma y PostgreSQL, pero el proyecto recibido no contenía una interfaz completa ni endpoints para invitar, aceptar o rechazar invitaciones de grupo. No se inventó ese flujo para evitar cambiar la lógica del proyecto sin requisitos definidos.

## Configuración necesaria

El backend necesita PostgreSQL, JWT, SMTP y Supabase Storage configurados en `server/.env`. El frontend necesita `VITE_API_URL` en `client/.env` cuando la API no se ejecuta en `http://localhost:3000/api`.
