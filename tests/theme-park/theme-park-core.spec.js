#!/usr/bin/env node
/* ============================================================================
   tests/theme-park/theme-park-core.spec.js
   ============================================================================
   Test automatizado, versionado y reproducible del contrato mínimo del motor
   genérico (assets/theme-park-core.js) contra el fixture de prueba
   tests/theme-park/fixtures/minimal-test-park.js/.html — NO contra Story Land
   ni LEGOLAND New York, a propósito (ver el fixture para el porqué).

   Este test es parte del contrato arquitectónico del Theme Park Companion:
   "un tercer parque debe poder agregarse mediante parks/<park-id>.js +
   configuración + thin HTML shell, sin modificar assets/theme-park-core.js"
   (ver specs/operations/testing-and-validation.md.asc). Si este test falla contra un
   cambio al core, ese cambio rompió el contrato genérico — no es un problema
   del fixture.

   Ejecutar:  npm test
   o bien:    node tests/theme-park/theme-park-core.spec.js
   Requiere Playwright instalado (ver package.json / tests/theme-park/README.md).

   El fixture se sirve con un servidor HTTP estático mínimo levantado por este
   mismo script (sin depender de ninguna herramienta externa) — necesario
   porque el mapa geográfico (Leaflet) y algunas rutas relativas no funcionan
   de forma confiable sobre file://. Se sirve la RAÍZ del repo (no solo
   tests/) para que el fixture pueda cargar el mismo
   assets/theme-park-core.js/.css de producción con sus rutas relativas tal
   cual — nunca una copia especial para tests.
   ============================================================================ */
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE_PATH = '/tests/theme-park/fixtures/minimal-test-park.html';
const MIME = {
  '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.png':'image/png', '.webp':'image/webp', '.json':'application/json',
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

async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts || {});
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404') && !msg.text().includes('TUNNEL') && !msg.text().includes('net::ERR_')) {
      errors.push('console: ' + msg.text());
    }
  });
  return { ctx, pg, errors };
}

(async () => {
  const server = await startServer();
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}${FIXTURE_PATH}`;
  const browser = await chromium.launch();

  console.log('\n=== 1. Carga sin errores + recomienda una atracción ===');
  {
    const { ctx, pg, errors } = await newPage(browser, {
      viewport: { width: 412, height: 892 },
      permissions: ['geolocation'],
      geolocation: { latitude: 36.97465, longitude: -122.03102, accuracy: 10 },
    });
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(300);
    await pg.evaluate(() => mapGpsButtonTap()); // concede GPS (mockeado por el context) para las pruebas de proximidad
    await pg.waitForTimeout(1200);

    const loaded = await pg.evaluate(() => ({
      parkId: window.PARK && window.PARK.id,
      hasCore: typeof getRecommendation === 'function',
    }));
    check('carga sin errores de página', errors.length === 0, errors);
    check('window.PARK del fixture cargó', loaded.parkId === 'minimal-test-park');
    check('el core (theme-park-core.js) se cargó', loaded.hasCore === true);

    const rec = await pg.evaluate(() => { const r = getRecommendation(); return r && r.id; });
    check('recomienda una atracción', !!rec, rec);

    console.log('\n=== 2. done/closed/discarded/unavailable como hard constraints ===');
    const hardConstraints = await pg.evaluate(() => {
      const out = {};
      // sealedPavilion: unavailable:true desde el fixture — hard-excluded siempre
      out.unavailableExcluded = !candidateList().some(a => a.id === 'sealedPavilion');
      out.unavailableIsHard = isHardExcluded(BY_ID['sealedPavilion']);
      // done/closed/discarded sobre harborGlide (probado uno a la vez, revertido después de cada uno)
      actDone('harborGlide');
      out.doneExcluded = !candidateList().some(a => a.id === 'harborGlide');
      cycleStatus('harborGlide', 'done'); // revierte a pending (mismo botón de nuevo)
      actClose('harborGlide');
      out.closedExcluded = !candidateList().some(a => a.id === 'harborGlide');
      cycleStatus('harborGlide', 'closed');
      actDiscard('harborGlide');
      out.discardedExcluded = !candidateList().some(a => a.id === 'harborGlide');
      cycleStatus('harborGlide', 'discarded');
      out.harborGlideBackToPending = getStatus('harborGlide') === 'pending';
      return out;
    });
    check('unavailable:true excluye de candidateList()', hardConstraints.unavailableExcluded);
    check('unavailable:true es hard constraint (isHardExcluded)', hardConstraints.unavailableIsHard);
    check('done excluye de candidateList()', hardConstraints.doneExcluded);
    check('closed excluye de candidateList()', hardConstraints.closedExcluded);
    check('discarded excluye de candidateList()', hardConstraints.discardedExcluded);
    check('el toggle revierte correctamente a pending', hardConstraints.harborGlideBackToPending);

    console.log('\n=== 3. Elegibilidad: unknown / mixta / "ningún niño" NO excluye ===');
    const eligibility = await pg.evaluate(() => {
      const unknownHtml = eligibilityFactHtml(BY_ID['driftwoodPath']);
      const mixedInList = candidateList().some(a => a.id === 'harborGlide');
      const towerInList = candidateList().some(a => a.id === 'towerLookout');
      const towerAllIneligible = allRegisteredChildrenIneligible(BY_ID['towerLookout']);
      const towerHtml = eligibilityFactHtml(BY_ID['towerLookout']);
      return {
        unknownSaysUnverified: unknownHtml.includes('Sin verificar'),
        unknownNeverSaysCanRide: !unknownHtml.includes('✅ Puede subir'),
        mixedInList,
        towerInList,
        towerAllIneligible,
        towerShowsWarning: towerHtml.includes('Ningún niño registrado cumple'),
      };
    });
    check('sin `restrictions` -> "❓ Sin verificar" (nunca ✅)', eligibility.unknownSaysUnverified && eligibility.unknownNeverSaysCanRide);
    check('elegibilidad mixta (harborGlide) NO excluida', eligibility.mixedInList);
    check('"ningún niño registrado cumple" (towerLookout) NO excluye la atracción', eligibility.towerInList);
    check('allRegisteredChildrenIneligible() detecta el caso correctamente', eligibility.towerAllIneligible);
    check('se muestra el aviso informativo correspondiente', eligibility.towerShowsWarning);

    console.log('\n=== 4. family:null no rompe el motor ===');
    const familyNull = await pg.evaluate(() => {
      const prevFamily = window.PARK.family;
      window.PARK.family = null;
      let threw = false, rec2 = null, elig = null;
      try {
        rec2 = getRecommendation();
        elig = eligibilityFactHtml(BY_ID['harborGlide']);
        renderAll();
      } catch (e) { threw = true; }
      window.PARK.family = prevFamily;
      renderAll();
      return { threw, recExists: !!rec2, eligNeverSaysCanRide: elig ? !elig.includes('✅ Puede subir') : null };
    });
    check('family:null no lanza excepciones', !familyNull.threw);
    check('family:null sigue recomendando', familyNull.recExists);
    check('family:null: elegibilidad sin restrictions sigue sin afirmar ✅', familyNull.eligNeverSaysCanRide);

    console.log('\n=== 5. Wait observations independientes del status ===');
    const waitObs = await pg.evaluate(() => {
      const out = {};
      recordWaitObservation('driftwoodPath', '0-10', { source: 'manual' });
      const obs = waitObservation('driftwoodPath');
      out.shape = obs && Object.keys(obs).sort();
      out.hasSource = obs && obs.source === 'manual';
      out.adjPositive = waitTimeScoreAdjust(BY_ID['driftwoodPath']) > 0;
      // Wait observation on a hard-excluded (unavailable) attraction never brings it back
      recordWaitObservation('sealedPavilion', '0-10', { source: 'manual' });
      out.stillExcludedWithWait = !candidateList().some(a => a.id === 'sealedPavilion');
      clearWaitTime('driftwoodPath');
      clearWaitTime('sealedPavilion');
      return out;
    });
    check('waitObservation() tiene la forma {range,observedAt,source,ttlMs,...}', waitObs.shape && ['ageMin','expired','observedAt','range','source','ttlMs'].every(k => waitObs.shape.includes(k)), waitObs.shape);
    check('source:"manual" se persiste', waitObs.hasSource);
    check('ajuste de score de una fila corta es positivo', waitObs.adjPositive);
    check('una fila corta NUNCA revive una atracción hard-excluded (unavailable)', waitObs.stillExcludedWithWait);

    console.log('\n=== 6. Geo parcial no rompe la app + proximidad solo con geo+GPS ===');
    const geoChecks = await pg.evaluate(() => {
      const withGeo = gpsDistanceMeters(BY_ID['harborGlide'].geo);
      const withoutGeo = gpsDistanceMeters(BY_ID['driftwoodPath'].geo);
      return { withGeoIsNumber: typeof withGeo === 'number', withoutGeoIsNull: withoutGeo === null };
    });
    check('proximidad calculada para atracción CON geo+GPS', geoChecks.withGeoIsNumber);
    check('proximidad null (nunca inventada) para atracción SIN geo', geoChecks.withoutGeoIsNull);

    console.log('\n=== 7. Accesos rápidos derivados de POIs (sin PARK.quickServices) ===');
    const quickSvc = await pg.evaluate(() => {
      setTab('ahora'); renderAll();
      const list = quickServiceList();
      const tileTypes = list.map(t => t.type);
      return { configured: window.PARK.quickServices, derivedTypes: tileTypes };
    });
    check('PARK.quickServices NO está configurado en el fixture', quickSvc.configured === undefined);
    check('quickServiceList() derivó tiles de los POIs presentes (restroom/food/hydration-point)', ['restroom','food','hydration-point'].every(t => quickSvc.derivedTypes.includes(t)), quickSvc.derivedTypes);

    console.log('\n=== 8. Tipo de POI inventado (hydration-point) sin cambios al core ===');
    const invented = await pg.evaluate(() => {
      const label = poiTypeLabel('hydration-point');
      const near = nearestOfTypes(['hydration-point']); // sin geo -> null, pero no debe tirar error
      const cats = mapGeoAllCategories();
      return { label, nearOk: near === null, categoryIncluded: cats.includes('hydration-point') };
    });
    check('poiTypeLabel() deriva una etiqueta razonable para un type nunca visto', !!invented.label && invented.label !== 'undefined', invented.label);
    check('nearestOfTypes() no revienta con un type inventado sin geo', invented.nearOk);
    check('el type inventado aparece como categoría de filtro del mapa geográfico', invented.categoryIncluded, invented.categoryIncluded);

    console.log('\n=== 9. Mapa geográfico funciona sin mapa ilustrado + sin geoCalibration ===');
    const mapChecks = await pg.evaluate(() => {
      return new Promise(resolve => {
        openParkMap('harborGlide', { forceView: 'oficial' });
        setTimeout(() => {
          const illustratedFallback = !document.getElementById('mapSheetFallback').hidden;
          closeParkMap();
          openParkMap(null, { forceView: 'geo' });
          setTimeout(() => {
            const geoChipsExist = document.querySelectorAll('#mapGeoFilters button[data-filter]').length > 0;
            const noGeoCalibration = !(window.PARK.map && window.PARK.map.geoCalibration);
            const illustratedGpsNeverActive = geoToImagePercent(36.97465, -122.03102) === null;
            closeParkMap();
            resolve({ illustratedFallback, geoChipsExist, noGeoCalibration, illustratedGpsNeverActive });
          }, 400);
        }, 400);
      });
    });
    check('mapa ilustrado cae a fallback (map.image:null)', mapChecks.illustratedFallback);
    check('mapa geográfico sigue funcionando (chips de filtro presentes)', mapChecks.geoChipsExist);
    check('fixture no tiene geoCalibration', mapChecks.noGeoCalibration);
    check('"Estás aquí" ilustrado nunca se activa sin geoCalibration', mapChecks.illustratedGpsNeverActive);

    console.log('\n=== 10. Cambiar ids/nombres/zonas/tipos de POI no requiere tocar el core ===');
    const renamed = await pg.evaluate(() => {
      // Muta el PARK ya cargado con nombres completamente distintos, en runtime, y confirma que
      // el motor (ya cargado, sin recargar el script) sigue funcionando sin ningún error —
      // demuestra que ninguna decisión del core depende de los ids/nombres/tipos concretos.
      const a = BY_ID['harborGlide'];
      const originalId = a.id;
      window.PARK.attractions.forEach(x => { x.id = 'renamed_' + x.id; x.name = 'Renamed ' + x.name; x.zone = 'Renamed Zone'; });
      window.PARK.pois.forEach(x => { x.id = 'renamed_' + x.id; x.type = 'renamed_' + x.type; });
      let threw = false;
      try {
        BY_ID['renamed_' + originalId] = { ...window.PARK.attractions.find(x => x.id === 'renamed_' + originalId), _i: 0 };
        renderAll();
        getRecommendation();
        candidateList();
        servicesHtml();
        quickServicesHtml();
      } catch (e) { threw = true; }
      return { threw };
    });
    check('renombrar ids/nombres/zonas/tipos de POI en runtime no rompe el motor', !renamed.threw);

    console.log('\n=== Errores de consola/página acumulados durante todo el flujo ===');
    check('cero errores de consola/página relevantes', errors.length === 0, errors);

    await ctx.close();
  }

  console.log('\n=== 11. GPS denegado: la app sigue siendo usable ===');
  {
    const { ctx, pg, errors } = await newPage(browser, { viewport: { width: 412, height: 892 }, permissions: [] });
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(300);
    const noGps = await pg.evaluate(() => {
      const rec = getRecommendation();
      const dist = gpsDistanceMeters(BY_ID['harborGlide'].geo);
      setTab('ahora'); renderAll();
      const tiles = document.querySelectorAll('.quicksvc-tile').length;
      return { recExists: !!rec, distNull: dist === null, tilesRender: tiles > 0 };
    });
    check('sin GPS: sigue recomendando', noGps.recExists);
    check('sin GPS: nunca fabrica distancia', noGps.distNull);
    check('sin GPS: accesos rápidos siguen renderizando (con "Ver lista")', noGps.tilesRender);
    check('sin GPS: cero errores de consola/página', errors.length === 0, errors);
    await ctx.close();
  }

  console.log('\n=== 12. Regresión contra los parques reales (Story Land, LEGOLAND New York) ===');
  // A diferencia de las secciones 1-11 (contrato genérico contra el fixture sintético),
  // esto carga storyland.html/legoland.html tal cual se sirven en producción —
  // exige explícitamente specs/operations/testing-and-validation.md.asc:
  // "validar con Playwright contra ambos parques además del fixture sintético".
  // auth.js/auth.css se cargan igual que en producción: no bloquean la ejecución
  // del motor (solo ocultan visibilidad vía CSS), así que no hace falta simular login.
  const REAL_PARKS = [
    {
      label: 'Story Land',
      path: '/storyland.html',
      expectedId: 'story-land',
      // reactionSystem configurado (Polar -> Roar) es específico de Story Land — ver parks/story-land.js
      expectReactionSystem: true,
    },
    {
      label: 'LEGOLAND New York',
      path: '/legoland.html',
      expectedId: 'legoland-new-york',
      // quickServices + map.poiFilterGroups configurados explícitamente — ver parks/legoland-new-york.js
      expectQuickServicesConfigured: true,
      expectPoiFilterGroups: true,
    },
  ];
  for (const park of REAL_PARKS) {
    console.log(`\n  --- ${park.label} (${park.path}) ---`);
    const { ctx, pg, errors } = await newPage(browser, { viewport: { width: 412, height: 892 }, permissions: [] });
    await pg.goto(`http://127.0.0.1:${port}${park.path}`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(500);

    const info = await pg.evaluate(() => ({
      parkId: window.PARK && window.PARK.id,
      hasCore: typeof getRecommendation === 'function',
      candidateCount: typeof candidateList === 'function' ? candidateList().length : null,
      recExists: !!getRecommendation(),
      quickServicesConfigured: !!(window.PARK.quickServices && window.PARK.quickServices.length),
      poiFilterGroupsConfigured: !!(window.PARK.map && window.PARK.map.poiFilterGroups),
      reactionSystemConfigured: !!window.PARK.reactionSystem,
    }));

    check(`${park.label}: carga sin errores de consola/página`, errors.length === 0, errors);
    check(`${park.label}: window.PARK.id === '${park.expectedId}'`, info.parkId === park.expectedId, info.parkId);
    check(`${park.label}: el core se cargó`, info.hasCore === true);
    check(`${park.label}: candidateList() no está vacía`, info.candidateCount > 0, info.candidateCount);
    check(`${park.label}: getRecommendation() devuelve una atracción`, info.recExists);
    if (park.expectQuickServicesConfigured) {
      check(`${park.label}: PARK.quickServices sigue configurado (accesos rápidos curados)`, info.quickServicesConfigured);
    }
    if (park.expectPoiFilterGroups) {
      check(`${park.label}: PARK.map.poiFilterGroups sigue configurado (filtro "Ayuda" agrupado)`, info.poiFilterGroupsConfigured);
    }
    if (park.expectReactionSystem) {
      check(`${park.label}: PARK.reactionSystem sigue configurado (Polar -> Roar)`, info.reactionSystemConfigured);
    }

    await ctx.close();
  }

  await browser.close();
  server.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    console.error('\nFAILED CHECKS:', failures.join(', '));
    process.exit(1);
  }
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
