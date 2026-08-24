/* ============================================================================
   parks/synthetic-test-park.js — PARK sintético de prueba arquitectónica
   ============================================================================
   NO es un parque real de la familia — existe únicamente para probar el
   criterio de aceptación arquitectónico: "un tercer parque debe poder
   agregarse normalmente mediante parks/<park-id>.js + configuración +
   thin HTML shell, sin modificar assets/theme-park-core.js".

   Deliberadamente NO comparte ningún id/nombre/zona/miembro de familia con
   Story Land ni con LEGOLAND New York, para que una prueba automatizada
   contra este archivo no pueda "pasar por accidente" apoyándose en algo
   que el core solo sepa manejar porque coincide con uno de los otros dos
   parques. Ver synthetic-test.html (esqueleto delgado idéntico a
   legoland.html/storyland.html) y specs/SPECIFICATIONS.md.asc — "Nuevo
   parque: checklist completa" — para el detalle de qué se está probando.

   Cobertura deliberada de degradación progresiva:
     - 2 atracciones SIN `geo` (tidepoolTrail, lanternMaze) y 1 CON `geo`
       (cloudSwing) — proximidad GPS real debe funcionar para la que tiene
       geo y no inventar nada para las que no.
     - 1 atracción SIN `restrictions` (tidepoolTrail) — la elegibilidad debe
       mostrarse como "❓ Sin verificar", nunca "✅ Puede subir" solo por
       ausencia de datos.
     - 1 atracción donde NINGÚN niño de la familia cumple (lanternMaze) —
       debe quedar excluida de candidateList() (hard constraint), no solo
       penalizada.
     - `map.image: null` y sin `map.geoCalibration` — el mapa ilustrado debe
       caer a su fallback ("Abrir PDF oficial"), el "Estás aquí" ilustrado
       nunca debe activarse, y el resto de la app (mapa geográfico, checklist,
       accesos rápidos) debe seguir funcionando igual.
     - `PARK.quickServices` NO configurado — debe derivarse automáticamente
       de `PARK.pois` (restroom + food, en el orden en que aparecen).
     - `PARK.map.poiFilterGroups`/`poiFilterGroupLabels`/`defaultGeoFilters`
       NO configurados — el mapa geográfico debe derivar sus categorías de
       filtro solas.
   ============================================================================ */
window.PARK={
  id:'synthetic-test-park',
  name:'Nimbus Cove (parque de prueba)',
  emoji:'🌊',
  theme:{accent:'#2a7f9e',accentDark:'#1c5c73',themeColor:'#2a7f9e'},
  copy:{
    backHref:'#',
    backLabel:'← Salir',
    headerTitle:'🌊 Nimbus Cove (prueba)',
    mapAltText:'Mapa de Nimbus Cove (parque sintético de prueba)',
    mapNote:'Este parque es una prueba de arquitectura — no corresponde a ninguna visita real.',
    doneTitle:'¡Completaron el plan de prueba!',
    doneBody:'Nimbus Cove terminado — esto confirma que el motor funciona con datos que nunca vio antes.',
    resetConfirm:'¿Borrar el progreso de esta prueba?',
  },
  map:{
    url:'https://example.org/nimbus-cove/mapa-oficial', // placeholder — nunca se hace fetch real en las pruebas
    image:null, // a propósito: sin mapa ilustrado, para probar el fallback ("Abrir PDF oficial") de ensureMapImage()
    center:[36.9741,-122.0308], // punto de prueba genérico (costa de Santa Cruz, CA) — sin relación con ninguna visita real
    // SIN geoCalibration: el "🔵 Estás aquí" ilustrado nunca debe activarse para este parque —
    // exactamente el mismo camino de degradación que ya usa LEGOLAND New York.
    // SIN poiFilterGroups/poiFilterGroupLabels/defaultGeoFilters: prueba que el core deriva solo
    // las categorías de filtro del mapa geográfico a partir de los `type` de `pois` presentes.
  },
  storageKey:'synthetic_test_park_state_v1',
  attractions:[
    {id:'cloudSwing',name:'Cloud Swing',cat:'rides',priorityTier:0,zone:'Muelle Norte',adult:true,
      restrictions:{minHeightIn:42,confidence:'verified-official',source:'dato de prueba, no real',lastVerified:'2026-08-24'},
      // geo real de prueba — permite validar proximidad GPS/ranking con al menos un punto conocido.
      geo:{lat:36.97465,lng:-122.03102,source:'test-fixture',confidence:'confirmed_on_site'},
      tags:['🔥 IMPERDIBLE'],
      why:'Atracción de prueba con altura mínima — un niño de la familia sintética la cumple, el otro no (elegibilidad mixta).'},
    {id:'tidepoolTrail',name:'Tidepool Trail',cat:'nature',priorityTier:1,zone:'Costa Sur',adult:false,
      // SIN `restrictions` a propósito: debe mostrar elegibilidad "❓ Sin verificar", nunca "✅ Puede subir".
      // SIN `geo` a propósito: prueba que la proximidad no inventa nada para un punto sin coordenada.
      tags:['🌿 SUAVE'],
      why:'Recorrido de prueba sin datos de restricción ni de geolocalización — degradación progresiva.'},
    {id:'lanternMaze',name:'Lantern Maze',cat:'rides',priorityTier:2,zone:'Muelle Norte',adult:true,
      // Altura mínima que NINGÚN niño de la familia sintética cumple — debe quedar excluida de
      // candidateList() por hard constraint (isReallyIneligibleForFamily), no solo penalizada.
      restrictions:{minHeightIn:60,confidence:'verified-official',source:'dato de prueba, no real',lastVerified:'2026-08-24'},
      tags:['🌀 INTENSA'],
      why:'Atracción de prueba pensada para que NINGÚN niño de la familia sintética la cumpla.'},
  ],
  pois:[
    {id:'restroom-north',type:'restroom',icon:'🚻',name:'Restrooms — Muelle Norte',zone:'Muelle Norte',
      nearbyText:'Junto a Cloud Swing.',source:'dato de prueba, no real',lastVerified:'2026-08-24',confidence:'approximate',
      geo:{lat:36.97460,lng:-122.03095,source:'test-fixture',confidence:'approximate'}},
    {id:'snackDock',type:'food',icon:'🍔',name:'Snack Dock',zone:'Costa Sur',
      // SIN `geo` a propósito: prueba que los accesos rápidos/servicios no inventan "más cercano".
      nearbyText:'Cerca de Tidepool Trail.',source:'dato de prueba, no real',lastVerified:'2026-08-24',confidence:'approximate',geo:null},
  ],
  mustIds:['cloudSwing'],
  calmIds:['tidepoolTrail'],
  categories:[['rides','🎡 Juegos'],['nature','🌊 Naturaleza']],
  childFavoriteIds:['tidepoolTrail'],
  waterIds:[],
  priorityGroups:[],
  reactionSystem:null,
  tips:[
    ['🧪','Este parque es una prueba de arquitectura — no representa ninguna visita real.'],
  ],
  // Familia sintética, completamente distinta de la familia real usada en LEGOLAND/Story Land —
  // nombres genéricos de prueba, sin relación con ningún dato personal.
  family:{
    children:[
      {name:'Explorador de prueba A',ageYears:7,heightIn:46},
      {name:'Explorador de prueba B',ageYears:4,heightIn:38},
    ],
  },
  shows:[],
  closingTime:null,
};
