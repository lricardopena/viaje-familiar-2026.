# Test del itinerario

Smoke test de `index.html` + `data.js` — la parte de la app que se usa
todos los días del viaje. No existía ningún test para esto (ver
`audits/2G-cobertura-tests.md`, hallazgo H3); este archivo no pretende
sustituir una revisión manual del contenido, sólo detectar que un `data.js`
malformado o un cambio a `index.html` rompen el renderizado antes de que
eso se descubra en el propio viaje.

## Ejecutar

```bash
npm run test:itinerary
```

o directamente:

```bash
node tests/itinerary/index-smoke.spec.js
```

o junto con el test del Theme Park Companion:

```bash
npm test
```

## Qué verifica

Carga `index.html` real (con `data.js` real, sin mocks) contra un servidor
HTTP estático efímero, y confirma:

- `TRIP_DATA` se cargó desde `data.js` con un array `days[]`.
- Se renderizó exactamente una `<section class="day">` por cada entrada de
  `TRIP_DATA.days` — ni de más ni de menos.
- Cada día tiene su `id="d<N>"` correspondiente en el DOM.
- La barra de navegación de días (`#nav`) generó al menos un botón/enlace.
- Cero errores de consola/página durante la carga.

Las peticiones de red externas (fotos de Wikimedia Commons vía `IMG()`) se
bloquean a propósito — esto es un smoke test de renderizado, no una prueba
de disponibilidad de imágenes externas.

## Qué NO verifica

No comprueba el contenido de un día concreto, ni la salida de las funciones
de pattern-matching en español (`wicon`/`clothes`/`actIcon`/`excite`/
`expectation`/`mission`/`story` — ver `CLAUDE.md`) caso por caso. Sólo
confirma que ninguna de ellas lanza una excepción con los datos reales de
`data.js` tal como están hoy.
