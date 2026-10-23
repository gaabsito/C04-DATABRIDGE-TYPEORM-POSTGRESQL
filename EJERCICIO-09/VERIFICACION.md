# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 13 pruebas superadas (`npm test`).
- HTTP: comprobadas las cuatro combinaciones de filtros, condiciones AND y respuesta vacía sin coincidencias.
- Parámetros: comprobados filtros vacíos, recorte de espacios, valores acentuados codificados y rechazo de filtros repetidos o demasiado largos.
- Inicialización: comprobado que no se duplican ni se sobrescriben datos existentes.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: prueba con PostgreSQL real y apertura de la app en Expo Go.

Las pruebas HTTP utilizan NestJS con un Repository simulado. El README incluye las consultas SQL para comprobar el filtrado real.
