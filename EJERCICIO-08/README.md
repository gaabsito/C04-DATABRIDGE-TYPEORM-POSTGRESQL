# Ejercicio 08 · My Playlists

Solución del [ejercicio 8 de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e8): relacionar datos mediante una clave foránea, `OneToMany`, `ManyToOne` y consultas con `relations`.

Incluye el reto **MODIFÍCALO**: añadir una canción a una playlist concreta desde el móvil. El DTO contiene `titulo`, `artista` y `playlistId`; el Service busca primero el padre y la interfaz recarga sus canciones después de guardar.

## 1. Base de datos

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e08;
\q
```

Configuración de aula: `localhost:5432`, usuario `postgres`, contraseña `postgres`. Puedes ajustarla en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-08`:

```sh
docker compose up -d
```

Si ya tienes PostgreSQL de otro ejercicio, crea `databridge_e08` en ese servidor en lugar de iniciar otro contenedor en el puerto 5432.

## 2. Backend primero

Detén los backends de otros ejercicios que utilicen el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

Con la tabla de playlists vacía se crea `Entrenamiento` con la canción `Run Boy Run`, de Woodkid. La playlist y su canción inicial se guardan juntas en una transacción. Si ya existen playlists, no se añaden ejemplos.

### Consultar la playlist y sus canciones

```sh
curl -i http://localhost:3000/playlists/1
```

Respuesta HTTP 200 esperada en una base nueva:

```json
{
  "id": 1,
  "nombre": "Entrenamiento",
  "canciones": [
    {"id":1,"titulo":"Run Boy Run","artista":"Woodkid"}
  ]
}
```

El identificador lo genera PostgreSQL; utiliza el real si tu base ya contiene datos. Una playlist vacía devuelve `canciones: []`. El Service incluye `relations: { canciones: true }` para cargar los registros relacionados y los ordena por id.

### Añadir una canción al padre indicado

```sh
curl -i -X POST http://localhost:3000/playlists/canciones \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Otro tema","artista":"Otro artista","playlistId":1}'
```

Responde HTTP **201** con la canción creada y su playlist asociada. Repite GET `/playlists/1`: ahora debe incluir la nueva canción.

La API acepta título y artista no vacíos, de hasta 120 caracteres, y `playlistId` como número entero positivo. El cliente no decide el id de la canción ni envía un objeto Playlist completo.

- Si `playlistId` no existe: HTTP 404, `Playlist no encontrada`, sin crear la canción.
- Si los datos del Body son inválidos: HTTP 400 antes de consultar los repositorios.
- GET de un id no numérico: HTTP 400; GET de un id inexistente: HTTP 404.

## 3. React Native y Expo Go

En `frontend`, copia `.env.example` a `.env` y sustituye `TU_IP_LOCAL` por la IP del ordenador:

```text
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

En macOS puedes verla en Ajustes del Sistema → Wi-Fi → Detalles → TCP/IP; en Windows, con `ipconfig`.

```sh
cd frontend
npm ci
npx expo start
```

Abre el QR con Expo Go. Móvil y ordenador deben estar en la misma red. Para simulador iOS utiliza `http://localhost:3000`; para emulador Android, `http://10.0.2.2:3000`. Reinicia Expo después de cambiar `.env`.

La app carga inicialmente la playlist 1. También puedes introducir otro identificador existente y pulsar **Cargar playlist**.

1. Comprueba el nombre de la playlist cargada y su número de canciones.
2. Escribe título y artista y pulsa **Añadir canción**.
3. La petición envía el id de la playlist realmente cargada.
4. Tras la confirmación, se limpian los campos y se consulta de nuevo GET con sus canciones.
5. Si cambias el identificador, pulsa Cargar antes de añadir a la nueva selección.

La app muestra errores de conexión, datos inválidos y playlist inexistente. Los botones se bloquean durante el envío. Si el guardado termina correctamente pero falla la recarga, el mensaje distingue ambos casos para evitar repetir el POST por error.

## 4. Comprueba la clave foránea y la persistencia

```sh
psql -U postgres -d databridge_e08
```

```sql
\dt
\d canciones
SELECT * FROM playlists;
SELECT id, titulo, artista, "playlistId" FROM canciones ORDER BY id;
SELECT p.id, p.nombre, c.titulo, c.artista
FROM playlists p
LEFT JOIN canciones c ON c."playlistId" = p.id
ORDER BY p.id, c.id;
```

`playlistId` está en la tabla **canciones**, porque `ManyToOne` es el lado propietario de la relación. La clave foránea es obligatoria y apunta a una playlist existente. Las comillas dobles conservan la mayúscula del nombre de la columna.

Añade una canción desde el móvil y comprueba que aparece con el `playlistId` correcto. Reinicia NestJS y vuelve a cargar la playlist: la canción debe seguir asociada y no deben duplicarse los ejemplos.

Para practicar con una segunda playlist, puedes crearla desde PostgreSQL:

```sql
INSERT INTO playlists (nombre) VALUES ('Estudio') RETURNING id;
```

Carga el id devuelto en la app y añade una canción. Comprueba que aparece en Estudio y no en Entrenamiento.

La relación utiliza `onDelete: 'CASCADE'`: si se elimina una playlist desde la base de datos, también se eliminan sus canciones. Este ejercicio no añade un endpoint para borrar playlists.

## 5. Explicación

**¿Qué expresa OneToMany?** Una playlist puede contener muchas canciones. `Playlist.canciones` representa esa colección. En el otro lado, `Cancion.playlist` usa `ManyToOne`: cada canción pertenece a una playlist.

**¿Por qué se busca el padre antes de guardar?** Para comprobar que existe y asociar la nueva canción a la Entity correcta; no se crean dos registros independientes.

**¿Para qué sirve relations?** Para que al recuperar la playlist TypeORM cargue también sus canciones. No basta con declarar la relación en las clases para que todas las consultas la incluyan automáticamente.

**¿Qué envía el DTO?** Los datos de la canción y el identificador del padre. El Service resuelve el identificador a una Playlist real y utiliza el Repository de Cancion para guardar el hijo relacionado.

Recorrido: formulario → POST con playlistId → Controller/DTO → búsqueda de Playlist → creación de Cancion relacionada → save → PostgreSQL → GET con relations → lista actualizada.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas HTTP utilizan NestJS con repositorios simulados. La relación y la persistencia real en PostgreSQL, así como la interfaz de Expo Go, se verifican siguiendo los pasos anteriores. Consulta `VERIFICACION.md` para conocer los controles ejecutados.
