# Tests del Theme Park Companion

Prueba el contrato mínimo de `assets/theme-park-core.js` (el motor genérico
compartido por `storyland.html`, `legoland.html`, y cualquier parque futuro)
en dos capas:

1. **Contrato genérico (secciones 1–11)** contra un fixture sintético
   (`fixtures/minimal-test-park.js` + `fixtures/minimal-test-park.html`) que
   nunca comparte ningún id/nombre/zona con Story Land ni con LEGOLAND New
   York — ver "Fixture" más abajo.
2. **Regresión contra los parques reales (sección 12)** — carga
   `storyland.html`/`legoland.html` tal cual se sirven en producción y
   verifica que cada uno sigue recomendando, que `candidateList()` no está
   vacía, y que sus extensiones opcionales propias del contrato
   (`reactionSystem` en Story Land; `quickServices`/`map.poiFilterGroups` en
   LEGOLAND) siguen configuradas. `auth.js`/`auth.css` se cargan igual que en
   producción — no bloquean la ejecución del motor, solo ocultan
   visibilidad vía CSS, así que no hace falta simular login.

Este test es parte del contrato arquitectónico documentado en
`specs/operations/testing-and-validation.md.asc`: **un tercer parque debe poder
agregarse mediante `parks/<park-id>.js` + configuración + thin HTML shell,
sin modificar `assets/theme-park-core.js`.** Si la sección 1–11 falla contra
un cambio al core, ese cambio rompió el contrato genérico; si la sección 12
falla, el cambio rompió a un parque real concreto (no necesariamente el
contrato genérico en sí).

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
reales que forman parte de la aplicación. El fixture cubre deliberadamente:

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
  `PARK.quickServices` ni `PARK.map.poiFilterGroups`.
