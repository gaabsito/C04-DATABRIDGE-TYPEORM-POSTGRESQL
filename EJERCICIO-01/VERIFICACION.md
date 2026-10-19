# Verificación · 19 de octubre de 2026

- Backend: `npm run build` y compilación directa TypeScript correctos.
- Backend: 3 pruebas del servicio correctas (ejemplos con género, no repetir inserciones cuando hay registros y consulta ordenada).
- Frontend: `npx tsc --noEmit` y `npx eslint App.tsx index.ts` correctos.
- Pendiente: iniciar PostgreSQL, comprobar GET /videojuegos, consultar la tabla, reiniciar NestJS y abrir la aplicación en Expo Go. En este equipo no hay psql y el servicio Docker está apagado.

Las pruebas del servicio utilizan un repositorio simulado; no prueban por sí solas la persistencia real. Sigue el README para verificarla con PostgreSQL.
