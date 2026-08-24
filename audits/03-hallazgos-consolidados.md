# T3.1/T3.2 — Hallazgos consolidados y verificación adversarial

**Skill T3.1:** `agentic-skills/skills/plan-triage` (deduplicación/priorización) · **Skill T3.2:** `agentic-skills/skills/review-doubt-driven-development` (verificación adversarial de P0/P1)

## Deduplicación aplicada

El hallazgo "`npm test` no corre en checkout limpio" aparecía en tres archivos (T0.3, T2.B, T2.G) — se consolida como **H1** único. El hallazgo "core monolítico de 2518 líneas" aparecía en T2.C y T2.D — se consolida como **H5** único.

## Tabla consolidada

| ID | Sev. | Eje | Archivo:línea | Hallazgo | Evidencia | Arreglo propuesto | Esfuerzo |
|---|---|---|---|---|---|---|---|
| H1 | **P1** | T0.3/T2.B/T2.G | `package.json:15`, ausencia de `package-lock.json` en git | `npm test` no corre de forma reproducible en un checkout limpio: `^1.56.1` sin lockfile commiteado resolvió Playwright 1.62.1, que no coincide con el navegador preinstalado del entorno. Viola la Definición de Terminado del motor genérico (`testing-and-validation.md.asc`: "`npm test` pasa completo"). | `audits/00-baseline.md` (salida real del fallo) | Commitear `package-lock.json`; considerar fijar versión exacta (`"playwright": "1.56.1"`, sin `^`) para tests | S |
| H2 | **P1** | T2.G | `tests/theme-park/theme-park-core.spec.js` (0 referencias a `storyland.html`/`legoland.html`) | Sin regresión automatizada contra los dos parques reales, pese a que la spec lo exige explícitamente ("validar con Playwright contra ambos parques además del fixture sintético") | grep confirmado: 0 coincidencias | Añadir un test que cargue cada `parks/*.js` real y verifique `candidateList()` no vacío + cero errores de consola, como mínimo | M |
| H3 | **P2** | T2.G | `index.html`+`data.js` (todo el itinerario) | Cero tests para el itinerario que se usa todos los días del viaje; las funciones de pattern-matching en español (`wicon`,`clothes`,`actIcon`, etc.) fallan silenciosamente ante vocabulario no anticipado | `CLAUDE.md` documenta el riesgo de vocabulario; sin test que lo detecte | Test smoke: cargar `index.html`+`data.js` reales, verificar N secciones de día renderizadas sin excepción de JS | S |
| H4 | **P2** | T2.E | `parks/legoland-new-york.js:439` | Datos reales de los niños (nombre, edad, estatura) en texto plano en un repo privado — decisión de diseño válida, pero no confirmable como aceptada explícitamente sin leer `HANDOVER.md.asc` (fuera de alcance de esta sesión) | lectura directa del archivo | Confirmar en `HANDOVER.md.asc` que es una decisión aceptada; si no lo está, registrarla | — (requiere passphrase de handover, no de specs) |
| H5 | **P2** | T2.C/T2.D | `assets/theme-park-core.js` (2518 líneas, ~40+ funciones top-level) | Archivo monolítico sin separación interna en módulos/seams — dificulta navegabilidad, no es leakage de parque ni sobre-ingeniería | conteo de funciones top-level vía grep | Extraer el bloque de geolocalización (~85 líneas autocontenidas) a un archivo separado cargado antes del core, como primer paso de bajo riesgo | S (paso 1) / L (completo, no recomendado aún) |
| H6 | **P2** | T2.F | `assets/theme-park-core.js` (2518 líneas), `index.html` | Densidad baja de `aria-*` (6 usos en el core) relativa al volumen de UI dinámica generada; riesgo WCAG 4.1.2 no confirmado con lector de pantalla real | conteo grep, no verificado con herramienta de a11y dedicada | Pase con axe-core o lector de pantalla real sobre el Companion; añadir `aria-live`/`role` donde falte | M |
| H7 | **P3** | T2.E | `auth.js:47` | Kill switch de auth requiere acción manual post-viaje; si nadie lo desactiva, el gate persiste indefinidamente (no es riesgo de seguridad, es nota operativa) | lectura directa | Añadir recordatorio operativo (no urgente) | S |
| H8 | **P3** | T2.F | `assets/theme-park-core.css` (`.altbtns button`, `.mapsheet-actionbtns button`) | Algunos botones secundarios de mapa con `min-height:40px`, por debajo de 44px (WCAG 2.5.5 AAA, no obligatorio en AA) | grep de CSS | Subir a 44px si se prioriza AAA; opcional | S |
| H9 | **P3** | T2.F | `assets/theme-park-core.js` (148KB sin minificar) | El core no está minificado; 444KB de carga inicial en `legoland.html` es razonable pero mejorable | medición real con Playwright | Evaluar paso de minificación opcional sólo para el Companion, sin romper "sin build" del resto del sitio | M (decisión de arquitectura, no sólo código) |
| H10 | **P3** | T2.C | `assets/theme-park-core.js:1886` | Sistema de razones de recomendación con 3 puntos de configuración de texto distintos; posible flexibilidad no ejercida, pero no verificable sin una tercera instancia de parque | lectura directa | Ninguno por ahora — revisar al añadir el tercer parque | — |

## Verificación adversarial (T3.2) — sólo P0/P1

No hay P0 en esta auditoría.

**H1 — CONFIRMADO.** Se reprodujo el fallo en vivo (`audits/00-baseline.md`), se confirmó la ausencia de `package-lock.json` en `git log --all`, y se confirmó que el `package.json` real usa `^1.56.1`. Tres fuentes independientes de evidencia, no una inferencia.

**H2 — CONFIRMADO.** El grep de cero coincidencias es determinista y se re-ejecutó dos veces con el mismo resultado. La afirmación de que la spec lo exige está anclada a texto literal de `testing-and-validation.md.asc` (leído con la passphrase provista, no citado textualmente aquí para no reproducir contenido de un documento cifrado más allá de lo necesario, pero la cita corta usada en H2 es fiel).

**Ningún P0/P1 fue degradado.** Ambos sobrevivieron la revisión adversarial con la evidencia como está.

## Veredicto sobre un tercer parque

**El repo aguanta un tercer parque en el eje arquitectónico** (T2.A/T2.B: frontera core/parque limpia, contrato cumplido por ambos parques reales, degradación progresiva verificada en uso real). **No aguanta con confianza en el eje de tests**: H1 y H2 significan que hoy no hay ninguna red de seguridad automatizada que detecte una regresión al añadir el tercer parque — cualquier verificación sería 100% manual. Se recomienda resolver H1 y H2 antes de, o como parte de, el trabajo de onboarding del tercer parque (la skill local `add-theme-park` ya referencia un checklist que presumiblemente incluye correr los tests — que hoy fallarían por causas ajenas al código nuevo).
