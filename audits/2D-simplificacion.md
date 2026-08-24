# T2.D — Claridad y simplificación

**Skill externa:** `coding-code-simplification` + `coding-codebase-design` · **Alcance:** `assets/theme-park-core.js`, `parks/*.js`, `index.html`.

**Restricción respetada:** `data.js` (una entrada por línea) e `index.html` (denso) son convención deliberada documentada en `CLAUDE.md` — no se reporta "reformatear" como hallazgo en ninguno de los dos.

## Hallazgo P2 — `assets/theme-park-core.js`: 2518 líneas, ~40+ funciones top-level, sin seams internos

Espejo del hallazgo de T2.C, visto desde el ángulo de "deep modules": el archivo mezcla, en el mismo scope, al menos estas responsabilidades distinguibles por prefijo de nombre de función:

| Responsabilidad | Funciones representativas | Rango aprox. |
|---|---|---|
| Geolocalización/distancia | `haversineMeters`, `gpsDistanceMeters`, `humanDistanceLabel`, `walkEstimateLabel`, `distanceSuffix`, `proximityLineHtml`, `geoKnownPoints` | 105–189 |
| Elegibilidad por niño | `eligibilityForChild`, `eligibilitySummary`, `eligibilityConfidenceNote`, `eligibilityFactHtml`, `allRegisteredChildrenIneligible`, `childEligibilityReason` | 198–336 |
| Mapa ilustrado (viewport, zoom, pan) | `createMapViewport`, `clampAxis`, `clamp`, `layout`, `apply`, `setView`, `setFull`, `setNear`, `setMarker`, `pulse`, `setMe`, `zoomBy`, `doubleTapZoom` | 428–606 |
| Mapa geográfico (Leaflet) / filtros | `renderMapViewers`, `mapToggleMode`, `ensureMapImage`, `onMapImageError`, `flushMapImagePending` | 606–674 |
| Estado / localStorage | bloque marcado explícitamente `/* Estado / localStorage */` en :1430 | 1430+ |
| Servicios del parque / POIs | `servicesHtml`, `poiTypeLabel`, `quickServicesHtml`, `defaultQuickServices` | ~2400–2440 |

**Propuesta (S/M/L, riesgo de regresión):**
- **S, bajo riesgo:** extraer sólo el bloque de geolocalización/distancia (`haversineMeters` .. `geoKnownPoints`, ~85 líneas autocontenidas, sin dependencias hacia atrás visibles) a un módulo separado cargado antes del core. Beneficio: probable candidato a testear en aislamiento sin levantar todo el motor.
- **M, riesgo medio:** separar el viewport del mapa ilustrado (`createMapViewport` y sus closures internas, ~180 líneas) — es la sección más autocontenida (usa closures propias `clampAxis`/`clamp`/`layout`/`apply` ya anidadas, señal de que el autor ya sintió la necesidad de un scope propio).
- **L, no recomendado sin una tercera instancia de parque:** una refactorización completa a módulos ES/IIFEs por responsabilidad. Alto riesgo de regresión en un archivo sin cobertura de test confiable hoy (ver T2.G) y el propio repo ya se plantea "esperar a la tercera instancia" antes de generalizar estructura — aplica igual de bien aquí.

**No se propone ni se aplica ningún cambio ahora** — esta es una auditoría read-only; el S de arriba es candidato natural para un ticket de seguimiento (ver `audits/04-tickets.md`).

## Hallazgo P3 — nombres de función genéricos de una letra en closures anidadas
`createMapViewport()` (`core.js:428`) usa parámetros/vars como `t`, `vp`, `sx`, `sy` en funciones de ≤3 líneas — aceptable dado el scope reducido y que son matemática de transformación 2D (convención común en ese dominio), pero `sx`/`sy` en `doubleTapZoom(sx,sy)` (:535) podría ser `screenX`/`screenY` sin costo real de línea. Cosmético, no se eleva a P2.

## Sin hallazgos en `parks/*.js`
Ambos archivos de datos son legibles para su propósito (listas de literales), consistentes en convención entre sí, y ya siguen el patrón de comentarios de procedencia que la spec de operaciones pide. No se propone ningún cambio.

## Sin hallazgos adicionales en `index.html`
Denso por convención documentada; no se auditó como candidato de simplificación por instrucción explícita del plan.
