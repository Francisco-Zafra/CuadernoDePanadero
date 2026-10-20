
# Cuaderno de Masas — Plan de implementación

App web personal (PWA) para registrar horneados de pan y pizza: receta en porcentaje de panadero con prefermentos, proceso, fotos, valoración, calculadora de masa y estadísticas.

Todo debe funcionar **gratis y sin tarjeta**: GitHub Pages + Firebase plan Spark (Auth + Firestore). **No se usa Cloud Storage.**

---

## 0. Antes de empezar

1. **Diseño:** la interfaz ya está diseñada en Claude Design. Cuaderno de masas.
2. **Principio visual:** limpio y sobrio, **sin diseño de tarjetas por todas partes**. Contenido organizado con tipografía, espacio y líneas finas. No añadas bordes, sombras ni contenedores que no estén en el diseño.
3. **Idioma:** código, nombres, comentarios y commits en **inglés**. Toda la interfaz en **español**, con los textos centralizados en `src/i18n/es.ts`.
4. Trabaja por fases (sección 6). Al acabar cada fase: tests en verde, build correcto, commit y resumen breve a Fran.

---

## 1. Stack

| Pieza     | Elección                                                                            |
| --------- | ------------------------------------------------------------------------------------ |
| Framework | React + Vite + TypeScript (modo estricto)                                            |
| Rutas     | React Router con `HashRouter` (evita 404 al recargar en GitHub Pages)              |
| Backend   | Firebase JS SDK modular: Auth (Google) + Firestore                                   |
| Offline   | Firestore `persistentLocalCache` + `vite-plugin-pwa` (manifest + service worker) |
| Estilos   | CSS propio con variables (tokens del diseño). Sin frameworks de componentes         |
| Gráficas | Librería ligera (p. ej. Recharts o uPlot) o SVG propio si el diseño es simple      |
| Tests     | Vitest para la lógica de cálculo                                                   |
| Calidad   | ESLint + Prettier                                                                    |
| Deploy    | GitHub Actions → GitHub Pages                                                       |

Usa versiones estables actuales de cada dependencia.

---

## 2. Estructura del proyecto

```
src/
  app/            # App.tsx, router, layout (barra inferior móvil / lateral escritorio)
  pages/          # Login, Journal, BakeDetail, BakeEditor, Calculator, Stats, Settings, KitchenMode
  components/     # BakeRow, BakeGridItem, TypeChip, Rating, RecipeTable, ProcessTimeline,
                  # NumberField, PhotoUploader, SectionNav, Toast, Skeleton, ConfirmInline
  domain/         # types.ts, bakersMath.ts, yeast.ts, defaults.ts (+ *.test.ts)
  data/           # firebase.ts, auth.ts, bakesRepo.ts, photosRepo.ts, prefermentsRepo.ts,
                  # presetsRepo.ts, exportImport.ts
  hooks/          # useAuth, useBakes, useBake, useDraft, useWakeLock, useOnlineStatus
  i18n/es.ts
  styles/         # tokens.css, base.css
firestore.rules
.github/workflows/deploy.yml
```

La lógica de cálculo va en `domain/`, en funciones puras sin dependencias de React ni de Firebase.

---

## 3. Modelo de datos (Firestore)

Todo cuelga del usuario: `users/{uid}/...`

### `bakes/{bakeId}`

```ts
type BakeType = 'bread' | 'pizza';
type PrefermentKind = 'none' | 'poolish' | 'biga' | 'sourdough' | 'custom';

interface Bake {
  id: string;
  name: string;
  type: BakeType;
  date: Timestamp;
  status: 'complete' | 'incomplete';   // modo rápido => incomplete
  recipe: Recipe;
  process: ProcessStep[];
  rating: number | null;               // 1–5
  notes: string;
  nextTime: string;                    // "Próxima vez"
  photoIds: string[];
  coverPhotoId: string | null;
  thumb: string | null;                // miniatura ~240px WebP en base64 (~10–20 KB) para listar sin cargar fotos
  sourceBakeId: string | null;         // si viene de "Repetir"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Recipe {
  pieces: number;                      // nº de piezas / bolas
  pieceWeight: number;                 // g por pieza  → peso total = pieces × pieceWeight
  flours: { name: string; pct: number }[];   // suma 100 %
  hydration: number;                   // % sobre harina TOTAL
  salt: number;                        // %
  yeast: { kind: 'fresh' | 'instant' | 'active_dry' | 'none'; pct: number };
  extras: { name: string; pct: number }[];   // aceite, azúcar, malta…
  preferment: Preferment;
}

interface Preferment {
  kind: PrefermentKind;
  customId?: string;                   // si kind === 'custom'
  name?: string;                       // nombre mostrado (custom)
  flourPct: number;                    // % de la harina total que va al prefermento
  hydration: number;                   // hidratación propia del prefermento
  yeastPct: number;                    // % sobre la harina DEL PREFERMENTO (0 en masa madre)
  hours: number | null;
  tempC: number | null;
}

interface ProcessStep {
  id: string;
  kind: 'preferment' | 'autolyse' | 'mix' | 'folds' | 'bulk' | 'cold' | 'shape' | 'proof' | 'bake' | 'other';
  label: string;
  durationMin: number | null;
  tempC: number | null;
  note: string;
}
```

### `photos/{photoId}`

```ts
interface Photo {
  id: string;
  bakeId: string;
  tag: 'crust' | 'crumb' | 'pizza' | 'other';
  data: Bytes;          // WebP comprimido, máx ~1200px lado largo, objetivo ≤ 400 KB, límite duro 900 KB
  width: number;
  height: number;
  createdAt: Timestamp;
}
```

Usa el tipo `Bytes` de Firestore, no base64 (ocupa un 33 % menos). Un documento admite como máximo 1 MiB.

### `preferments/{id}` (prefermentos personalizados)

`{ id, name, flourPct, hydration, yeastPct, hours, tempC }`

### `presets/{id}` (recetas base de la calculadora)

`{ id, name, type, recipe: Recipe }`. En el primer inicio de sesión, crea los presets por defecto de `domain/defaults.ts`: Hogaza, Chapata con poolish, Napolitana con biga y Pizza en bandeja.

### Prefermentos por defecto (editables)

| Tipo       | flourPct | hydration | yeastPct | hours / tempC |
| ---------- | -------- | --------- | -------- | ------------- |
| Poolish    | 30       | 100       | 0,1      | 14 h / 20 °C |
| Biga       | 50       | 50        | 1        | 18 h / 18 °C |
| Masa madre | 20       | 100       | 0        | 5 h / 24 °C  |

---

## 4. Lógica de cálculo (`domain/bakersMath.ts`)

Todos los porcentajes son de panadero sobre la **harina total** (prefermento + masa final).

```
W  = pieces × pieceWeight                         // peso total de masa
F  = W / (1 + (hydration + salt + yeastFinal% + Σextras + prefYeastOverTotal%) / 100)
```

Calcula `F` de forma que la suma de todos los ingredientes dé exactamente `W`.

**Prefermento**

```
Fp = F × flourPct / 100                           // harina del prefermento
Wp = Fp × pref.hydration / 100                    // agua del prefermento
Yp = Fp × pref.yeastPct / 100                     // levadura del prefermento
```

**Masa final**

```
flour_final = F − Fp        (repartida según la mezcla de harinas)
water_final = F × hydration/100 − Wp
salt        = F × salt/100
yeast_final = F × yeast.pct/100
extras      = F × pct/100
+ todo el prefermento
```

Reglas:

- Si `water_final < 0`, devuelve un **aviso** (el prefermento aporta más agua que la hidratación total) y muéstralo en la interfaz. No lo corrijas en silencio.
- Con `kind === 'none'`, la receta es un solo bloque.
- Redondeo de visualización: gramos a 1 g, salvo la levadura y las cantidades < 10 g, que van a 0,1 g. Calcula siempre sin redondear.
- La función devuelve `{ totalFlour, preferment: Line[] | null, final: Line[], totals, warnings }`.

**Conversión de levadura (`domain/yeast.ts`)**, tomando como referencia la fresca: `instant = fresh / 3`, `active_dry = fresh × 0.4`. La masa madre no se convierte.

**Tests obligatorios (Vitest):** suma igual a W, receta sin prefermento, poolish, biga, masa madre, personalizado, aviso de agua negativa, mezcla de varias harinas, conversión de levaduras y redondeos.

---

## 5. Seguridad, Auth y despliegue

### `firestore.rules`

Solo puede acceder Fran. Restringe por UID (`ALLOWED_UID`, que Fran te dará tras su primer inicio de sesión) para que nadie más pueda crear datos ni gastar la cuota:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid
                         && uid == 'ALLOWED_UID';
    }
  }
}
```

Si el UID aún no está configurado, la app muestra tras el inicio de sesión "Esta cuenta no tiene acceso" en lugar de fallar.

### Configuración

- Configuración web de Firebase en variables `VITE_FIREBASE_*` (`.env.local` en local y *Variables* del repo en GitHub). No es secreta, pero mantenla fuera del código.
- `vite.config.ts`: `base: '/<nombre-repo>/'`.
- `.github/workflows/deploy.yml`: build en cada push a `main` y despliegue con `actions/deploy-pages`.
- Inicio de sesión con Google mediante `signInWithPopup`, y `signInWithRedirect` como alternativa si el popup falla en el móvil o en la PWA instalada.

### Pasos manuales para Fran (escríbelos en el README con detalle)

1. Crear un proyecto en Firebase (plan Spark, sin facturación).
2. Activar Authentication → Google.
3. Crear Firestore en una región europea (p. ej. `europe-southwest1`, Madrid).
4. Registrar una app web y copiar la configuración.
5. Authentication → Dominios autorizados: añadir `<usuario>.github.io`.
6. Crear el repo público en GitHub y elegir Settings → Pages → Source: GitHub Actions.
7. Añadir las variables `VITE_FIREBASE_*` al repo.
8. Iniciar sesión una vez, copiar el UID (Auth → Users), ponerlo en las reglas y desplegarlas con `firebase deploy --only firestore:rules`.

---

## 6. Fases

### Fase 1: Base

- Proyecto con Vite + React + TS, ESLint, Prettier y Vitest.
- Tokens y tipografías del diseño, tema claro/oscuro/automático.
- Layout: barra inferior en móvil y lateral en escritorio, con botón principal "Nuevo horneado".
- Login con Google, rutas protegidas y pantalla de "sin acceso".
- Firestore con caché offline e indicador de "Sin conexión".
- CRUD mínimo de horneados (nombre, tipo, fecha, notas, puntuación).
- Diario: lista con filtro Todo/Pan/Pizza, búsqueda, orden por fecha y puntuación, estado vacío y siluetas de carga.
- Deploy funcionando en GitHub Pages y README con los pasos manuales.

**Hecho cuando:** Fran entra desde el móvil, crea un horneado y lo ve en el ordenador.

### Fase 2: Receta, prefermentos y calculadora

- `domain/bakersMath.ts` y `yeast.ts` con todos los tests.
- Editor por pasos (Básico, Receta, Proceso, Fotos, Resultado) con indicador de progreso.
- Receta: varias harinas, hidratación, sal, levadura, extras, piezas × peso, y cambio entre ver % y g.
- Selector de prefermento: Ninguno / Poolish / Biga / Masa madre / Personalizado, con valores por defecto editables. Los personalizados se guardan en `preferments`.
- Proceso: fases que se añaden, quitan y reordenan. Si hay prefermento, la primera fase es la suya.
- Modo rápido (nombre, tipo, foto, nota → `incomplete`) y etiqueta "Incompleta" en el diario.
- Borrador guardado automáticamente en `localStorage` mientras se edita.
- Ficha de horneado: una sola página con scroll y barra de secciones fija (Receta · Proceso · Fotos · Notas) que marca la sección actual. Receta en dos bloques, Prefermento y Masa final. Acciones Repetir, Editar y Eliminar, con confirmación dentro de la página.
- "Repetir": duplica el horneado con fecha de hoy, sin fotos ni valoración, y guarda `sourceBakeId`.
- Calculadora: presets, tipo de prefermento, controles y resultado en dos bloques. Botón "Guardar como horneado".

### Fase 3: Fotos

- Subida de varias fotos con etiqueta (corteza, miga, pizza, otra).
- Compresión en el navegador con `createImageBitmap` + canvas → WebP, 1200 px de lado largo. Si pasa de 900 KB, reduce la calidad o el tamaño hasta que quepa. Respeta la orientación EXIF.
- Genera la miniatura `thumb` para el diario y permite elegir la foto de portada.
- Carga diferida: el diario usa solo `thumb` y la ficha carga las fotos al abrirse.
- Al borrar un horneado, borra también sus fotos (en un batch).

### Fase 4: Estadísticas, modo cocina, PWA y exportación

- Estadísticas: resumen, evolución de la puntuación, puntuación por hidratación y por prefermento, y horneados por mes. Colores de las gráficas tomados de los tokens.
- Modo cocina: vista con los gramos y las fases en letra grande, y la pantalla encendida con la Wake Lock API (si falla, se ignora).
- PWA: manifest, iconos, service worker e instalable en el móvil.
- Ajustes: presets, prefermentos personalizados, tema, exportar/importar JSON (con opción de incluir fotos) y cerrar sesión.
- Repaso de accesibilidad: contraste, foco visible, `prefers-reduced-motion`, teclado numérico (`inputMode="decimal"`) en los campos y botones +/- en los valores clave.

---

## 7. Criterios generales

- Primero móvil. Nada debe desbordar horizontalmente a 360 px.
- Números con `font-variant-numeric: tabular-nums`.
- Coma decimal en la interfaz (formato `es-ES`), aceptando tanto coma como punto al escribir.
- Sin emojis como iconos.
- Errores en español, claros y con la forma de solucionarlos.
- Cuotas del plan Spark (1 GiB, 50 000 lecturas/día y 20 000 escrituras/día): evita listeners innecesarios y no cargues fotos en listas.
- No añadas funciones que no estén en este plan o en el diseño sin consultarlo con Fran.
