#!/usr/bin/env node
/* ============================================================================
   tests/accessibility/axe-audit.spec.js
   ============================================================================
   Pase de accesibilidad con axe-core (vía @axe-core/playwright) sobre el
   Theme Park Companion (storyland.html, legoland.html) con datos reales —
   ver audits/04-tickets.md TICKET-5 (H6, audits/2F-performance-a11y.md), que
   dejó la densidad baja de `aria-*` en assets/theme-park-core.js como
   "no verificable sin herramienta dedicada" en la auditoría original.

   Alcance deliberadamente separado de npm test: a diferencia de
   tests/theme-park/theme-park-core.spec.js (contrato) y
   tests/itinerary/index-smoke.spec.js (renderizado), esto es un AUDIT, no
   una regresión funcional — corre bajo `npm run test:a11y`, no encadenado
   en `npm test`, para no acoplar el pipeline de tests a reglas WCOAG que
   pueden requerir criterio humano para decidir cómo resolver (falso
   positivo vs. violación real).

   Reglas evaluadas: WCAG 2.0/2.1 nivel A y AA (el objetivo declarado en
   audits/2F-performance-a11y.md), vía axe-core withTags(). Falla si hay
   alguna violación de impacto 'serious' o 'critical' — coincide con el
   criterio de aceptación de TICKET-5.

   Bypassea el gate de auth.js (auth.js/auth.css) inyectando una sesión
   válida en localStorage ANTES de que cualquier script de la página
   corra (page.addInitScript) — así se audita la vista real de la
   familia autenticada, no la pantalla de login. auth.js nunca se
   modifica ni se desactiva: solo se le da un estado de sesión ya
   autenticado.

   Ejecutar:  npm run test:a11y
   o bien:    node tests/accessibility/axe-audit.spec.js
   ============================================================================ */
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json',
};
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Mismo storageKey/forma de sesión que auth.js (AUTH_CONFIG.storageKey,
// readSession()) — nunca se toca auth.js, solo se le da un estado válido.
const AUTH_SESSION_KEY = 'viaje2026_auth_session';

let passed = 0, failed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name); console.error(`  ❌ ${name}${detail !== undefined ? '\n     ' + detail : ''}`); }
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(REPO_ROOT, urlPath);
      if (!filePath.startsWith(REPO_ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function formatViolations(violations) {
  return violations.map(v => {
    const targets = v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ');
    const more = v.nodes.length > 3 ? ` (+${v.nodes.length - 3} más)` : '';
    return `[${v.impact}] ${v.id}: ${v.help} — ${v.nodes.length} nodo(s): ${targets}${more}\n     ${v.helpUrl}`;
  }).join('\n     ');
}

const TARGETS = [
  { label: 'Story Land', path: '/storyland.html', tabs: ['ahora', 'checklist', 'favoritas', 'tips'] },
  { label: 'LEGOLAND New York', path: '/legoland.html', tabs: ['ahora', 'checklist', 'favoritas', 'tips'] },
];

(async () => {
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch();

  const allViolationsByPage = [];

  for (const target of TARGETS) {
    console.log(`\n=== ${target.label} (${target.path}) ===`);
    const ctx = await browser.newContext({ viewport: { width: 412, height: 892 } });
    // Sesión ya autenticada, inyectada antes de que auth.js corra — auditamos la
    // vista real de la familia, no la pantalla de login.
    await ctx.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ authenticated: true, expiresAt: Date.now() + 3600 * 1000 }));
    }, AUTH_SESSION_KEY);
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${port}${target.path}`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(500);

    for (const tab of target.tabs) {
      await pg.evaluate((t) => { setTab(t); renderAll(); }, tab);
      await pg.waitForTimeout(200);

      const results = await new AxeBuilder({ page: pg }).withTags(WCAG_TAGS).analyze();
      const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      const minor = results.violations.filter(v => v.impact !== 'serious' && v.impact !== 'critical');

      check(
        `${target.label} · pestaña "${tab}": sin violaciones serious/critical (WCAG A/AA)`,
        serious.length === 0,
        serious.length ? formatViolations(serious) : undefined
      );
      if (minor.length) {
        console.log(`     (info, no bloqueante) ${minor.length} violación(es) menor/moderada en "${tab}": ${minor.map(v => v.id).join(', ')}`);
      }
      allViolationsByPage.push({ label: target.label, tab, serious, minor });
    }

    await ctx.close();
  }

  await browser.close();
  server.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  const totalSerious = allViolationsByPage.reduce((n, p) => n + p.serious.length, 0);
  const totalMinor = allViolationsByPage.reduce((n, p) => n + p.minor.length, 0);
  console.log(`Total violaciones serious/critical: ${totalSerious} · menores/moderadas (informativas): ${totalMinor}`);
  if (failed) {
    console.error('\nFAILED CHECKS:', failures.join(', '));
    process.exit(1);
  }
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
