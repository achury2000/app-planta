# Planta de Transformación · Rediseño completo

Rediseño total de la app móvil (Expo / React Native) **manteniendo el backend y el contrato de la API intactos**.
Nuevo sistema de diseño, nueva experiencia, y una idea central nueva: **la PIT (Planta Individual de Transformación)**,
una hoja de vida viva que muestra tu estado real hoy.

> Antes → `docs/capturas/00-ANTES-original.png` · Después → `docs/capturas/01…09`

## Cómo abrirlo (VS Code)

```bash
cd frontend
npm install --legacy-peer-deps
npx expo start --web        # o: npx expo start  (y escanear con Expo Go / emulador)
```

**No necesita backend ni MongoDB para verla**: si el servidor no responde, la app cambia sola a **modo demo**
(servidor simulado en el dispositivo, mismo contrato que `/backend`). Cuentas demo en la pantalla de acceso:

| Cuenta | Para qué |
|---|---|
| `carlos@planta.com` / `demo123` | Racha de 6 días: al completar una acción hoy gana la medalla "Llama" (7 días) |
| `juan@planta.com` / `demo123` | Cuenta nueva (semilla) |
| `admin@planta.com` / `admin123` | Panel de administración |

Con backend real: `cp frontend/.env.example frontend/.env`, ajusta `EXPO_PUBLIC_API_URL` y levanta `backend/` o `docker compose up` como antes.
Forzar modo: `EXPO_PUBLIC_DEMO=1` (siempre demo) o `0` (nunca demo).

## Qué cambió y por qué

| Antes | Ahora |
|---|---|
| Fondo negro + verde genérico, imágenes remotas de Google/Unsplash | **"Bosque Nocturno"**: tipografía Fraunces + Manrope, aurora animada, tarjetas de cristal, fotos locales (assets de 29 MB → 1.9 MB) |
| Pantalla vacía sin backend | **Modo demo** completo (14 contenidos, usuarios, historial, ORQ) |
| Inicio con anillo de meta | **Planta viva** (orquídea holográfica, 6 etapas) que crece con tus acciones + semana, meta diaria y acción del día |
| 6 pestañas (Inicio, Descubrir, Retos, Logros, ORQ, Perfil) | 5 pestañas: **Hoy · Explorar · Retos · Mi PIT · Yo**; ORQ accesible desde Hoy y Perfil |
| Logros = lista de medallas | **Mi PIT**: vector de estado real, competencias, certificaciones (medallas), trayectoria |
| Artículos en slides genéricos | **Lector tipo historias** con progreso, plan de acción marcable, quiz con explicación y cierre con medallas |
| Retos: GPS + juego externo (WebView) | Retos con **GPS validado**, **respiración guiada 4-4-6**, **contador de agua** y hábito diario |
| ORQ: chat simple | ORQ con sugerencias, fuentes tocables, reintento y respuestas en demo |
| Admin de ~3.000 líneas | Panel único: resumen, usuarios (bloquear/rol), contenido (publicar/destacar/eliminar), retos |

### La PIT (inspirada en el video y el texto del cliente)
* **Vector de Estado Real**: 5 ejes — *Constancia* y *Territorio* se calculan de tu actividad real en la app;
  *Enfoque*, *Resiliencia* y *Calma* salen de un **check-in diario** de 4 toques (autorreporte, se rotula como tal).
* **Orquídea holográfica** que evoluciona: Semilla → Brote → Plántula → Planta joven → Frondosa → Árbol en flor.
* **Modo presentación** (`/presentar`): pantalla completa con reloj "en vivo" para mostrar la PIT "sobre la mesa".
* **Competencias, certificaciones y trayectoria** generadas automáticamente desde la actividad.

## Estructura
```
frontend/
  app/            pantallas (expo-router): (tabs)/{index,discover,retos,pit,profile}, content/[id], orq, auth, welcome, presentar, admin, saved, settings, profile-edit
  components/     ui.tsx (sistema base), Plant.tsx (planta viva), ContentCard, Celebration
  constants/      theme.ts (tokens), api.ts (fetch + modo demo), medals.ts
  context/        AuthContext (original), DataContext (catálogo, progreso, guardados, check-in)
  lib/            pit.ts (vector de estado), img.ts, demo/{server,content}.ts (servidor simulado)
backend/          SIN CAMBIOS (API, modelos, seed, Docker)
docs/capturas/    antes y después
```

## Contrato de API conservado
`/auth`, `/activity` (event, in-progress, me), `/achievements/summary`, `/content` (+paginated, admin/all), `/admin` (users, challenges), `/orq/chat`, `/user/saved`.
Mismos eventos (`article_completed`, `routine_completed`, `challenge_completed`, `quiz_submitted`…) y misma validación GPS en servidor.
En esta versión los **videos cuentan como `routine`** (igual que el backend original).

## Verificación realizada y límites (honestidad)
* Compila sin errores de TypeScript (`npx tsc --noEmit`) y exporta a web (`expo export -p web`).
* Probado en navegador (390×844, Playwright) con modo demo: onboarding, acceso, Hoy, Explorar, lector + quiz + medalla, Retos (caminata simulada validada), check-in, Mi PIT, ORQ, presentación y admin, sin errores de consola.
* **No** se probó en un celular/emulador real ni se generó APK; el GPS real solo se probó por simulación.
* El ORQ del modo demo responde con reglas sobre el catálogo; el ORQ real (IA) requiere el backend con `GROQ_API_KEY`.
* Los datos del check-in (enfoque/energía/estrés) viven en el dispositivo (no hay campo en el backend aún). Para persistirlos en servidor habría que agregar un endpoint.
* El admin ya no incluye el formulario largo de crear/editar contenido (sí publicar, destacar y eliminar).
* El juego externo "Oráculo-Juego" (WebView a un sitio de terceros) se retiró del flujo de Retos.
* La web de Lovable compartida no pudo abrirse desde mi entorno; la PIT se basó en el video y el texto.
