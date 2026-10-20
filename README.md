# Cuaderno de Masas

App web personal (PWA) para apuntar horneados de pan y pizza: receta en porcentaje de panadero con prefermentos, proceso, fotos, valoración, calculadora de masa y estadísticas.

Funciona gratis y sin tarjeta: **GitHub Pages** para la web y **Firebase plan Spark** (Authentication + Firestore) para los datos. No usa Cloud Storage: las fotos se comprimen en el navegador y se guardan en Firestore.

## Desarrollo local

Requisitos: Node 22 o superior.

```bash
npm install
cp .env.example .env.local   # y rellénalo con la configuración web de Firebase (paso 4)
npm run dev                  # http://localhost:5173/CuadernoDePanadero/
```

Otros comandos:

| Comando           | Qué hace                               |
| ----------------- | -------------------------------------- |
| `npm test`        | Tests de la lógica de cálculo (Vitest) |
| `npm run lint`    | ESLint                                 |
| `npm run format`  | Prettier                               |
| `npm run build`   | Compilación de producción en `dist/`   |
| `npm run preview` | Sirve `dist/` en local                 |

Para probar en local tienes que añadir `localhost` a los dominios autorizados de Firebase (viene añadido por defecto).

## Puesta en marcha (pasos manuales)

Se hacen una sola vez. Necesitas una cuenta de Google y una de GitHub.

### 1. Crear el proyecto de Firebase (plan Spark)

1. Entra en <https://console.firebase.google.com> y pulsa **Crear un proyecto**.
2. Ponle un nombre (por ejemplo `cuaderno-de-masas`). Google Analytics no hace falta: puedes desactivarlo.
3. El proyecto se crea en el plan **Spark** (gratuito). No añadas ninguna forma de pago: así es imposible que te cobren nada.

### 2. Activar el inicio de sesión con Google

1. En el menú lateral: **Compilación → Authentication → Comenzar**.
2. Pestaña **Método de inicio de sesión** → **Google** → **Habilitar**.
3. Elige tu correo como correo de asistencia y pulsa **Guardar**.

### 3. Crear la base de datos Firestore en Europa

1. **Compilación → Firestore Database → Crear base de datos**.
2. Edición **Standard**. Ubicación: una región europea, por ejemplo **`europe-southwest1` (Madrid)**. La región no se puede cambiar después.
3. Empieza en **modo de producción** (todo cerrado). Las reglas buenas se ponen en el paso 8.

### 4. Registrar la app web y copiar la configuración

1. **Configuración del proyecto** (rueda dentada) → **General** → **Tus apps** → icono **`</>`** (Web).
2. Ponle un apodo (por ejemplo `web`). **No** marques Firebase Hosting.
3. Copia los valores del objeto `firebaseConfig`. Corresponden a estas variables:

   | `firebaseConfig`    | Variable                            |
   | ------------------- | ----------------------------------- |
   | `apiKey`            | `VITE_FIREBASE_API_KEY`             |
   | `authDomain`        | `VITE_FIREBASE_AUTH_DOMAIN`         |
   | `projectId`         | `VITE_FIREBASE_PROJECT_ID`          |
   | `storageBucket`     | `VITE_FIREBASE_STORAGE_BUCKET`      |
   | `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
   | `appId`             | `VITE_FIREBASE_APP_ID`              |

   Esta configuración no es secreta (acaba en el JavaScript público), pero se mantiene fuera del código. La seguridad la dan las reglas de Firestore.

4. Para desarrollo local, pégalos en `.env.local` (copia de `.env.example`).

### 5. Autorizar el dominio de GitHub Pages

**Authentication → Configuración → Dominios autorizados → Agregar dominio** y añade `<tu-usuario>.github.io` (sin `https://` ni ruta).

### 6. Crear el repositorio en GitHub y activar Pages

1. Crea un repositorio **público** en GitHub, por ejemplo `CuadernoDePanadero` (el nombre del repo forma parte de la URL).
2. Sube este código a la rama `main`:

   ```bash
   git remote add origin https://github.com/<tu-usuario>/CuadernoDePanadero.git
   git push -u origin main
   ```

3. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

La app quedará en `https://<tu-usuario>.github.io/<nombre-del-repo>/`. La ruta base sale sola del nombre del repo en el workflow (`BASE_PATH`); en local se usa `/CuadernoDePanadero/` (ver `vite.config.ts`).

### 7. Añadir las variables de Firebase al repositorio

**Settings → Secrets and variables → Actions → pestaña Variables → New repository variable**, una por cada `VITE_FIREBASE_*` del paso 4 (son _Variables_, no _Secrets_).

Después, en la pestaña **Actions**, relanza el workflow **Deploy to GitHub Pages** (o haz cualquier push a `main`). Cada push a `main` pasa el lint y los tests, compila y despliega.

### 8. Restringir el acceso a tu cuenta

Hasta este paso la app te mostrará «Esta cuenta no tiene acceso» después de entrar, porque las reglas aún no conocen tu cuenta.

1. Abre la app y **entra con Google** una vez.
2. Copia tu **UID**: aparece en la propia pantalla de «sin acceso» (botón _Copiar UID_) y también en **Authentication → Users**, columna _UID de usuario_.
3. En `firestore.rules`, sustituye `ALLOWED_UID` por tu UID.
4. Despliega las reglas con la CLI de Firebase:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # elige tu proyecto
   firebase deploy --only firestore:rules
   ```

   (También puedes pegarlas a mano en **Firestore Database → Reglas → Publicar**.)

5. Recarga la app. En el primer inicio de sesión se crean los presets de serie: Hogaza, Chapata con poolish, Napolitana con biga y Pizza en bandeja.

Con estas reglas nadie más puede leer, crear datos ni gastar tu cuota, aunque conozca la URL.

## Cuotas del plan Spark

1 GiB de almacenamiento, 50 000 lecturas/día y 20 000 escrituras/día. La app está pensada para quedarse muy lejos:

- Un único listener para la lista de horneados. Gracias a la caché offline, al volver a abrir la app solo se leen los documentos que han cambiado.
- El diario muestra la miniatura que va dentro de cada horneado (unos 15 KB). Las fotos solo se cargan al abrir la ficha.
- Presets y prefermentos se leen una vez por sesión.
- Cada foto pesa como máximo 900 KB (WebP, 1200 px de lado largo).

## Estructura

```
src/
  app/         App, rutas y layout (barra inferior en móvil, lateral en escritorio)
  pages/       Pantallas
  components/  Piezas de interfaz reutilizables
  domain/      Tipos y cálculo puro (porcentaje de panadero, levaduras), con tests
  data/        Firebase: auth, repositorios, exportar/importar
  hooks/       Estado compartido (auth, horneados, catálogo, borradores…)
  i18n/es.ts   Todos los textos de la interfaz
  styles/      Tokens del diseño y estilos base
```
