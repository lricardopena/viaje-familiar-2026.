/* parks/legoland-new-york.js — datos y configuración de LEGOLAND New York
   Resort (Goshen, NY) para el Theme Park Companion (assets/theme-park-core.js).
   Instancia #2 del motor reutilizable — demuestra que agregar un parque
   nuevo es escribir este archivo, no copiar la app. Visita familiar:
   domingo 23 de agosto de 2026, ida y vuelta desde Branford, CT.

   ⚠️ PROCEDENCIA Y CONFIANZA — leer antes de editar:
   Primera versión (2026-08-19) se armó por WebSearch indirecto, sin poder
   hacer fetch directo a legoland.com (bloqueado por el proxy de salida del
   entorno de desarrollo). Esta versión (actualizada 2026-08-19, mismo día)
   incorpora una investigación de seguimiento hecha por otro agente con
   acceso de red real, que SÍ pudo abrir las páginas oficiales — ver
   `legoland-research-findings.md` (adjuntado por el usuario) para el
   detalle completo con URL/fecha por cada hallazgo. Fuentes primarias
   usadas para restricciones de altura/edad (en este orden de prioridad):
     1. 2026 Accessibility Guide V6 (05.29.2026):
        https://www.legoland.com/new-york/media/o0uhthqm/llny-accessibility-guide-v6-52926.pdf
     2. Height Restrictions — Help Center (vigente):
        https://newyork-support.legoland.com/hc/en-us/articles/360024867691-Do-your-rides-and-attractions-have-height-restrictions
   Con esas dos fuentes en acuerdo, las restricciones de casi todas las
   atracciones de esta lista ahora llevan confidence:'verified-official'.
   Lo que SIGUE sin confirmar oficialmente (queda 'unknown'/null a
   propósito, no inventado):
     - Horario de apertura/cierre del 23-ago-2026 (el calendario oficial no
       expuso esa fecha específica al momento de la investigación).
     - Horarios exactos de los 3 shows 4D y de los meet & greets (oficial:
       varían, se confirman en la app el mismo día).
     - Nombre comercial "Livingston Charge Port", tipo de conector (J1772
       vs. otro) y costo de los cargadores EV del parque — el FAQ oficial
       confirma que existen 2 estaciones en Lot B, máximo 2 horas, sin
       carga nocturna, solo mientras se está cargando activamente, pero NO
       especifica marca/conector/precio.
     - Coordenadas GPS/Plus Code de baños, First Aid, Family Care y
       lockers — el mapa oficial 2026 es esquemático ("not to scale"), sin
       coordenadas descargables.
   ANTES DEL VIAJE: revisar el calendario oficial cuando se acerque la
   fecha (para el horario) y la app oficial el día de la visita (shows/
   meet&greets/tiempos de espera en vivo). */
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
    // Página oficial del mapa (enlace externo, "Abrir mapa oficial" — nunca embebido).
    url:'https://www.legoland.com/new-york/plan-your-visit/planning-tools/park-map/',
    // Imagen JPG oficial 2026, enlazada directamente desde la página anterior — confirmado
    // verified-official (ver legoland-research-findings.md, sección 3). Es esquemática, el
    // propio sitio la marca "not to scale", y ninguna atracción tiene mapMarker calibrado
    // (no hubo visita previa al parque) — el visor la muestra completa, sin círculos ni
    // zoom automático, mismo comportamiento que Story Land para una atracción sin marcador.
    // A diferencia de storyland-map-2026.webp (generada y alojada localmente), esta es un
    // hotlink al CDN de legoland.com: si algún día deja de resolver, ensureMapImage() ya
    // cae automáticamente al fallback "Abrir mapa oficial" (ver assets/theme-park-core.js).
    image:'https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',
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
    ['🔌','Kia EV6 2025: cargar en el Tesla Supercharger de Newburgh Mall (NACS nativo, sin adaptador) camino al parque. Los 2 cargadores del parque (Lot B) son solo respaldo — oficialmente limitados a 2 horas y sin carga nocturna, no sirven para dejar el auto cargando todo el día.'],
    ['🕐','Horario oficial del 23 de agosto de 2026 todavía sin confirmar (el calendario oficial no lo publicaba al momento de esta investigación) — revisarlo cerca de la fecha y llegar con margen antes de la apertura para parking/entrada.'],
    ['📱','Usar la app oficial de LEGOLAND New York en el parque para horarios de shows/personajes y tiempos de espera en vivo — confirmado que varían día a día y no se publican con antelación en la web.'],
    ['🧱','Miniland USA está en el centro del parque — buena referencia para reagruparse si las familias se separan.'],
    ['🏎️','Nueva atracción 2026 "LEGO Ferrari Build & Race" ya abierta, sin restricción de altura/edad — no está en el plan interactivo todavía (zona exacta sin confirmar en esta actualización), pero vale la pena preguntar por ella al llegar.'],
  ],
  family:{
    children:[
      {name:'Niño (5 años)',ageYears:5,heightIn:47,heightApprox:true},
      {name:'Niña (6 años)',ageYears:6,heightIn:47,heightApprox:true},
      {name:'Niña (5 años)',ageYears:5,heightIn:47,heightApprox:true},
    ],
  },
  shows:[], // Confirmado oficialmente (Help Center) que los 3 shows 4D y los meet&greets no tienen horario fijo publicado — "check the app" — así que se mantienen como POIs informativos (ver pois) en vez de con `times` fabricados; si algún día se confirma un horario fijo, ahí sí vale poblar `times` para activar el banner "🎭 empieza pronto" del core.
  closingTime:null, // horario de cierre oficial del 23-ago-2026 sin confirmar: el calendario oficial (operating-calendar) no expuso esa fecha durante la investigación (2026-08-19), y no hay una política publicada de "se publica con N semanas de antelación" — revisar de nuevo más cerca de la fecha.
  attractions:[
{id:'dragon',name:'The Dragon',cat:'rides',priorityTier:1,zone:'🏰 LEGO Castle',adult:true,
  restrictions:{minHeightIn:42,minAge:4,adultRequiredBelowInAndAge:{heightIn:48,ageYears:6},source:'2026 Accessibility Guide V6 (05.29.2026) + Height Restrictions Help Center — https://www.legoland.com/new-york/media/o0uhthqm/llny-accessibility-guide-v6-52926.pdf',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🔥 IMPERDIBLE','🎢 COASTER FAMILIAR','🐉 CASTLE'],
  why:'El coaster principal de LEGO Castle: familiar pero con emoción real — conviene temprano antes de que se formen filas.',
  tip:'Nuestro niño de 6 años puede calificar para ir sin adulto (verificar en el parque si "6 años" cuenta como "menor de 6" o no); las dos niñas de 5 necesitan acompañante por la regla combinada edad+altura.'},
{id:'dragonsapprentice',name:"Dragon's Apprentice",cat:'rides',priorityTier:0,zone:'🏰 LEGO Castle',adult:false,
  restrictions:{minHeightIn:36,adultRequiredBelowIn:42,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (mínimo 36"; acompañante requerido debajo de 42").',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🔥 IMPERDIBLE','🎢 COASTER SUAVE','⭐ PUEDE IR SOLO'],
  why:'Coaster pequeño para entrenar "dragones bebé" — a ~47" los tres niños califican para subir solos, buena primera montaña rusa del día.'},
{id:'merlin',name:"Merlin's Flying Machines",cat:'rides',priorityTier:2,zone:'🏰 LEGO Castle',adult:true,
  restrictions:{minHeightIn:36,adultRequiredBelowIn:48,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center.',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🎠 GIRO SUAVE','👨‍👦 CON ADULTO'],
  why:'Vueltas suaves en el aire, temática de dragones — buen contraste de ritmo cerca de The Dragon.'},
{id:'fireacademy',name:'Fire Academy',cat:'lego',priorityTier:0,zone:'🌆 LEGO City',adult:true,
  restrictions:{minHeightIn:34,adultRequiredBelowInAndAge:{heightIn:52,ageYears:12},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (mínimo 34"; acompañante para menores de 52" Y de 12 años — condición combinada, no altura sola).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🔥 IMPERDIBLE','🚒 INTERACTIVA','👨‍👦 CON ADULTO'],
  why:'Manejan un camión de bomberos y "apagan" un incendio con agua — de las experiencias interactivas favoritas de los niños en LEGO City.'},
{id:'coastguard',name:'Coast Guard Academy',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',adult:true,
  restrictions:{minHeightIn:34,adultRequiredBelowIn:52,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center.',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚤 INTERACTIVA','👨‍👦 CON ADULTO'],
  why:'Manejan botes patrulla en un canal de agua — similar en espíritu a Fire Academy, buena alternativa si hay fila ahí.'},
{id:'drivingschool',name:'Driving School',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',adult:false,
  restrictions:{minAgeUnaccompanied:6,soloOnly:true,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima, edades 6–13, autos que se manejan solos (no admite ir "con adulto" en el mismo auto).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚗 MANEJAN SOLOS','6-13 AÑOS'],
  why:'Autos eléctricos con carril propio — solo para quien ya cumple la edad mínima; los demás pueden hacer Junior Driving School.'},
{id:'juniordriving',name:'Junior Driving School',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',adult:false,
  restrictions:{minAgeUnaccompanied:3,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima, edades 3–6 confirmadas (rango oficial vigente).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚗 MANEJAN SOLOS','3-6 AÑOS'],
  why:'Versión para más pequeños de Driving School — pensada para nuestro rango de edad (5 y 6 años); el rango oficial confirmado (3–6) incluye a la niña que cumple 6.'},
{id:'anchorsaway',name:'Anchors Away',cat:'rides',priorityTier:2,zone:'🏴‍☠️ LEGO Pirates',adult:false,
  restrictions:{minHeightIn:34,adultRequiredBelowIn:42,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (34" confirmado — contenido más antiguo indexado decía 36", usar el valor 2026 vigente).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🏴‍☠️ PIRATAS','⭐ PUEDE IR SOLO'],
  why:'Vueltas en barco pirata — a ~47" los tres niños ya califican para ir sin adulto.'},
{id:'splashbattle',name:'Splash Battle',cat:'agua',priorityTier:2,waterBoostTier:1.5,zone:'🏴‍☠️ LEGO Pirates',adult:false,
  restrictions:{adultRequiredBelowInAndAge:{heightIn:52,ageYears:8},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima, acompañante requerido para menores de 8 años Y de 52" (condición combinada).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['💦 TE MOJAS','🎮 INTERACTIVA','👨‍👩‍👦 FAMILIAR'],
  tip:'👕 Confirmen que traen muda de ropa antes de empezar.',
  why:'Batalla de agua interactiva temática pirata — buena para la parte más calurosa del día.'},
{id:'legofactory',name:'LEGO Factory Adventure Ride',cat:'lego',priorityTier:0,zone:'🎡 Bricktopia',adult:true,
  restrictions:{adultRequiredBelowIn:48,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima para subir, acompañante requerido para menores de 48" (contenido más antiguo indexado decía 52" — usar 48" vigente).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🔥 IMPERDIBLE','🏭 DARK RIDE','👨‍👦 CON ADULTO'],
  why:'Recorrido tranquilo tipo dark ride mostrando cómo se hacen los ladrillos LEGO — imperdible, apto para toda la familia, ritmo suave.'},
{id:'duploexpress',name:'LEGO DUPLO Express',cat:'descanso',priorityTier:2.6,zone:'🎡 Bricktopia',adult:false,
  restrictions:{adultRequiredBelowIn:34,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center.',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚂 SUAVE','👨‍👩‍👦 FAMILIAR'],
  why:'Tren tranquilo pensado para los más chicos — buen respiro entre atracciones más activas.'},
{id:'dizzydisco',name:"DJ's Dizzy Disco Spin",cat:'rides',priorityTier:2.6,zone:'🎡 Bricktopia',adult:false,
  restrictions:{adultRequiredBelowIn:40,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (contenido más antiguo indexado decía 42" — usar 40" vigente).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🎵 GIRO SUAVE'],
  why:'Vueltas suaves con música — buena opción ligera dentro de Bricktopia.'},
{id:'ninjagoride',name:'LEGO NINJAGO The Ride',cat:'lego',priorityTier:1,zone:'🥷 LEGO NINJAGO World',adult:true,
  restrictions:{adultRequiredBelowIn:48,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima, acompañante requerido para menores de 48".',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🔥 IMPERDIBLE','🥷 INTERACTIVA (GESTOS)','🏠 INDOOR'],
  tip:'👟 Puede pedir calzado cerrado — no confirmado en esta actualización si sigue vigente ese requisito, preguntar en la entrada de la atracción.',
  why:'Dark ride interactivo: "lanzan" energía con gestos de las manos contra villanos — de las experiencias más pedidas por los niños, indoor (buen plan si llueve).'},
{id:'gravityforce',name:"Jay's Gravity Force Trainer",cat:'rides',priorityTier:2,zone:'🥷 LEGO NINJAGO World',adult:false,
  restrictions:{minHeightIn:42,minAge:4,adultRequiredBelowInAndAge:{heightIn:52,ageYears:8},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: mínimo 42"/4 años; acompañante para menores de 8 años Y de 52".',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🌀 GIRO MÁS INTENSO'],
  why:'Entrenamiento giratorio estilo ninja — el ride "más emocionante" del día si los niños quieren algo con más intensidad, sin ser un coaster grande.'},
{id:'miniland',name:'Miniland USA',cat:'miniland',priorityTier:0,zone:'🏙️ Miniland',adult:false,
  tags:['🔥 IMPERDIBLE','🏙️ RECORRIDO','📸 FOTOS'],
  why:'Miniaturas de ciudades de EE.UU. hechas con millones de piezas LEGO — el corazón visual del parque, sin restricciones, ritmo libre.'},
{id:'buildtest',name:'Build & Test',cat:'descanso',priorityTier:3,zone:'🧱 Brick Street',adult:false,
  tags:['🧱 CONSTRUCCIÓN','😌 TRANQUILA'],
  why:'Mesa de construcción libre — buena pausa creativa entre atracciones, sin filas largas.'},
{id:'brickparty',name:'Brick Party',cat:'descanso',priorityTier:3,zone:'🧱 Brick Street',adult:false,
  restrictions:{adultRequiredBelowInAndAge:{heightIn:44,ageYears:5},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: acompañante requerido para menores de 5 años Y de 44".',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🎈 INTERACTIVA','👨‍👩‍👦 FAMILIAR'],
  why:'Área de juego temática de fiesta — a ~47" y 5-6 años los tres niños ya superan el umbral de acompañante obligatorio, pero sigue siendo buena para ir en familia.'},
{id:'steppingtones',name:'Stepping Tones',cat:'descanso',priorityTier:3.2,zone:'🎡 Bricktopia',adult:false,
  tags:['🎵 INTERACTIVA','😌 TRANQUILA'],
  why:'Piso musical interactivo — ideal cuando estén cansados de caminar, cerca de Bricktopia.'},
  ],
  pois:[
{id:'brickolinis',type:'food',icon:'🍕',name:'Brickolini’s Pizza and Pasta',zone:'🌆 LEGO City',nearbyText:'Pizza, pasta y ensaladas — recomendado para las dos familias.',source:'legoland.com/new-york/things-to-do/theme-park/dining/brickolini-s-pizza-and-pasta/',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'royalfeast',type:'food',icon:'🍔',name:'Royal Feast',zone:'🏰 LEGO Castle',nearbyText:'Hamburguesas y menú infantil.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY (no reverificado en la investigación de seguimiento).',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'smokeys',type:'food',icon:'🍖',name:'Smokey’s Brick B-Q-Que',zone:'🌆 LEGO City',nearbyText:'Barbacoa clásica.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY (no reverificado en la investigación de seguimiento).',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'brickbeards',type:'food',icon:'🌮',name:'Brickbeard’s Food Market',zone:'🏴‍☠️ LEGO Pirates',nearbyText:'Hamburguesas, ensaladas, tacos y más.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY (no reverificado en la investigación de seguimiento).',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'legocoffee',type:'food',icon:'☕',name:'LEGOLAND Coffee Company',zone:'🧱 Brick Street',nearbyText:'Café, pastelería y sándwiches.',source:'Búsqueda web sobre contenido oficial LEGOLAND NY (no reverificado en la investigación de seguimiento).',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'restroom-entrance',type:'restroom',icon:'🚻',name:'Restrooms — junto a Ticket Windows',zone:'🚪 Entrada',nearbyText:'Confirmado oficialmente: hay un kiosco Cash-to-Card justo al lado de estos baños, cerca de las ventanillas de boletos de la entrada.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'restroom-city',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🌆 LEGO City',nearbyText:'El mapa oficial 2026 marca baños con ícono en esta zona, sin referencia textual más precisa ni coordenada.',source:'Mapa oficial 2026 — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'restroom-miniland',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🏙️ Miniland',nearbyText:'El mapa oficial 2026 marca baños con ícono en esta zona, sin referencia textual más precisa ni coordenada.',source:'Mapa oficial 2026 — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'restroom-bricktopia',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🎡 Bricktopia',nearbyText:'El mapa oficial 2026 marca baños con ícono en esta zona, sin referencia textual más precisa ni coordenada.',source:'Mapa oficial 2026 — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'approximate',geo:null},
{id:'firstaid-brickstreet',type:'firstaid',icon:'🩹',name:'First Aid — Brick Street',zone:'🧱 Brick Street',nearbyText:'Junto al Guest Experience Center.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'firstaid-legocity',type:'firstaid',icon:'🩹',name:'First Aid — LEGO City',zone:'🌆 LEGO City',nearbyText:'Junto al Water Playground.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'familycare',type:'familycare',icon:'👶',name:'DUPLO Family Care Center',zone:'🌆 LEGO City',nearbyText:'Áreas privadas de lactancia, calentador de biberones, microondas, cambiadores para bebé/adulto y sala sensorial del parque. Un mapa oficial más antiguo (2023) la ubicaba junto a Brickolini’s Pizza and Pasta — referencia de apoyo, no confirmada contra el mapa 2026.',source:'Services page (zona) — https://www.legoland.com/new-york/things-to-do/theme-park/services/ · referencia de ubicación más precisa: LLNY Sensory Guide 2023 — https://www.legoland.com/new-york/media/bgfbqheo/llny-sensory-guide-2023.pdf',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'lockers-bricktopia',type:'locker',icon:'🔒',name:'Lockers — Build + Test, Bricktopia',zone:'🎡 Bricktopia',nearbyText:'Sistema sin llave (keyless). Tarifa oficial vigente: $9–$12/día según tamaño.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'lockers-familycare',type:'locker',icon:'🔒',name:'Lockers — junto a Family Care',zone:'🌆 LEGO City',nearbyText:'Sistema sin llave (keyless). Tarifa oficial vigente: $9–$12/día según tamaño.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'show-police4d',type:'show',icon:'🎬',name:'LEGO CITY 4D: Officer in Pursuit',zone:'🌆 LEGO City',nearbyText:'Horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita, sin agenda fija publicada en la web.',source:'https://newyork-support.legoland.com/hc/en-us/articles/22950265526557-What-4D-shows-do-you-have-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'show-friends4d',type:'show',icon:'🎬',name:'LEGO Friends 4D: Alien Invasion',zone:'🌆 LEGO City',nearbyText:'Horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita, sin agenda fija publicada en la web.',source:'https://newyork-support.legoland.com/hc/en-us/articles/22950265526557-What-4D-shows-do-you-have-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'show-dreamzzz4d',type:'show',icon:'🎬',name:'LEGO DREAMZzz 4D: Z-Blob Rescue Rush',zone:'🌆 LEGO City',nearbyText:'Horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita, sin agenda fija publicada en la web.',source:'https://newyork-support.legoland.com/hc/en-us/articles/22950265526557-What-4D-shows-do-you-have-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'character-meetgreet',type:'character',icon:'👋',name:'Meet & Greet con Minifiguras',zone:'Varía',nearbyText:'Personajes y horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita.',source:'https://newyork-support.legoland.com/hc/en-us/articles/23710553919901-What-shows-and-entertainment-can-I-enjoy-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'ev-lotb',type:'ev',icon:'🔌',name:'Carga EV — Park Lot B (2 estaciones)',zone:'🅿️ Estacionamiento',nearbyText:'Confirmado oficialmente: 2 estaciones de carga hacia el frente, lado más lejano del Lot B. Máximo 2 horas de carga, sin carga nocturna, espacios solo para carga activa. El FAQ oficial NO especifica marca, tipo de conector ni costo — no asumir "Livingston Charge Port"/J1772/gratis sin confirmarlo en el parque. Llevar el adaptador J1772→NACS por si acaso, pero no está garantizado que sea compatible.',source:'https://newyork-support.legoland.com/hc/en-us/articles/6344836333725-Do-you-have-Car-Charging-Stations-at-LEGOLAND-New-York',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'entrance-main',type:'entrance',icon:'🚪',name:'Entrada principal',zone:'🚪 Entrada',nearbyText:'1 LEGOLAND Way, Goshen, NY — dirección pública del parque (no residencial).',source:'Búsqueda web (iloveny.com, Wikipedia) — dirección pública del predio.',lastVerified:'2026-08-19',confidence:'approximate',geo:{lat:41.37806,lng:-74.31333,source:'official-map',reference:'entrance'}},
{id:'parking-main',type:'parking',icon:'🅿️',name:'Estacionamiento principal',zone:'🅿️ Estacionamiento',nearbyText:'Llegar antes de la apertura para tiempo de parking + caminata a la entrada.',source:'Recomendación general — sin tarifa/ubicación exacta confirmada en esta implementación.',lastVerified:'2026-08-19',confidence:'inferred',geo:null},
  ],
};
