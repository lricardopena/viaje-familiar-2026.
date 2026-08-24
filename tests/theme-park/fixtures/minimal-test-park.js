/* ============================================================================
   tests/theme-park/fixtures/minimal-test-park.js — fixture de prueba, NO un
   parque soportado
   ============================================================================
   Vive bajo tests/, no bajo parks/, a propósito: parks/ está reservado para
   parques reales que forman parte de la aplicación (Story Land, LEGOLAND New
   York, y cualquier futuro parque real de la familia). Este archivo existe
   únicamente para probar el criterio de aceptación arquitectónico —
   "un tercer parque debe poder agregarse mediante parks/<park-id>.js +
   configuración + thin HTML shell, sin modificar assets/theme-park-core.js"
   — desde tests/theme-park/theme-park-core.spec.js. Nunca se enlaza desde
   index.html ni se muestra a la familia.

   Deliberadamente NO comparte ningún id/nombre/zona/miembro de familia con
   Story Land ni con LEGOLAND New York, para que el test no pueda "pasar por
   accidente" apoyándose en algo que el core solo sepa manejar porque coincide
   con uno de los otros dos parques. Ver specs/operations/new-park-checklist.md.asc
   y specs/operations/testing-and-validation.md.asc para el detalle de qué se está
   probando y por qué.

   Cobertura deliberada (ver theme-park-core.spec.js para los asserts):
     - `harborGlide`: CON `geo` y `restrictions` que un participante
       registrado cumple y el otro no (elegibilidad mixta, no excluye).
     - `driftwoodPath`: SIN `restrictions` — la elegibilidad debe mostrarse
       como "unknown"/"❓ Sin verificar", nunca "✅ Puede subir" solo por
       ausencia de datos. SIN `geo` — la proximidad no debe inventar nada.
     - `towerLookout`: restricción que NINGÚN niño registrado cumple — debe
       seguir siendo candidata (NO hard-excluded): `PARK.family` solo modela
       `children`, no adultos, así que "los niños no cumplen" nunca implica
       "nadie de la familia puede subir".
     - `sealedPavilion`: `unavailable:true` — este SÍ es un hard constraint
       inequívoco, debe quedar excluida de candidateList() siempre.
     - `map.image:null` y sin `map.geoCalibration` — el mapa ilustrado debe
       caer a su fallback, "🔵 Estás aquí" ilustrado nunca debe activarse.
     - `PARK.quickServices`/`map.poiFilterGroups` NO configurados — deben
       derivarse solos de `PARK.pois`.
     - Un tipo de POI inventado (`hydration-point`) que el core nunca vio
       antes, para demostrar extensibilidad sin tocarlo.
   ============================================================================ */
window.PARK={
  id:'minimal-test-park',
  name:'Minimal Test Park (fixture de prueba, no un parque real)',
  emoji:'🧪',
  theme:{accent:'#2a7f9e',accentDark:'#1c5c73',themeColor:'#2a7f9e'},
  copy:{
    backHref:'#',
    backLabel:'← Salir',
    headerTitle:'🧪 Minimal Test Park',
    mapAltText:'Mapa de Minimal Test Park (fixture de prueba)',
    mapNote:'Este parque es un fixture de prueba — no corresponde a ninguna visita real.',
    doneTitle:'¡Completaron el plan de prueba!',
    doneBody:'Minimal Test Park terminado — esto confirma que el motor funciona con datos que nunca vio antes.',
    resetConfirm:'¿Borrar el progreso de esta prueba?',
  },
  map:{
    url:'https://example.org/minimal-test-park/mapa-oficial', // placeholder — nunca se hace fetch real en las pruebas
    image:null, // a propósito: sin mapa ilustrado, para probar el fallback ("Abrir PDF oficial") de ensureMapImage()
    center:[36.9741,-122.0308], // punto de prueba genérico (costa de Santa Cruz, CA) — sin relación con ninguna visita real
    // SIN geoCalibration, SIN poiFilterGroups/poiFilterGroupLabels/defaultGeoFilters a propósito —
    // ver theme-park-core.spec.js para lo que eso prueba.
  },
  storageKey:'minimal_test_park_state_v1',
  attractions:[
    {id:'harborGlide',name:'Harbor Glide',cat:'rides',priorityTier:0,zone:'North Pier',adult:true,
      restrictions:{minHeightIn:40,confidence:'verified-official',source:'dato de prueba, no real',lastVerified:'2026-08-24'},
      geo:{lat:36.97465,lng:-122.03102,source:'test-fixture',confidence:'confirmed_on_site'},
      tags:['🔥 IMPERDIBLE'],
      why:'Fixture con altura mínima que un participante registrado cumple y el otro no — elegibilidad mixta, nunca excluida.'},
    {id:'driftwoodPath',name:'Driftwood Path',cat:'nature',priorityTier:1,zone:'South Cove',adult:false,
      // SIN `restrictions` a propósito: la elegibilidad debe caer a "unknown"/"❓ Sin verificar".
      // SIN `geo` a propósito: la proximidad no debe inventar nada para un punto sin coordenada.
      tags:['🌿 SUAVE'],
      why:'Fixture sin datos de restricción ni de geolocalización — degradación progresiva.'},
    {id:'towerLookout',name:'Tower Lookout',cat:'rides',priorityTier:2,zone:'North Pier',adult:true,
      // Altura mínima que NINGÚN participante registrado cumple. NO debe quedar hard-excluded —
      // `PARK.family` solo modela children, no adultos: "los niños no cumplen" nunca implica
      // "nadie de la familia puede subir".
      restrictions:{minHeightIn:54,confidence:'verified-official',source:'dato de prueba, no real',lastVerified:'2026-08-24'},
      tags:['🌀 INTENSA'],
      why:'Fixture pensado para que NINGÚN niño registrado la cumpla — sigue siendo candidata por si hay adultos u otros participantes.'},
    {id:'sealedPavilion',name:'Sealed Pavilion',cat:'rides',priorityTier:1,zone:'South Cove',adult:false,
      // unavailable:true — hard constraint inequívoco (ver isHardExcluded() en el core), a
      // diferencia de la inelegibilidad de towerLookout, que NO excluye.
      unavailable:true,
      tags:[],
      why:'Fixture con unavailable:true — señal explícita e inequívoca de que no está disponible para ningún participante, a propósito distinta de la elegibilidad.'},
  ],
  pois:[
    {id:'restroom-pier',type:'restroom',icon:'🚻',name:'Restrooms — North Pier',zone:'North Pier',
      nearbyText:'Junto a Harbor Glide.',source:'dato de prueba, no real',lastVerified:'2026-08-24',confidence:'approximate',
      geo:{lat:36.97460,lng:-122.03095,source:'test-fixture',confidence:'approximate'}},
    {id:'driftCafe',type:'food',icon:'🍔',name:'Drift Cafe',zone:'South Cove',
      // SIN `geo` a propósito: los accesos rápidos/servicios no deben inventar "más cercano".
      nearbyText:'Cerca de Driftwood Path.',source:'dato de prueba, no real',lastVerified:'2026-08-24',confidence:'approximate',geo:null},
    {id:'tidePost',type:'hydration-point',icon:'🧃',name:'Tide Post',zone:'South Cove',
      // Tipo de POI completamente inventado — nunca visto por el core, demuestra extensibilidad
      // (etiqueta/ícono de sección, filtro del mapa geográfico y accesos rápidos deben derivarse
      // solos, sin ninguna entrada hardcodeada para 'hydration-point').
      nearbyText:'Punto de hidratación de prueba.',source:'dato de prueba, no real',lastVerified:'2026-08-24',confidence:'approximate',geo:null},
  ],
  mustIds:['harborGlide'],
  calmIds:['driftwoodPath'],
  categories:[['rides','🎡 Juegos'],['nature','🌊 Naturaleza']],
  childFavoriteIds:['driftwoodPath'],
  waterIds:[],
  priorityGroups:[],
  reactionSystem:null,
  tips:[
    ['🧪','Este parque es un fixture de prueba — no representa ninguna visita real.'],
  ],
  // Familia de prueba, completamente distinta de la familia real usada en LEGOLAND/Story Land —
  // nombres genéricos, sin relación con ningún dato personal. Ver "Evolución futura hacia
  // participantes genéricos" en specs/architecture/family-and-eligibility.md.asc: el modelo debería poder crecer hacia `PARK.family.members` sin
  // asumir que `children` representa a todos los que pueden usar una atracción.
  family:{
    children:[
      {name:'Participant A (test)',ageYears:7,heightIn:46},
      {name:'Participant B (test)',ageYears:4,heightIn:38},
    ],
  },
  shows:[],
  closingTime:null,
};
