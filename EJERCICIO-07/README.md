# Ejercicio 07 · Sneaker Vault

Solución del [ejercicio 7 de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e7): integrar un CRUD completo con React Native, NestJS, TypeORM y PostgreSQL.

Incluye el reto **MODIFÍCALO**: `stock` se guarda como entero en PostgreSQL y se admite en POST/PATCH. GET lo devuelve como número. La etiqueta **AGOTADO** se calcula en React Native cuando `stock === 0`; no se guarda esa palabra en la base de datos.

## 1. Base de datos

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e07;
\q
```

Configuración de aula: `localhost:5432`, usuario `postgres` y contraseña `postgres`. Se puede cambiar en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-07`:

```sh
docker compose up -d
```

Si ya tienes un PostgreSQL de otro ejercicio, crea `databridge_e07` en ese servidor en lugar de arrancar otro contenedor en el puerto 5432.

## 2. Backend primero

Detén otros backends que estén usando el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

Este ejercicio comienza con la colección vacía. No inserta ejemplos automáticamente.

### Crear — POST

En otra terminal (macOS o Git Bash):

```sh
curl -i -X POST http://localhost:3000/sneakers \
  -H 'Content-Type: application/json' \
  -d '{"marca":"Nike","modelo":"Air Max 1","precio":149.99,"talla":42,"stock":3}'
```

Responde HTTP **201** con el objeto guardado y el id generado. Utiliza ese id en las siguientes peticiones; los ejemplos suponen que es `1`.

### Consultar — GET

```sh
curl -i http://localhost:3000/sneakers
curl -i http://localhost:3000/sneakers/1
```

El primer GET devuelve un array ordenado por id descendente; el segundo, un objeto. Ambos incluyen `stock` como número.

### Editar — PATCH

```sh
curl -i -X PATCH http://localhost:3000/sneakers/1 \
  -H 'Content-Type: application/json' \
  -d '{"stock":0}'
```

Responde HTTP **200**. Marca, modelo, precio y talla se conservan. GET debe devolver `stock: 0`; la app debe mostrar AGOTADO.

Para rebajar solo el precio:

```sh
curl -i -X PATCH http://localhost:3000/sneakers/1 \
  -H 'Content-Type: application/json' \
  -d '{"precio":139.99}'
```

La operación debe conservar el stock que se había cambiado a cero.

### Eliminar — DELETE

```sh
curl -i -X DELETE http://localhost:3000/sneakers/1
curl -i http://localhost:3000/sneakers
```

DELETE responde **204 No Content**. La colección ya no incluye el registro y será `[]` si era el último. Las peticiones sobre ids inexistentes devuelven 404; los ids no numéricos devuelven 400.

### Datos admitidos

- Marca y modelo: texto no vacío, máximo 120 caracteres.
- Precio: número de 0 a 9999,99; PostgreSQL lo almacena con dos decimales.
- Talla: entero de 1 a 100, de acuerdo con la columna entera del ejercicio.
- Stock: entero de 0 a 2147483647.

POST exige los cinco campos. PATCH admite cualquiera de ellos, pero exige al menos un cambio válido. Los campos desconocidos y el id se descartan. Los datos inválidos devuelven 400 antes de escribir en el Repository. Una tabla de la solución base sin `stock` recibe la columna con valor por defecto `0` al sincronizarse.

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

Comprueba el ciclo completo:

1. Completa marca, modelo, precio, talla y stock y pulsa **Crear sneaker**.
2. Comprueba la tarjeta y el stock devuelto por el servidor.
3. Pulsa **Editar**: se consulta GET individual y se rellena el formulario con los datos actuales.
4. Cambia precio o stock y pulsa **Guardar cambios**. Con stock cero, la tarjeta muestra AGOTADO.
5. Pulsa **Cancelar edición** para volver al formulario de creación sin enviar cambios.
6. Pulsa **Eliminar** y confirma. Cancelar el diálogo no envía DELETE.
7. Pulsa **Recargar colección** para volver a consultar PostgreSQL.

Los botones se bloquean mientras hay una operación en marcha. Las modificaciones de la lista se aplican después de la confirmación del servidor y se vuelve a consultar GET para sincronizarla. Si el guardado termina bien pero falla la recarga, la app distingue ese caso del fallo al guardar.

## 4. Comprueba la persistencia

```sh
psql -U postgres -d databridge_e07
```

```sql
SELECT id, marca, modelo, precio, talla, stock FROM sneakers ORDER BY id DESC;
```

Crea una sneaker desde el móvil y comprueba la fila. Cambia solo stock, repite el SELECT y verifica que el resto de los campos sigue igual. Reinicia NestJS y recarga la app: el stock debe conservarse. Elimina el registro y comprueba que no reaparece al reiniciar.

## 5. Explicación

- **GET colección:** `repository.find()` obtiene todas las sneakers.
- **GET individual:** `findOneBy({ id })` obtiene una sneaker o produce 404.
- **POST:** `create(dto)` construye la Entity y `save()` la guarda.
- **PATCH:** busca, mezcla solo los cambios con `merge()` y persiste con `save()`.
- **DELETE:** busca y elimina con `remove()`.
- **Interfaz:** interpreta `stock === 0` para mostrar AGOTADO; el dato persistente sigue siendo numérico.

Recorrido: React Native → HTTP/JSON → Controller → DTO/validación → Service → Repository → PostgreSQL → respuesta → estado React.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas HTTP ejecutan una aplicación NestJS con un Repository simulado. La persistencia real con PostgreSQL y la interfaz en Expo Go se comprueban siguiendo los pasos anteriores. Consulta `VERIFICACION.md` para los controles ejecutados.
