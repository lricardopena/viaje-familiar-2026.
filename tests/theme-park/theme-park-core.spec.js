#!/usr/bin/env node
/* ============================================================================
   tests/theme-park/theme-park-core.spec.js
   ============================================================================
   Dos suites con objetivos DISTINTOS, en el mismo archivo porque comparten
   toda la infraestructura (servidor HTTP efímero, helpers de Playwright):

   1. THIRD PARK CONTRACT TEST (secciones 0-12) — protege la GENERICIDAD del
      core. Corre contra tests/theme-park/fixtures/minimal-test-park.js/.html,
      un fixture sintético que nunca comparte ningún id/nombre/zona/tipo de
      POI con Story Land ni con LEGOLAND New York — deliberadamente, para que
      ningún check pueda "pasar por accidente" apoyándose en algo que el core
      solo sepa manejar porque coincide con uno de los otros dos parques. Es
      en la práctica nuestro "tercer parque" sintético (ver
      specs/operations/testing-and-validation.md.asc): si esta suite falla
      contra un cambio al core, ese cambio rompió el contrato genérico
      "window.PARK" — no es un problema del fixture. Cubre explícitamente:
      carga sin errores, contrato Required cumplido, candidateList()/
      getRecommendation() funcionando, hard constraints, elegibilidad,
      degradación progresiva de CADA capacidad opcional relevante (family,
      reactionSystem, shows, quickServices, map.poiFilterGroups,
      geoCalibration/map.image), extensibilidad de p.type, independencia de
      ids/nombres/zonas concretos, ausencia de lógica específica de parque en
      el core (verificación estática), y un negative contract test.

   2. REGRESSION TESTS (última sección) — protege el COMPORTAMIENTO de los
      parques reales ya en producción (Story Land, LEGOLAND New York),
      cargando storyland.html/legoland.html tal cual se sirven hoy. Un
      cambio puede pasar el Third Park Contract Test (sigue siendo genérico)
      y aun así romper algo específico de un parque real (p. ej. su
      geoCalibration o sus quickServices curados) — por eso son pruebas
      separadas con objetivos separados, y ambas se mantienen.

   Ejecutar:  npm test  (o npm run test:theme-park)
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
const FIXTURE_JS_PATH = path.join(REPO_ROOT, 'tests', 'theme-park', 'fixtures', 'minimal-test-park.js');
const CORE_JS_PATH = path.join(REPO_ROOT, 'assets', 'theme-park-core.js');
const MIME = {
  '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.png':'image/png', '.webp':'image/webp', '.json':'application/json',
};

// Campos "Required en la práctica" según specs/architecture/park-contract.md.asc
// §"Semántica Required/Optional/Derived" — mirror manual, no generado del docblock
// del core; si el contrato cambia ahí, actualizar esta lista también.
const REQUIRED_PARK_FIELDS = [
  'id','name','emoji','theme','copy','map','storageKey','attractions','pois',
  'mustIds','calmIds','categories','childFavoriteIds','waterIds','priorityGroups','tips',
];

// ids reales+fixture que el core NUNCA debe conocer por nombre — ver sección 0.
const KNOWN_PARK_IDS = ['story-land', 'legoland-new-york', 'minimal-test-park'];

/* stripJsComments: escáner de propósito específico (NO un lexer JS completo) que
   elimina comentarios de línea y de bloque, preservando intacto el contenido de
   strings/template literals — así un literal real como 'story-land' dentro de
   una comparación de código sigue siendo visible, mientras que la misma palabra
   dentro de un comentario de documentación desaparece (evita falsos positivos:
   el core menciona "LEGOLAND"/"Story Land" en comentarios explicando el
   contrato, eso es esperado y no debe disparar nada). Rastrea el estado de
   strings/template para no confundir "https://" dentro de un string con el
   inicio de un comentario de línea. No des-ambigua regex literals de división
   (no hace falta: assets/theme-park-core.js no usa regex con '/' interno —
   verificado a mano antes de introducir esto; ver README para el detalle). */
function stripJsComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let state = 'code'; // 'code' | 'sq' | 'dq' | 'tpl'
  const tplBraceStack = []; // profundidad de `{` dentro de cada interpolación ${...} abierta
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (state === 'code') {
      if (c === '/' && c2 === '/') { i += 2; while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && c2 === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
      if (c === "'") { out += c; state = 'sq'; i++; continue; }
      if (c === '"') { out += c; state = 'dq'; i++; continue; }
      if (c === '`') { out += c; state = 'tpl'; i++; continue; }
      if (tplBraceStack.length) {
        if (c === '{') tplBraceStack[tplBraceStack.length - 1]++;
        else if (c === '}') {
          tplBraceStack[tplBraceStack.length - 1]--;
          if (tplBraceStack[tplBraceStack.length - 1] === 0) { tplBraceStack.pop(); out += c; i++; state = 'tpl'; continue; }
        }
      }
      out += c; i++; continue;
    }
    if (state === 'sq' || state === 'dq') {
      if (c === '\\') { out += c + (c2 || ''); i += 2; continue; }
      out += c;
      if ((state === 'sq' && c === "'") || (state === 'dq' && c === '"')) state = 'code';
      i++; continue;
    }
    if (state === 'tpl') {
      if (c === '\\') { out += c + (c2 || ''); i += 2; continue; }
      if (c === '$' && c2 === '{') { out += c + c2; tplBraceStack.push(1); state = 'code'; i += 2; continue; }
      out += c;
      if (c === '`') state = 'code';
      i++; continue;
    }
    out += c; i++;
  }
  return out;
}

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
  console.log('============================================================');
  console.log('  THIRD PARK CONTRACT TEST');
  console.log('  (protege la genericidad de assets/theme-park-core.js: un');
  console.log('  tercer parque real debe poder integrarse solo con');
  console.log('  parks/<id>.js + window.PARK, sin tocar el core)');
  console.log('============================================================');

  console.log('\n=== 0. Verificación estática: el core no conoce ids de parque por nombre ===');
  // Puramente sobre el código fuente, sin browser — falla rápido si alguien
  // introdujo `if(PARK.id==='...')`, un `switch(PARK.id)`, o simplemente
  // escribió el nombre de un parque real/fixture en código (no en comentario)
  // dentro de assets/theme-park-core.js. Complementa (no sustituye) a la
  // sección 10, que prueba la misma propiedad de forma comportamental
  // renombrando ids/nombres/zonas en runtime — esta sección la prueba de
  // forma estática y explícita, con evidencia legible en el fallo.
  {
    const coreSrc = fs.readFileSync(CORE_JS_PATH, 'utf8');
    const stripped = stripJsComments(coreSrc);

    const idComparisonPattern = /(PARK|park)\s*\.\s*id\s*(===|==|!==|!=)/;
    const switchOnIdPattern = /switch\s*\(\s*(PARK|park)\s*\.\s*id\s*\)/;
    check('el core NO compara PARK.id/park.id contra un literal (if/===) fuera de comentarios',
      !idComparisonPattern.test(stripped), stripped.match(idComparisonPattern));
    check('el core NO tiene un switch(PARK.id) fuera de comentarios',
      !switchOnIdPattern.test(stripped));

    for (const id of KNOWN_PARK_IDS) {
      const found = stripped.includes(id);
      check(`el core nunca escribe el id de parque '${id}' en código real (solo puede aparecer en comentarios)`, !found);
    }
  }

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

    // Contrato mínimo obligatorio (park-contract.md.asc §Required) — comprobado
    // contra el PARK real cargado por el browser, no una copia en Node.
    const missingRequired = await pg.evaluate((REQUIRED) => {
      const p = window.PARK;
      const missing = REQUIRED.filter(f => p[f] === undefined || p[f] === null);
      if (p.map && !(p.map.url || p.map.center)) missing.push('map.url|map.center');
      return missing;
    }, REQUIRED_PARK_FIELDS);
    check('window.PARK cumple todos los campos Required del contrato (park-contract.md.asc)', missingRequired.length === 0, missingRequired);

    const candidateCount = await pg.evaluate(() => candidateList().length);
    check('candidateList() existe y devuelve candidatos no vacíos', candidateCount > 0, candidateCount);

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

    console.log('\n=== 4. Degradación progresiva: family/reactionSystem/shows ausentes no rompen el motor ===');
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

    // reactionSystem: el fixture ya lo trae en null (Story Land es el único parque real que lo
    // usa hoy — Polar->Roar). Comportamiento observable esperado: la "reactcard" (pregunta de
    // reacción) nunca debe renderizarse en la pestaña "Ahora", y computeScore()/getRecommendation()
    // deben seguir funcionando sin el bonus/boost que ese sistema aporta cuando existe.
    const reactionNull = await pg.evaluate(() => {
      let threw = false;
      try {
        setTab('ahora'); renderAll();
      } catch (e) { threw = true; }
      const reactCardExists = !!document.querySelector('.reactcard');
      const rec = getRecommendation();
      return { threw, reactCardExists, recExists: !!rec, reactionSystemIsNull: window.PARK.reactionSystem === null };
    });
    check('PARK.reactionSystem:null confirmado en el fixture (para que este check pruebe lo que dice probar)', reactionNull.reactionSystemIsNull);
    check('reactionSystem:null no lanza excepciones al renderizar', !reactionNull.threw);
    check('reactionSystem:null: la pregunta de reacción ("reactcard") nunca se muestra', !reactionNull.reactCardExists);
    check('reactionSystem:null sigue recomendando', reactionNull.recExists);

    // shows: el fixture lo trae en [] (arreglo vacío) — comportamiento observable esperado:
    // nextShowSoon()/showSoonBannerHtml() (el banner "empieza pronto") nunca se disparan, sin error.
    const showsEmpty = await pg.evaluate(() => {
      let threw = false, next = null, bannerHtml = null;
      try {
        next = nextShowSoon();
        bannerHtml = showSoonBannerHtml();
      } catch (e) { threw = true; }
      return { threw, next, bannerHtml, showsIsEmptyArray: Array.isArray(window.PARK.shows) && window.PARK.shows.length === 0 };
    });
    check('PARK.shows:[] confirmado en el fixture (para que este check pruebe lo que dice probar)', showsEmpty.showsIsEmptyArray);
    check('shows:[] no lanza excepciones en nextShowSoon()/showSoonBannerHtml()', !showsEmpty.threw);
    check('shows:[]: nextShowSoon() nunca encuentra un show próximo', showsEmpty.next === null);
    check('shows:[]: el banner "empieza pronto" nunca se dispara (HTML vacío)', showsEmpty.bannerHtml === '');

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

    // map.poiFilterGroups ausente (LEGOLAND sí lo usa para agrupar firstaid+familycare bajo
    // 'help'; el fixture no) — comportamiento derivado esperado: una categoría de filtro POR
    // CADA type distinto presente en pois, sin agrupar nada (park-contract.md.asc §"Contrato de
    // tipos de POI").
    const filterGroupsChecks = await pg.evaluate(() => {
      const cats = mapGeoAllCategories();
      return {
        noPoiFilterGroupsConfigured: !(window.PARK.map && window.PARK.map.poiFilterGroups),
        oneCategoryPerType: ['restroom', 'food', 'hydration-point'].every(t => cats.includes(t)),
        noGroupingApplied: !cats.includes('help'), // 'help' es el nombre de grupo que usa LEGOLAND — no debe aparecer acá
      };
    });
    check('fixture no tiene map.poiFilterGroups configurado', filterGroupsChecks.noPoiFilterGroupsConfigured);
    check('map.poiFilterGroups ausente -> una categoría de filtro derivada por cada type distinto', filterGroupsChecks.oneCategoryPerType);
    check('map.poiFilterGroups ausente -> ningún type se agrupa (no hay agrupación inventada)', filterGroupsChecks.noGroupingApplied);

    console.log('\n=== 10. El core no depende de ids/nombres/zonas/tipos concretos (comportamental) ===');
    // Complementa la verificación estática de la sección 0: ahí se prueba que el core no
    // MENCIONA ids de parque en su código; acá se prueba, en tiempo de ejecución, que tampoco
    // DEPENDE de ellos — renombrar todo en caliente no debe romper nada.
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

  console.log('\n=== 12. Negative contract test: falta un campo Required -> el core NO finge que funciona ===');
  // Copia en memoria del fixture (nunca se escribe a disco, nunca se toca el archivo real):
  // se lee minimal-test-park.js una vez y se le quita el bloque `attractions:[...]` (Required
  // según park-contract.md.asc) con un replace de string; el resultado se sirve SOLO para esta
  // página de prueba interceptando la petición de red con ctx.route() y respondiendo con el
  // contenido mutado. Así el core real arranca desde cero contra un PARK genuinamente roto
  // desde el principio (a diferencia de mutar window.PARK después de cargado, que no serviría:
  // el core cachea `const ALL=PARK.attractions||[]` una sola vez al cargar — mutar la propiedad
  // después no lo afectaría, así que la única forma honesta de probar esto es rompiendo el dato
  // ANTES de que el core lo lea por primera vez).
  {
    const realFixtureSrc = fs.readFileSync(FIXTURE_JS_PATH, 'utf8');
    const brokenSrc = realFixtureSrc.replace(/attractions:\[[\s\S]*?\],\n  pois:/, 'pois:');
    if (brokenSrc === realFixtureSrc) {
      throw new Error('El patrón para romper attractions:[...] en memoria ya no coincide con minimal-test-park.js — actualizar el replace() de la sección 12 si el fixture cambió de forma.');
    }

    const { ctx, pg, errors } = await newPage(browser, { viewport: { width: 412, height: 892 }, permissions: [] });
    await ctx.route('**/tests/theme-park/fixtures/minimal-test-park.js', route => route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: brokenSrc,
    }));
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(300);

    const result = await pg.evaluate((REQUIRED) => {
      const p = window.PARK;
      const missing = REQUIRED.filter(f => p[f] === undefined || p[f] === null);
      let candidateListThrew = false, candidateListResult = null, recExists = null;
      try {
        candidateListResult = candidateList();
        recExists = !!getRecommendation();
      } catch (e) { candidateListThrew = true; }
      return { missing, candidateListThrew, candidateListLength: Array.isArray(candidateListResult) ? candidateListResult.length : null, recExists };
    }, REQUIRED_PARK_FIELDS);

    check('la copia en memoria del fixture SÍ le falta `attractions` (nuestra mutación surtió efecto)', result.missing.includes('attractions'), result.missing);
    check('el checker de contrato Required detecta la violación (attractions faltante)', result.missing.length > 0, result.missing);
    // El core es defensivo (`PARK.attractions||[]`) así que NO lanza una excepción — precisamente
    // por eso el checker explícito de arriba importa: sin él, un campo Required faltante degrada
    // en silencio a una app sin candidatos, indistinguible a simple vista de un parque real vacío.
    check('sin `attractions`, el core no finge funcionar: candidateList() queda vacía', result.candidateListLength === 0, result);
    check('sin `attractions`, el core no finge funcionar: getRecommendation() no puede recomendar nada', result.recExists === false, result);

    await ctx.close();
  }

  console.log('\n============================================================');
  console.log('  REGRESSION TESTS — Story Land / LEGOLAND New York reales');
  console.log('  (objetivo DISTINTO del Third Park Contract Test de arriba:');
  console.log('  protege el comportamiento de los parques reales existentes,');
  console.log('  no la genericidad del core — ambas suites se mantienen)');
  console.log('============================================================');
  console.log('\n=== 13. Regresión contra los parques reales (Story Land, LEGOLAND New York) ===');
  // A diferencia de las secciones 0-12 (Third Park Contract Test, contra el fixture sintético),
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
