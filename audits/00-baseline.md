# T0.3 — Baseline antes de auditar

**Fecha:** 2026-08-24
**Comando:** `npm install && npm test`

## Resultado: ❌ FALLA (antes de cualquier cambio de esta auditoría)

```
> test
> node tests/theme-park/theme-park-core.spec.js

browserType.launch: Executable doesn't exist at
/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║     npx playwright install                                 ║
╚════════════════════════════════════════════════════════════╝
```

## Causa raíz

- `package.json` fija `"playwright": "^1.56.1"` (rango flotante) y **`package-lock.json` no está commiteado en el repo** (confirmado: `git log --all -- package-lock.json` no devuelve nada; el archivo en disco tras `npm install` queda como `??` sin trackear).
- Un `npm install` fresco en esta sesión resolvió Playwright **1.62.1**, que busca `chromium_headless_shell-1234`.
- El entorno trae preinstalado `chromium-1194` / `chromium_headless_shell-1194` (versión distinta, para el Playwright que estaba pineado cuando se preparó el entorno).
- Resultado: la única suite de tests del repo **no corre out-of-the-box** en un checkout limpio si `npm install` resuelve una versión de Playwright distinta a la que el entorno/CI tiene descargada.

Esto se reporta como hallazgo en **T2.G (cobertura de tests)** — no se corrige aquí (auditoría read-only), y no se modificó `tests/` para "hacerlo pasar".

## Nota metodológica para el resto de la auditoría

Para T2.F (performance/a11y), que necesita mediciones reales con Chromium, se usó un script **nuevo, fuera de `tests/`**, bajo `audits/`, apuntando explícitamente a `executablePath: '/opt/pw-browsers/chromium'` (el binario que sí existe en este entorno) — sin tocar `tests/theme-park-core.spec.js`. Ver `audits/2F-performance-a11y.md` para el detalle.
