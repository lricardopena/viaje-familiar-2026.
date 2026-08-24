# Nota de ajuste al plan — skills externas (antiguas T0.1/T0.2)

**Actualizado:** las tareas T0.1 ("vendorear la colección de skills como submódulo") y T0.2
("registrar la ruta de skills en `.claude/settings.json`") **ya no existen en el plan**. Se
sustituyeron por una preparación ligera — `T0.1 · Resolver skills externas opcionales` — cuya
regla es: *las skills externas son tooling opcional del entorno del agente, no una dependencia
del repo* (flujo completo en `audits/SKILLS-EXTERNAS.md`).

## Por qué se eliminó el submódulo (antigua T0.1)

El submódulo apuntaba a un repositorio privado. En el checkout de GitHub Pages eso se traducía en
un intento de inicializarlo y un fallo `Repository not found`, que **rompía el build del sitio**.
El producto no necesita esas skills para ejecutarse, probarse ni desplegarse: son tooling de
desarrollo para agentes autorizados. Se eliminó el gitlink y `.gitmodules` completo; el repo vuelve
a ser autocontenido y su checkout no requiere acceso a ningún repositorio privado.

Tampoco se sustituyó por subtree, copia vendoreada, symlink commiteado, descarga automática, PAT,
deploy key ni GitHub Action que clone el repo privado — todas esas opciones reintroducen la misma
dependencia por otra vía.

## Por qué la antigua T0.2 no era ejecutable de todos modos

El schema real de `settings.json` de Claude Code no tiene ningún campo tipo
`skillDirectories`/`extraSkillPaths` para escanear un directorio arbitrario de `SKILL.md`. Las
únicas rutas de descubrimiento de skills son:

1. `.claude/skills/<nombre>/SKILL.md` — sólo el proyecto local (es el caso de las skills locales
   `theme-park-architecture-audit` y `add-theme-park`, que sí pertenecen a este repo y se quedan).
2. Skills empaquetadas como **plugin** vía un marketplace (`extraKnownMarketplaces` con source
   `directory`/`github`/`git`, apuntando a un `.claude-plugin/marketplace.json`). La colección de
   skills externas usada en esta auditoría no trae ese manifiesto — es un conjunto de `SKILL.md`
   sueltos, pensado para leerse directamente, no para instalarse como plugin.

## Cómo se usan entonces las skills externas

Se leen **desde donde ya estén disponibles en el entorno del agente**, como guía metodológica, sin
depender de que el harness las autodescubra por nombre y sin que su ruta entre nunca al repo. Si no
están disponibles, el agente pregunta al usuario por la ubicación/acceso cuando la tarea realmente lo
justifique, y si no lo obtiene, continúa con las capacidades disponibles y documenta qué metodología
externa no pudo utilizar. Ese checkout, si llega a existir, vive **fuera** del repo y es temporal: no
se añade a git, no se convierte en submódulo, no se copia al repo público y no forma parte del deploy.

Las citas a skills externas que quedan en los documentos de `audits/` (`coding-kiss`, `plan-triage`,
`review-implementation-audit`, …) son referencias **metodológicas**: explican cómo se hizo cada eje de
la auditoría. No son rutas del repo ni requisitos de ejecución.
