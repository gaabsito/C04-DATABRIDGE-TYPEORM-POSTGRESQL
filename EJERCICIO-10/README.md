# Ejercicio 10 · Wander · Full Stack Challenge

Solución del [ejercicio final de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e10): integrar de forma autónoma un CRUD completo de destinos con React Native, NestJS, TypeORM y PostgreSQL.

## Mejora propia: prioridad del viaje

Cada destino guarda una prioridad **ALTA, MEDIA o BAJA**. Se puede elegir al crear, modificar al editar, consultar en la API y ver en su tarjeta. La colección se ordena primero por prioridad y, a igualdad, por id descendente.

La mejora recorre todas las capas: Entity → PostgreSQL → DTOs → POST/PATCH → GET → formulario y tarjetas. Si POST omite la prioridad, se utiliza MEDIA. Si PATCH la omite, se conserva la que ya tenga el destino.

## 1. Prepara la base de datos

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e10;
\q
```

Configuración de aula: `localhost:5432`, usuario `postgres`, contraseña `postgres`. Puedes modificarla en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-10`:

```sh
docker compose up -d
```

Si ya tienes PostgreSQL de otro ejercicio, crea `databridge_e10` en ese servidor. Evita arrancar otro contenedor en el puerto 5432.

## 2. Backend primero

Detén otros backends que estén utilizando el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

La colección empieza vacía. Este ejercicio no inserta ejemplos automáticamente.

### Crear: POST

Desde otra terminal (macOS o Git Bash):

```sh
curl -i -X POST http://localhost:3000/destinos \
  -H 'Content-Type: application/json' \
  -d '{"ciudad":"Reikiavik","pais":"Islandia","descripcion":"Ver auroras","prioridad":"ALTA"}'
```

Respuesta HTTP **201**, con un id generado:

```json
{"id":1,"ciudad":"Reikiavik","pais":"Islandia","descripcion":"Ver auroras","prioridad":"ALTA"}
```

Usa el id realmente devuelto en los ejemplos siguientes. Puedes crear otro destino sin prioridad para comprobar que recibe MEDIA:

```json
{"ciudad":"Lisboa","pais":"Portugal","descripcion":"Pasear por la ciudad"}
```

### Consultar: GET

```sh
curl -i http://localhost:3000/destinos
curl -i http://localhost:3000/destinos/1
```

El primer GET devuelve un array ordenado por prioridad; el segundo, el objeto individual. Ambos incluyen `prioridad`.

### Editar parcialmente: PATCH

```sh
curl -i -X PATCH http://localhost:3000/destinos/1 \
  -H 'Content-Type: application/json' \
  -d '{"prioridad":"BAJA"}'
```

Respuesta HTTP **200**. Ciudad, país y descripción se conservan. Repite GET y comprueba que cambia también la posición del destino dentro de la colección.

Para cambiar solo la descripción sin restablecer la prioridad:

```sh
curl -i -X PATCH http://localhost:3000/destinos/1 \
  -H 'Content-Type: application/json' \
  -d '{"descripcion":"Ver auroras y cascadas"}'
```

### Eliminar: DELETE

```sh
curl -i -X DELETE http://localhost:3000/destinos/1
curl -i http://localhost:3000/destinos
```

DELETE responde **204 No Content**. El destino ya no aparece en la colección. Si era el último, GET devuelve `[]`.

### Validación

- Ciudad y país: texto no vacío, hasta 120 caracteres.
- Descripción: texto no vacío, hasta 1000 caracteres.
- Prioridad: ALTA, MEDIA o BAJA, en mayúsculas.
- POST exige ciudad, país y descripción; prioridad es opcional y toma MEDIA.
- PATCH exige al menos un campo válido. Los campos ausentes se conservan.
- El id lo genera PostgreSQL; se descarta un id enviado en el Body.
- Datos inválidos: 400. Id no numérico: 400. Destino inexistente: 404.

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

Abre el QR con Expo Go. Móvil y ordenador deben estar en la misma red. Para simulador iOS utiliza `http://localhost:3000`; para emulador Android, `http://10.0.2.2:3000`. Reinicia Expo si cambias `.env`.

1. Completa ciudad, país y descripción y elige Alta, Media o Baja.
2. Pulsa **Crear destino**: el destino se guarda y aparece en la colección.
3. Pulsa **Editar**: GET individual carga sus datos actuales en el formulario.
4. Cambia cualquier dato o la prioridad y pulsa **Guardar cambios**.
5. **Cancelar edición** vuelve al formulario de creación sin guardar.
6. **Eliminar** solicita confirmación; Cancelar no envía DELETE.
7. **Recargar** consulta de nuevo la colección real de la API.

La app muestra carga, validación, éxito y errores. Bloquea los botones durante las operaciones y modifica la lista después de una respuesta correcta. Tras guardar o borrar, vuelve a consultar GET. Si falla esa recarga después de un cambio confirmado, lo indica sin presentar el guardado como fallido.

## 4. Comprueba la persistencia

```sh
psql -U postgres -d databridge_e10
```

```sql
\d destinos
SELECT id, ciudad, pais, descripcion, prioridad FROM destinos
ORDER BY prioridad ASC, id DESC;
```

Crea un destino desde el móvil y comprueba su fila. Modifica solo su prioridad, repite el SELECT y verifica que los demás campos se conservan. Reinicia NestJS y recarga la app: el cambio debe seguir almacenado. Borra el destino y comprueba que no reaparece al reiniciar.

`prioridad` utiliza un enum de PostgreSQL cuyos valores se declaran ALTA, MEDIA y BAJA. PostgreSQL ordena un enum según ese orden de declaración, como explica su [documentación oficial](https://www.postgresql.org/docs/current/datatype-enum.html#DATATYPE-ENUM-ORDERING). Los registros de una versión base sin prioridad reciben MEDIA cuando `synchronize: true` añade la columna en este laboratorio.

## 5. Explica el recorrido del dato

Ejemplo: crear Reikiavik con prioridad alta.

1. React Native recoge los campos y envía JSON con POST `/destinos`.
2. El Controller recibe la petición y el Pipe comprueba el DTO.
3. El Service pide al Repository construir y guardar la Entity.
4. TypeORM traduce la operación para PostgreSQL, que almacena la fila y genera el id.
5. NestJS devuelve el objeto guardado como JSON.
6. React Native actualiza el estado y vuelve a consultar la colección.
7. GET ordena por prioridad y la app representa la tarjeta con los datos persistidos.

Entity define la tabla; DTO define los campos admitidos en una operación; Controller recibe HTTP; Service coordina; Repository consulta y guarda; React Native presenta el resultado.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas HTTP utilizan NestJS con un Repository simulado. La persistencia real con PostgreSQL y la interfaz de Expo Go se verifican siguiendo los pasos anteriores. Consulta `VERIFICACION.md` para los controles ejecutados.
