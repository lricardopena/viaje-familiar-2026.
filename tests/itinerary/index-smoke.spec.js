#!/usr/bin/env node
/* ============================================================================
   tests/itinerary/index-smoke.spec.js
   ============================================================================
   Test smoke del itinerario (index.html + data.js) — la parte de la app que
   se usa todos los días del viaje y que, a diferencia del Theme Park
   Companion (ver tests/theme-park/), no tenía ningún test (ver
   audits/2G-cobertura-tests.md, hallazgo H3).

   No pretende ser exhaustivo: sólo confirma que la página real, con los
   datos reales de data.js, renderiza sin excepciones de JS y produce
   exactamente una sección por día declarado en TRIP_DATA.days. Las
   funciones de pattern-matching en español (wicon/clothes/actIcon/excite/
   expectation/mission/story — ver CLAUDE.md) fallan silenciosamente ante
   vocabulario no anticipado; este test no verifica su salida caso por caso,
   solo que ninguna de ellas lanza una excepción con los datos reales de hoy.

   Ejecutar:  npm run test:itinerary
   o bien:    node tests/itinerary/index-smoke.spec.js
   Requiere Playwright instalado (ver package.json).

   Bloquea peticiones de red externas (fotos de Wikimedia Commons vía IMG())
   a propósito: este es un smoke test de renderizado, no una prueba de que
   las imágenes de referencia cargan — evita flakiness/lentitud por red
   externa. Levanta su propio servidor HTTP estático efímero sirviendo la
   raíz del repo, igual que tests/theme-park/theme-park-core.spec.js.
   ============================================================================ */
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json',
};

let passed = 0, failed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name); console.error(`  ❌ ${name}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
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

(async () => {
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 892 } });

  // Bloquea red externa (fotos de Wikimedia Commons vía IMG()) — smoke test
  // de renderizado, no de disponibilidad de imágenes externas.
  await ctx.route('https://upload.wikimedia.org/**', route => route.abort());
  await ctx.route('https://commons.wikimedia.org/**', route => route.abort());

  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404') && !msg.text().includes('net::ERR_')) {
      errors.push('console: ' + msg.text());
    }
  });

  console.log('\n=== Itinerario (index.html + data.js real) ===');
  await pg.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(300);

  const info = await pg.evaluate(() => ({
    tripDataLoaded: typeof TRIP_DATA === 'object' && Array.isArray(TRIP_DATA.days),
    expectedDayCount: typeof TRIP_DATA === 'object' ? TRIP_DATA.days.length : null,
    renderedDaySections: document.querySelectorAll('#days section.day').length,
    navButtons: document.querySelectorAll('#nav button, #nav a').length,
    // ids de sección deben coincidir 1:1 con el campo "d" de cada día (ver index.html:74, id="d${x.d}")
    dayIdsMatch: typeof TRIP_DATA === 'object'
      ? TRIP_DATA.days.every(x => !!document.getElementById('d' + x.d))
      : false,
  }));

  check('TRIP_DATA cargó desde data.js con un array days[]', info.tripDataLoaded, info);
  check(`se renderizó una <section class="day"> por cada entrada de TRIP_DATA.days (${info.expectedDayCount})`,
    info.renderedDaySections === info.expectedDayCount, info);
  check('cada día tiene su id de sección correspondiente (id="d<N>")', info.dayIdsMatch);
  check('la barra de navegación de días se generó (al menos un botón/enlace)', info.navButtons > 0, info.navButtons);
  check('carga sin errores de consola/página', errors.length === 0, errors);

  await ctx.close();
  await browser.close();
  server.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    console.error('\nFAILED CHECKS:', failures.join(', '));
    process.exit(1);
  }
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
