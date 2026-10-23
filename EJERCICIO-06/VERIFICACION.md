# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 13 pruebas superadas (`npm test`).
- HTTP: comprobados GET, PATCH leído, DELETE 204, errores 400/404 y colección vacía.
- Inicialización: comprobado que eliminar todos los ejemplos y reiniciar no los vuelve a insertar.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: conexión real con PostgreSQL y apertura en Expo Go, incluido el diálogo de confirmación.

Las pruebas utilizan NestJS con repositorios simulados. El README describe las comprobaciones de persistencia real.
