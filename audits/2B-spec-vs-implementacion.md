# T2.B — Implementación vs. especificación (con passphrase)

**Skill externa:** `review-implementation-audit` · **Specs auditadas:** `park-contract.md.asc`, `theme-park-core.md.asc`, `recommendation-engine.md.asc`, `family-and-eligibility.md.asc`, `geolocation-and-maps.md.asc`, `observations-and-state.md.asc`, `testing-and-validation.md.asc`.

## Metodología

Cada requisito normativo de las specs se clasifica: `implementado` / `parcial` / `faltante` / `contradicho` / `no verificable`, con evidencia `archivo:línea`.

## Tabla de requisitos

| Requisito (spec) | Clasificación | Evidencia |
|---|---|---|
| 16 campos required presentes en cada `parks/*.js` | **implementado** | ver `audits/2A-frontera-core-parques.md` — verificado en ambos parques |
| `family: null` no rompe el motor | **implementado** (por diseño de datos) | `parks/story-land.js:89` usa `family:null` en producción real, no sólo en el fixture — validación en uso real, no sólo teórica |
| Elegibilidad `unknown`/mixta nunca excluye la atracción | **implementado** | `assets/theme-park-core.js:198` `eligibilityForChild()` y `:293` `allRegisteredChildrenIneligible()` existen como funciones separadas de cualquier filtro de exclusión — la exclusión real vive en otro lado (estados `done/closed/discarded/unavailable`), consistente con la regla |
| `p.type` de POI es cadena libre, sin enum cerrado | **implementado** | `park-contract.md.asc` lo documenta explícitamente y LEGOLAND usa `firstaid`/`familycare` agrupados vía `poiFilterGroups` sin que el core necesite conocerlos — `assets/theme-park-core.js:786-787` |
| `quickServices` opcional con derivación automática | **implementado** | `defaultQuickServices()` en `assets/theme-park-core.js:2429`; LEGOLAND override explícito en `parks/legoland-new-york.js:414` |
| `geoCalibration` por parque, no cruzado | **implementado (con nota)** | comentario explícito en `assets/theme-park-core.js:1358-1361`: "Un parque sin `geoCalibration` (ej. LEGOLAND New York...) simplemente no proyecta el GPS sobre el mapa de otro parque" — la regla está codificada como comentario de diseño, no verificada por un test automatizado en este momento (ver fila de test suite abajo) |
| `npm test` pasa completo (Definición de Terminado, `testing-and-validation.md.asc`) | **contradicho** | Ver `audits/00-baseline.md` — la suite **no corre** en un checkout fresco de este entorno (mismatch de versión de Playwright, sin lockfile commiteado). La spec declara esto como parte de la Definición de Terminado del motor genérico; el estado actual del repo no lo satisface de forma reproducible. Esto es el hallazgo más importante de este eje — ver T2.G para el detalle completo. |
| Auditoría de leakage específico de parque como parte del checklist de cualquier cambio al core | **no verificable como proceso** | El leakage en sí está limpio hoy (T2.A), pero no hay evidencia en el repo (hook, CI, checklist ejecutable) de que esta auditoría se repita automáticamente en cada cambio futuro — depende de que un agente humano/IA la recuerde y la ejecute manualmente. Riesgo de proceso, no de estado actual. |
| `closingTime: null` en LEGOLAND documentado con razón concreta y fecha de revisión | **implementado, con scope creep positivo** | `parks/legoland-new-york.js:447` no sólo dice `null` — explica por qué (calendario oficial sin publicar a la fecha de investigación) y cuándo revisar. Esto excede lo que el contrato exige (sólo pide que el campo sea opcional) — es buena práctica, no un problema. |
| Reglas al escribir `parks/<id>.js`: nunca reutilizar ids entre parques | **implementado** | `mustIds`/`calmIds`/etc. usan namespaces implícitos por `storageKey` distinto (`storyland_state_v1` vs. el de LEGOLAND); no se verificó exhaustivamente que ningún id literal se repita entre los dos archivos — bajo riesgo dado que son namespaces separados en runtime, pero no se hizo un diff id-a-id completo por límite de alcance de esta auditoría |

## Scope creep (comportamiento no pedido por ninguna spec)

- Los comentarios de procedencia/confianza en `parks/legoland-new-york.js` (ej. `closingTime` línea 447, coordenadas con metodología de Plus Codes) son más detallados de lo que `park-contract.md.asc` exige — documentado aparte en `operations/data-provenance.md.asc`, así que no es contradictorio, es la implementación de *otra* spec que sí lo pide.

## Hallazgo consolidado

**P1 — El contrato dice "el motor no se considera conforme si `npm test` no pasa completo", y hoy no pasa en un checkout limpio.** No es un problema del código del motor en sí (el fixture y las aserciones parecen correctas por lectura estática) sino de reproducibilidad del entorno de test: `package.json` fija `playwright: ^1.56.1` sin `package-lock.json` commiteado. Ver `audits/00-baseline.md` y `audits/2G-cobertura-tests.md` para el detalle y la evidencia completa.
