# Plan de auditoría — `viaje-familiar-2026` con las skills de `agentic-skills`

**Estado:** listo para ejecutar · **Repo auditado:** `lricardopena/viaje-familiar-2026.` · **Fuente de skills:** `lricardopena/agentic-skills`
**Modo:** auditoría **read-only** — este plan produce *hallazgos*, no parches. Los arreglos son un segundo encargo, posterior y separado.

---

## 0. Contexto que el agente necesita antes de empezar

Sitio estático, sin build, sin package manager para el sitio (sólo `tests/` tiene `package.json`). Dos subsistemas independientes:

| Subsistema | Archivos | Naturaleza |
|---|---|---|
| Itinerario | `index.html` (shell: HTML+CSS+JS de render), `data.js` (todo el contenido) | Render manual por template literals, sin framework |
| Theme Park Companion | `assets/theme-park-core.js` (~148 KB), `assets/theme-park-core.css`, `parks/story-land.js`, `parks/legoland-new-york.js`, `storyland.html`, `legoland.html` | Motor genérico + datos por parque vía `window.PARK` |
| Auth | `auth.js`, `auth.css`, `tools/generate-auth-verifier.html` | Gate de acceso client-side |
| Tests | `tests/theme-park/theme-park-core.spec.js` + fixtures (`minimal-test-park.js/.html`), Playwright | Único test suite del repo |
| Docs | `CLAUDE.md`, `README.md`, `specs/**/*.md.asc` (cifrado), `HANDOVER.md.asc` (cifrado) | |

Skills locales ya existentes en `.claude/skills/`: `theme-park-architecture-audit`, `add-theme-park`. **No duplicar su trabajo — reutilizarlas donde el plan lo indica.**

### Reglas duras (no negociables)

1. **No modificar código de producto.** Ninguna tarea de este plan edita `index.html`, `data.js`, `assets/**`, `parks/**`, `auth.js`, `*.html`. Sólo se escriben archivos nuevos bajo `audits/`.
2. **`HANDOVER.md.asc` no se toca ni se descifra** sin preguntar explícitamente al usuario en el chat (regla de `CLAUDE.md`). Si el agente cree que un hallazgo debe registrarse ahí, lo anota en el reporte bajo "Pendiente de registrar" y sigue.
3. **`specs/**/*.md.asc` sí se pueden descifrar y leer proactivamente**, pero **sólo con una passphrase que el usuario haya proporcionado en esta sesión**. Nunca adivinarla, derivarla ni reutilizarla. Si no hay passphrase disponible: ejecutar las tareas marcadas `[sin-specs]` y marcar las demás como `BLOQUEADA — falta passphrase`. Borrar todo plaintext descifrado antes de terminar.
4. **Privacidad:** la ubicación residencial nunca se escribe en el repo. Si la auditoría encuentra una dirección, coordenada, Plus Code o Place ID residencial commiteado, eso es un hallazgo **CRÍTICO** — se reporta como "hay una fuga en `<archivo>:<línea>`" **sin transcribir el valor** en el reporte.
5. **Todo hallazgo lleva evidencia:** `archivo:línea` + cita corta. Un hallazgo sin ancla verificable no entra al reporte.

### Escala de severidad (usar exactamente ésta)

- **P0 — Crítico:** rompe el uso en viaje, filtra datos privados o de auth.
- **P1 — Alto:** bug real, contrato violado, o deuda que bloquea añadir un tercer parque.
- **P2 — Medio:** complejidad no ganada, gap de tests, inconsistencia con specs.
- **P3 — Bajo:** claridad, naming, docs.

---

## Fase 0 — Preparación (secuencial, bloquea todo lo demás)

### T0.1 · Vendorear `agentic-skills` como submódulo
- **Skill:** — (git puro)
- **Pasos:** `git submodule add -b main https://github.com/lricardopena/agentic-skills.git agentic-skills` en la raíz del repo. Ubicación fija: raíz, nombre `agentic-skills`, **no** dentro de `skills/`.
- **Entregable:** `.gitmodules` + gitlink, commiteados.
- **DoD:** `agentic-skills/skills/coding-kiss/SKILL.md` existe y es legible.
- **Si falla** (sin acceso de red o de repo): fallback — leer las skills desde `/home/user/agentic-skills` si ya está clonado, y marcar T0.1 como `OMITIDA — usando clon local`. El resto del plan no depende del submódulo, sólo de poder leer los `SKILL.md`.

### T0.2 · Registrar la ruta de skills en la config del proyecto
- **Skill:** `update-config` (nativa de Claude Code)
- **Pasos:** añadir `agentic-skills/skills/` a las rutas de skills en `.claude/settings.json` para que se autodescubran junto a las locales.
- **DoD:** las skills de la colección aparecen invocables sin ruta absoluta.
- **Nota:** si esto genera conflicto con las skills locales por nombre, ganan las locales — documentarlo en el reporte, no renombrar nada.

### T0.3 · Baseline verde
- **Pasos:** `npm install` y `npm test` (Playwright). Registrar el resultado **antes** de auditar.
- **Entregable:** `audits/00-baseline.md` con la salida.
- **DoD:** se sabe si la suite pasa hoy. **Si falla, eso ya es un hallazgo P1** y va al reporte final — no se arregla aquí.

---

## Fase 1 — Reconocimiento (secuencial, alimenta la Fase 2)

### T1.1 · Mapa del codebase y presupuesto de complejidad
- **Skill:** `agentic-skills/skills/meta-improve-codebase-architecture`
- **Alcance:** todo el repo.
- **Pasos:** escanear buscando "deepening opportunities". Producir el reporte HTML visual que la skill genera. **No** ejecutar la fase de "grill" interactiva — el agente corre sin humano; en su lugar, listar todas las oportunidades detectadas con su justificación.
- **Entregable:** `audits/01-arquitectura-scan.md` + el HTML que produzca la skill en `audits/01-arquitectura-scan.html`.
- **DoD:** cada oportunidad tiene archivo, síntoma y por qué importa.

### T1.2 · Inventario de specs vs. superficie real `[requiere passphrase]`
- **Skill:** — (lectura)
- **Pasos:** descifrar `specs/**/*.md.asc` a un directorio temporal **fuera del repo** (`/tmp/.../specs-plain/`). Construir una tabla: cada documento de specs ↔ qué archivos del repo lo implementan. Marcar specs huérfanas (documentan algo que no existe) y código huérfano (existe pero ninguna spec lo cubre — p. ej. revisar si `auth.js` está especificado en algún lado).
- **Entregable:** `audits/02-inventario-specs.md` (tabla, sin copiar el contenido de las specs — sólo referencias por título/sección).
- **DoD:** el plaintext descifrado está borrado al terminar la tarea. Verificar con `ls`.

---

## Fase 2 — Auditorías por eje

**Estas siete tareas son independientes entre sí y pueden lanzarse en paralelo** (una subtarea por eje). Cada una escribe su propio archivo en `audits/` y **no** lee los archivos de las demás.

### T2.A · Frontera core-genérico vs. datos-por-parque
- **Skill:** `.claude/skills/theme-park-architecture-audit` (**la local, no una de la colección** — es el lente exacto para esto)
- **Alcance:** `assets/theme-park-core.js`, `assets/theme-park-core.css`, `parks/*.js`, `storyland.html`, `legoland.html`.
- **Pregunta guía:** ¿el core sigue sin saber nada específico de un parque? Buscar IDs de parque hardcodeados, ramas `if (park === ...)`, nombres de atracción o restaurante en el core, umbrales calibrados para un parque concreto.
- **Prueba de fuego:** usar el fixture `tests/theme-park/fixtures/minimal-test-park.js` y las referencias `references/third-park-test.md` + `references/hardcode-checklist.md` de la skill local.
- **Entregable:** `audits/2A-frontera-core-parques.md`.

### T2.B · Implementación vs. especificación `[requiere passphrase]`
- **Skill:** `agentic-skills/skills/review-implementation-audit`
- **Alcance:** Theme Park Companion completo, auditado contra `specs/architecture/park-contract.md.asc`, `specs/architecture/theme-park-core.md.asc`, `specs/architecture/recommendation-engine.md.asc`, `specs/architecture/family-and-eligibility.md.asc`, `specs/architecture/geolocation-and-maps.md.asc`, `specs/architecture/observations-and-state.md.asc`.
- **Pasos:** por cada requisito de las specs, clasificar: `implementado` / `parcial` / `faltante` / `contradicho` / `no verificable`. Incluir *scope creep*: comportamiento en el código que ninguna spec pidió.
- **Entregable:** `audits/2B-spec-vs-implementacion.md` con una fila por requisito y su evidencia (`archivo:línea`).
- **Fallback sin passphrase:** ejecutar sólo contra el contrato documentado en el comentario de cabecera de `assets/theme-park-core.js`, y marcar el alcance reducido de forma visible al inicio del archivo.

### T2.C · Sobre-ingeniería y complejidad no ganada `[sin-specs]`
- **Skill:** `agentic-skills/skills/coding-kiss`
- **Alcance:** `assets/theme-park-core.js` (prioridad — 148 KB en un archivo), `index.html`, `auth.js`.
- **Pregunta guía:** ¿qué complejidad presente **no** está ganada por evidencia? Abstracciones especulativas, knobs de configuración que ningún parque usa, capas de indirección con un solo implementador, generalización prematura.
- **Matiz importante:** el core *debe* ser genérico por diseño (es el contrato del repo). Distinguir "genérico porque hay dos parques y habrá un tercero" (justificado) de "genérico por si acaso" (no justificado). **Chesterton's Fence aplica fuerte aquí** — antes de marcar algo como innecesario, buscar en `git log` y en los comentarios por qué se puso.
- **Entregable:** `audits/2C-kiss-sobreingenieria.md`.

### T2.D · Claridad y simplificación `[sin-specs]`
- **Skill:** `agentic-skills/skills/coding-code-simplification` + `agentic-skills/skills/coding-codebase-design`
- **Alcance:** mismo que T2.C, más `parks/*.js`.
- **Pregunta guía:** refactors que **no cambian comportamiento** y mejoran legibilidad/navegabilidad. Usar el vocabulario de "deep modules" para proponer dónde debería ir cada seam si `theme-park-core.js` se partiera.
- **Restricción de estilo:** `data.js` es una-entrada-por-línea a propósito, y `index.html` es denso a propósito (`CLAUDE.md`). **No reportar "reformatear" como hallazgo** — es una convención deliberada.
- **Entregable:** `audits/2D-simplificacion.md`, con cada propuesta clasificada por esfuerzo (S/M/L) y riesgo de regresión.

### T2.E · Seguridad, privacidad y hardening `[sin-specs]`
- **Skill:** `agentic-skills/skills/coding-security-and-hardening` + `/security-review` (nativa)
- **Alcance:** `auth.js`, `auth.css`, `tools/generate-auth-verifier.html`, manejo de `localStorage` en el core, permisos de geolocalización, todo dato embebido en `data.js` y `parks/*.js`.
- **Checklist específico de este repo:**
  1. ¿Hay alguna dirección/coordenada/Plus Code/Place ID **residencial** commiteado? (Ver regla 4 — reportar sin transcribir.) Verificar que la convención `"Home"` se respeta en `maps`, `activityDests`, `hotelDests` y en las URLs de Maps.
  2. ¿Qué protege realmente `auth.js`? Es un gate client-side sobre un sitio estático público en GitHub Pages — determinar y **documentar explícitamente** el modelo de amenaza real: qué evita (curiosos con la URL) y qué **no** evita (cualquiera con devtools o acceso al repo). Si el código o los docs sugieren más garantía de la que da, eso es P1.
  3. Secretos, tokens o hashes débiles en el repo.
  4. Manejo de datos de los niños (nombres, edades, alturas para elegibilidad): ¿es más de lo necesario? ¿está en un repo privado o público?
  5. Uso de `innerHTML`/`insertAdjacentHTML` con datos — inyección desde `data.js` es de bajo riesgo (contenido propio), pero anotar cualquier punto donde entre input externo.
- **Entregable:** `audits/2E-seguridad-privacidad.md`.

### T2.F · Rendimiento y accesibilidad `[sin-specs]`
- **Skill:** `agentic-skills/skills/coding-performance-optimization` + `agentic-skills/skills/coding-frontend-ui-engineering`
- **Alcance:** carga de `index.html`, `storyland.html`, `legoland.html`.
- **Foco de rendimiento:** los mapas ilustrados pesan **1.5 MB y 2.0 MB** (`assets/*-map-2026.webp`) y `theme-park-core.js` son 148 KB sin minificar. **Contexto de uso real: teléfono, en un parque, con datos móviles y batería limitada.** Evaluar: ¿se cargan eager o lazy? ¿hay versiones responsive? ¿cuánto tarda el primer render en 4G lenta? ¿Leaflet se carga aunque el usuario nunca abra el mapa geográfico?
- **Foco de accesibilidad:** WCAG en los controles del Companion, contraste, tamaño de *touch target* (se usa con una mano, al sol), foco de teclado, `aria-*` en los toggles de progreso.
- **Herramienta:** Chromium + Playwright ya están disponibles. Medir, no estimar. Incluir números.
- **Entregable:** `audits/2F-performance-a11y.md` con mediciones reales (peso transferido, tiempo hasta interactivo) y no sólo opiniones.

### T2.G · Cobertura de tests `[sin-specs]`
- **Skill:** `agentic-skills/skills/review-implementation-audit` (eje de test-coverage)
- **Alcance:** `tests/theme-park/theme-park-core.spec.js` vs. la superficie real del core.
- **Pregunta guía:** ¿qué comportamiento **parece implementado pero no está verificado por ningún test**? Priorizar: motor de recomendación, elegibilidad por niño, lógica de zonas/cooldown, persistencia en `localStorage`, y el itinerario (`index.html` + `data.js`) que **no tiene tests en absoluto**.
- **Entregable:** `audits/2G-cobertura-tests.md`, con los gaps ordenados por "qué se rompe en el viaje si esto falla".

---

## Fase 3 — Consolidación (secuencial, requiere toda la Fase 2 terminada)

### T3.1 · Deduplicar y priorizar
- **Skill:** `agentic-skills/skills/plan-triage`
- **Pasos:** leer los siete archivos de Fase 2. Fusionar hallazgos duplicados (T2.C y T2.D se van a solapar; T2.B y T2.G también). Asignar P0–P3 según la escala de arriba. Ordenar por **impacto en el viaje real**, no por elegancia técnica.
- **Entregable:** `audits/03-hallazgos-consolidados.md` — una tabla única, cada fila: `ID | severidad | eje | archivo:línea | hallazgo | evidencia | arreglo propuesto | esfuerzo`.

### T3.2 · Verificación adversarial de los P0/P1
- **Skill:** `agentic-skills/skills/review-doubt-driven-development`
- **Pasos:** para **cada** hallazgo P0 y P1, revisar con contexto fresco: ¿la evidencia realmente sostiene la afirmación? ¿el `archivo:línea` dice lo que el hallazgo dice? Degradar o eliminar los que no sobrevivan.
- **Entregable:** actualizar `audits/03-hallazgos-consolidados.md` marcando cada P0/P1 como `CONFIRMADO` o `DEGRADADO a Pn` con una línea de por qué.
- **Por qué esta tarea existe:** un reporte de auditoría con falsos positivos en el tope se deja de leer. Es más barato descartarlos ahora.

### T3.3 · Reporte final
- **Skill:** — (redacción)
- **Entregable:** `audits/REPORTE-AUDITORIA.md`, en **español**, con:
  1. **Resumen ejecutivo** (máx. 15 líneas): salud general, los 3 riesgos que importan, veredicto sobre si el repo aguanta un tercer parque.
  2. Tabla de hallazgos confirmados por severidad.
  3. Un apartado **"Antes del viaje"** — sólo lo que debe arreglarse antes del 14 de agosto de 2026, con esfuerzo estimado.
  4. Un apartado **"Deuda que puede esperar"**.
  5. **"Pendiente de registrar"**: qué debería ir a `HANDOVER.md.asc` o a `specs/` y por qué no se hizo en esta sesión (el agente **no** edita esos archivos).
  6. Alcance de la auditoría: qué se auditó, qué **no**, y qué quedó bloqueado por falta de passphrase.

### T3.4 · Tickets accionables
- **Skill:** `agentic-skills/skills/plan-to-tickets`
- **Pasos:** convertir los hallazgos P0/P1/P2 confirmados en tickets autocontenidos: contexto, archivos a tocar, criterio de aceptación, cómo verificar.
- **Entregable:** `audits/04-tickets.md`. **No abrir issues en GitHub** salvo que el usuario lo pida.

---

## Fase 4 — Entrega

### T4.1 · Commit y push
- **Rama:** `claude/agentic-skill-audit-gubpxq` (única rama permitida).
- **Pasos:** commitear todo `audits/` + `.gitmodules`/gitlink + el cambio de `.claude/settings.json`. Push con `git push -u origin claude/agentic-skill-audit-gubpxq`.
- **Verificación previa al commit:** `git diff --stat` no debe mostrar cambios en `index.html`, `data.js`, `assets/**`, `parks/**`, `auth.js`, `*.html` de producto, `HANDOVER.md.asc`, ni `specs/**`. Si los muestra, revertirlos — este encargo es read-only sobre el producto.
- **No crear PR** salvo petición explícita.

### T4.2 · Reporte al usuario
Resumen en el chat: cuántos hallazgos por severidad, los 3 principales, qué quedó bloqueado, y la pregunta de si quiere que se ejecuten los arreglos (encargo separado).

---

## Grafo de dependencias

```
T0.1 → T0.2 ┐
T0.3 ───────┴→ T1.1 ─┐
             T1.2 ───┴→ [ T2.A  T2.B  T2.C  T2.D  T2.E  T2.F  T2.G ]  (paralelas)
                                              │
                                              └→ T3.1 → T3.2 → T3.3 → T3.4 → T4.1 → T4.2
```

## Criterio de "hecho" del plan completo

- [ ] `audits/REPORTE-AUDITORIA.md` existe, en español, con resumen ejecutivo y veredicto sobre el tercer parque.
- [ ] Todo hallazgo P0/P1 pasó por T3.2 y está marcado `CONFIRMADO` o `DEGRADADO`.
- [ ] Ningún archivo de producto fue modificado (`git diff --stat` lo prueba).
- [ ] Ningún plaintext de `specs/` quedó en disco.
- [ ] `HANDOVER.md.asc` intacto.
- [ ] Todo pusheado a `claude/agentic-skill-audit-gubpxq`.
- [ ] Las tareas bloqueadas están listadas explícitamente con su razón, no omitidas en silencio.
