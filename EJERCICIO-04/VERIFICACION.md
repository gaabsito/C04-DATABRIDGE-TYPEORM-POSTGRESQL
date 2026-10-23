# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 8 pruebas superadas (`npm test`).
- HTTP: comprobado POST con respuesta 201 y precioMedio, rechazo 400 de datos inválidos y exclusión del id enviado por el cliente.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: conexión real a PostgreSQL y apertura en Expo Go. No hay psql disponible y Docker no está arrancado.

Las pruebas HTTP utilizan NestJS con un Repository simulado. El README incluye el POST y el SELECT para verificar la persistencia real.
