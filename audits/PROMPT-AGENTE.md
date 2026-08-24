# Prompt para el agente auditor

Copiar el bloque completo de abajo y enviarlo como primer mensaje al agente, en una sesión con acceso al repo `lricardopena/viaje-familiar-2026.`. **No hace falta acceso a ningún repo de skills:** las skills externas que cita el plan son tooling opcional del entorno del agente, no una dependencia de este repo (ver `audits/SKILLS-EXTERNAS.md`).

---

```
Vas a ejecutar una auditoría técnica read-only del repo viaje-familiar-2026.

EL PLAN ES TU CONTRATO
Lee audits/PLAN-AUDITORIA-2026.md completo antes de hacer nada. Ese archivo define
las fases, las tareas (T0.1 … T4.2), qué skill usa cada una, el alcance de archivos,
el entregable, la escala de severidad P0–P3 y el criterio de "hecho". Ejecútalo tal
como está escrito. Si algo del plan resulta imposible o equivocado al aterrizarlo,
dilo en el reporte final y sigue con el resto — no lo reinterpretes en silencio ni
lo abandones.

REGLAS DURAS
1. Es una auditoría, no un refactor. NO modifiques index.html, data.js, assets/**,
   parks/**, auth.js, storyland.html, legoland.html ni ningún archivo de producto.
   Sólo escribes archivos nuevos bajo audits/. Antes de commitear, corre `git diff --stat`
   y verifica que ningún archivo de producto aparece; si aparece, revierte.
2. HANDOVER.md.asc no se descifra ni se edita. Si un hallazgo debería registrarse ahí,
   anótalo en la sección "Pendiente de registrar" del reporte y sigue adelante.
3. specs/**/*.md.asc puedes descifrarlas y leerlas, pero SÓLO con una passphrase que yo
   te haya dado explícitamente en esta conversación. No la adivines, no la derives, no
   la reutilices de ningún otro contexto, no la imprimas. Si no te la he dado:
   ejecuta las tareas marcadas [sin-specs], marca las marcadas [requiere passphrase]
   como "BLOQUEADA — falta passphrase", y pregúntame una sola vez al final si la quiero
   proporcionar. No te detengas a esperar: entrega lo que sí se puede auditar.
   Descifra siempre a un directorio temporal FUERA del repo y bórralo antes de terminar.
4. Privacidad: la ubicación residencial de la familia nunca vive en este repo (la
   convención es la etiqueta literal "Home"). Si encuentras una dirección, coordenada,
   Plus Code o Place ID residencial commiteado, es un hallazgo CRÍTICO — repórtalo como
   "fuga en <archivo>:<línea>" SIN transcribir el valor.
5. Cada hallazgo lleva evidencia: archivo:línea más una cita corta. Un hallazgo que no
   puedas anclar así no entra al reporte.

CONTEXTO QUE TE AHORRA ERRORES
- Sitio 100% estático: sin build, sin bundler, sin package manager para el sitio. El
  package.json de la raíz existe SÓLO para los tests (Playwright) y no participa del
  deploy en GitHub Pages. No propongas "añadir un bundler" como si fuera gratis:
  el sitio se abre con doble clic desde file:// y eso es un requisito, no un accidente.
- data.js está formateado a una entrada por línea, e index.html está denso, ambos A
  PROPÓSITO (está documentado en CLAUDE.md). "Reformatear" no es un hallazgo.
- El core del Theme Park Companion (assets/theme-park-core.js) DEBE ser genérico: no
  puede saber nada específico de un parque, lo lee todo de window.PARK. Genérico no es
  sobre-ingeniería aquí — pero distingue "genérico porque hay dos parques y viene un
  tercero" de "genérico por si acaso". Aplica Chesterton's Fence: antes de marcar algo
  como innecesario, busca en git log y en los comentarios por qué se puso.
- El repo ya tiene skills locales en .claude/skills/ (theme-park-architecture-audit,
  add-theme-park). Están versionadas con el repo y forman parte de sus capacidades:
  úsalas donde el plan lo indica en vez de reinventar su análisis.
- Las skills EXTERNAS que cita el plan (coding-kiss, plan-triage, etc.) son tooling
  opcional de tu entorno, NO una dependencia del repo. Mira primero si ya las tienes
  disponibles; si sí, léelas desde esa ubicación externa. Si no y una tarea se
  beneficiaría de verdad, pregúntame dónde están o cómo acceder — no inventes rutas ni
  asumas acceso a repos privados. Si no te doy acceso, sigue con lo que tengas y
  documenta qué metodología externa no pudiste usar. Nunca las añadas a git, ni como
  submódulo, ni copiadas dentro del repo: el checkout es temporal y vive fuera. Ver
  audits/SKILLS-EXTERNAS.md.
- Chromium y Playwright ya están instalados. Para la tarea de rendimiento MIDE, no
  estimes: los mapas ilustrados pesan 1.5 MB y 2.0 MB, y el uso real es un teléfono
  dentro de un parque con datos móviles. Los números importan más que las opiniones.
- Todo el output al usuario va en español.

PARALELISMO
Las siete tareas de la Fase 2 (T2.A … T2.G) son independientes. Lánzalas como subagentes
en paralelo, uno por eje, cada uno escribiendo sólo su propio archivo en audits/. Las
Fases 0, 1, 3 y 4 son secuenciales.

ENTREGA
Rama: claude/agentic-skill-audit-gubpxq. Es la ÚNICA rama a la que puedes pushear.
Commitea todo audits/ y pushea con `git push -u origin claude/agentic-skill-audit-gubpxq`.
NO abras un pull request.
El entregable principal es audits/REPORTE-AUDITORIA.md, en español, con: resumen
ejecutivo de máximo 15 líneas, veredicto sobre si el repo aguanta un tercer parque,
tabla de hallazgos por severidad, un apartado "Antes del viaje" (lo que debe arreglarse
antes del 14 de agosto de 2026) y otro "Deuda que puede esperar".

CUANDO TERMINES
Dame en el chat: cuántos hallazgos por severidad, los 3 principales con su archivo:línea,
qué quedó bloqueado y por qué, y pregúntame si quiero que se ejecuten los arreglos.
Los arreglos son un encargo aparte — no los hagas ahora aunque te parezcan triviales.
```

---

## Variantes

**Si le vas a dar la passphrase de `specs/`:** añade al final del prompt, antes de enviarlo,
una línea con la passphrase y la nota `usa esta passphrase para specs/ únicamente`. Ten en
cuenta que queda en el historial de esa sesión (mismo tradeoff que la sección 62 del handover).

**Si sólo quieres una parte:** sustituye "Ejecútalo tal como está escrito" por
"Ejecuta únicamente las fases 0, 1 y las tareas T2.A, T2.E y T2.G; omite el resto y dilo
en el reporte". El plan está numerado precisamente para poder recortarlo así.

**Si quieres que además arregle:** no cambies este prompt. Manda el encargo de arreglos
como una segunda sesión, con el reporte ya en la rama — mezclar auditar y arreglar en una
sola pasada produce parches sin diagnóstico verificado.
