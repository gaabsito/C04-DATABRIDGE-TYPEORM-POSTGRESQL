# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 13 pruebas superadas (`npm test`).
- HTTP: comprobados POST, GET de colección e individual, PATCH parcial y DELETE 204.
- Stock: comprobado valor numérico, stock cero, conservación de campos omitidos y rechazo de entradas negativas, fraccionarias o textuales.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: prueba con PostgreSQL real y apertura de la app en Expo Go, incluida la confirmación de eliminación y la etiqueta AGOTADO.

Las pruebas HTTP utilizan NestJS con un Repository simulado. El README incluye el ciclo CRUD y el SELECT para comprobar la persistencia real.
