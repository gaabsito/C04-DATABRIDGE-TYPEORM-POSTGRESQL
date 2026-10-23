# Ejercicio 03 · Pet Profile

Solución del [ejercicio 3 de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e3): consultar un registro concreto con `GET /mascotas/:id`, Path Param y `repository.findOneBy({ id })`.

Incluye **MODIFÍCALO**: `nivelEnergia` existe en la Entity, se persiste en PostgreSQL, viaja en el JSON y se muestra en la ficha. Nala se crea con energía `Alta`. Los registros que ya existan reciben el valor por defecto `Media` al añadir la columna.

## 1. Base de datos

Con PostgreSQL local, ejecuta `psql -U postgres` y, dentro de la consola:

```sql
CREATE DATABASE databridge_e03;
\q
```

La configuración de aula es `localhost:5432`, usuario `postgres` y contraseña `postgres`; se puede ajustar en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-03`:

```sh
docker compose up -d
```

Si ya usas PostgreSQL de un ejercicio anterior, crea `databridge_e03` en ese mismo servidor en lugar de arrancar otro contenedor en el puerto 5432.

## 2. Backend primero

Detén otros backends de los ejercicios anteriores: también utilizan el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

En otra terminal:

```sh
curl -i http://localhost:3000/mascotas/1
curl -i http://localhost:3000/mascotas/999
curl -i http://localhost:3000/mascotas/abc
```

Respuestas esperadas:

- `/1`: HTTP 200 y **un objeto**, no un array.
- `/999`: HTTP 404 si no existe esa mascota, con el mensaje `Mascota no encontrada`.
- `/abc`: HTTP 400; `ParseIntPipe` rechaza el identificador antes de consultar el Repository.

```json
{"id":1,"nombre":"Nala","raza":"Golden Retriever","edad":4,"ciudad":"Zaragoza","nivelEnergia":"Alta"}
```

El identificador es generado por PostgreSQL. Si utilizas una tabla con otros datos, consulta su identificador real y ajusta `MASCOTA_ID` en `frontend/App.tsx`.

## 3. Frontend con Expo Go

En `frontend`, copia `.env.example` a `.env` y sustituye `TU_IP_LOCAL` por la IP del ordenador:

```text
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

Puedes verla en Ajustes del Sistema → Wi-Fi → Detalles → TCP/IP (macOS), o con `ipconfig` en Windows.

```sh
cd frontend
npm ci
npx expo start
```

Abre el QR con Expo Go. El móvil y el ordenador deben estar en la misma red. Para simulador iOS utiliza `http://localhost:3000`; para emulador Android, `http://10.0.2.2:3000`. Reinicia Expo después de cambiar `.env`.

La app consulta la mascota con `MASCOTA_ID = 1` y muestra nombre, raza, edad, ciudad y nivel de energía. Incluye carga, error de conexión y mensaje de mascota no encontrada.

## 4. Comprueba la persistencia

```sh
psql -U postgres -d databridge_e03
```

```sql
\dt
SELECT id, nombre, raza, edad, ciudad, "nivelEnergia" FROM mascotas;
UPDATE mascotas SET "nivelEnergia" = 'Baja' WHERE nombre = 'Nala';
```

TypeORM utiliza el nombre `nivelEnergia` respetando las mayúsculas; por eso SQL necesita comillas dobles. Repite el GET y recarga la app: debe mostrar `Baja`. Reinicia NestJS y comprueba que el cambio se conserva y que Nala no se duplica. Puedes restaurarla con:

```sql
UPDATE mascotas SET "nivelEnergia" = 'Alta' WHERE nombre = 'Nala';
```

Los ejemplos se insertan solo si la tabla está vacía. `synchronize: true` adapta las columnas durante este laboratorio.

## 5. Qué has aprendido

**¿De dónde obtiene el Controller el id solicitado?** Del Path Param de la URL. En `/mascotas/1`, `@Param('id', ParseIntPipe)` recoge `1` y lo convierte en número.

El Controller delega en `MascotasService.findOne(id)`, que utiliza `repository.findOneBy({ id })`. Si no encuentra el registro lanza `NotFoundException`, que NestJS convierte en HTTP 404. A diferencia de `find()`, esta operación devuelve un objeto concreto o ningún resultado.

Recorrido: React Native → HTTP → Controller → Path Param → Service → Repository → PostgreSQL → objeto JSON → ficha.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas cubren la columna de energía, la inserción inicial, la ausencia de reinserciones y las respuestas HTTP 200/404/400. Usan un Repository simulado; el README describe la prueba con PostgreSQL real y Expo Go. Consulta `VERIFICACION.md` para conocer lo que se ha ejecutado.
