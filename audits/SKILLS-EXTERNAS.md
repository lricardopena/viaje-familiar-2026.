# Skills externas — tooling opcional, nunca dependencia del repo

> **Regla:** *las skills externas son tooling opcional del entorno del agente, no una dependencia del repo.*

Este repo (`viaje-familiar-2026.`) es **autocontenido** para producto, tests y GitHub Pages.
Ningún checkout, clon, submódulo ni credencial de un repositorio externo o privado hace falta
para abrir la página, correr `npm test` o publicar en Pages. Si algo alguna vez lo exigiera,
eso es un bug de configuración, no un requisito.

## Dos tipos de skills, no confundirlos

| | Skills **locales del proyecto** | Skills **externas / privadas** |
|---|---|---|
| Dónde viven | `.claude/skills/<nombre>/SKILL.md`, dentro del repo | Fuera del repo (otro repositorio, otro directorio del workspace, el entorno del agente) |
| Versionadas con el repo | Sí — forman parte de sus instrucciones y capacidades específicas | No — nunca se commitean aquí |
| Ejemplos | `add-theme-park`, `theme-park-architecture-audit` | La colección `agentic-skills` (`coding-kiss`, `plan-triage`, `review-implementation-audit`, …) |
| Naturaleza | Producto/documentación del repo | Tooling del agente, opcional |

En los documentos de `audits/`, un nombre de skill en `código` **sin ruta** (p. ej. `coding-kiss`)
se refiere siempre a una skill **externa opcional**: se cita para explicar *con qué metodología*
se hizo esa auditoría, no como archivo que deba existir en este repo. Las nativas de Claude Code
se marcan "(nativa)" (`/security-review`, `update-config`) y las locales se citan con su ruta
`.claude/skills/…`.

## Flujo cuando una tarea quiere usar una skill externa

1. **Comprobar disponibilidad local primero.** ¿Está la skill ya presente en el entorno actual
   del agente (skills cargadas, un clon previo en el workspace, un directorio que el usuario ya
   indicó)? Si sí, se usa desde ahí.
2. **Si está disponible**, se lee/usa temporalmente **desde esa ubicación externa**. En el
   entregable se registra únicamente *que se usó desde una ruta externa*, sin convertir esa ruta
   en requisito del repo.
3. **Si no está disponible** y la tarea realmente se beneficiaría de ella, **preguntar al usuario**
   dónde están esas skills o cómo acceder al repositorio/directorio autorizado. No inventar rutas
   ni asumir acceso a repositorios privados.
4. **Con la ubicación o el acceso que dé el usuario**, el agente puede: clonarlas temporalmente
   **fuera** del repo, usar un checkout externo ya existente, o leerlas desde otra ruta del workspace.
5. **Ese checkout es temporal y es tooling:** no se añade a git, no se convierte en submódulo, no se
   copia dentro del repo público y no forma parte del deploy.
6. **Si no hay acceso y el usuario no lo proporciona**, el agente **continúa con las capacidades
   disponibles** y documenta explícitamente qué metodología externa no pudo utilizar.

## Lo que no se hace, nunca

- `git submodule add` de un repo de skills (privado o no) en este repo.
- Subtree, copia vendoreada o symlink commiteado de skills externas.
- Descarga automática de skills en build, tests o deploy.
- PAT, deploy key o GitHub Action que clone un repo privado para que el sitio o los tests funcionen.

La ausencia de estas skills nunca bloquea el build, los tests, GitHub Pages ni el uso de la aplicación.
