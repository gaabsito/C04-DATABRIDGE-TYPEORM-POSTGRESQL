# Verificación · 23 de octubre de 2026

- Backend: compilación correcta y 13 pruebas superadas (`npm test`).
- Modelo: comprobados los metadatos OneToMany/ManyToOne y la definición de clave foránea obligatoria.
- HTTP: comprobados GET con canciones, POST relacionado, separación de canciones entre playlists y respuestas 400/404.
- Inicialización: comprobado que no se duplican los ejemplos al volver a inicializar con datos existentes.
- Frontend: tipos y lint correctos (`npx tsc --noEmit` y `npx eslint App.tsx index.ts`).
- Pendiente: prueba con PostgreSQL real y apertura de la app en Expo Go.

Las pruebas HTTP utilizan NestJS con repositorios simulados. El README incluye las consultas SQL para comprobar la clave foránea y la persistencia reales.
