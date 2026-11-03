
DOCUMENTACIÓN COMPLETA — PROYECTO PLANTA DE TRANSFORMACIÓN (planta-app)
AUTOR / CONTEXTO
Este proyecto es la app de transformación personal llamada "Planta de Transformación". Se trabaja en un repositorio que tiene frontend/ (app móvil/web con Expo), backend/ (API Node/Express con MongoDB), docker-compose.yml, PENDIENTES.md y archivo vacío README. El proyecto estuvo en desarrollo, se completaron 9 apartados, se hizo despliegue real en servidor Ubuntu, la base de datos se unificó en LaPlantaDB, se generó APK funcional y se borraron componentes/mocks muertos.
PARA QUÉ SERVE / QUÉ RESUELVE
La app ayuda al usuario a crear hábitos diarios. Entra, ve una acción principal (rutina o reto), avanza con contenido multimedia, guarda lo que le interesa, consulta su progreso real y, si es admin, gestiona usuarios, retos y contenido.
ARQUITECTURA GENERAL
- Frontend: Expo React Native (TypeScript) con expo-router. Estructura basada en carpetas app/ para rutas, features/ para lógica de dominio, components/ para UI, constants/ para configuración.
- Backend: Node.js con Express 4, Mongoose 8, JWT, Bcrypt, Luxon, CORS.
- Persistencia: MongoDB (base LaPlantaDB).
- Infraestructura: Docker Compose para entorno local/unificado. Despliegue en servidor Ubuntu remoto (pruebas1@100.100.188.93).
APARTADO POR APARTADO — QUÉ ES Y PARA QUÉ SIRVE
1. INICIO (frontend/app/(tabs)/index.tsx)
- Pantalla principal de la app.
- Hero rotativo: muestra una acción diaria que cambia entre las rutinas que el usuario aún no completó (se basa en completedIds que vienen del backend).
- "Continuar": consume inProgressList real; antes siempre estaba vacío porque se aplicaba Array.isArray sobre un objeto. Ahora muestra título, miniatura, duración y porcentaje.
- Progreso real del video: onProgress actualiza PATCH /activity/in-progress. Al reabrir, usa seekTo para retomar donde estaba.
- Autocompletado al 95% y barra que indica "Retomaste en X:XX".
- "Recomendado para ti": viene del backend (featured=true), no está hardcodeado.
- Meta diaria real: today.completed / 3 acciones (antes usaba una fórmula inventada (art+rut+retos) - 2).
- Avatar navega a /profile/edit; campana a avisos; "Ver todo" a /saved.
2. DESCUBRIR (frontend/features/content/screens/DiscoverScreen.tsx)
- Catálogo completo de contenido.
- Filtros por chips: "Rutina" y "Reto" (antes usaba type en lugar de category, dando 0 resultados).
- Componente Thumb: muestra imagen con onError que activa fallback por categoría. Antes tenía 2 <Image> superpuestos.
- Badge de duración real: durationSec = duration * 60 (antes estaba mal calculado).
- Destacados no se repiten en la lista inferior.
3. ARTÍCULOS / CONTENIDO (frontend/features/articles/)
- Lectura completa de artículos/ritmos por ID.
- Usa articleApi.ts que hace GET /api/content/:id con el ObjectId real de MongoDB.
- Antes los slugs mock seguían funcionando como fallback, pero cualquier navegación a artículo real caía en "no encontrado" porque no se pasaba el ID real.
- Pantalla app/articles/[id].tsx.
4. GUARDADOS (frontend/features/content/savedApi.ts)
- Lista de favoritos del usuario.
- Antes solo guardaba en el dispositivo local (AsyncStorage o similar).
- Ahora tiene sincronización completa: GET /api/user/saved y POST /api/user/saved. Si hay problemas de red, la caché local actúa como respaldo.
- Pantalla vinculada desde Inicio ("Ver todo").
5. PERFIL / EDICIÓN (frontend/app/profile/edit.tsx)
- Edición de datos personales y foto de perfil.
- APK tiene permisos de ubicación y foto de perfil activos.
- El avatar del inicio navega a esta pantalla.
6. ADMIN (frontend/app/admin/)
- Panel de administración completo.
- users/index.tsx y users/[id].tsx: gestión de usuarios. Antes estaba 100% roto porque usaba URL hardcodeada con puerto equivocado; ya usa constants/api.ts.
- challenges/index.tsx: muestra retos completados. Consume GET /api/admin/challenges.
- Admin de prueba: admin@planta.com / admin123.
7. BACKEND (backend/src/)
- index.js: servidor Express.
- Dependencias principales: express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv, luxon.
- Scripts de trabajo: npm run dev (nodemon), npm run seed (datos iniciales), npm run backfill (limpia descripciones vacías de contenido).
- Dockerfile en backend/ para contenerizar.
8. BASE DE DATOS (MongoDB / LaPlantaDB)
- Unificada en el servidor de despliegue.
- Contiene 8 contenidos y 15 usuarios.
- Backup creado: test.users_test_backup_20261023.
- Endpoint verificado: /paginated responde 200, /saved responde 401 cuando corresponde.
9. DOCKER / DESPLIEGUE (docker-compose.yml, Dockerfile)
- Levanta backend y base de datos de forma unificada.
- Servidor remoto: pruebas1@100.100.188.93
- URL pública confirmada: https://pruebas1-1.tail033823.ts.net/planta/api
- Render queda obsoleto; se usa el servidor Ubuntu.
STACK TÉCNICO DETALLADO
- Frontend: Expo SDK ~54.0.33, React 19.1.0, React Native 0.81.5, expo-router 6.0.23, TypeScript 5.9.2, luxon para fechas.
- Backend: Node.js, Express 4.21.2, Mongoose 8.9.5, JWT 9.0.2, Bcryptjs 2.4.3, Luxon 3.7.2.
- Base: MongoDB (versión compatible con Mongoose 8).
- Entorno: Windows (desarrollo local), Linux/Ubuntu (despliegue).
ESTADO DEL PROYECTO Y ARREGLOS REALIZADOS (según PENDIENTES.md y commits recientes)
- 9 apartados terminados, 0 pendientes de código.
- URL de API hardcodeada y con puerto equivocado: corregida (constants/api.ts).
- Rutas sin registrar en el Stack raíz (doble header): corregido (app/_layout.tsx).
- IDs mock vs IDs reales: corregido (features/articles/articleApi.ts, articleSlides.ts).
- Componentes y mocks muertos: borrados (components/ui/, features/content/components/*, mocks de artículos, componentes sin usar de Expo como modal.tsx, themed-*, hello-wave, etc.).
- Guardados solo en dispositivo: corregido (savedApi.ts sincroniza con backend).
- Endpoints del backend sin usar: ahora se consumen (ej. /api/admin/challenges).
INSTRUCCIONES PASO A PASO PARA EJECUTAR
Backend local:
1. cd backend
2. npm install
3. Copiar .env.example a .env y configurar MONGODB_URI, JWT_SECRET, PORT.
4. npm run dev
Frontend local:
1. cd frontend
2. npm install
3. npx expo start o npm start
4. Verificar que constants/api.ts apunte al backend local (ej. http://localhost:3000 o la IP local).
Docker (entorno completo):
1. docker-compose up --build
2. Verificar docker.md si hay detalles de variables.
ADMINISTRACIÓN Y CREDENCIALES
- Panel admin: admin@planta.com / admin123
- Base de datos de producción: LaPlantaDB en el servidor Ubuntu.
- Backup disponible: test.users_test_backup_20261023.
