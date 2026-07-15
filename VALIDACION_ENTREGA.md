# Validación de la entrega

## Comprobaciones completadas

### Frontend

Comando ejecutado:

```bash
cd client
npm run build
```

Resultado: build de producción generado correctamente por Vite.

### Backend

Se ejecutó `node --check` sobre todos los archivos `.js` de `server/src`.

Resultado: no se encontraron errores de sintaxis.

### Dependencias

Se comprobó `npm ls --depth=0` dentro de `client` y `server`.

Resultado: las dependencias declaradas están instaladas de forma coherente en el entorno de revisión.

### Datos simulados

Se buscó persistencia funcional mediante `localStorage` y referencias a cuentas demo.

Resultado: `localStorage` solo permanece en `ThemeContext.jsx` para guardar el modo claro u oscuro. No quedan cuentas demo ni almacenamiento local de publicaciones, amistades, grupos o mensajes.

## Comprobación pendiente en el equipo del proyecto

La prueba completa contra PostgreSQL requiere generar el cliente Prisma:

```bash
cd server
npm install
npx prisma generate
npm run dev
```

En el entorno de preparación de este ZIP, `prisma generate` no pudo descargar su motor desde el servidor externo de binarios de Prisma. Por ese motivo no se realizaron escrituras de prueba sobre la base de datos real incluida en las variables privadas del proyecto.

Después de iniciar el backend, se recomienda comprobar en este orden:

1. Registro sin foto y con foto.
2. Recepción y validación del código de correo.
3. Login y restauración de sesión al recargar.
4. Creación de una publicación, like y comentario desde dos usuarios.
5. Solicitud y aceptación de amistad.
6. Creación y unión a un grupo público.
7. Inicio de una conversación y envío de mensajes desde dos navegadores.
8. Recepción y lectura de notificaciones.

## Seguridad del ZIP

El archivo entregado no incluye:

- `client/.env`
- `server/.env`
- `node_modules`
- `dist`
- `.git`

Las variables deben reconstruirse usando los archivos `.env.example`.
