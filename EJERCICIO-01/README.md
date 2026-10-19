# Ejercicio 01 · Game Vault

Solución del [cuaderno DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e1), incluido el reto **MODIFÍCALO**: `genero` se guarda en PostgreSQL, aparece en el JSON de `GET /videojuegos` y se muestra en cada tarjeta.

## 1. Preparación

Necesitas Node.js, npm, PostgreSQL y Expo Go en el móvil. Comprueba `node --version`, `npm --version`, `git --version` y `psql --version`. Los proyectos ya están creados con las herramientas oficiales de NestJS y Expo.

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e01;
```

La conexión de aula es `localhost:5432`, usuario `postgres`, contraseña `postgres`. Si tu instalación usa otros valores, cambia `backend/src/app.module.ts`.

Como alternativa, con Docker Desktop arrancado, ejecuta desde esta carpeta:

```sh
docker compose up -d
```

Esto crea PostgreSQL y la base de datos con un volumen persistente. Elige una de las dos opciones para evitar ocupar el mismo puerto.

## 2. Backend primero

```sh
cd backend
npm install
npm run start:dev
```

En otra terminal:

```sh
curl -i http://localhost:3000/videojuegos
```

Debe responder 200 y devolver estos datos (los identificadores se generan automáticamente):

```json
[
  {"id":2,"titulo":"Zelda: Tears of the Kingdom","plataforma":"Nintendo Switch","genero":"Aventura","puntuacion":"9.8"},
  {"id":1,"titulo":"Hollow Knight","plataforma":"Nintendo Switch","genero":"Metroidvania","puntuacion":"9.4"},
  {"id":3,"titulo":"Forza Horizon 5","plataforma":"Xbox","genero":"Conducción","puntuacion":"9.1"}
]
```

TypeORM devuelve las columnas `decimal` de PostgreSQL como cadenas; la pantalla usa `Number(...).toFixed(1)` para mostrar la puntuación.

## 3. Frontend

Desde `frontend`, copia `.env.example` a `.env` y sustituye `TU_IP_LOCAL` por la IP del ordenador. En Windows se consulta con `ipconfig`; en macOS, en Ajustes del Sistema → Wi-Fi → Detalles → TCP/IP. El móvil y el ordenador deben estar en la misma red.

```sh
cd frontend
npm install
npx expo start
```

Abre el QR con Expo Go. Para el simulador de iOS puedes usar `http://localhost:3000`; para el emulador Android, `http://10.0.2.2:3000`. Tras cambiar `.env`, reinicia Expo. La pantalla incluye carga, error de conexión y tarjetas con género, plataforma y puntuación.

## 4. Comprobación de persistencia

```sh
psql -U postgres -d databridge_e01
```

```sql
\dt
SELECT id, titulo, genero, plataforma, puntuacion FROM videojuegos;
```

Detén NestJS y arráncalo otra vez. Repite la consulta y el GET: deben seguir las mismas tres filas, sin duplicarse. Los ejemplos solo se insertan si la tabla está vacía.

Si ya habías ejecutado la solución base sin género, el nuevo campo toma `Sin clasificar`. Puedes completar los ejemplos existentes sin borrarlos:

```sql
UPDATE videojuegos SET genero = 'Metroidvania' WHERE titulo = 'Hollow Knight' AND genero = 'Sin clasificar';
UPDATE videojuegos SET genero = 'Aventura' WHERE titulo = 'Zelda: Tears of the Kingdom' AND genero = 'Sin clasificar';
UPDATE videojuegos SET genero = 'Conducción' WHERE titulo = 'Forza Horizon 5' AND genero = 'Sin clasificar';
```

`synchronize: true` es la configuración del laboratorio: adapta la tabla a la Entity.

## 5. Qué hace cada parte

- **Entity:** define la tabla `videojuegos`, incluidas las columnas `genero` y `puntuacion`.
- **Module:** registra la Entity y conecta el Controller y el Service.
- **Controller:** recibe `GET /videojuegos`.
- **Service:** inserta los ejemplos al primer arranque y pide al Repository la colección ordenada por puntuación.
- **Repository:** consulta PostgreSQL mediante TypeORM.
- **App.tsx:** hace `fetch`, guarda el JSON en el estado y dibuja las tarjetas.

Recorrido: React Native → HTTP → Controller → Service → Repository → TypeORM → PostgreSQL → JSON → tarjetas.

**Respuesta a «¿Por qué utilizamos Repository?»:** permite al Service trabajar con la Entity sin que el Controller acceda directamente a PostgreSQL. Separar estas responsabilidades facilita mantener el código.

Si quitas `genero` del texto de la tarjeta, el campo sigue existiendo en PostgreSQL y en la API: la presentación y los datos son capas distintas.

## 6. Verificaciones y entrega

```sh
# En backend
npm run build
npm test
# En frontend
npx tsc --noEmit
```

Repositorio: https://github.com/gaabsito/C04-DATABRIDGE-TYPEORM-POSTGRESQL

El estado real de las comprobaciones realizadas se recoge en `VERIFICACION.md`.
