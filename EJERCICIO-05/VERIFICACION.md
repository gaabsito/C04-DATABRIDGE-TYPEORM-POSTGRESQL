# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 11 pruebas superadas (`npm test`).
- HTTP: comprobado PATCH de fecha sola, estado solo y ambos campos; conservación de datos omitidos; respuestas 400/404 y validación de fechas reales.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: ejecutar la prueba de persistencia con PostgreSQL real y abrir la app en Expo Go.

Las pruebas HTTP ejecutan NestJS con un Repository simulado. El README incluye el PATCH y el SELECT para comprobar la persistencia real.
