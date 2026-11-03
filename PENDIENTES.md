# Pendientes por apartado — Planta de Transformación

> Documento de trabajo. Se actualiza a medida que avanzamos.
> **Estado:** 9 de 9 apartados terminados. **0 pendientes de código.**
> Despliegue completado: servidor Ubuntu actualizado a `c4967524` y BD unificada en `LaPlantaDB`.
> **Última actualización:** sesión del 23/10/2026 (despliegue + unificación de BD).

**Cómo usar:** cada apartado tiene prioridad 🔴 rompe funcionalidad / 🟠 mejora notable /
🟡 detalle de calidad. Marcamos `[x]` lo hecho.

**Estado actual del stack:** backend en Docker en el servidor Ubuntu (URL: `https://pruebas1-1.tail033823.ts.net/planta/api`), frontend con `npx expo start --clear`. Admin: `admin@planta.com` / `admin123`.

---

## 📌 Pendientes reales (lo que queda)

| Prioridad | Qué | Dónde |
|---|---|---|
| ✅ | **Despliegue backend** (23/10): servidor Ubuntu en `c4967524`, BD = `LaPlantaDB` (8 contenidos, 15 usuarios), `/paginated` → 200 y `/saved` → 401 verificados por fuera. Backup de usuarios: `test.users_test_backup_20261023`. Render queda **obsoleto** | servidor `pruebas1@100.100.188.93` |
| ✅ | **5.7 — Datos en la BD**: `npm run backfill` ejecutado en `LaPlantaDB` → 0 descripciones vacías | — |
| ✅ | **APK**: desplegado y funcionando bien (regenerado con EAS; permiso de ubicación y foto de perfil activos) | `frontend/app.json`, `app/profile/edit.tsx` |
| 🟡 | **Chip "Retos"** en Descubrir (crear contenido `category: "challenges"` desde el panel admin) | `DiscoverScreen.tsx` |

---

## 🔴 Transversales (afectan a varios apartados)

| # | Pendiente | Dónde | Impacto |
|---|---|---|---|
| T1 | [x] **URL de API hardcodeada y con puerto equivocado** → corregido: `app/admin/users/*` ya usa `constants/api.ts` | `app/admin/users/index.tsx`, `app/admin/users/[id].tsx` | **El panel de usuarios está 100% roto.** Debería usar `constants/api.ts` |
| T2 | [x] **Rutas sin registrar en el Stack raíz** → doble header | `app/_layout.tsx` | Header nativo encima del header propio |
| T3 | [x] **IDs mock vs IDs reales** — el lector de artículos ya pide `GET /api/content/:id` con el ObjectId real (los slugs mock siguen funcionando como fallback) | `features/articles/articleApi.ts`, `features/articles/articleSlides.ts`, `app/articles/[id].tsx` | Cualquier navegación a artículos cae en "no encontrado" |
| T4 | [x] **Componentes y mocks muertos** — borrados `components/ui/{SectionHeader,StitchButton,StitchChip,StitchSearchBar}`, `features/content/components/*` (6), `features/content/data/*.mock.ts`, `features/articles/{article,catalog}.mock.ts` y los componentes de la plantilla de Expo sin usar (`modal.tsx`, `themed-*`, `haptic-tab`, `hello-wave`, `parallax-scroll-view`, `external-link`) | — | ~25 archivos menos |
| T5 | [x] **Guardados solo en el dispositivo** → ahora van al backend (`GET/POST /api/user/saved`) con la caché local como respaldo | `features/content/savedApi.ts` | Se sincronizan entre móvil y web |
| T6 | [x] **Endpoints del backend sin usar en el front** → `GET /api/admin/challenges` lo consume la pantalla "Retos completados" | `app/admin/challenges/index.tsx` | La visibilidad de retos completados no existe en la UI |

---

## 1. Inicio — `app/(tabs)/index.tsx` [x]

- [x] "Comenzar" y el hero navegan a `/content/[id]` (con 5 fallbacks de contenido)
- [x] "Continuar" consume `inProgressList` (antes siempre vacío por `Array.isArray` sobre un objeto)
- [x] Progreso real del video: `onProgress` → `PATCH /activity/in-progress` → `seekTo` al reabrir
- [x] Autocompletado al 95% + barra "Retomaste en 2:30"
- [x] "Recomendado para ti" sale del backend (`featured=true`), no hardcodeado
- [x] Avatar → `/profile/edit`; campana → aviso; "Ver todo" → `/saved`
- [x] Backend: `inProgressList` con título/miniatura/duración/%; `GET /activity/routine/:id/in-progress`; `Content.duration`
- [x] **1.1 Rotación de "Acción del día"**: el hero rota entre las rutinas **no completadas** (ids que llegan en `completedIds`) y cambia cada día
- [x] **1.2 Sin duplicados**: "Recomendado para ti" filtra el contenido del hero
- [x] **1.3 "Meta diaria" con datos reales**: `today.completed` / 3 acciones (antes: fórmula inventada `(art+rut+retos) × 2`)
- [x] **1.4 Duración unificada**: el modelo guarda minutos y la UI los muestra en minutos (`formatDuration` de la UI de Descubrir recibe segundos)

---

## 2. Descubrir — `features/content/screens/DiscoverScreen.tsx` [x]

- [x] Chips "Rutina"/"Reto" filtran por `category` (antes `type` → 0 resultados)
- [x] Los destacados ya no se repiten en la lista inferior
- [x] Componente `Thumb` con `onError` → fallback por categoría (antes 2 `<Image>` superpuestos)
- [x] Badge de duración real (mapea `durationSec = duration × 60`)
- [x] "Ver guardados" → `/saved`; campana → aviso
- [x] "Recomendado para ti" → "Todos los contenidos"
- [x] Búsqueda por título + descripción + categoría
- [x] **2.1 Filtro por categoría** (segundo eje: Ambiental / Actividad física / Rutina / Retos) junto al de tipo (Video / Artículo)
- [x] **2.2 Ordenar**: Recientes / Más vistos / Más largos (`?sort=recent|views|duration` en el backend)
- [x] **2.3 Paginación / scroll infinito** (`GET /content/paginated` → `{items,page,total,hasMore}`)
- [x] **2.4 Pull-to-refresh** (`RefreshControl`)
- [x] **2.5 Skeletons** de carga
- [x] **2.6 Carrusel con snap real** (`snapToInterval={334}`)
- [x] **2.7 Carrusel vacío** (no se pinta si no hay destacados)
- [x] **2.8 Badge con datos reales** (Destacado / Nuevo / Popular)
- [x] **2.9 Búsqueda con debounce** (350 ms)
- [x] **2.10 Vistas sin inflar**: el backend cuenta **una vista por usuario y día** y el front manda el token
- [x] **2.11 Miniatura propia** para "Tu transformación también es ambiental" (el seed ya trae thumbnail)
- [x] **2.12 IDs de YouTube reales** en el seed (verificados con oEmbed)

---

## 3. Retos — `app/(tabs)/game.tsx` [x]

- [x] Los 3 retos son funcionales (GPS para "Camina 1 km", self-report para los otros 2)
- [x] Backend valida `distanceKm ≥ 0.8` y guarda la evidencia
- [x] `GET /api/admin/challenges` para el admin
- [x] **3.1** La app **envía el evento `challenge_completed`** con `refType: "challenge"` y la evidencia (`distanceKm`, `steps`, `source`)
- [x] **3.2** `expo-location` con permiso explícito en `app.json` (iOS `NSLocationWhenInUseUsageDescription` + Android `ACCESS_FINE_LOCATION`)
- [x] **3.3** Fallback sin GPS: modal "Registrar a mano" (queda marcado como `source: "manual"`)
- [x] **3.4** La distancia se **valida en el servidor**: el cliente manda el rastro GPS y el backend recalcula la distancia, descarta saltos imposibles y rechaza la distancia inflada

> Validación del rastro probada: camino real (1 km) ✅, distancia inflada ❌, salto de 1 km en 5 s ❌, sin rastro ❌.

---

## 4. Logros — `app/(tabs)/achievements.tsx` [x]

- [x] **4.1** Botón "Compartir" (nativo / Web Share API / portapapeles)
- [x] **4.2** Refresca al volver a la pestaña (`useFocusEffect`)
- [x] **4.3** Usa los datos del backend: `challenges.completedCount`, `challenges.recent` (lista "Últimos retos") y `medals[].earnedAt` ("Obtenida el …")
- [x] **4.4** Progreso con denominador real (medallas obtenidas / total del catálogo, sin el `/50` inventado)
- [x] **4.5** Tipos de iconos válidos (`workspace-premium`, `military-tech`)

---

## 5. ORQ — `app/(tabs)/orq.tsx` + `backend/src/routes/orq.routes.js` [x]

### Estado actual (verificado contra el backend en marcha)

El **cerebro de ORQ funciona bien** y hay que respetarlo:

- [x] Se niega a responder temas ajenos a la app
- [x] Conoce el catálogo y sugiere contenido real
- [x] Es breve y amable
- [x] (Backend ya arreglado antes: `llama-3.3-70b-versatile` → `openai/gpt-oss-120b` + fallback en cascada a 3 modelos)

> ⚠️ **RESTRICCIÓN QUE NO SE TOCA:** el system prompt de `backend/src/routes/orq.routes.js:13-22`
> ("Eres ORQ, el asistente de la aplicación... No inventes artículos, funciones ni datos")
> se queda **igual**. ORQ sigue siendo el guía de la app, no un asistente general.

### Lo que está roto

| # | Problema | Detalle |
|---|---|---|
| 5.1 | [x] ORQ nombra contenidos pero no puedes tocarlos → devuelve `sources` y el front pinta tarjetas pulsables | `backend/src/utils/orqSources.js` |
| 5.2 | [x] Los chips de sugerencia envían el mensaje | `app/(tabs)/orq.tsx` |
| 5.3 | [x] Los errores del backend se muestran como error con botón "Reintentar" | `app/(tabs)/orq.tsx` |
| 5.4 | [x] La conversación se persiste (AsyncStorage / localStorage, separada por usuario) | `lib/orqStorage.ts` |
| 5.5 | [x] ORQ sabe del usuario (racha, completados, lo que dejaste a medias) | `backend/src/routes/orq.routes.js` |
| 5.6 | [x] El icono "auto-awesome" es el botón "limpiar conversación" | `app/(tabs)/orq.tsx` |
| 5.7 | [x] "Rutina de 5 minutos" sin descripción en la BD → `npm run backfill` (backend) rellena las descripciones vacías del catálogo; los que falten se editan en el panel admin | `backend/src/scripts/backfillDescriptions.js` |
| 5.8 | [x] El backend cruza la respuesta contra el catálogo y devuelve `sources` | `backend/src/routes/orq.routes.js` |
| 5.9 | [x] Distingue el estado "sin sesión" | `app/(tabs)/orq.tsx` |

---

## 6. Perfil — `app/(tabs)/profile.tsx` [x]

- [x] **6.1** Los admins **sí** ven "Mi actividad": el panel de admin acompaña la fila, ya no la reemplaza
- [x] **6.2** "Contenido guardado" cruza los IDs guardados contra `GET /api/content` (contenido real)
- [x] **6.3** El toggle de notificaciones **se persiste** en el backend (`User.preferences.notifications`)
- [x] **6.4** `requireAuth` ya no está vacío (abre el modal de login / lleva a la pantalla de login)

### 6.1 Mi actividad — `app/profile/activity.tsx` [x]

- [x] **6.1.1** Spinner eterno sin sesión → la lista se vacía y se sale
- [x] **6.1.2** Navegación a artículos con ObjectId reales
- [x] **6.1.3** Eventos `quiz` abren el artículo del quiz
- [x] **6.1.4** Usa `inProgressList` (nueva sección "Continuar donde quedaste" con miniatura y %)
- [x] **6.1.5** Usa `event.meta` (`distanceKm`, `steps`, `score`) y fecha legible (Hoy/Ayer/fecha)
- [x] **6.1.6** Refresca al enfocar (`useFocusEffect`)

### 6.2 Editar perfil — `app/profile/edit.tsx` [x]

- [x] **6.2.1** El avatar **se guarda en el backend** (`User.avatar`, data URL base64) y se ve en móvil y web
- [x] **6.2.2** Borrar el nombre ahora avisa "El nombre no puede estar vacío"
- [x] **6.2.3** `mediaTypes: ["images"]` (API nueva de expo-image-picker 17)
- [x] **6.2.4** El efecto de carga usa flag `alive`

### 6.3 Ajustes — `app/settings/*` [x]

- [x] **6.3.1** `settings/index.tsx` (stub huérfano) **eliminado** y quitado del Stack
- [x] **6.3.2** (se fue con el stub) tema oscuro
- [x] **6.3.3** `privacy.tsx`: tras eliminar la cuenta **avisa y vuelve al inicio**
- [x] **6.3.4** `privacy.tsx`: `savingPassword` y `deleting` por separado
- [x] **6.3.5** `help.tsx`: el diagnóstico usa `constants/api.ts` (ya no "n/a")
- [x] **6.3.6** `help.tsx`: guardas muertas eliminadas; email/Whatsapp configurables por env
- [x] **6.3.7** `help.tsx`: **ya no manda el JWT** (solo "Session: activa")
- [x] **6.3.8** `help.tsx`: la FAQ explica que la foto se guarda en el servidor

---

## 7. Admin — `app/admin/*` [x]

- [x] **7.1** URL de API corregida
- [x] **7.2** `GET /api/admin/users/:id` (con actividad)
- [x] **7.3** `PATCH /api/admin/users/:id` (rol + bloqueo) con salvaguardas
- [x] **7.4** `GET /api/admin/challenges` → pantalla `app/admin/challenges`
- [x] **7.5** Panel de usuario con racha, completados, medallas, retos y últimos eventos
- [x] **7.6** `status: "archived"` se conserva y se puede archivar/desarchivar
- [x] **7.7** `admin/_layout.tsx` espera `isLoading` y no filtra la UI de admin
- [x] **7.8** Buscador + chips de categoría en `admin/content`
- [x] **7.9** `duration` e `isNew` en la tarjeta (+ badge "Archivado")
- [x] **7.10** `admin/users`: buscador con debounce (350 ms)
- [x] **7.11** `COLORS` unificado con `constants/theme.ts`
- [x] **7.12** Título "Usuarios" / "Detalle de usuario"

> **Reglas de seguridad del bloqueo/rol** (backend): un admin no puede cambiar su
> propio rol ni bloquear su propia cuenta, y no se puede quitar el rol ni bloquear
> al único administrador. El bloqueo corta el login (403) y cualquier llamada a la
> API con un token viejo (403).

---

## 8. Lectores — `app/content/[id].tsx` y `app/articles/[id].tsx` [x]

- [x] **8.1** `articles/[id].tsx` carga `GET /api/content/:id` y convierte el `body` en slides
- [x] **8.2** Eventos con IDs reales
- [x] **8.3** `article_started` solo una vez por artículo
- [x] **8.4** `slideIndex={activeIndex}` (índice real)
- [x] **8.5** El score del quiz se envía con `quiz_submitted`
- [x] **8.6** El badge "Artículo leído" se ve (no se sale de la pantalla)
- [x] **8.7** Hay que pasar por todas las slides; el CTA dice "Finalizar artículo"
- [x] **8.8** El título aparece en la cabecera del lector
- [x] **8.9** `content/[id].tsx` redirige los artículos al lector de slides
- [x] **8.10** Las vistas no se inflan (una por usuario y día)

---

## 9. Sistema de artículos por slides — `features/articles/` [x]

- [x] **El `body` del `Content` se convierte en slides** (`articleSlides.ts`)
- [x] **Los artículos del backend ya tienen quiz**: `Content.quiz` (pregunta, opciones, respuesta, explicación) → slide "Mini Quiz" automático
- [x] Componentes del lector: `ArticleSlideShell`, `SlideRenderer`, slides `Hook/Concept/Example/Action/Quiz`
- [x] Los mocks siguen vivos como fallback para los slugs de demostración (`features/articles/data/*`)

---

## Decisiones tomadas

| # | Decisión | Dónde |
|---|---|---|
| D1 | [x] **ORQ: las 3 fases** | Apartado 5 |
| D2 | [x] **Slides: conectados a la API** | Apartado 9 |
| D3 | [x] **Guardados: al backend** (`User.saved` + `GET/POST /api/user/saved`), con la caché local como respaldo si no hay red | T5 |
| D4 | [x] **Bloquear usuario y cambiar rol** (`PATCH /api/admin/users/:id`) con salvaguardas | 7.3 |
| D5 | [x] **Avatar: campo `User.avatar`** (data URL base64, máx. ~256 KB) | 6.2.1 |

---

## Orden sugerido de avance

1. [x] **Bloque 0** — T1, T2, Logros, título admin
2. [x] **Bloque 1** — T3 (IDs reales)
3. [x] **Bloque 2** — ORQ completo
4. [x] **Bloque 3** — Panel admin
5. [x] **Bloque 4** — Perfil → Mi actividad (`inProgressList` + `meta`) y admins con "Mi actividad"
6. [x] **Bloque 5** — Descubrir: filtro por categoría, orden, paginación, refresh, skeletons
7. [x] **Bloque 6** — Retos: permiso iOS, fallback sin GPS, validación de distancia en el servidor
8. [x] **Bloque 7** — Avatar y guardados al backend (D5 + D3), varios pendientes por tipo (1.5), vistas sin inflar
9. [x] **Bloque 8** — Limpieza (T4) y datos (quiz en artículos, thumbnails, IDs de YouTube reales)
10. **Siguiente** — Desplegar backend en Render, regenerar el APK y correr `npm run backfill` (datos en la BD)
