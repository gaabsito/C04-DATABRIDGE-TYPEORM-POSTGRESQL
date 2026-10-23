# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 14 pruebas superadas (`npm test`).
- HTTP: comprobado el CRUD completo, errores 400/404 y eliminación 204.
- Prioridad: comprobada la definición enum ALTA/MEDIA/BAJA, el valor MEDIA por defecto, la actualización parcial y la configuración de orden de la consulta.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: prueba con PostgreSQL real y apertura de la app en Expo Go.

Las pruebas HTTP utilizan NestJS con un Repository simulado. El README incluye el SELECT y el ciclo CRUD para comprobar persistencia y orden reales.
