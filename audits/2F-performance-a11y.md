# T2.F — Rendimiento y accesibilidad

**Skill:** `agentic-skills/skills/coding-performance-optimization` + `agentic-skills/skills/coding-frontend-ui-engineering` · **Herramienta:** Playwright + Chromium (`/opt/pw-browsers/chromium`, ver nota metodológica en `audits/00-baseline.md` — no se tocó `tests/`).

## Mediciones reales (no estimaciones)

Servidor HTTP estático local sirviendo la raíz del repo, medido con Chromium vía CDP (`Network.loadingFinished` para bytes transferidos reales, `Network.emulateNetworkConditions` para throttle).

| Página | Bytes transferidos en carga inicial (sin interactuar) | Nota |
|---|---|---|
| `index.html` | 94 KB | |
| `storyland.html` | 379 KB | |
| `legoland.html` | 444 KB | |

**Hallazgo positivo, no un riesgo:** los mapas ilustrados (`legoland-map-2026.webp` 1.5 MB, `storyland-map-2026.webp` 2.0 MB) **no se cargan en la carga inicial**. Verificado con `performance.getEntriesByType('resource')` filtrando `.webp` inmediatamente después del evento `load`: **0 recursos `.webp` cargados**. La app los difiere hasta que el usuario abre el visor de mapa — el patrón de carga diferida que T2.F esperaba auditar ya está implementado correctamente.

**Tiempo de carga bajo throttle simulando datos móviles** (1.5 Mbps down / 150ms latencia, similar a "Fast 3G"): `legoland.html` alcanza el evento `load` en **2598 ms**. Es una medición de un entorno de contenedor, no del hardware real del teléfono en el parque — sirve como orden de magnitud, no como cifra definitiva.

## Hallazgos de performance

**P3** — 444 KB en la carga inicial de `legoland.html` (sin contar el mapa diferido) es razonable para el contenido que representa (motor de 148 KB sin minificar + CSS + datos del parque), pero el motor **no está minificado** (`assets/theme-park-core.js` se sirve tal cual, comentarios de documentación incluidos). Minificarlo para producción reduciría la transferencia sin tocar el código fuente legible en el repo — pero el repo no tiene build step por diseño (`CLAUDE.md`), así que esto requeriría decidir si vale la pena introducir un paso de minificación sólo para el Companion sin romper la filosofía "sin build" del resto del sitio. Se deja como propuesta, no como hallazgo urgente.

## Accesibilidad — señales estáticas

- **Atributos `aria-*`:** 6 usos en `assets/theme-park-core.js` (2518 líneas), 5 en `index.html` (79 líneas). Proporcionalmente escaso en el core dado el volumen de UI interactiva que genera (checklist, tabs, mapa, filtros). **P2** — no se verificó con un lector de pantalla real (fuera de alcance de esta pasada), pero la densidad baja de `aria-*` en un componente con tanta interacción dinámica (contenido que cambia sin recarga de página) es una señal de riesgo real para WCAG 4.1.2 (Name, Role, Value) en los elementos generados dinámicamente vía `insertAdjacentHTML`.
- **Tamaño de touch target:** los botones principales (`.actbtn`, `.resetbtn`, `.restroombtn`, `.mapgeo-gpsbtn`) usan `min-height` de 48–58px — **cumple WCAG 2.5.5 AAA** (44px). Botones secundarios (`.altbtns button`, `.mapsheet-actionbtns button`) usan 40px — **por debajo de 44px pero dentro de un rango comúnmente aceptado para AA** (que no fija un mínimo numérico estricto). Uso real es "una mano, al sol, en un parque" según el contexto del plan — 40px es el más ajustado de los encontrados y el más usado en acciones secundarias frecuentes (botones de mapa). **P3.**
- **Contraste:** no verificado cuantitativamente (requeriría capturas + análisis de color, fuera del alcance práctico de esta pasada). Marcado como **no verificable** en esta auditoría — candidato a T3.4 (ticket de seguimiento con herramienta dedicada, ej. axe-core).

## Resumen de hallazgos de este eje
- P2 — densidad baja de `aria-*` relativa al volumen de contenido dinámico generado por el core; riesgo no confirmado con lector de pantalla real.
- P3 — algunos botones secundarios de mapa por debajo de 44px de touch target.
- P3 — el core no está minificado (444 KB de carga inicial en LEGOLAND es aceptable, pero mejorable).
- No verificable — contraste de color no medido cuantitativamente en esta pasada.
