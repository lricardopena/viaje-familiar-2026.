# Tests del Theme Park Companion

Dos suites con objetivos **distintos**, en el mismo archivo (`theme-park-core.spec.js`) porque comparten toda la infraestructura (servidor HTTP efímero, helpers de Playwright):

1. **Third Park Contract Test (secciones 0–12)** — protege la **genericidad** de `assets/theme-park-core.js`. Corre contra un fixture sintético (`fixtures/minimal-test-park.js` + `fixtures/minimal-test-park.html`) que nunca comparte ningún id/nombre/zona/tipo de POI con Story Land ni con LEGOLAND New York — ver "Fixture" más abajo. Es, en la práctica, nuestro tercer parque sintético.
2. **Regression Tests (sección 13)** — protege el **comportamiento** de los parques reales ya en producción (Story Land, LEGOLAND New York), cargando `storyland.html`/`legoland.html` tal cual se sirven hoy.

**Por qué ambas se mantienen:** un cambio puede pasar el Third Park Contract Test (el core sigue siendo genérico) y aun así romper algo específico de un parque real — por ejemplo su `geoCalibration` propio o sus `quickServices` curados. Y a la inversa, un cambio puede no tocar ningún parque real observable y aun así violar el contrato genérico (por ejemplo, introduciendo una rama `if(PARK.id==='...')` que hoy no se ejercita porque ningún parque real la necesita todavía, pero que rompería silenciosamente al agregar un tercer parque). Si la sección 0–12 falla, ese cambio rompió el contrato genérico — no es un problema del fixture. Si la sección 13 falla, el cambio rompió a un parque real concreto, no necesariamente el contrato genérico en sí.

Ambas son parte del contrato arquitectónico documentado en `specs/operations/testing-and-validation.md.asc`: **un tercer parque debe poder agregarse mediante `parks/<park-id>.js` + configuración + thin HTML shell, sin modificar `assets/theme-park-core.js`.**

## Qué cubre el Third Park Contract Test, sección por sección

| # | Qué prueba |
|---|---|
| 0 | **Verificación estática**: el código fuente de `assets/theme-park-core.js` (comentarios excluidos con un escáner dedicado, ver el código) nunca compara `PARK.id`/`park.id` contra un literal, nunca tiene un `switch(PARK.id)`, y nunca escribe el id de ningún parque real o del fixture en código real. Falla rápido, sin browser. |
| 1 | Carga sin errores, `window.PARK` cumple los campos **Required** del contrato (`park-contract.md.asc`), `candidateList()` no vacía, `getRecommendation()` funciona. |
| 2 | `done`/`closed`/`discarded`/`unavailable` como hard constraints. |
| 3 | Elegibilidad `unknown`/mixta/"ningún niño" nunca excluye una atracción. |
| 4 | **Degradación progresiva** de tres capacidades opcionales: `family:null`, `reactionSystem:null` (la "reactcard" nunca se muestra) y `shows:[]` (el banner "empieza pronto" nunca se dispara) — todas probadas por comportamiento observable, no solo `=== undefined`. |
| 5 | Wait observations independientes del `status`. |
| 6 | Geo parcial: proximidad solo con `geo`+GPS, nunca inventada. |
| 7 | Accesos rápidos derivados automáticamente cuando `PARK.quickServices` no está configurado. |
| 8 | Un tipo de POI inventado (`hydration-point`, nunca visto por el core) funciona en etiquetas/filtros/accesos rápidos sin cambios al core. |
| 9 | Mapa geográfico sin mapa ilustrado ni `geoCalibration`; y `map.poiFilterGroups` ausente → una categoría de filtro derivada por cada `type` distinto, sin agrupar nada. |
| 10 | **Comportamental**: renombrar todos los ids/nombres/zonas/tipos de POI en runtime no rompe el motor — complementa la verificación estática de la sección 0 (esa prueba que el core no *menciona* ids de parque; esta prueba que tampoco *depende* de ellos). |
| 11 | GPS denegado: la app sigue siendo usable, nunca fabrica una distancia. |
| 12 | **Negative contract test**: una copia en memoria del fixture (nunca se escribe a disco — se sirve interceptando la petición de red con `ctx.route()`) sin el campo Required `attractions`. Prueba que el checker de contrato detecta la violación, y que el core no finge funcionar (`candidateList()`/`getRecommendation()` quedan vacíos) — el core es defensivo (`PARK.attractions||[]`) así que no lanza una excepción, por eso el checker explícito importa: sin él, un campo Required faltante degrada en silencio. |

## Ejecutar

```bash
npm install   # una sola vez — instala Playwright como devDependency
npm test
```

o directamente:

```bash
node tests/theme-park/theme-park-core.spec.js
```

El script levanta su propio servidor HTTP estático efímero (sirviendo la raíz
del repo) para que el fixture cargue el **mismo** `assets/theme-park-core.js`/
`.css` de producción con sus rutas relativas tal cual — nunca una copia
especial para tests. No depende de ningún servidor externo ya corriendo.

## Qué NO es esto

Esto es tooling **solo para pruebas** del motor genérico. El sitio en sí
sigue siendo 100% estático, sin build ni package manager (ver `CLAUDE.md`,
raíz del repo) — el `package.json`/`node_modules/` de la raíz no participan
del despliegue en GitHub Pages, solo existen para poder correr este test de
forma reproducible.

## Fixture (`fixtures/minimal-test-park.js`/`.html`)

Vive bajo `tests/`, no bajo `parks/` — `parks/` está reservado para parques
reales que forman parte de la aplicación. Es, en la práctica, nuestro tercer
parque sintético para el Third Park Contract Test. Cubre deliberadamente:

- una atracción con `geo` y elegibilidad mixta (un niño registrado cumple, el
  otro no) — nunca excluida;
- una atracción sin `restrictions` — elegibilidad `unknown`, nunca `✅`;
- una atracción donde **ningún** niño registrado cumple — sigue siendo
  candidata (no es un hard constraint, ver `allRegisteredChildrenIneligible()`
  en el core y `specs/architecture/family-and-eligibility.md.asc`);
- una atracción con `unavailable:true` — este sí es un hard constraint
  inequívoco;
- 1 restroom, 1 POI de comida, y un tipo de POI inventado
  (`hydration-point`) que el core nunca vio antes;
- geo parcial, sin `geoCalibration`, sin mapa ilustrado, sin
  `PARK.quickServices` ni `PARK.map.poiFilterGroups`;
- `reactionSystem:null` y `shows:[]` — las dos capacidades opcionales
  restantes del contrato que ningún otro campo del fixture ya ejercitaba.

Si en el futuro se necesita ejercitar una capacidad opcional nueva del
contrato (ver `specs/architecture/park-contract.md.asc` §"Matriz de
capacidades"), el primer lugar para añadirla es este fixture — no un parque
real ni un segundo fixture.
