# Verificación · 20 de octubre de 2026

- Backend: compilación correcta y 5 pruebas superadas (`npm test`).
- Frontend: TypeScript correcto (`npx tsc --noEmit`).
- Frontend: lint correcto (`npx eslint App.tsx index.ts`).
- Dependencias instaladas en la copia local de Developer.
- Pendiente: prueba con PostgreSQL y Expo Go. `psql` no está disponible y Docker no está arrancado en este equipo.

Las pruebas utilizan un repositorio simulado. El README incluye el GET, el SELECT, el cambio persistente de `favorita` y la prueba de reinicio para verificar la conexión real.
