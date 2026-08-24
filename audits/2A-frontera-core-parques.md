# T2.A — Frontera core-genérico vs. datos-por-parque

**Skill local del proyecto:** `.claude/skills/theme-park-architecture-audit` · **Alcance:** `assets/theme-park-core.js` (2518 líneas), `assets/theme-park-core.css`, `parks/story-land.js`, `parks/legoland-new-york.js`, `storyland.html`, `legoland.html`.

## Veredicto: ✅ el core se mantiene genérico

Búsqueda textual completa de `storyland|story-land|legoland|lego-land` y de IDs conocidos (`'sl'`, `'lny'`, `polar`, `roar`) en `assets/theme-park-core.js`: **28 coincidencias, las 28 dentro de comentarios** (docblocks explicando el contrato, ejemplos de uso de un campo opcional). Ninguna aparece en una rama `if`, en un `switch`, ni en un literal usado para lógica — ver `assets/theme-park-core.js:8,9,13,14,60,72,86,116,117,213,226,609,786,787,891,903,1024,1081,1358,1361,1367,1431,1433,1622,1886,2422`.

No existe ningún `PARK.id === '...'` ni equivalente en el código: `grep -n "PARK\.id" assets/theme-park-core.js` no devuelve resultados de comparación, sólo se lee `storageKey` (genérico) para namespacing de `localStorage`.

## Contrato `window.PARK` — cumplimiento verificado

Los 16 campos "Required en la práctica" según `specs/architecture/park-contract.md.asc` (`id, name, emoji, theme, copy, map, storageKey, attractions, pois, mustIds, calmIds, categories, childFavoriteIds, waterIds, priorityGroups, tips`) están presentes en **ambos** `parks/story-land.js:29` y `parks/legoland-new-york.js:266`.

Los campos opcionales se usan de forma asimétrica y consciente — evidencia de que la degradación progresiva documentada es real, no aspiracional:

| Campo opcional | Story Land | LEGOLAND New York |
|---|---|---|
| `family` | `null` (comentario explícito: "no usa el modelo de elegibilidad por niño" — `parks/story-land.js:89`) | objeto con 2 niños (`parks/legoland-new-york.js:439`) |
| `reactionSystem` | configurado (Polar→Roar, único caso que lo usa — `parks/story-land.js:67`) | `null` con comentario explícito de por qué (`parks/legoland-new-york.js:427`) |
| `map.poiFilterGroups` | no declarado | `{firstaid:'help',familycare:'help'}` (`parks/legoland-new-york.js:405`) |
| `quickServices` | no declarado (usa `defaultQuickServices()` automático) | declarado, para preservar 4 accesos históricos (`parks/legoland-new-york.js:414`) |

Esto es exactamente el patrón que `park-contract.md.asc` describe como correcto: cada parque usa sólo las extensiones que necesita, y el core deriva un default razonable cuando faltan (`defaultQuickServices()` en `assets/theme-park-core.js:2429`).

## Prueba de fuego (fixture mínimo)

`tests/theme-park/fixtures/minimal-test-park.js` existe y vive fuera de `parks/` (correcto según la regla del contrato: `parks/` es sólo para parques reales). Declara un `type` de POI inventado (`hydration-point` esperado) para probar que el core no tiene un enum cerrado — coherente con `park-contract.md.asc` §"Contrato de tipos de POI". No se ejecutó el test end-to-end en esta tarea (ver `audits/00-baseline.md` — el test suite no corre en este entorno por versión de Playwright); la revisión aquí es estática.

## Hallazgos

Ninguno de severidad P0–P2. Un P3 potencial: el core es un único archivo de 2518 líneas sin módulos internos declarados (todo en el mismo top-level scope de funciones) — no es leakage de parque, pero dificulta la navegabilidad. Se reporta con más detalle en `audits/2D-simplificacion.md` (T2.D), no aquí, porque no es un problema de la frontera core/parque sino de organización interna del core.

**Conclusión para el veredicto del reporte final:** la frontera se mantiene limpia. El repo está en buena posición para un tercer parque en este eje específico.
