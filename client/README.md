# ULimaSocial Client

Frontend React de ULimaSocial conectado a la API Express del proyecto.

## Tecnologías

- React 18
- React Router 6
- Vite 7
- Tailwind CSS 3
- Socket.IO Client

## Configuración

```bash
cp .env.example .env
npm install
npm run dev
```

Variable disponible:

```env
VITE_API_URL=http://localhost:3000/api
```

La URL debe incluir el prefijo `/api`.

## Datos

Las cuentas, publicaciones, amistades, grupos, conversaciones, mensajes y notificaciones se obtienen del backend. `localStorage` solo conserva la preferencia de tema.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```
