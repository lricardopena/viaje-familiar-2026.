# T2.G — Cobertura de tests

**Skill externa:** `review-implementation-audit` (eje test-coverage) · **Alcance:** `tests/theme-park/theme-park-core.spec.js` vs. superficie real.

## Lo que sí está cubierto (evidencia: 29 aserciones `check()` en el spec)

El contrato arquitectónico del motor genérico está **bien cubierto** contra el fixture sintético: hard constraints (`unavailable/done/closed/discarded`, líneas 126–131), elegibilidad `unknown`/mixta/"nadie cumple" (149–153), `family:null` (169–171), forma de las observaciones de wait time y que nunca revive una atracción excluida (188–191), proximidad nunca fabricada sin `geo` (199–200), derivación automática de accesos rápidos (209–210), un `type` de POI nunca visto por el core (219–221), degradación sin mapa ilustrado/`geoCalibration` (241–244), y la prueba más fuerte del criterio de aceptación — renombrar todos los ids/nombres/zonas en runtime sin romper el motor (266). Esto coincide punto por punto con la lista obligatoria de `specs/operations/testing-and-validation.md.asc`.

## P0/P1 — Baseline roto: el estado real hoy es que nada de esto corre

Como ya se estableció en `audits/00-baseline.md` y `audits/2B-spec-vs-implementacion.md`: `npm test` **falla** en un checkout limpio de este entorno por mismatch de versión de Playwright (`^1.56.1` sin `package-lock.json` commiteado resolvió 1.62.1, que busca un binario de navegador que el entorno no tiene descargado). La cobertura descrita arriba existe **en el código del test**, pero no hay evidencia de que se haya ejecutado exitosamente de forma reciente y reproducible fuera del entorno original donde se escribió. **P1** — clasificado igual que en T2.B, mismo hallazgo, visto desde este eje.

## P1 — Sin regresión automatizada contra los parques reales

`specs/operations/testing-and-validation.md.asc` exige explícitamente: *"Cualquier cambio al core o a un `parks/*.js` existente debe verificar que Story Land y LEGOLAND New York siguen funcionando sin regresión... Validar con Playwright contra ambos parques además del fixture sintético."*

`grep` de `storyland.html`/`legoland.html`/`story-land`/`legoland-new-york` en `tests/theme-park/theme-park-core.spec.js`: **cero coincidencias.** El único target de test es el fixture sintético. Esto significa que un cambio al core que rompiera silenciosamente algo específico del `geoCalibration` real de Story Land, o de los `poiFilterGroups`/`quickServices` reales de LEGOLAND, **no lo detectaría ningún test automatizado** — sólo una revisión manual. La spec pide esto como requisito, no como sugerencia.

## P2 — Cero tests para `index.html`/`data.js` (el itinerario en sí)

El itinerario del viaje (`index.html` + `data.js`, ~80KB combinados) no tiene ningún test. Las funciones puras documentadas en `CLAUDE.md` (`wicon`, `clothes`, `actIcon`, `excite`, `expectation`, `mission`, `story`) hacen pattern-matching sobre palabras clave en español — son exactamente el tipo de función que se rompe silenciosamente cuando alguien añade un día nuevo con vocabulario que no coincide con los patrones esperados, y no hay ningún test que lo detecte. Esto es consistente con "sitio 100% estático sin build" (no se está pidiendo introducir un framework de test), pero un test smoke mínimo (¿la página renderiza N días sin excepciones de JS, con los datos reales de `data.js`?) sería barato y de alto valor dado que el viaje es en menos de tres semanas desde la fecha de esta auditoría.

## Qué se rompe en el viaje si esto falla (orden de prioridad real)

1. **El itinerario no renderiza un día** (sin test) — bloquea el uso completo de la app ese día del viaje.
2. **El motor de recomendación de un parque real da una recomendación incorrecta** (sin regresión automatizada) — degrada la experiencia pero no bloquea el uso manual del checklist.
3. **Un cambio futuro al core rompe el contrato genérico** (sí cubierto por el fixture, pero el fixture no corre hoy) — bloquea la generalización, detectable manualmente por code review mientras tanto.

## Resumen de hallazgos de este eje
- P1 — `npm test` no corre de forma reproducible en un checkout limpio (mismo hallazgo raíz que T2.B).
- P1 — sin regresión automatizada contra Story Land/LEGOLAND reales, pese a que la spec lo exige explícitamente.
- P2 — cero cobertura de test para el itinerario (`index.html`/`data.js`), la parte de la app que se usa todos los días del viaje.
