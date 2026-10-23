# Ejercicio 04 · Food Spots

Solución del [ejercicio 4 de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e4): crear restaurantes desde React Native con `POST`, `Body`, DTO, `repository.create()` y `repository.save()`.

Incluye el reto **MODIFÍCALO**: `precioMedio` existe en la Entity, el DTO, el formulario, el JSON del POST y la tarjeta de confirmación.

## 1. Base de datos

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e04;
\q
```

La configuración de aula es `localhost:5432`, usuario `postgres` y contraseña `postgres`. Se puede modificar en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-04`:

```sh
docker compose up -d
```

Si ya tienes un PostgreSQL de los ejercicios anteriores, crea `databridge_e04` en ese servidor. Evita iniciar un segundo contenedor en el puerto 5432.

## 2. Prueba primero el backend

Detén otros backends que estén utilizando el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

En otra terminal (macOS o Git Bash):

```sh
curl -i -X POST http://localhost:3000/restaurantes \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"La Trattoria","tipo":"Italiano","ciudad":"Zaragoza","puntuacion":9,"precioMedio":25.5}'
```

Debe responder HTTP **201 Created**, con un identificador generado por PostgreSQL y el precio enviado:

```json
{"id":1,"nombre":"La Trattoria","tipo":"Italiano","ciudad":"Zaragoza","puntuacion":9,"precioMedio":25.5}
```

El `id` puede variar. Un nuevo POST válido crea un nuevo restaurante, aunque coincida el nombre. Este ejercicio no inserta datos de ejemplo automáticamente.

El backend valida nombre, tipo y ciudad (1–120 caracteres), puntuación (0–10) y precio medio (0–999999,99). Puntuación y precio deben ser números JSON. Los datos inválidos devuelven HTTP 400 antes de consultar el Repository. El id y los campos ajenos al DTO se descartan.

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

Abre el QR con Expo Go. El móvil y el ordenador deben estar en la misma red. Para simulador iOS utiliza `http://localhost:3000`; para emulador Android, `http://10.0.2.2:3000`. Reinicia Expo si cambias `.env`.

Completa nombre, tipo de cocina, ciudad, puntuación y precio medio. El precio y la puntuación aceptan coma o punto decimal en el formulario y se convierten en números antes del POST.

Mientras se envía, el botón se desactiva. Tras una respuesta correcta se limpian los campos y se muestra la tarjeta con el objeto devuelto por NestJS, incluido el precio medio con dos decimales. Si falla la conexión o la validación, se conserva el formulario y se muestra un error.

La tarjeta representa el último restaurante guardado durante esa sesión. Al recargar la app, los datos siguen en PostgreSQL; este ejercicio se centra en POST y no añade un listado GET de restaurantes.

## 4. Comprueba PostgreSQL y la persistencia

```sh
psql -U postgres -d databridge_e04
```

```sql
\dt
SELECT id, nombre, tipo, ciudad, puntuacion, "precioMedio"
FROM restaurantes ORDER BY id;
```

Relaciona la fila con el JSON devuelto por el POST. Reinicia NestJS y repite el SELECT: el restaurante debe seguir almacenado. Envía otro restaurante desde el móvil y comprueba que se añade una fila con su precio.

`precioMedio` es `decimal(8,2)`: PostgreSQL almacena dos decimales. Las comillas dobles conservan las mayúsculas del nombre de la columna. Con una tabla de la solución base, `synchronize: true` añade la columna y asigna `0` a los registros existentes; puedes ajustar esos precios mediante SQL.

## 5. Explicación

- **Entity:** representa la tabla persistente, incluido el id autogenerado y el precio.
- **DTO:** describe los campos que se aceptan al crear. No incluye el id.
- **Pipe:** valida el JSON en ejecución; los tipos TypeScript por sí solos no validan peticiones HTTP.
- **Controller:** recibe POST `/restaurantes` y extrae el Body validado.
- **Service:** llama a `repository.create(dto)` y después a `repository.save(restaurante)`.
- **React Native:** construye el JSON, envía el POST y muestra la respuesta del servidor.

**¿Por qué Entity y DTO no tienen la misma responsabilidad?** La Entity define cómo se almacena el dato; el DTO define qué puede enviar el cliente para una operación. PostgreSQL genera el id, por lo que el cliente no debe decidirlo en el DTO de creación.

**¿Qué diferencia hay entre create() y save()?** `create()` construye una Entity en memoria. `save()` realiza la operación que la persiste en PostgreSQL. Crear el objeto sin guardarlo no inserta una fila.

Recorrido: formulario → JSON → POST → Body/DTO → Service → create() → save() → PostgreSQL → respuesta → tarjeta.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas HTTP usan una aplicación NestJS con un Repository simulado. La comprobación con PostgreSQL y Expo Go debe seguir los pasos anteriores. El resultado de las comprobaciones ejecutadas se recoge en `VERIFICACION.md`.
