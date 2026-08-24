/* parks/story-land.js — datos y configuración de Story Land para el
   Theme Park Companion (assets/theme-park-core.js). Instancia #1 del motor
   reutilizable — ver specs/architecture/theme-park-core.md.asc.

   Migrado 1:1 desde la implementación original de storyland.html (agosto
   2026) al separar el core reutilizable de los datos del parque: mismos
   ids/atracciones/POIs/pesos de recomendación, mismo localStorage key
   ("storyland_state_v1", para no perder el progreso ya guardado en el
   teléfono de la familia). Los campos priorityTier/waterBoostTier/tip son
   nuevos (antes vivían como cadenas de if/else hardcodeadas en el motor —
   baseTier()/tipFor() en storyland.html) pero producen exactamente los
   mismos valores que antes para cada atracción.

   Nota sobre reactionSystem.tierOverride: en el motor original, la rama
   "roar && polarReaction==='no' → tier 2.4" nunca se ejecutaba en la
   práctica (Roar-O-Saurus ya calificaba antes por la lista de tier 0), así
   que el comportamiento real siempre mantuvo a Roar en tier 0 pase lo que
   pase con la reacción — por eso NO se define tierOverride acá (definirlo
   cambiaría el comportamiento real respecto al original). Lo que sí era
   real: el mensaje ("¿Le encantó?"), el score boost (+45 con "love") y la
   nota "Roar-O-Saurus... Opcional para después" cuando la respuesta es
   "no" — eso se preserva con boost/whyMessages/optionalNoteValues.

   Metadata geográfica (zone/mapNumber/nearbyAttractions/mapMarker/geo):
   documentación completa de procedencia y método de calibración conservada
   en specs/architecture/geolocation-and-maps.md.asc y
   specs/operations/data-provenance.md.asc (no se repite acá para no
   duplicar contenido — mismos datos, ninguno cambiado en esta migración). */
window.PARK={
  id:'story-land',
  name:'Story Land',
  emoji:'🏰',
  theme:{accent:'#ed7d24',accentDark:'#d9601c',themeColor:'#ed7d24'},
  copy:{
    backHref:'index.html',backLabel:'← Itinerario',
    headerTitle:'🏰 Story Land',
    mapOfficialTitle:'🗺️ Mapa oficial de Story Land',
    mapAltText:'Mapa oficial de Story Land',
    mapNote:'El mapa oficial de Story Land nos ayuda a ubicarnos físicamente (zona / número). Nuestra app sigue decidiendo qué conviene hacer ahora.',
    doneTitle:'¡Completaron el plan de Story Land!',
    doneBody:'Ya hicieron todo lo importante. Si quieren, repitan alguna favorita antes de irse.',
    resetConfirm:'¿Borrar todo el progreso del día en Story Land? Esta acción no se puede deshacer.',
    lunchTip:'Después de comer, Loopy Lab es una buena opción tranquila.',
  },
  map:{
    url:'https://hfe.widen.net/view/pdf/icf5sgszuz/STL26_General_ParkMap_Download.pdf?t.download=true&u=exbmhu', // PDF oficial 2026 — fuente de verdad; enlace externo "Abrir PDF oficial" (fuera de la app, nunca embebido)
    image:'assets/storyland-map-2026.webp', // imagen local generada a partir del PDF oficial (ver specs/architecture/geolocation-and-maps.md.asc)
    center:[44.1168,-71.1805],
    // Transformación afín (lat/lng → %x,%y sobre storyland-map-2026.webp),
    // ajustada offline por mínimos cuadrados (numpy.lstsq) a partir de las 6
    // atracciones que tienen tanto `geo` como `mapMarker` calibrado a mano
    // (polar, roar, bamboo, raptour, antiquecars, loopylab — ver abajo).
    // Movida acá (antes vivía como constante fija en theme-park-core.js) al
    // generalizar el motor para más de un parque — mismos 6 coeficientes,
    // mismo resultado numérico que siempre tuvo Story Land. Detalle completo
    // (script, residuales) en specs/operations/data-provenance.md.asc.
    geoCalibration:{ax:-24598.225084,bx:5992.442921,cx:1511778.056777,ay:-951.387361,by:-13334.325079,cy:-907130.644129,
      controlPointIds:['polar','roar','bamboo','raptour','antiquecars','loopylab'],fittedOn:'2026-08'},
  },
  storageKey:'storyland_state_v1',
  mustIds:['polar','roar','bamboo','raptour','flyingfish','antiquecars','farmtractors'],
  calmIds:['huffpuff','swanboats','castle','pumpkincoach','loopylab','turtletwirl'],
  categories:[['imperdible','🔥 Imperdibles'],['agua','💦 Agua'],['clasico','🏰 Story Land clásico'],['descanso','😌 Descanso / flexibles']],
  childFavoriteIds:['farmtractors','antiquecars','raptour','flyingfish'],
  waterIds:['drgeyser','splashbattle','moolagoon'],
  priorityGroups:[{ids:['polar','roar','raptour'],earlyBonus:20,earlyBonusMaxDone:3,reasonLabel:'🦖 Hay otra actividad de dinosaurios aquí mismo.'}],
  reactionSystem:{
    triggerId:'polar',targetId:'roar',
    promptEmoji:'🎢',promptTitle:'¿Cómo le fue en Polar Coaster?',promptSubtitle:'Esto nos ayuda a decidir el siguiente paso.',
    options:[{value:'love',label:'😍 Le encantó'},{value:'ok',label:'😐 Estuvo bien'},{value:'no',label:'😨 No quiere otra montaña rusa'}],
    boost:{love:45},
    earlyBonus:20,
    optionalNoteValues:['no'],
    tip:{ok:'💡 Es normal parar aquí si después no quiere más coasters por un rato.'},
    whyMessages:{
      roar:{love:'¡Le encantó Polar Coaster! Aprovechamos el ánimo con Roar-O-Saurus.',ok:'Estuvo bien en Polar Coaster. Roar-O-Saurus es un poco más intensa — pueden intentarlo cuando quieran.',no:'No quería otra montaña rusa hace un rato, pero ya no queda mucho mejor por aquí — pueden intentarlo si cambió de idea.'},
      raptour:{no:'Como no quiere otra montaña rusa por ahora, vamos a algo más tranquilo y con dinosaurios.'},
    },
  },
  tips:[
    ['👦','Cumple la altura mínima para las atracciones grandes del parque, incluida Roar-O-Saurus.'],
    ['👨‍👦','Algunas atracciones requieren adulto por estar debajo de 48".'],
    ['👕','Guardar una muda para las atracciones de agua.'],
    ['🚂','No usar el tren durante la primera hora salvo necesidad.'],
    ['📸','Cinderella / Castle son buenos para fotos familiares.'],
    ['❤️','Marcar las atracciones que quiera repetir.'],
    ['👥','Si una fila parece demasiado larga, usar "Volver después".'],
  ],
  family:null, // Story Land no usa el modelo de elegibilidad por niño (preserva el flag `adult` original por atracción)
  shows:[],
  closingTime:null,
  attractions:[
{id:'polar',priorityTier:0,tip:'💡 Si le encanta, ir inmediatamente a Roar-O-Saurus.',name:'Polar Coaster',cat:'imperdible',adult:true,zone:'🦖 Zona Dinosaurios',mapNumber:34,mapMarker:{x:43.1,y:56.8},plusCode:'4R89+H8 Intervale, Conway, NH',geo:{lat:44.116437,lng:-71.181687,source:'onsite-plus-code',reference:'entrance'},mapRegion:'back-right',visualLandmark:null,nearbyMapNumbers:[35,36],nearbyAttractions:['roar','raptour'],tags:['🔥 IMPERDIBLE','🎢 INTENSA','👨‍👦 CON ADULTO'],why:'Es la montaña rusa principal del parque: conviene hacerla temprano, antes de que se formen filas, y sirve para probar cómo tolera una montaña rusa antes de Roar-O-Saurus.'},
{id:'roar',priorityTier:0,name:'Roar-O-Saurus',cat:'imperdible',adult:true,zone:'🦖 Zona Dinosaurios',mapNumber:36,mapMarker:{x:56.5,y:9.9},plusCode:'4R8C+JQ3 Bartlett, New Hampshire',geo:{lat:44.116512,lng:-71.178078,source:'onsite-plus-code',reference:'entrance'},mapRegion:'back-right',visualLandmark:null,nearbyMapNumbers:[34,35],nearbyAttractions:['polar','raptour'],tags:['🔥 IMPERDIBLE','🎢 INTENSA','🦕 DINOSAURIOS','👨‍👦 CON ADULTO'],why:'La montaña rusa temática de dinosaurios: la gran favorita del día.'},
{id:'bamboo',priorityTier:0,name:'Bamboo Chutes',cat:'imperdible',adult:true,zone:'💦 Zona Bambú',mapNumber:4,mapMarker:{x:11.8,y:49.5},plusCode:'4R99+3HX Bartlett, New Hampshire',geo:{lat:44.117738,lng:-71.181016,source:'onsite-plus-code',reference:'entrance'},mapRegion:'front-center',visualLandmark:null,nearbyMapNumbers:[2],nearbyAttractions:['drgeyser'],tags:['🔥 IMPERDIBLE','💦 TE MOJAS UN POCO','🛟 SUAVE'],why:'Tobogán acuático suave: buen contraste de ritmo después de una montaña rusa.'},
{id:'raptour',priorityTier:0,name:'Rap-Tour Safari',cat:'imperdible',adult:false,zone:'🦖 Zona Dinosaurios',mapNumber:35,mapMarker:{x:49.6,y:35.1},plusCode:'4R8C+J2, Intervale, NH 03845',geo:{lat:44.116563,lng:-71.179938,source:'onsite-plus-code',reference:'entrance'},mapRegion:'back-right',visualLandmark:null,nearbyMapNumbers:[34,36],nearbyAttractions:['polar','roar'],tags:['🔥 IMPERDIBLE','⭐ MUY RECOMENDADA PARA ÉL','🦕 DINOSAURIOS','🎮 INTERACTIVA'],why:'Safari temático de dinosaurios: participativo y no muy intenso.'},
{id:'flyingfish',priorityTier:0,name:'Flying Fish',cat:'imperdible',adult:false,zone:'🚜 Zona Granja',mapNumber:20,mapMarker:{x:53.3,y:23.4},mapRegion:null,visualLandmark:'Zona de granja, parte interior del parque',nearbyMapNumbers:[18],nearbyAttractions:['farmtractors','crazybarn'],tags:['🔥 IMPERDIBLE','⭐ MUY RECOMENDADA PARA ÉL','🐟 SUAVE'],why:'Atracción suave, buena para subir la confianza entre atracciones más intensas.'},
{id:'antiquecars',priorityTier:1,tip:'💡 Si le encanta, puede repetirla — toca ❤️ QUIERE REPETIR.',name:'Antique Cars',cat:'imperdible',adult:false,zone:'🚗 Zona Autos Antiguos',mapNumber:2,mapMarker:{x:21.1,y:77.4},plusCode:'4R88+MPH Bartlett, New Hampshire',geo:{lat:44.116687,lng:-71.183141,source:'onsite-plus-code',reference:'entrance'},mapRegion:'front-center',visualLandmark:null,nearbyMapNumbers:[4],nearbyAttractions:[],tags:['⭐ MUY RECOMENDADA PARA ÉL','🚗 VEHÍCULOS','😌 TRANQUILA'],why:'Autos a su ritmo: encaja perfecto con lo que más le gusta.'},
{id:'farmtractors',priorityTier:1,tip:'💡 Si le encanta, puede repetirla — toca ❤️ QUIERE REPETIR.',name:"Eggs-traordinary Farm Tractors",cat:'imperdible',adult:false,zone:'🚜 Zona Granja',mapNumber:18,mapMarker:{x:33.2,y:7.4},mapRegion:null,visualLandmark:'Sección de granja del parque',nearbyMapNumbers:[20],nearbyAttractions:['crazybarn','flyingfish'],tags:['⭐ MUY RECOMENDADA PARA ÉL','🚜 VEHÍCULOS','😌 TRANQUILA'],why:'Tractores que maneja él mismo: alta probabilidad de que quiera repetir.'},
{id:'drgeyser',priorityTier:2,waterBoostTier:1.5,tip:'👕 Confirmen que traen muda de ropa antes de empezar.',name:"Dr. Geyser's Remarkable Raft Ride",cat:'agua',adult:true,zone:'💦 Zona Acuática',mapNumber:15,mapMarker:{x:22.5,y:61.1},mapRegion:null,visualLandmark:'Zona Geyser, junto a las Mini-Geysers',nearbyMapNumbers:[],nearbyAttractions:['splashbattle','moolagoon'],tags:['💦 TE MOJAS','☀️ MEJOR CON CALOR','👨‍👦 CON ADULTO'],why:'Con el calor de ahora es buen momento para mojarse.'},
{id:'splashbattle',priorityTier:2,waterBoostTier:1.5,tip:'👕 Confirmen que traen muda de ropa antes de empezar.',name:"Splash Battle: Pharaoh's Reign",cat:'agua',adult:false,zone:'💦 Zona Acuática',mapNumber:39,mapMarker:{x:50.6,y:41.8},mapRegion:null,visualLandmark:'Zona posterior del mapa, después del bloque de dinosaurios',nearbyMapNumbers:[],nearbyAttractions:['drgeyser','moolagoon'],tags:['💦 TE MOJAS','🎮 INTERACTIVA','👨‍👩‍👦 FAMILIAR'],why:'Batalla de agua interactiva: ideal para la parte más calurosa del día.'},
{id:'moolagoon',priorityTier:2.8,secondaryWaterBonus:true,tip:'💡 Puede llevarse bastante tiempo — bien como cierre, no como prioridad.',name:'Moo Lagoon',cat:'agua',adult:false,zone:'💦 Zona Acuática',mapNumber:33,mapMarker:{x:41.6,y:22.5},mapRegion:null,visualLandmark:'Justo antes del grupo de dinosaurios',nearbyMapNumbers:[34],nearbyAttractions:['drgeyser','splashbattle'],tags:['💦 OPCIONAL · PUEDE TOMAR BASTANTE TIEMPO','👨‍👩‍👦 FAMILIAR'],why:'Área de juegos de agua tipo splashpad: divertida pero puede llevarse mucho tiempo — no debe robarle turno a los imperdibles.'},
{id:'pumpkincoach',priorityTier:2.6,name:"Cinderella's Pumpkin Coach",cat:'clasico',adult:false,zone:'🏰 Zona Cuentos Clásicos',mapNumber:10,mapMarker:{x:64.9,y:70.2},mapRegion:null,visualLandmark:null,nearbyMapNumbers:[9],nearbyAttractions:['castle','swanboats','carousel'],tags:['📸 FOTO FAMILIAR','😌 TRANQUILA'],why:'Parada tranquila y bonita para fotos familiares.'},
{id:'castle',priorityTier:2.6,name:"Cinderella's Castle",cat:'clasico',adult:false,zone:'🏰 Zona Cuentos Clásicos',mapNumber:9,mapMarker:{x:91.8,y:65.0},mapRegion:null,visualLandmark:null,nearbyMapNumbers:[10],nearbyAttractions:['pumpkincoach','swanboats'],tags:['📸 FOTO FAMILIAR','🏰 CLÁSICO'],why:'El castillo de Cenicienta: imprescindible para la foto familiar.'},
{id:'swanboats',priorityTier:2.6,name:'Swan Boats',cat:'clasico',adult:false,zone:'🏰 Zona Cuentos Clásicos',mapNumber:40,mapMarker:{x:71.6,y:70.7},mapRegion:null,visualLandmark:'Cerca del área de Cinderella, como referencia general',nearbyMapNumbers:[],nearbyAttractions:['castle','carousel'],tags:['📸 FOTO FAMILIAR','😌 TRANQUILA'],why:'Paseo lento en botes: buen respiro entre atracciones.'},
{id:'carousel',priorityTier:2.6,name:'Antique German Carousel',cat:'clasico',adult:false,zone:'🏰 Zona Cuentos Clásicos',mapNumber:3,mapMarker:{x:73.4,y:58.8},mapRegion:null,visualLandmark:null,nearbyMapNumbers:[],nearbyAttractions:['swanboats','pumpkincoach'],tags:['📸 FOTO FAMILIAR','🎠 CLÁSICO'],why:'Carrusel clásico, siempre un acierto.'},
{id:'balloonchase',priorityTier:2.6,name:'Great Balloon Chase',cat:'clasico',adult:false,zone:'🌳 Zona Central',mapNumber:24,mapMarker:{x:40.4,y:37.3},mapRegion:null,visualLandmark:null,nearbyMapNumbers:[],nearbyAttractions:['huffpuff','loopylab'],tags:['📸 FOTO FAMILIAR','🎈 SUAVE'],why:'Vueltas suaves en globo: buena para bajar el ritmo.'},
{id:'huffpuff',priorityTier:3.2,tip:'💡 Ideal cuando estén cansados de caminar.',name:'Huff Puff & Whistle Railroad',cat:'descanso',adult:false,zone:'🌳 Zona Central',mapNumber:26,mapMarker:{x:15.8,y:82.2},mapRegion:null,visualLandmark:'Sigue el trazado del tren alrededor del parque',nearbyMapNumbers:[],nearbyAttractions:['loopylab','balloonchase'],tags:['😌 DESCANSO','👨‍👩‍👦 FAMILIAR','🚂 VEHÍCULOS'],why:'Tren panorámico para descansar los pies caminando. Ideal cuando estén cansados de caminar — no gastar la primera hora del parque aquí.'},
{id:'loopylab',priorityTier:3,name:'Loopy Lab Play Area',cat:'descanso',adult:false,zone:'🌳 Zona Central',mapNumber:31,mapMarker:{x:29.7,y:37.3},plusCode:'4R89+VQ6 Bartlett, New Hampshire',geo:{lat:44.117163,lng:-71.180609,source:'onsite-plus-code',reference:'back-area'},mapRegion:null,visualLandmark:'Punto de juego interior/interactivo, zona media/trasera del parque',nearbyMapNumbers:[],nearbyAttractions:['turtletwirl','huffpuff','balloonchase'],tags:['🎮 INTERACTIVA','😌 TRANQUILA'],why:'Laboratorio interactivo: ideal para después de comer.'},
{id:'turtletwirl',priorityTier:3,name:'Turtle Twirl',cat:'descanso',adult:false,zone:'🌳 Zona Central',mapNumber:42,mapMarker:{x:31.5,y:26.5},mapRegion:null,visualLandmark:null,nearbyMapNumbers:[],nearbyAttractions:['loopylab'],tags:['🎠 SUAVE','😌 TRANQUILA'],why:'Vueltas suaves, tranquila.'},
{id:'crazybarn',priorityTier:3,name:'Crazy Barn',cat:'descanso',adult:false,zone:'🚜 Zona Granja',mapNumber:11,mapMarker:{x:38.2,y:2.0},mapRegion:null,visualLandmark:null,nearbyMapNumbers:[],nearbyAttractions:['farmtractors','flyingfish'],tags:['🎮 INTERACTIVA','😌 TRANQUILA'],why:'Granero interactivo con sorpresas: le gustará explorar. Opcional — solo si sigue teniendo sentido geográfico y está abierta.'},  ],
  pois:[
{id:'world-pavilion-kitchen',type:'food',icon:'🍴',name:'World Pavilion Kitchen',mapNumber:59,zone:'🌳 Zona Central',plusCode:'4R89+CQH Bartlett, New Hampshire',geo:{lat:44.116062,lng:-71.180516,source:'onsite-plus-code',reference:'entrance'},amenities:null,nearbyText:null},
{id:'restroom-granja',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🚜 Zona Granja',plusCode:null,geo:null,amenities:{accessible:null,babyChanging:null},nearbyText:'Cerca de Eggs-traordinary Farm Tractors #18',source:'official-map'},
{id:'restroom-central',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🌳 Zona Central',plusCode:null,geo:null,amenities:{accessible:null,babyChanging:null},nearbyText:'Cerca de Dutch Village',source:'official-map'},
{id:'restroom-clasicos',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🏰 Zona Cuentos Clásicos',plusCode:null,geo:null,amenities:{accessible:null,babyChanging:null},nearbyText:'Cerca de Party Patio',source:'official-map'},
{id:'restroom-entrada',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🚗 Zona Autos Antiguos',plusCode:null,geo:null,amenities:{accessible:null,babyChanging:null},nearbyText:'Cerca de la entrada, junto a Hilltop Theater',source:'official-map'},  ],
};
