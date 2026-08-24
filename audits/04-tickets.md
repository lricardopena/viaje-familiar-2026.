# T3.4 — Tickets accionables

**Skill:** `agentic-skills/skills/plan-to-tickets` · No se abrieron issues en GitHub (fuera de alcance salvo petición explícita).

---

### TICKET-1 (H1, P1) — ✅ RESUELTO — Commitear `package-lock.json` y fijar versión de Playwright

**Contexto:** `package.json:15` fija `"playwright": "^1.56.1"` sin `package-lock.json` en git. Un `npm install` fresco resuelve una versión distinta a la que el entorno de test espera, y el único test suite del repo no corre.

**Archivos a tocar:** `package.json` (opcional: fijar `"1.56.1"` sin `^`), `package-lock.json` (nuevo, commitear).

**Criterio de aceptación:** `rm -rf node_modules && npm install && npm test` pasa completo en un checkout limpio.

**Cómo verificar:** clonar el repo en un directorio nuevo, correr la secuencia de arriba, confirmar 0 fallos.

---

### TICKET-2 (H2, P1) — ✅ RESUELTO — Test de regresión contra Story Land y LEGOLAND reales

**Contexto:** `specs/architecture/operations/testing-and-validation.md.asc` exige validar Playwright contra ambos parques reales, no sólo el fixture sintético. Hoy no existe.

**Archivos a tocar:** `tests/theme-park/` (nuevo archivo o extensión del spec existente).

**Criterio de aceptación:** cargar `storyland.html` y `legoland.html` reales (no el fixture), verificar `candidateList()` no vacío y cero errores de consola para cada uno, como mínimo. Idealmente también verificar que `quickServices`/`poiFilterGroups` de LEGOLAND y `reactionSystem` de Story Land siguen presentes tras la carga.

**Cómo verificar:** `npm test` incluye y pasa los nuevos casos; romper deliberadamente un campo de `parks/legoland-new-york.js` hace fallar el test nuevo (prueba de que realmente detecta regresión).

---

### TICKET-3 (H3, P2) — ✅ RESUELTO — Test smoke para el itinerario (`index.html`+`data.js`)

**Contexto:** cero cobertura de test para la parte de la app que se usa todos los días del viaje. Las funciones de pattern-matching en español (`wicon`, `clothes`, `actIcon`, etc.) fallan silenciosamente ante vocabulario no anticipado.

**Archivos a tocar:** `tests/` (nuevo archivo, ej. `tests/itinerary/index-smoke.spec.js`).

**Criterio de aceptación:** cargar `index.html` real con el `data.js` real, verificar que se renderizan tantas secciones `<section class="day">` como entradas tiene `TRIP_DATA.days`, y cero errores de consola.

**Cómo verificar:** el test pasa hoy; añadir deliberadamente un día con datos malformados a una copia de prueba de `data.js` hace fallar el test.

---

### TICKET-4 (H5, P2) — Extraer el bloque de geolocalización de `theme-park-core.js`

**Contexto:** `theme-park-core.js` (2518 líneas) no tiene separación interna en módulos. El bloque de geolocalización/distancia (`haversineMeters` .. `geoKnownPoints`, ~líneas 105–189) es el más autocontenido y de menor riesgo para extraer primero.

**Archivos a tocar:** nuevo `assets/theme-park-geo.js` (o similar), `assets/theme-park-core.js` (remover el bloque), `storyland.html`/`legoland.html` (añadir el nuevo `<script src>` antes del core).

**Criterio de aceptación:** `npm test` sigue pasando (una vez resuelto TICKET-1) sin ningún otro cambio de comportamiento.

**Cómo verificar:** diff de comportamiento nulo — cargar ambos parques reales antes/después y comparar recomendaciones/distancias mostradas.

---

### TICKET-5 (H6, P2) — Pase de accesibilidad con herramienta dedicada

**Contexto:** densidad baja de `aria-*` en `theme-park-core.js` relativa al volumen de UI dinámica. No verificado con herramienta real en esta auditoría.

**Archivos a tocar:** por determinar tras el pase (probablemente `assets/theme-park-core.js`, generación de HTML de tabs/checklist).

**Criterio de aceptación:** correr axe-core (o equivalente) sobre `storyland.html`/`legoland.html` con datos reales cargados, 0 violaciones de severidad "serious"/"critical".

**Cómo verificar:** el reporte de la herramienta, antes/después.

---

### TICKET-6 (fuera del reporte original, pedido explícitamente) — ✅ RESUELTO — Third Party Contract Test explícito

**Contexto:** el Third Party Contract Test (frontera core/parque genérico) ya estaba parcialmente cubierto por las secciones 1–11 del spec del Theme Park Companion, pero de forma implícita — sin verificación estática de ausencia de lógica específica de parque, sin cobertura explícita de `reactionSystem`/`shows` como degradación progresiva, y sin un negative contract test.

**Archivos tocados:** `tests/theme-park/theme-park-core.spec.js` (reorganizado y extendido, mismo archivo — sin nueva suite), `tests/theme-park/README.md`.

**Qué se agregó** (sin tocar el fixture existente `minimal-test-park.js`, reutilizado tal cual como el "tercer parque" sintético):
- Sección 0 (nueva): verificación estática — un escáner de comentarios propio (`stripJsComments()`) confirma que `assets/theme-park-core.js` nunca compara `PARK.id` contra un literal, nunca tiene `switch(PARK.id)`, y nunca escribe el id de ningún parque real/fixture en código real (solo en comentarios).
- Sección 1 (extendida): chequeo explícito de los 16 campos Required del contrato (`park-contract.md.asc`) + `candidateList()` no vacía.
- Sección 4 (extendida): degradación progresiva de `reactionSystem:null` (la "reactcard" nunca se muestra) y `shows:[]` (el banner "empieza pronto" nunca se dispara) — comportamiento observable, no solo `=== undefined`.
- Sección 9 (extendida): `map.poiFilterGroups` ausente → una categoría de filtro derivada por cada `type` distinto, sin agrupar nada.
- Sección 10 (relabeleada, sin cambios de lógica): documentado explícitamente como la prueba comportamental complementaria a la sección 0.
- Sección 12 (nueva): negative contract test — copia en memoria del fixture (servida vía `ctx.route()`, nunca escrita a disco) sin el campo Required `attractions`; prueba que el checker de contrato lo detecta y que el core no finge funcionar.

**Criterio de aceptación:** `npm test` pasa completo; la sección 0 falla si se introduce una rama `PARK.id===...` en el core.

**Verificado:** se insertó temporalmente `if(PARK.id==='story-land'){...}` en `assets/theme-park-core.js`, la sección 0 falló como se esperaba (2 checks), se restauró el archivo antes del commit (`git diff --stat assets/` limpio).

**Resultado final:** `npm test` → 74 (Companion, incluye ambas suites del archivo) + 5 (itinerario) = 79 checks, todos verdes.
