# Cómo sacar el APK

El error más común con EAS en este proyecto es que `npm install` falla por conflictos de dependencias (peer deps).
Ya está resuelto con `frontend/.npmrc` (`legacy-peer-deps=true`). Además el perfil `production` genera **.aab** (no instalable);
usa el perfil **apk**.

## Opción A — EAS (nube de Expo)
El `projectId` de la cuenta del jefe ya fue quitado de `app.json`; EAS te ofrecerá crear el proyecto en TU cuenta (responde **Y**).

```powershell
cd frontend
npm install --legacy-peer-deps
npx eas-cli login
npx eas-cli build -p android --profile apk
```
Si falla, abre el build en expo.dev → pestaña **Logs** → fase "Install dependencies" o "Run gradlew" y copia el error.

## Opción B — GitHub Actions (gratis, sin tu PC)
1. Sube la carpeta `planta-rediseno` a un repositorio de GitHub (la carpeta `.github` debe quedar en la raíz del repo).
2. Pestaña **Actions → Build APK → Run workflow**.
3. Al terminar (10–20 min) descarga el artefacto **planta-apk** (.apk) e instálalo en el celular.
El APK sale en modo demo (`EXPO_PUBLIC_DEMO=1`). Para usar tu backend, quita esa variable del workflow y define `EXPO_PUBLIC_API_URL`.

## Opción C — Local con Android Studio
`cd frontend && npm install --legacy-peer-deps && npx expo prebuild -p android && cd android && gradlew assembleRelease`
(requiere JDK 17 y Android SDK). El APK queda en `android/app/build/outputs/apk/release/`.
