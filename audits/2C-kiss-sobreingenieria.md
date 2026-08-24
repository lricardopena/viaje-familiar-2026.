# T2.C — Sobre-ingeniería y complejidad no ganada

**Skill externa:** `coding-kiss` · **Alcance:** `assets/theme-park-core.js` (prioridad), `index.html`, `auth.js`.

## Marco aplicado

El core *debe* ser genérico — eso no es sobre-ingeniería, es el contrato del repo (ver T2.A/T2.B). La pregunta de este eje es distinta: ¿qué mecanismo presente **no** está ganado por evidencia de uso real? Se aplicó Chesterton's Fence contra `git log -- assets/theme-park-core.js` (12 commits) antes de marcar algo como injustificado.

## Lo que está bien justificado (no son hallazgos)

- **`geoCalibration` opcional por parque** (`assets/theme-park-core.js:1358`): podría verse como "generalización especulativa", pero **ambos** parques reales lo usan de forma distinta hoy (LEGOLAND no lo tiene, Story Land sí — `parks/story-land.js` "6 pares control point" según el comentario en `core.js:1367`), y el commit `0a06585 Recalibra geoCalibration con 13 anchors` muestra que es un mecanismo activamente ajustado con datos reales, no especulación.
- **`map.poiFilterGroups`** (`core.js:786`): un solo consumidor hoy (LEGOLAND), pero el mecanismo es trivial (un objeto de remapeo, no una nueva capa de abstracción) y está documentado como "config de parque, NO del core" en el propio dato (`parks/legoland-new-york.js:398`) — bajo costo, alta claridad, no amerita reportarse.
- **`reactionSystem` con `tierOverride?` opcional** (`core.js:1622`, comentario "para el único caso que lo usa hoy"): el autor ya documentó explícitamente que es un mecanismo de un solo consumidor. Eso normalmente sería una bandera KISS ("Rule of Three" no cumplida), pero el campo es opcional, cuesta cero para el parque que no lo usa (`null` explícito en LEGOLAND), y sacarlo forzaría hardcodear la mecánica Polar→Roar en el core — peor, no mejor. Se deja como está.

## Hallazgos

### P2 — `assets/theme-park-core.js` es un único archivo de 2518 líneas sin separación en módulos
No hay `export`/`import`, ni IIFEs por subsistema — todo vive en el mismo scope global de funciones top-level (`allLocatableEntities`, `applyParkTheme`, `haversineMeters`, ... más de 40 funciones de nivel superior detectadas). Esto no es sobre-ingeniería en el sentido de "capas de más" — es lo contrario, **falta de estructura interna** a un tamaño donde ya se necesita. No es un hallazgo de KISS puro sino de navegabilidad; se detalla con propuesta concreta en `audits/2D-simplificacion.md`. Se anota aquí porque cruza ambos ejes.

### P3 — `reasonKey`/sistema de razones de recomendación con múltiples niveles de indirección
`core.js:1886` documenta "ni `reasonKey` es específico de LEGOLAND ni de Story Land" — buena señal de intención genérica, pero el mecanismo de razones (`reasonLabel` en `priorityGroups`, `whyMessages` en `reactionSystem`, más el registro de razones que menciona `recommendation-engine.md.asc`) tiene al menos tres puntos de configuración de texto distintos para un problema que hoy sólo dos parques ejercitan de forma parcialmente solapada. No se pudo confirmar con evidencia de código si esto es necesario o es flexibilidad no ejercida — **marcado como no verificable sin una tercera instancia real**, que es justo la prueba que el propio repo se plantea antes de generalizar más (ver `theme-park-core.md.asc`, principio de "esperar a la tercera instancia").

### auth.js — sin hallazgos KISS
`auth.js` (266 líneas) es proporcional a su objetivo declarado ("elevar el costo de un vistazo casual, no de un ataque dirigido" — `auth.js:4-5`). No introduce framework, no over-engineered. Ver `audits/2E-seguridad-privacidad.md` para el análisis de seguridad (distinto eje).

## Conclusión

No se encontró sobre-ingeniería real en el sentido clásico (abstracciones especulativas, capas sin consumidor, flexibilidad no pedida). El único hallazgo de peso (P2, archivo monolítico) es un problema de tamaño/estructura, no de complejidad injustificada — se prioriza y cuantifica en la consolidación (T3.1) junto con el hallazgo espejo de T2.D.
