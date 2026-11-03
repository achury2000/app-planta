# Docker — Backend y Base de Datos

Guía paso a paso para levantar el proyecto completo (backend + base de datos Mongo).

## Requisitos

- **Docker Desktop** instalado, con el motor corriendo (WSL2 o Hyper-V).
- **Docker Compose** (incluido con Docker Desktop).
- **Git** para clonar el repositorio (opcional si ya tienes el código).
- **Node.js 20+** solo si quieres ejecutar el backend fuera de Docker.

## Arquitectura

El proyecto se compone de 3 contenedores definidos en `docker-compose.yml`:

| Servicio | Contenedor | Rol |
| --- | --- | --- |
| `mongo` | `planta-mongo` | Base de datos MongoDB 7 con volumen persistente `mongo_data`. |
| `backend` | `planta-backend` | API Express (Node 20) que expone el puerto `3000`. |
| `seed` | `planta-seed` | Script de datos de prueba (se ejecuta una sola vez con `docker compose run`). |

## Archivos relevantes

| Archivo | Descripción |
| --- | --- |
| `docker-compose.yml` | Define los servicios `mongo`, `backend` y `seed`. |
| `backend/Dockerfile` | Imagen Node 20 (Alpine) con dependencias de producción. |
| `backend/.dockerignore` | Excluye `node_modules` y `.env` de la imagen (los secretos no se incluyen). |
| `backend/.env` | Variables de entorno del backend (PORT, JWT_SECRET, etc.). |
| `backend/src/seed.js` | Semilla con datos de prueba (usuarios y contenidos). |
| `backend/src/config/db.js` | Conexión a MongoDB con Mongoose. |

## Configuración previa

### 1. Variables de entorno del backend

Copia el ejemplo y ajusta los valores si es necesario:

```bash
cp backend/.env.example backend/.env
```

Valores clave en `backend/.env`:

```ini
PORT=3000
JWT_SECRET=pon_aqui_un_secreto_largo_y_aleatorio
```

> El `MONGO_URI` de Atlas que aparece en `.env` **se ignora dentro de Docker**: el `docker-compose.yml` lo sobrescribe con `mongodb://mongo:27017/plantatransformacion` para usar la BD local.

### 2. URL de la API para el frontend (opcional)

En `frontend/.env`, la URL apunta a la IP de tu equipo:

```
EXPO_PUBLIC_API_URL=http://<IP_DE_TU_EQUIPO>:3000/api
```

Reemplaza `<IP_DE_TU_EQUIPO>` por la IP local de tu máquina (ej: `10.7.68.211`).

## Paso a paso: levantar backend + base de datos con Docker

### Paso 1 — Construir las imágenes y levantar los contenedores

```bash
docker compose up -d --build
```

Esto construye la imagen del backend, descarga la imagen `mongo:7` (solo la primera vez) y crea la red interna donde el backend alcanza a Mongo por el nombre `mongo`.

### Paso 2 — Verificar que los contenedores están arriba

```bash
docker compose ps
```

Debes ver los servicios `planta-mongo` y `planta-backend` en estado `Up`. El puerto `0.0.0.0:3000->3000/tcp` debe aparecer en `planta-backend`.

### Paso 3 — Ver los logs del backend

```bash
docker compose logs -f backend
```

Deberías ver:

```
✅ MongoDB conectado: ...
Backend corriendo en http://0.0.0.0:3000
BOOT: backend/src/index.js LOADED
```

Si aparece un error de conexión, revisa la sección [Solución de problemas](#solucion-de-problemas).

### Paso 4 — Cargar datos de prueba (seed)

El backend arranca con la BD **vacía** (Mongo crea las colecciones al primer insert). Para poblar la BD con datos de prueba:

```bash
docker compose run --rm seed
```

> El contenedor `seed` se ejecuta una sola vez y se elimina (`--rm`). Si ya existen datos, no hace nada; para reinsertar usa el comando `--reset` (ver [Comandos útiles](#comandos-utiles)).

### Paso 5 — Probar la API

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{"status":"ok","timestamp":"2026-08-14T..."}
```

### Paso 6 — Probar el login con un usuario demo

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@planta.com","password":"admin123"}'
```

Respuesta esperada: un JSON con `token` y `user.role: "admin"`.

### Paso 7 — Revisar los contenidos

```bash
curl http://localhost:3000/api/content
```

Debe devolver el arreglo con los 5 contenidos de prueba.

### Paso 8 — Acceder a la consola de la BD (opcional)

```bash
docker compose exec mongo mongosh plantatransformacion
```

Dentro de `mongosh` puedes ver las colecciones:

```js
show collections
db.users.find().pretty()
db.contents.find().pretty()
exit
```

## Usuarios de prueba (seed)

| Rol | Email | Contraseña |
| --- | --- | --- |
| Admin | `admin@planta.com` | `admin123` |
| Usuario | `carlos@planta.com` | `demo123` |
| Usuario | `maria@planta.com` | `demo123` |
| Usuario | `juan@planta.com` | `demo123` |

Las contraseñas se almacenan con hash (bcrypt) gracias al `pre("save")` del modelo `User`.

## Comandos útiles

| Comando | Acción |
| --- | --- |
| `docker compose up -d --build` | Construir y levantar (recomendado tras cambios). |
| `docker compose up -d` | Levantar sin reconstruir. |
| `docker compose ps` | Ver estado de los contenedores. |
| `docker compose logs -f backend` | Ver logs del backend en tiempo real. |
| `docker compose run --rm seed` | Insertar datos de prueba (solo si hay colecciones vacías). |
| `docker compose run --rm seed node src/seed.js -- --reset` | Borrar y reinsertar los datos de prueba. |
| `docker compose exec mongo mongosh plantatransformacion` | Consola interactiva de Mongo. |
| `docker restart planta-backend` | Reiniciar solo el backend. |
| `docker compose down` | Detener y eliminar los contenedores (conserva el volumen de datos). |
| `docker compose down -v` | Detener, eliminar contenedores **y el volumen** (borra todos los datos locales). |

## Solución de problemas

| Síntoma | Solución |
| --- | --- |
| `planta-backend` se reinicia o no queda `Up` | Revisa los logs con `docker compose logs backend`. Lo más común es que Mongo no estuviera listo; con el healthcheck el backend espera, pero si el error persiste, reinicia con `docker compose up -d --build`. |
| Error `ECONNREFUSED 27017` | Verifica que `planta-mongo` esté arriba: `docker compose ps`. Si no, levántalo solo: `docker compose up -d mongo`. |
| El seed no inserta nada | Las colecciones ya tienen datos. Usa `docker compose run --rm seed node src/seed.js -- --reset`. |
| El puerto 3000 está ocupado | Detén el proceso que lo usa o cambia `PORT` en `backend/.env` y `"3000:3000"` en `docker-compose.yml`. Luego actualiza `EXPO_PUBLIC_API_URL` en `frontend/.env`. |
| El puerto 27017 está ocupado | Detén la instancia local de Mongo o cambia `"27017:27017"` a otro puerto (ej: `"27018:27017"`). El backend sigue conectándose por la red interna, así que no requiere otros cambios. |
| Los datos desaparecen al hacer `down` | Solo ocurre si usas `docker compose down -v`, que elimina el volumen. Para conservarlos usa `docker compose down` a secas. |
| El backend no ve los contenidos creados antes | La BD en Docker es local y distinta de Atlas. Si venías usando Atlas, los datos no viajan con Docker; puebla la BD local con el seed. |

## Ejecutar sin Docker (opcional)

Para desarrollo sin Docker necesitas una BD Mongo accesible. Dos opciones:

### Opción A — Backend local + Mongo en Docker

Solo levanta Mongo en Docker y ejecuta el backend en tu máquina:

```bash
docker compose up -d mongo
```

En `backend/.env`, apunta a la BD local:

```ini
MONGO_URI=mongodb://localhost:27017/plantatransformacion
```

Luego:

```bash
cd backend
npm install
npm run seed
npm run dev
```

### Opción B — Backend local + Atlas (BD en la nube)

Mantén `MONGO_URI` de Atlas en `backend/.env` y ejecuta:

```bash
cd backend
npm install
npm run dev
```

> ⚠️ La URI actual de Atlas no define nombre de base de datos, por lo que MongoDB usará la BD `test`. Se recomienda agregarlo: `mongodb+srv://...@appplantadetransformaci.wytwgkp.mongodb.net/plantatransformacion?appName=...`

## Notas

- El backend solo arranca si la conexión a MongoDB es exitosa (`backend/src/config/db.js`).
- En Docker, el backend usa la BD local `mongo` con volumen persistente `mongo_data`, ignorando el `MONGO_URI` de Atlas. Para volver a usar Atlas, elimina el bloque `environment.MONGO_URI` de `docker-compose.yml` y reinicia.
- Los volúmenes de Docker conservan los datos entre reinicios; solo se borran con `docker compose down -v`.
- El `MONGO_URI` de Atlas no debe incluirse en el contenedor; el `backend/.dockerignore` excluye `.env` de la imagen y los secretos viajan como variables de entorno en tiempo de ejecución.
