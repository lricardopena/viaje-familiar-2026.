# T0.2 — Nota de ajuste al plan

El plan pedía "registrar la ruta `agentic-skills/skills/` en `.claude/settings.json` (o el mecanismo correcto)
para que las skills se autodescubran junto a las locales".

**No existe ese mecanismo.** El schema real de `settings.json` de Claude Code no tiene ningún campo tipo
`skillDirectories`/`extraSkillPaths` para escanear un directorio arbitrario de `SKILL.md`. Las únicas rutas
de descubrimiento de skills son:
1. `.claude/skills/<nombre>/SKILL.md` — sólo el proyecto local (ya usado por `theme-park-architecture-audit` y `add-theme-park`).
2. Skills empaquetadas como **plugin** vía un marketplace (`extraKnownMarketplaces` con source `directory`/`github`/`git`, apuntando a un `.claude-plugin/marketplace.json`). El repo `agentic-skills` no trae ese manifiesto — es una colección de `SKILL.md` sueltos, pensada para consumirse con `npx skills@latest add` (copia snapshot) o como submódulo de referencia, no como plugin instalable.

**Ajuste aplicado:** T0.2 se marca `NO EJECUTABLE TAL COMO ESTABA ESCRITA`. En su lugar, el submódulo (T0.1)
queda en `agentic-skills/skills/<nombre>/SKILL.md` y las auditorías de la Fase 2 leen esos archivos directamente
como guía metodológica (Read), sin depender de que el harness las autodescubra por nombre. Esto no bloquea nada
del resto del plan — sólo cambia *cómo* se invoca cada skill (lectura directa en vez de `/nombre-skill`).

Si en el futuro se quiere invocar estas skills por nombre (`/coding-kiss`, etc.), la opción real sería copiar
o symlinkear los `SKILL.md` deseados dentro de `.claude/skills/` del proyecto — eso sí es soportado, pero no
es "registrar una ruta en settings.json" y tiene el efecto colateral de mezclarlas con las skills locales del
repo. Se deja fuera de esta auditoría por ser un cambio de configuración, no un hallazgo de auditoría.
