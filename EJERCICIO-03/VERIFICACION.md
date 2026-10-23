# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 7 pruebas superadas (`npm test`).
- HTTP: comprobadas respuestas 200, 404 y 400 y conversión del identificador a número.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: conexión real a PostgreSQL y apertura en Expo Go. No hay psql disponible y Docker no está arrancado.

Las pruebas HTTP ejecutan una aplicación NestJS con un Repository simulado. La prueba de persistencia real se describe en el README.
