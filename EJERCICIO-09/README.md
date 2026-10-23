# Ejercicio 09 · Event Radar

Solución del [ejercicio 9 de DataBridge](https://albertohdezakkari.github.io/03-REACTNATIVE-03CT/#e9): consultar eventos mediante Query Params opcionales y filtros de TypeORM.

Incluye el reto **MODIFÍCALO**: combinar `ciudad` y `categoria` en una misma consulta. Cada filtro puede utilizarse por separado o dejarse vacío; ambos juntos se aplican con **AND**.

## 1. Base de datos

Con PostgreSQL local, entra con `psql -U postgres` y ejecuta:

```sql
CREATE DATABASE databridge_e09;
\q
```

Configuración de aula: `localhost:5432`, usuario `postgres`, contraseña `postgres`. Puedes ajustarla en `backend/src/app.module.ts`.

Alternativa con Docker Desktop arrancado, desde `EJERCICIO-09`:

```sh
docker compose up -d
```

Si ya tienes PostgreSQL de otro ejercicio, crea `databridge_e09` en ese servidor. Evita arrancar otro contenedor en el puerto 5432.

## 2. Backend primero

Detén los backends anteriores que estén utilizando el puerto 3000.

```sh
cd backend
npm ci
npm run start:dev
```

En una base nueva se crean tres ejemplos:

| Evento | Ciudad | Categoría | Fecha |
| --- | --- | --- | --- |
| Tech Meetup | Zaragoza | Tecnologia | 2027-03-12 |
| Festival Indie | Zaragoza | Musica | 2027-04-20 |
| Dev Conference | Madrid | Tecnologia | 2027-05-15 |

Se conservan los datos existentes: los ejemplos solo se insertan si la tabla está vacía.

### Prueba las cuatro combinaciones

En otra terminal (macOS o Git Bash):

```sh
# Sin filtros: los tres eventos.
curl -i http://localhost:3000/eventos

# Solo ciudad: Tech Meetup y Festival Indie.
curl -i 'http://localhost:3000/eventos?ciudad=Zaragoza'

# Solo categoría: Tech Meetup y Dev Conference.
curl -i 'http://localhost:3000/eventos?categoria=Tecnologia'

# Ambos: solo Tech Meetup.
curl -i 'http://localhost:3000/eventos?ciudad=Zaragoza&categoria=Tecnologia'
```

Todos responden HTTP **200** con un array ordenado por fecha ascendente y, en caso de empate, por id. La consulta combinada devuelve:

```json
[
  {"id":1,"nombre":"Tech Meetup","ciudad":"Zaragoza","categoria":"Tecnologia","fecha":"2027-03-12"}
]
```

Los identificadores pueden variar. Con los ejemplos de una base nueva, `ciudad=Madrid&categoria=Musica` devuelve `[]`, no 404.

### Filtros opcionales

- Un parámetro ausente no añade condiciones a la consulta.
- Un parámetro vacío o solo con espacios se trata como ausente.
- Se recortan los espacios al inicio y al final.
- Cada filtro admite un único texto de hasta 120 caracteres; parámetros repetidos o demasiado largos devuelven HTTP 400.
- La coincidencia es exacta: se distinguen mayúsculas y tildes. Los ejemplos usan `Tecnologia` y `Musica`, sin tilde.

Los filtros se aplican en la base de datos mediante un único objeto `where`. No se descarga toda la colección para filtrarla en React Native.

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

La pantalla comienza mostrando todos los eventos. Comprueba:

1. Escribe Zaragoza y deja categoría vacía: aparecen los eventos de esa ciudad.
2. Deja ciudad vacía y escribe Tecnologia: aparecen los de esa categoría.
3. Escribe ambos: aparecen solo los que cumplen las dos condiciones.
4. Pulsa **Mostrar todos**: se vacían los campos y se consulta `/eventos` sin parámetros.
5. Prueba una combinación sin coincidencias: aparece el mensaje de lista vacía.

La interfaz muestra los filtros realmente aplicados y el número de resultados, además de carga y errores de conexión. Si falla una consulta, conserva los resultados anteriores. Cambiar el texto no aplica filtros hasta pulsar el botón.

La URL se construye solo con los campos rellenados y utiliza `encodeURIComponent` para codificar espacios, tildes y otros caracteres especiales.

## 4. Comprueba PostgreSQL y la consulta

```sh
psql -U postgres -d databridge_e09
```

```sql
SELECT id, nombre, ciudad, categoria, fecha FROM eventos ORDER BY fecha, id;

SELECT id, nombre, ciudad, categoria, fecha FROM eventos
WHERE ciudad = 'Zaragoza' AND categoria = 'Tecnologia'
ORDER BY fecha, id;
```

Compara la segunda consulta con el JSON de GET utilizando ambos Query Params. Reinicia NestJS y repite las consultas: los registros deben seguir almacenados y los ejemplos no deben duplicarse.

Para practicar con espacios y tildes en los valores, puedes insertar otro evento:

```sql
INSERT INTO eventos (nombre, ciudad, categoria, fecha)
VALUES ('Festival local', 'A Coruña', 'Música en vivo', '2027-06-10');
```

Introduce esos mismos textos en el formulario. La URL codificada sería:

```text
/eventos?ciudad=A%20Coru%C3%B1a&categoria=M%C3%BAsica%20en%20vivo
```

## 5. Explicación

- `@Query('ciudad')` y `@Query('categoria')` leen los parámetros de la URL.
- El Pipe normaliza los textos y rechaza filtros inválidos.
- El Service comienza con `where = {}` y añade solo las condiciones presentes.
- En un único objeto `where`, ciudad y categoría se combinan con AND.
- `repository.find({ where, order })` ejecuta la consulta filtrada.
- React Native muestra el array que devuelve la API y no realiza un filtrado alternativo local.

**¿Por qué puede ser mejor filtrar en la API?** Evita transferir registros que no se necesitan y permite que PostgreSQL resuelva la consulta. Esto reduce datos descargados y trabajo en el móvil.

**¿Qué pasa si no se envía categoría?** No se añade `categoria` al `where`: se conservan los eventos de todas las categorías que cumplan los demás filtros.

Recorrido: formulario → URL con Query Params → Controller → Service → where opcional → Repository → PostgreSQL → array JSON → resultados.

## 6. Comprobaciones

```sh
# En backend:
npm test
# En frontend:
npx tsc --noEmit
npx eslint App.tsx index.ts
```

Las pruebas HTTP ejecutan NestJS con un Repository simulado. La consulta real con PostgreSQL y la interfaz en Expo Go se verifican siguiendo los pasos anteriores. Consulta `VERIFICACION.md` para conocer los controles ejecutados.
