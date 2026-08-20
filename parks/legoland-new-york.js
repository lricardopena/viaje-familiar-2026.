/* parks/legoland-new-york.js — datos y configuración de LEGOLAND New York
   Resort (Goshen, NY) para el Theme Park Companion (assets/theme-park-core.js).
   Instancia #2 del motor reutilizable — demuestra que agregar un parque
   nuevo es escribir este archivo, no copiar la app. Visita familiar:
   domingo 23 de agosto de 2026, ida y vuelta desde Branford, CT.

   ⚠️ PROCEDENCIA Y CONFIANZA — leer antes de editar:
   Este archivo se armó por investigación web (WebSearch) sobre contenido
   oficial de newyork-support.legoland.com y legoland.com/new-york citado por
   buscadores, más guías de terceros (fivefortheroad.com,
   legolandinnewyork.com, coasterpedia.net, ultimaterollercoaster.com) —
   NO se pudo hacer fetch directo a legoland.com ni a su subdominio de
   soporte durante esta implementación (bloqueados por el proxy de salida
   del entorno de desarrollo), incluido el PDF oficial de restricciones de
   altura (height-restrictions-52026.pdf, nombre de archivo sugiere mayo
   2026 — el más reciente que se pudo referenciar). Por eso NINGÚN dato de
   este archivo lleva confidence:'verified-official': lo más alto que se
   usa es 'approximate' (visto en contenido citado del sitio oficial via
   buscador) — nunca inventado. Horario de cierre, coordenadas de POIs
   sin Plus Code propio, y algunas atracciones sin restricción confirmada
   quedan explícitamente en null/'unknown' — ver comentarios puntuales.
   ANTES DEL VIAJE: reverificar restricciones de altura/edad en
   legoland.com/new-york (o la app oficial) y en la entrada de cada
   atracción — la UI ya recuerda esto vía eligibilityConfidenceNote() en
   el core cuando confidence no es 'verified-official'.
   lastVerified de todo el archivo: 2026-08-19 (fecha de esta investigación). */
window.PARK={
  id:'legoland-new-york',
  name:'LEGOLAND New York Resort',
  emoji:'🧱',
  theme:{accent:'#e30613',accentDark:'#b8050f',themeColor:'#e30613'}, // rojo LEGO
  copy:{
    backHref:'index.html',backLabel:'← Itinerario',
    headerTitle:'🧱 LEGOLAND New York',
    mapOfficialTitle:'🗺️ Mapa oficial de LEGOLAND New York',
    mapAltText:'Mapa oficial de LEGOLAND New York Resort',
    mapNote:'El mapa oficial nos ayuda a ubicarnos por zona (7 lands). Nuestra app sigue decidiendo qué conviene hacer ahora.',
    doneTitle:'¡Completaron el plan de LEGOLAND New York!',
    doneBody:'Ya hicieron todo lo importante. Si el parque sigue abierto, repitan alguna favorita o vuelvan a Miniland antes de irse.',
    resetConfirm:'¿Borrar todo el progreso del día en LEGOLAND New York? Esta acción no se puede deshacer.',
    lunchTip:'Brickolini’s Pizza and Pasta (LEGO City) tiene pizza, pasta y ensaladas — buena opción para las dos familias. Coman temprano (~11:15) o tarde (~14:00) para evitar el pico.',
  },
  map:{
    // Mapa oficial descargable — enlace externo (no embebido), mismo patrón que Story Land.
    url:'https://www.legoland.com/new-york/plan-your-visit/planning-tools/park-map/',
    image:null, // sin imagen local calibrada (no hubo visita previa al parque para generar marcadores mapMarker como en Story Land) — el visor cae automáticamente al fallback "Abrir mapa oficial" (ver mapsheet-fallback en el core), comportamiento ya soportado sin cambios.
    center:[41.37806,-74.31333], // LEGOLAND New York Resort, Goshen NY — coordenada pública del predio (Wikipedia/registros públicos), NO una dirección residencial.
  },
  storageKey:'legoland_ny_state_v1',
  mustIds:['dragon','dragonsapprentice','fireacademy','legofactory','ninjagoride','miniland'],
  calmIds:['miniland','buildtest','brickparty','steppingtones','duploexpress'],
  categories:[['rides','🎢 Rides'],['lego','🧱 LEGO / construcción'],['miniland','🏙️ Miniland'],['agua','💦 Agua'],['descanso','😌 Descanso / interactivo']],
  childFavoriteIds:['dragonsapprentice','fireacademy','legofactory','duploexpress','brickparty'],
  waterIds:['splashbattle'],
  priorityGroups:[],
  reactionSystem:null, // LEGOLAND no usa el sistema de reacción dinámica de Story Land (era específico de Polar→Roar) — campo opcional, se omite sin afectar nada más.
  tips:[
    ['📏','Los tres niños miden ~47" (aproximado, sin medir en el parque todavía) — verificar altura real antes de atracciones cerca del límite (48"/52").'],
    ['👨‍👦','Varias atracciones piden adulto acompañante incluso cumpliendo la altura mínima — revisar la ficha de elegibilidad de cada niño en la tarjeta.'],
    ['🍕','Brickolini’s Pizza and Pasta (LEGO City) para comer — pizza/pasta/ensalada, buena opción para ambas familias.'],
    ['🔌','Kia EV6 2025: cargar en el Tesla Supercharger de Newburgh Mall (NACS nativo, sin adaptador) camino al parque; los cargadores del parque (Lot B, J1772, Nivel 2) sirven de respaldo mientras el auto está estacionado todo el día.'],
    ['🕐','Horario oficial del 23 de agosto de 2026 todavía sin confirmar en esta implementación — revisar el calendario oficial cerca de la fecha y llegar con margen antes de la apertura para parking/entrada.'],
    ['📱','Usar la app oficial de LEGOLAND New York en el parque para horarios de shows/personajes y tiempos de espera en vivo — no están disponibles en esta app.'],
    ['🧱','Miniland USA está en el centro del parque — buena referencia para reagruparse si las familias se separan.'],
  ],
  family:{
    children:[
      {name:'Niño (5 años)',ageYears:5,heightIn:47,heightApprox:true},
      {name:'Niña (6 años)',ageYears:6,heightIn:47,heightApprox:true},
      {name:'Niña (5 años)',ageYears:5,heightIn:47,heightApprox:true},
    ],
  },
  shows:[], // sin horarios oficiales confirmados para el 23-ago-2026 — no se inventan; los 3 shows 4D y meet&greets quedan como POIs informativos (ver pois) en vez de con `times` fabricados.
  closingTime:null, // horario de cierre oficial del 23-ago-2026 pendiente de confirmar — dejar null evita que closingSoonBonus use un dato inventado; actualizar cuando se confirme el calendario oficial.
  attractions:[
{id:'dragon',name:'The Dragon',cat:'rides',priorityTier:1,zone:'🏰 LEGO Castle',adult:true,
  restrictions:{minHeightIn:42,minAge:4,adultRequiredBelowInAndAge:{heightIn:48,ageYears:6},source:'Búsqueda web sobre contenido oficial LEGOLAND NY (altura mín. 42", edad mín. 4 años; acompañante requerido para menores de 6 años Y de 48") — no verificado por fetch directo.',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🔥 IMPERDIBLE','🎢 COASTER FAMILIAR','🐉 CASTLE'],
  why:'El coaster principal de LEGO Castle: familiar pero con emoción real — conviene temprano antes de que se formen filas.',
  tip:'Nuestro niño de 6 años puede calificar para ir sin adulto (verificar en el parque si "6 años" cuenta como "menor de 6" o no); las dos niñas de 5 necesitan acompañante por la regla combinada edad+altura.'},
{id:'dragonsapprentice',name:"Dragon's Apprentice",cat:'rides',priorityTier:0,zone:'🏰 LEGO Castle',adult:false,
  restrictions:{minHeightIn:36,adultRequiredBelowIn:42,source:'Búsqueda web (coasterpedia.net / ultimaterollercoaster.com): mínimo 36" con adulto, 42" para ir solo.',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🔥 IMPERDIBLE','🎢 COASTER SUAVE','⭐ PUEDE IR SOLO'],
  why:'Coaster pequeño para entrenar "dragones bebé" — a ~47" los tres niños califican para subir solos, buena primera montaña rusa del día.'},
{id:'merlin',name:"Merlin's Flying Machines",cat:'rides',priorityTier:2,zone:'🏰 LEGO Castle',adult:true,
  restrictions:{minHeightIn:36,adultRequiredBelowIn:48,source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🎠 GIRO SUAVE','👨‍👦 CON ADULTO'],
  why:'Vueltas suaves en el aire, temática de dragones — buen contraste de ritmo cerca de The Dragon.'},
{id:'fireacademy',name:'Fire Academy',cat:'lego',priorityTier:0,zone:'🌆 LEGO City',adult:true,
  restrictions:{minHeightIn:34,adultRequiredBelowIn:52,source:'Búsqueda web sobre contenido oficial LEGOLAND NY (mínimo 34"; acompañante para menores de 52" y ~12 años).',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🔥 IMPERDIBLE','🚒 INTERACTIVA','👨‍👦 CON ADULTO'],
  why:'Manejan un camión de bomberos y "apagan" un incendio con agua — de las experiencias interactivas favoritas de los niños en LEGO City.'},
{id:'coastguard',name:'Coast Guard Academy',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',adult:true,
  restrictions:{minHeightIn:34,adultRequiredBelowIn:52,source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🚤 INTERACTIVA','👨‍👦 CON ADULTO'],
  why:'Manejan botes patrulla en un canal de agua — similar en espíritu a Fire Academy, buena alternativa si hay fila ahí.'},
{id:'drivingschool',name:'Driving School',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',adult:false,
  restrictions:{minAgeUnaccompanied:6,soloOnly:true,source:'Búsqueda web sobre contenido oficial LEGOLAND NY: autos que se manejan solos, diseñados para 6–13 años (no admite ir "con adulto" en el mismo auto).',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🚗 MANEJAN SOLOS','6-13 AÑOS'],
  why:'Autos eléctricos con carril propio — solo para quien ya cumple la edad mínima; los demás pueden hacer Junior Driving School.'},
{id:'juniordriving',name:'Junior Driving School',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',adult:false,
  tags:['🚗 MANEJAN SOLOS','3-6 AÑOS APROX.'],
  why:'Versión para más pequeños de Driving School — pensada para nuestro rango de edad (5 y 6 años); confirmar el límite superior de edad en el parque para la niña que cumple 6.'},
{id:'anchorsaway',name:'Anchors Away',cat:'rides',priorityTier:2,zone:'🏴‍☠️ LEGO Pirates',adult:false,
  restrictions:{minHeightIn:34,adultRequiredBelowIn:42,source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🏴‍☠️ PIRATAS','⭐ PUEDE IR SOLO'],
  why:'Vueltas en barco pirata — a ~47" los tres niños ya califican para ir sin adulto.'},
{id:'splashbattle',name:'Splash Battle',cat:'agua',priorityTier:2,waterBoostTier:1.5,zone:'🏴‍☠️ LEGO Pirates',adult:false,
  tags:['💦 TE MOJAS','🎮 INTERACTIVA','👨‍👩‍👦 FAMILIAR'],
  tip:'👕 Confirmen que traen muda de ropa antes de empezar.',
  why:'Batalla de agua interactiva temática pirata — buena para la parte más calurosa del día (sin restricción de altura confirmada; verificar en el parque).'},
{id:'legofactory',name:'LEGO Factory Adventure Ride',cat:'lego',priorityTier:0,zone:'🎡 Bricktopia',adult:true,
  restrictions:{adultRequiredBelowIn:48,source:'Búsqueda web sobre contenido oficial LEGOLAND NY: sin altura mínima para subir, acompañante requerido para menores de 48".',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🔥 IMPERDIBLE','🏭 DARK RIDE','👨‍👦 CON ADULTO'],
  why:'Recorrido tranquilo tipo dark ride mostrando cómo se hacen los ladrillos LEGO — imperdible, apto para toda la familia, ritmo suave.'},
{id:'duploexpress',name:'LEGO DUPLO Express',cat:'descanso',priorityTier:2.6,zone:'🎡 Bricktopia',adult:false,
  restrictions:{adultRequiredBelowIn:34,source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🚂 SUAVE','👨‍👩‍👦 FAMILIAR'],
  why:'Tren tranquilo pensado para los más chicos — buen respiro entre atracciones más activas.'},
{id:'dizzydisco',name:'DJ Dizzy Disco Spin',cat:'rides',priorityTier:2.6,zone:'🎡 Bricktopia',adult:false,
  tags:['🎵 GIRO SUAVE'],
  tip:'⚠️ Restricción de altura no confirmada en esta implementación — revisar en el letrero de la atracción.',
  why:'Vueltas suaves con música — buena opción ligera dentro de Bricktopia.'},
{id:'ninjagoride',name:'LEGO NINJAGO The Ride',cat:'lego',priorityTier:1,zone:'🥷 LEGO NINJAGO World',adult:true,
  tags:['🔥 IMPERDIBLE','🥷 INTERACTIVA (GESTOS)','🏠 INDOOR'],
  tip:'⚠️ Restricción de altura no confirmada para LEGOLAND New York en esta implementación (otros parques LEGOLAND suelen pedir ~34") — revisar antes de hacer fila.',
  why:'Dark ride interactivo: "lanzan" energía con gestos de las manos contra villanos — de las experiencias más pedidas por los niños, indoor (buen plan si llueve).'},
{id:'gravityforce',name:"Jay's Gravity Force Trainer",cat:'rides',priorityTier:2,zone:'🥷 LEGO NINJAGO World',adult:false,
  tags:['🌀 GIRO MÁS INTENSO'],
  tip:'⚠️ Restricción de altura no confirmada en esta implementación — revisar en el letrero de la atracción.',
  why:'Entrenamiento giratorio estilo ninja — el ride "más emocionante" del día si los niños quieren algo con más intensidad, sin ser un coaster grande.'},
{id:'miniland',name:'Miniland USA',cat:'miniland',priorityTier:0,zone:'🏙️ Miniland',adult:false,
  tags:['🔥 IMPERDIBLE','🏙️ RECORRIDO','📸 FOTOS'],
  why:'Miniaturas de ciudades de EE.UU. hechas con millones de piezas LEGO — el corazón visual del parque, sin restricciones, ritmo libre.'},
{id:'buildtest',name:'Build & Test',cat:'descanso',priorityTier:3,zone:'🧱 Brick Street',adult:false,
  tags:['🧱 CONSTRUCCIÓN','😌 TRANQUILA'],
  why:'Mesa de construcción libre — buena pausa creativa entre atracciones, sin filas largas.'},
{id:'brickparty',name:'Brick Party',cat:'descanso',priorityTier:3,zone:'🧱 Brick Street',adult:false,
  restrictions:{adultRequiredBelowInAndAge:{heightIn:44,ageYears:5},source:'Búsqueda web sobre contenido oficial LEGOLAND NY: acompañante requerido para menores de 5 años Y de 44".',lastVerified:'2026-08-19',confidence:'approximate'},
  tags:['🎈 INTERACTIVA','👨‍👩‍👦 FAMILIAR'],
  why:'Área de juego temática de fiesta — a ~47" y 5-6 años los tres niños ya superan el umbral de acompañante obligatorio, pero sigue siendo buena para ir en familia.'},
{id:'steppingtones',name:'Stepping Tones',cat:'descanso',priorityTier:3.2,zone:'🎡 Bricktopia',adult:false,
  tags:['🎵 INTERACTIVA','😌 TRANQUILA'],
  why:'Piso musical interactivo — ideal cuando estén cansados de caminar, cerca de Bricktopia.'},
  ],
  pois:[
{id:'brickolinis',type:'food',icon:'🍕',name:'Brickolini’s Pizza and Pasta',zone:'🌆 LEGO City',nearbyText:'Pizza, pasta y ensaladas — recomendado para las dos familias.',source:'Búsqueda web sobre legoland.com/new-york/things-to-do/theme-park/dining/brickolini-s-pizza-and-pasta/',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'royalfeast',type:'food',icon:'🍔',name:'Royal Feast',zone:'🏰 LEGO Castle',nearbyText:'Hamburguesas y menú infantil.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'smokeys',type:'food',icon:'🍖',name:'Smokey’s Brick B-Q-Que',zone:'🌆 LEGO City',nearbyText:'Barbacoa clásica.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'brickbeards',type:'food',icon:'🌮',name:'Brickbeard’s Food Market',zone:'🏴‍☠️ LEGO Pirates',nearbyText:'Hamburguesas, ensaladas, tacos y más.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'legocoffee',type:'food',icon:'☕',name:'LEGOLAND Coffee Company',zone:'🧱 Brick Street',nearbyText:'Café, pastelería y sándwiches.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'restroom-city',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🌆 LEGO City',nearbyText:'Ubicación aproximada — verificar en el mapa oficial impreso/app al llegar.',source:'Inferido de la disposición general del parque — sin confirmar contra el mapa oficial.',lastVerified:'2026-08-19',confidence:'unknown',geo:null},
{id:'restroom-miniland',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🏙️ Miniland',nearbyText:'Ubicación aproximada — verificar en el mapa oficial impreso/app al llegar.',source:'Inferido de la disposición general del parque — sin confirmar contra el mapa oficial.',lastVerified:'2026-08-19',confidence:'unknown',geo:null},
{id:'restroom-bricktopia',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🎡 Bricktopia',nearbyText:'Ubicación aproximada — verificar en el mapa oficial impreso/app al llegar.',source:'Inferido de la disposición general del parque — sin confirmar contra el mapa oficial.',lastVerified:'2026-08-19',confidence:'unknown',geo:null},
{id:'firstaid',type:'firstaid',icon:'🩹',name:'First Aid / Family Care',zone:'🚪 Entrada principal',nearbyText:'Suele estar cerca de Guest Services, junto a la entrada — confirmar ubicación exacta al llegar.',source:'Patrón típico de parques LEGOLAND/Merlin — no confirmado específicamente para este parque.',lastVerified:'2026-08-19',confidence:'inferred',geo:null},
{id:'lockers',type:'locker',icon:'🔒',name:'Lockers',zone:'🚪 Entrada principal',nearbyText:'Cerca de la entrada principal — confirmar ubicación y tarifa al llegar.',source:'Patrón típico de parques LEGOLAND/Merlin — no confirmado específicamente para este parque.',lastVerified:'2026-08-19',confidence:'inferred',geo:null},
{id:'show-police4d',type:'show',icon:'🎬',name:'LEGO City Police Chase (4D)',zone:'🌆 LEGO City',nearbyText:'Horarios variables — confirmar en la app oficial el día de la visita.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'show-friends4d',type:'show',icon:'🎬',name:'LEGO Friends "Alien Invasion" (4D)',zone:'🌆 LEGO City',nearbyText:'Horarios variables — confirmar en la app oficial el día de la visita.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'show-dreamzzz4d',type:'show',icon:'🎬',name:'LEGO DREAMZzz 4D: Z-Blob Rescue Rush',zone:'🌆 LEGO City',nearbyText:'Horarios variables — confirmar en la app oficial el día de la visita.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'character-meetgreet',type:'character',icon:'👋',name:'Meet & Greet con Minifiguras',zone:'Varía',nearbyText:'Personajes y horarios varían — confirmar en la app oficial el día de la visita.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'ev-lotb',type:'ev',icon:'🔌',name:'Carga EV — Park Lot B (Nivel 2, J1772)',zone:'🅿️ Estacionamiento',nearbyText:'2 estaciones "Livingston Charge Port", conector J1772 (Nivel 2, no DC rápido) — usar con el adaptador J1772 del EV6. Respaldo mientras el auto está estacionado todo el día, no como carga principal del viaje.',source:'Búsqueda web (parking-mobility.org, nystia.org) sobre la instalación de cargadores Livingston Charge Port en LEGOLAND New York.',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'entrance-main',type:'entrance',icon:'🚪',name:'Entrada principal',zone:'🚪 Entrada',nearbyText:'1 LEGOLAND Way, Goshen, NY — dirección pública del parque (no residencial).',source:'Búsqueda web (iloveny.com, Wikipedia) — dirección pública del predio.',lastVerified:'2026-08-19',confidence:'approximate',geo:{lat:41.37806,lng:-74.31333,source:'official-map',reference:'entrance'}},
{id:'parking-main',type:'parking',icon:'🅿️',name:'Estacionamiento principal',zone:'🅿️ Estacionamiento',nearbyText:'Llegar antes de la apertura para tiempo de parking + caminata a la entrada.',source:'Recomendación general — sin tarifa/ubicación exacta confirmada en esta implementación.',lastVerified:'2026-08-19',confidence:'inferred',geo:null},
  ],
};
