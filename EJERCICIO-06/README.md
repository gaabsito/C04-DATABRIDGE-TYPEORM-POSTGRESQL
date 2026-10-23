# Ejercicio 06 · My Library

Solución del [ejercicio 6 de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e6): eliminar registros con `DELETE` y sincronizar el estado de React Native.

Incluye el reto **MODIFÍCALO**: el atributo `leido` se almacena en PostgreSQL, se modifica con PATCH y se representa en la tarjeta sin eliminar el libro.

## 1. Base de datos

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e06;
\q
```

Configuración de aula: `localhost:5432`, usuario `postgres` y contraseña `postgres`. Puedes ajustarla en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-06`:

```sh
docker compose up -d
```

Si ya tienes PostgreSQL de otro ejercicio, crea `databridge_e06` en ese servidor. No arranques otro contenedor en el puerto 5432.

## 2. Backend primero

Detén otros backends de los ejercicios anteriores: también utilizan el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

En una base nueva, se insertan `1984` y `Dune`, ambos con `leido: false`. Los identificadores de los ejemplos normalmente son 1 y 2; utiliza los reales de tu colección.

```sh
curl -i http://localhost:3000/libros
```

Respuesta HTTP 200, con los libros ordenados por título:

```json
[
  {"id":1,"titulo":"1984","autor":"George Orwell","genero":"Distopía","leido":false},
  {"id":2,"titulo":"Dune","autor":"Frank Herbert","genero":"Ciencia ficción","leido":false}
]
```

Marca el primero como leído:

```sh
curl -i -X PATCH http://localhost:3000/libros/1/leido
curl -i http://localhost:3000/libros
```

El PATCH responde HTTP 200 sin cuerpo. GET debe seguir devolviendo los dos libros, con `leido: true` en el primero. Repetir el PATCH mantiene el mismo estado.

Elimina ahora ese libro:

```sh
curl -i -X DELETE http://localhost:3000/libros/1
curl -i http://localhost:3000/libros
```

DELETE responde **204 No Content**, y GET ya no incluye el libro eliminado. Un identificador inexistente devuelve 404; uno no numérico devuelve 400. No se intenta leer JSON de las respuestas vacías de DELETE o PATCH.

## 3. Abre la app con Expo Go

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

Abre el QR con Expo Go. El móvil y el ordenador deben estar en la misma red. Para simulador iOS usa `http://localhost:3000`; para emulador Android, `http://10.0.2.2:3000`. Reinicia Expo después de cambiar `.env`.

Comprueba estas acciones en el móvil:

1. **Eliminar → Cancelar:** el libro sigue en pantalla y no se envía DELETE.
2. **Marcar como leído:** el libro permanece y aparece la etiqueta `✓ Leído`.
3. **Eliminar → Eliminar:** el libro desaparece cuando la API confirma el borrado.
4. **Recargar:** vuelve a consultar la colección del servidor.
5. **Sin conexión:** se muestra un error y no se oculta un libro cuyo borrado no se ha confirmado.

Los botones se bloquean mientras se guarda para evitar operaciones simultáneas. Después de un cambio confirmado se actualiza el estado local y se vuelve a pedir GET `/libros`. Si esa recarga falla, se indica que el cambio ya se guardó y se ofrece Recargar.

## 4. Comprueba PostgreSQL y los reinicios

```sh
psql -U postgres -d databridge_e06
```

```sql
SELECT id, titulo, autor, genero, leido FROM libros ORDER BY titulo;
```

Marca un libro desde la app y repite el SELECT: debe seguir existiendo con `leido = true`. Elimínalo y repite la consulta: la fila debe desaparecer. Reinicia NestJS y comprueba que los cambios se conservan.

También puedes eliminar todos los libros. GET debe devolver `[]`, la pantalla debe mostrar la biblioteca vacía y reiniciar NestJS no debe recrearlos.

Para conservar ese comportamiento, `biblioteca_estado` recuerda que los ejemplos ya se inicializaron. La marca y los ejemplos se guardan en una transacción. Si había libros previamente, se conservan y solo se crea la marca. No borres esta tabla de control durante las comprobaciones: indica que la preparación inicial ya se realizó.

## 5. Explicación

- **GET:** utiliza `repository.find()` para leer la colección ordenada.
- **DELETE:** busca el libro, devuelve 404 si no existe y utiliza `repository.remove(libro)` para eliminarlo.
- **PATCH leído:** busca el libro, cambia `leido = true` y utiliza `repository.save(libro)`.
- **React Native:** muestra una confirmación antes del DELETE y modifica la lista solo después de una respuesta correcta.

**¿Qué diferencia hay entre borrar y marcar como leído?** Borrar elimina la fila. Marcar como leído mantiene el libro y modifica un atributo persistente.

**¿Por qué no basta con `setLibros(...filter(...))`?** Eso solo cambia la pantalla. Si no se ejecuta DELETE en el backend, el registro continúa en PostgreSQL y reaparece al recargar.

**¿Por qué volvemos a cargar después del cambio?** Para sincronizar la interfaz con la colección real almacenada por el servidor.

Recorrido: confirmación/acción → DELETE o PATCH → Controller → Service → Repository → PostgreSQL → confirmación → estado React → GET actualizado.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas HTTP utilizan NestJS con un Repository simulado. La prueba con PostgreSQL real, Expo Go y el diálogo de confirmación se realiza siguiendo los pasos anteriores. Consulta `VERIFICACION.md` para los controles ejecutados.
