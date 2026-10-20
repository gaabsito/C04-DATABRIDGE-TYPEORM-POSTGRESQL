# Ejercicio 02 · CineBox

Solución del [ejercicio 2 del cuaderno DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e2). Lee una colección de películas desde PostgreSQL mediante `repository.find()` y la muestra en React Native.

Incluye el reto **MODIFÍCALO**: `favorita` es una columna booleana con valor por defecto `false`, viaja en el JSON y se representa como **♥** o **♡**. El corazón muestra el estado de PostgreSQL; este ejercicio no incluye editarlo desde el móvil.

## 1. Prepara PostgreSQL

Con PostgreSQL local:

```sh
psql -U postgres
```

```sql
CREATE DATABASE databridge_e02;
\q
```

Conexión de aula: `localhost:5432`, usuario `postgres`, contraseña `postgres`. Puedes cambiar estos valores en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-02`:

```sh
docker compose up -d
```

Elige una alternativa. Si usas el PostgreSQL de Docker del ejercicio 1, crea `databridge_e02` dentro de ese servidor en lugar de arrancar otro contenedor en el puerto 5432.

## 2. Arranca y prueba el backend

```sh
cd backend
npm ci
npm run start:dev
```

En otra terminal:

```sh
curl -i http://localhost:3000/peliculas
```

Si todavía tienes el backend del ejercicio 1 en marcha, detenlo antes: ambos escuchan en el puerto 3000.

La respuesta esperada es HTTP 200 y una colección ordenada por puntuación descendente:

```json
[
  {"id":1,"titulo":"Interstellar","genero":"Ciencia ficción","anio":2014,"puntuacion":"9.2","favorita":true},
  {"id":2,"titulo":"Coco","genero":"Animación","anio":2017,"puntuacion":"8.8","favorita":false}
]
```

Los identificadores son automáticos. PostgreSQL devuelve `decimal` como cadena; el frontend utiliza `Number()` para mostrar la puntuación con un decimal.

## 3. Abre la app en Expo Go

Desde `frontend`, copia `.env.example` a `.env` y cambia `TU_IP_LOCAL` por la IP del ordenador. Puedes verla en Ajustes del Sistema → Wi-Fi → Detalles → TCP/IP (macOS), o con `ipconfig` en Windows.

```text
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

```sh
cd frontend
npm ci
npx expo start
```

Abre el QR con Expo Go, con el móvil y el ordenador en la misma red. Para simulador iOS usa `http://localhost:3000`; para emulador Android, `http://10.0.2.2:3000`. Reinicia Expo al cambiar `.env`.

La pantalla muestra carga, errores de conexión, una colección vacía cuando no hay registros y tarjetas con título, género, año, puntuación y corazón.

## 4. Comprueba PostgreSQL y la persistencia

```sh
psql -U postgres -d databridge_e02
```

```sql
\dt
SELECT id, titulo, genero, anio, puntuacion, favorita
FROM peliculas ORDER BY puntuacion DESC;
```

Reinicia NestJS y repite el GET y el SELECT: deben conservarse los registros sin duplicados. `onModuleInit()` inserta ejemplos solo cuando la tabla está vacía.

Para comprobar que el corazón procede realmente de PostgreSQL:

```sql
UPDATE peliculas SET favorita = true WHERE titulo = 'Coco';
```

Repite GET `/peliculas` y recarga la app: Coco debe pasar de ♡ a ♥. Reinicia también NestJS para comprobar que el cambio se conserva. Puedes restaurarlo con `UPDATE peliculas SET favorita = false WHERE titulo = 'Coco';`.

Si habías ejecutado antes la versión base sin `favorita`, `synchronize: true` añade la columna con `false` a los registros existentes. Para marcar el ejemplo favorito:

```sql
UPDATE peliculas SET favorita = true WHERE titulo = 'Interstellar';
```

## 5. Explicación

- `Pelicula` describe la tabla y sus columnas, incluida `favorita`.
- `PeliculasModule` registra la Entity, el Controller y el Service.
- `PeliculasController` recibe GET `/peliculas` y delega en el Service.
- `PeliculasService.findAll()` utiliza `repository.find({ order: { puntuacion: 'DESC' } })`.
- TypeORM consulta PostgreSQL y devuelve los registros como JSON a React Native.
- `App.tsx` guarda la colección en el estado y dibuja las tarjetas.

**¿Qué devuelve conceptualmente `repository.find()`?** Una promesa que se resuelve con un array de entidades. Si no hay resultados, devuelve `[]`.

**¿Por qué `find()` no necesita conocer cómo se dibuja una película?** Porque consulta los datos. React Native decide cómo representarlos; el mismo JSON puede utilizarse en otras interfaces.

## 6. Comprobaciones de código

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas verifican la columna booleana, los ejemplos con ambos estados, la ausencia de reinserciones, la colección ordenada y el resultado vacío. Utilizan un repositorio simulado: la prueba con PostgreSQL y Expo Go debe realizarse siguiendo los pasos anteriores.
