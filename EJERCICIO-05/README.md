# Ejercicio 05 · Travel Book

Solución del [ejercicio 5 de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e5): actualizar parcialmente un viaje con `PATCH /viajes/:id`, DTO opcional, búsqueda, `merge()` y `save()`.

Incluye el reto **MODIFÍCALO**: `fecha` es opcional en el DTO y se puede modificar sin enviar destino, país ni estado. El formulario envía solo los campos que se han rellenado.

## 1. Base de datos

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e05;
\q
```

Conexión de aula: `localhost:5432`, usuario `postgres`, contraseña `postgres`. Puedes cambiarla en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-05`:

```sh
docker compose up -d
```

Si ya tienes PostgreSQL de un ejercicio anterior, crea `databridge_e05` dentro de ese servidor. Evita arrancar otro contenedor en el puerto 5432.

## 2. Backend primero

Detén otros backends que estén utilizando el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

Al arrancar con la tabla vacía, se inserta un viaje a Tokio, Japón, con fecha `2027-04-10` y estado `RESERVADO`.

Desde otra terminal (macOS o Git Bash), cambia **solo la fecha**:

```sh
curl -i -X PATCH http://localhost:3000/viajes/1 \
  -H 'Content-Type: application/json' \
  -d '{"fecha":"2027-05-20"}'
```

Respuesta esperada HTTP **200**:

```json
{"id":1,"destino":"Tokio","pais":"Japón","fecha":"2027-05-20","estado":"RESERVADO"}
```

Destino, país y estado se conservan. El id es generado por PostgreSQL; en una tabla con datos previos utiliza el identificador real del viaje.

Cambia ahora solo el estado:

```sh
curl -i -X PATCH http://localhost:3000/viajes/1 \
  -H 'Content-Type: application/json' \
  -d '{"estado":"CONFIRMADO"}'
```

La fecha debe seguir siendo `2027-05-20`. También puedes enviar ambos cambios juntos:

```json
{"estado":"RESERVADO","fecha":"2027-06-15"}
```

El DTO permite `destino`, `pais`, `estado` y `fecha`, todos opcionales. Debe enviarse al menos uno. La API rechaza campos vacíos o nulos y fechas inexistentes o con formato distinto de `AAAA-MM-DD`. No permite cambiar el id desde el Body.

- Viaje inexistente: HTTP 404, `Viaje no encontrado`.
- Identificador no numérico: HTTP 400 por `ParseIntPipe`.
- Fecha inválida o Body sin cambios válidos: HTTP 400 antes de consultar el Repository.

## 3. Formulario en Expo Go

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

Abre el QR con Expo Go. Móvil y ordenador deben estar en la misma red. Para simulador iOS utiliza `http://localhost:3000`; para emulador Android, `http://10.0.2.2:3000`. Reinicia Expo si cambias `.env`.

Introduce el identificador y rellena **estado, fecha o ambos**. Dejar un campo en blanco significa conservarlo; el frontend no lo añade al JSON. Mientras se envía, se desactiva el botón. Si hay un error, se conservan los datos introducidos. Cuando la API responde correctamente, se limpian los campos de cambio y se muestra el viaje completo devuelto por el servidor.

La tarjeta muestra el último viaje actualizado durante esa sesión. El ejercicio se centra en PATCH y no añade una consulta GET para cargar la ficha al abrir la app.

## 4. Comprueba PostgreSQL antes y después

```sh
psql -U postgres -d databridge_e05
```

```sql
SELECT id, destino, pais, fecha, estado FROM viajes ORDER BY id;
```

Ejecuta un PATCH con solo `fecha` y repite el SELECT. Comprueba que solo cambió esa columna. Reinicia NestJS y repite el SELECT: la fecha modificada debe conservarse y no debe insertarse otro Tokio. El ejemplo inicial se crea solo si la tabla está vacía.

## 5. Explicación

1. `@Param('id', ParseIntPipe)` obtiene el identificador de la URL y lo convierte en número.
2. `@Body()` recibe únicamente los cambios; el Pipe valida los campos presentes.
3. `findOneBy({ id })` busca el viaje existente. Si no aparece, se lanza `NotFoundException`.
4. `repository.merge(viaje, dto)` aplica las propiedades recibidas al objeto, conservando las demás.
5. `repository.save(viaje)` persiste la actualización y la API devuelve el resultado.

**¿Por qué las propiedades del DTO son opcionales?** Porque PATCH permite modificar una parte del recurso. Cambiar solo fecha no debe obligar a reenviar destino, país o estado.

**¿Merge guarda en PostgreSQL?** No. Modifica la Entity en memoria; `save()` realiza la persistencia.

Recorrido: formulario → JSON parcial → PATCH → Controller → Service → búsqueda → merge → save → PostgreSQL → respuesta → tarjeta.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas incluyen cambios parciales, conservación de campos, fechas imposibles, año bisiesto, errores 400/404 y ausencia de reinserciones. Las pruebas HTTP utilizan un Repository simulado; sigue el apartado de PostgreSQL para comprobar la persistencia real. Consulta `VERIFICACION.md` para el resultado de los controles ejecutados.
