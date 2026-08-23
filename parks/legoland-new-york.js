/* parks/legoland-new-york.js — datos y configuración de LEGOLAND New York
   Resort (Goshen, NY) para el Theme Park Companion (assets/theme-park-core.js).
   Instancia #2 del motor reutilizable — demuestra que agregar un parque
   nuevo es escribir este archivo, no copiar la app. Visita familiar:
   domingo 23 de agosto de 2026, ida y vuelta desde casa (ver nota de
   privacidad de ubicaciones residenciales en CLAUDE.md / data.js).

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

   Tercera pasada (mismo día): el usuario compartió directamente la imagen
   del mapa oficial 2026 (la misma que enlaza `map.image` más abajo) — de
   ahí salen los `mapNumber` de cada atracción/POI, la corrección de zona
   de Smokey's Brick B-Q-Que (es Bricktopia #20, no LEGO City), y dos
   atracciones que antes no estaban en la lista por no tener zona
   confirmada: LEGO Ferrari Build & Race (Bricktopia #25, nueva 2026, sin
   restricción) y Minifigure Skyflyer (Brick Street #9 / LEGO Pirates #81).
   El mapa es esquemático ("not to scale"), así que estos números son
   referencia de ubicación por zona, no coordenadas — ninguna atracción de
   LEGOLAND tiene `mapMarker` calibrado en pixeles como Story Land (no hubo
   visita previa al parque para calibrarlo).

   Lo que SIGUE sin confirmar oficialmente (queda 'unknown'/null/'approximate' a
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
     - Rango de edad exacto de Junior Driving School: el mapa oficial dice
       "AGES 3-5", el Accessibility Guide + Help Center dicen 3–6 — se usa
       el piso compartido (3) y se marca `confidence:'approximate'` en vez
       de asumir cuál de las dos fuentes está vigente.
     - Regla de acompañante de Minifigure Skyflyer: el Accessibility Guide
       la lista con una notación de "14 yrs" que no se tradujo a un campo
       `restrictions` claro — queda solo como aviso en `tip`.
   Usuario confirmó (23-ago-2026): NO tienen adaptador NACS→CCS — Electrify
   America queda descartado como opción de carga para este viaje (ver
   campo `ev` del día "23" en data.js).
   ANTES DEL VIAJE: revisar el calendario oficial cuando se acerque la
   fecha (para el horario) y la app oficial el día de la visita (shows/
   meet&greets/tiempos de espera en vivo).

   Cuarta pasada (2026-08-20): geolocalización, a partir de
   `legoland-offline-research-geolocation-handoff.md` (adjuntado por el
   usuario, investigación externa ya hecha con fuentes/URL/fecha por
   hallazgo, sin necesidad de red en este entorno):
     - `geo` agregado a 4 atracciones (dragonsapprentice, fireacademy,
       legofactory, ninjagoride) — todas centroides de OpenStreetMap/
       terceros (source:'openstreetmap-poi'/'third-party-ride-poi',
       reference:'ride-poi', SIN confidence:'verified-official' — nunca la
       entrada de fila real, solo una ubicación aproximada de la
       atracción). `gravityforce` (Jay's Gravity Force Trainer) recibió su
       Plus Code (9MJP+7F) con `geo:null` a propósito — no se decodificó a
       lat/lng offline, y el handoff pide explícitamente no inventar la
       coordenada.
     - Jerarquía de procedencia aplicada (igual que documenta el handoff):
       entrada medida en sitio > coordenada oficial > POI de mapa/terceros
       > geo:null. Ningún punto de esta pasada alcanza el primer nivel —
       todos son de mapa/terceros o quedan sin coordenada.
     - `PARK.map.geoCalibration` (transformación GPS→mapa ilustrado)
       queda SIN definir a propósito: los 4 puntos con `geo` no están bien
       distribuidos (todos Bricktopia/NINJAGO/LEGO City, ninguno en LEGO
       Pirates/entrada/Miniland) y ninguna atracción tiene `mapMarker`
       calibrado todavía — ver comentario largo en `map:{}` más abajo con
       el orden de captura sugerido para la visita del 23-ago-2026.
     - Restricciones: se agregó soporte genérico de `minAge`/`maxAge` al
       motor (antes `minAge` era un campo muerto — The Dragon y Jay's
       Gravity Force Trainer ya lo declaraban pero nunca se evaluaba).
       Driving School ahora declara `maxAge:13` explícito. Junior Driving
       School se resolvió a favor de la página oficial vigente de la
       atracción (3–6 años, confidence:'verified-official') sobre el
       rótulo más genérico del mapa ilustrado ("3-5"), siguiendo la regla
       de prioridad de fuentes del handoff — ver el campo `source` de esa
       atracción para el detalle.
     - Guardrail de privacidad "Home": auditado — este archivo y el resto
       del repo ya usan la etiqueta lógica de Google Maps en vez de
       ciudad/dirección residencial (ver CLAUDE.md y el commit que aplicó
       esto antes de esta pasada); no se encontraron referencias nuevas
       que corregir.

   Quinta pasada (2026-08-24): `mapMarker` (posición en % sobre
   `assets/legoland-map-2026.webp`, imagen local ya vendorizada) leído
   visualmente por el agente directamente de la imagen — recortes de la
   imagen a resolución original (5100×3300) para ubicar el pin numerado de
   cada atracción, sin necesidad de visita previa al parque. Agregado a
   dragon(#45)/dragonsapprentice(#42)/fireacademy(#71)/legofactory(#22)/
   ninjagoride(#32) — las mismas 5 que ya tenían `geo` — más a
   entrance-main(#1, Ticket Windows) que ya tenía `geo`, y a
   anchorsaway(#83)/splashbattle(#87)/miniland(#98, Miniland Hub) SIN
   `geo` todavía (mapMarker no depende de `geo`; sirve para mostrar el pin
   sobre el mapa ilustrado incluso sin coordenada real — ver "Fallback de
   mapa" en specs). Con esto, esas 8 atracciones/POIs ya aparecen
   marcadas sobre el mapa oficial ilustrado (vista "🔎 Búscala en el
   mapa oficial"), independientemente de GPS.

   `PARK.map.geoCalibration` SIGUE sin activarse: con los 6 pares
   (geo,mapMarker) disponibles hoy (5 atracciones + entrance-main) se
   probó offline un ajuste afín diagnóstico (mismo método que Story
   Land) — residual mediano ~4.6 puntos porcentuales, máximo ~5.7pp
   (comparable al ~5pp de Story Land), pero la distribución sigue sin
   cubrir LEGO Pirates (todo el lado este del parque, x%≈70-90, queda
   fuera del casco convexo de los puntos actuales, x%≈22-59) — proyectar
   GPS ahí extrapolaría fuera de rango, con error no acotado. anchorsaway
   y splashbattle ya tienen `mapMarker` listo (#83/#87, Pirates) para el
   día que se les agregue `geo` (Plus Code buscado en Maps o medido en el
   parque) — con eso, la calibración quedaría lista para reevaluarse. Ver
   specs/SPECIFICATIONS.md.asc sección 21bis para el detalle completo
   (coeficientes, residual por punto, criterio de activación).

   Sexta pasada (2026-08-23, DÍA DE LA VISITA): primeros puntos MEDIDOS EN
   SITIO de este parque. El usuario recolectó Plus Codes parado en cada
   lugar y los dictó como referencias confirmadas físicamente — por la
   jerarquía de procedencia que ya aplicaba el archivo (entrada medida en
   sitio > coordenada oficial > POI de mapa/terceros > geo:null), tienen
   prioridad sobre cualquier estimación anterior:
     - anchorsaway        9MJQ+68Q → 41.380609,-74.311738  (nuevo)
     - splashbattle       9MJQ+5MP → 41.380453,-74.310762  (nuevo)
     - minifigureskyflyer 9MJQ+76H → 41.380703,-74.311963  (nuevo, acceso
       inferior lado LEGO Pirates — ver salvedades en su registro)
     - waterplayground    9MJQ+C59 → 41.381047,-74.312062  (atracción nueva
       en este archivo; antes solo se la mencionaba como referencia de
       First Aid #72)
     - fireacademy        9MJQ+H24 → 41.381391,-74.312438  (REEMPLAZA el
       centroide de OpenStreetMap que estaba, ~25 m al suroeste)
   Los códigos venían en forma corta ("9MJQ+68Q Goshen, New York"). Se
   recuperaron a código completo contra el centro del predio (87H7 +
   código) y se decodificaron con el algoritmo Open Location Code estándar
   — celda resultante ~3.5 × 2.1 m, o sea precisión de metros, no de zona.
   El decodificador se validó primero contra datos ya commiteados: los 6
   Plus Codes en sitio de Story Land y el código completo de The Dragon
   reproducen sus lat/lng guardados con diferencias de pocos metros.
   Verificación cruzada independiente: fireacademy cae a ~25 m del
   centroide OSM que tenía, y el orden este-oeste / norte-sur de los 5
   puntos coincide con el de sus `mapMarker` ya calibrados sobre el mapa
   ilustrado — dos señales de que los códigos son correctos.

   Lo que esta pasada NO hizo, a propósito:
     - No se activó `PARK.map.geoCalibration` — ver el análisis con
       residuales y leave-one-out en el comentario de `map:{}` más abajo.
     - No se inventó ninguna coordenada para los puntos que siguen sin
       medición (baños, First Aid, Family Care, lockers, resto de las
       atracciones). Siguen con `geo:null` y aparecen en la lista "sin
       coordenada registrada" del mapa geográfico; a los que están cerca
       de un ancla nueva se les mejoró el `nearbyText` para orientarlos
       por referencia relativa (restroom-city y firstaid-legocity vía Fire
       Academy/Water Playground; brickbeards vía Anchors Away/Splash
       Battle), que es lo más que se puede afirmar con honestidad.
     - No se tocó `assets/theme-park-core.js`: todo lo que pedía la
       actualización (Plus Code como referencia real, "ver en mapa"/"cómo
       llegar" a Google Maps, posición del usuario respecto a los puntos,
       vista general + vista cercana, fallback sin permiso de ubicación)
       ya estaba implementado de forma genérica en el motor y se activa
       solo con que el punto tenga `geo` — esta pasada es puramente de
       capa de datos.
     - Nombre a verificar: el usuario dictó "Minifigure Skyline"; el
       registro oficial de este archivo es "Minifigure Skyflyer". Se
       asumió la misma atracción (misma zona + nota de "acceso por la
       parte de abajo"), pero conviene confirmarlo.

   Séptima pasada (23-ago-2026, misma sesión) — 3 Plus Codes en sitio más +
   modelo de confianza de 3 niveles para geo + baños navegables:
     - 3 Plus Codes nuevos, mismo procedimiento de decodificación que la
       sexta pasada: Driving School `9MJP+PP3` → 41.381766,-74.313213;
       Coast Guard Academy `9MJP+VX7` → 41.382172,-74.312613 (ambas ya
       tenían `mapMarker`, ahora también `geo`); Ocean Explorer `9MJQ+W37`
       → 41.382297,-74.312363 (atracción nueva — #64, no estaba en la
       lista). Las tres con `confidence:'confirmed_on_site'` (nuevo campo
       en `geo`, ver más abajo).
     - Se agregaron las 3 atracciones/POIs que había señalado la auditoría
       de mismatches de la pasada anterior como faltantes de la leyenda del
       mapa: `mmbe` (Master Model Builder Experience, Bricktopia #18),
       `ninjakitchen` (Ninja Kitchen, NINJAGO World #29, POI dining) y
       `wuswarehouse` (Wu's Warehouse, NINJAGO World #30, POI shopping) —
       mapMarker leído del mapa oficial, mismo método de siempre.
     - **Modelo de confianza de 3 niveles para `geo`** (pedido explícito del
       usuario, generalizable a cualquier parque): `geo.confidence` puede
       ser `'confirmed_on_site'` (Plus Code medido parado en el punto),
       `'official_map'` (coordenada publicada por el parque, sin Plus Code
       propio — LEGOLAND no tiene ninguna así hoy, el mapa 2026 es
       esquemático) o `'approximate'` (estimada cruzando la posición del
       ícono en el mapa con anchors reales cercanos, con
       `geo.estimatedFrom` documentando cuáles). `geoSourceBadge()` en el
       core ahora revisa `geo.confidence` antes que `geo.source`/
       `geo.reference` — compatible con todo el geo existente, que no
       define `confidence` y sigue mostrando el mismo badge de siempre.
     - **Baños navegables, con el mismo modelo de 3 niveles.** Los 4 baños
       ya trackeados (`restroom-entrance`, `restroom-city`,
       `restroom-miniland`, `restroom-bricktopia`) reciben `mapMarker`
       (posición del ícono 🚻 en el mapa oficial, leída visualmente, mismo
       método que el resto del archivo). Se agregan 3 baños que no estaban
       trackeados: `restroom-castle`, `restroom-ninjago`, `restroom-pirates`
       (mismo método). De los 7, solo 2 reciben `geo` estimado —
       `restroom-city`/`restroom-miniland` (mismo ícono físico, en el borde
       de ambas zonas — comparten coordenada) y `restroom-pirates` —
       porque son los únicos con 3+ anchors `confirmed_on_site` lo bastante
       cerca (LEGO City: fireacademy/waterplayground/drivingschool/
       coastguard/oceanexplorer, residual máximo 2.68pp en un ajuste afín
       local — mejor que el ajuste de todo el parque documentado en
       `map:{}`; LEGO Pirates: anchorsaway/splashbattle/skyflyer, solo 3
       puntos así que el ajuste los reproduce exactos por construcción, sin
       margen propio de validación — tratar con más cautela). Los otros 4
       baños (`restroom-entrance`, `restroom-bricktopia`, `restroom-castle`,
       `restroom-ninjago`) se quedan con `geo:null` a propósito: sus
       anchors más cercanos son de terceros/OSM (no `confirmed_on_site`) o
       no hay ninguno cerca — encadenar una estimación sobre otra
       estimación habría sido demasiado ruido. Quedan igual localizables
       por `mapMarker` (mapa ilustrado) y `nearbyText` (referencia a la
       atracción numerada más cercana); están listos para que un `geo`
       real reemplace la ausencia en cuanto se mida un Plus Code parado en
       la puerta.
     - ⚠️ Corrección importante señalada por el usuario: el Plus Code
       `9MJQ+C59` (Water Playground, sexta pasada) NUNCA fue ni debe usarse
       para un baño — quedó una posible confusión de una versión anterior
       de la investigación offline. Verificado en este archivo: `9MJQ+C59`
       solo aparece en el registro de `waterplayground`.
     - Motor (`assets/theme-park-core.js`): `BY_ID` ahora indexa POIs
       además de atracciones (antes solo `ALL`) — sin esto, el botón
       "🗺️ Ver mapa" que ya existía para cualquier POI con `geo`
       (`poiCardHtml()`) no encontraba nada al tocarlo (bug preexistente,
       nunca se había notado porque hasta ahora ningún POI con `geo` lo
       había expuesto lo suficiente). Cero colisiones de id entre
       atracciones y POIs en ningún parque (verificado). Nueva función
       `nearestRestroomInfo()`: con GPS, prioriza el baño de la MISMA zona
       que el punto real conocido más cercano al usuario (con su distancia
       real si el baño tiene `geo`, o la distancia real al anchor de esa
       zona si no la tiene — nunca una distancia al baño que no se calculó)
       y solo cae a "el baño con geo más cercano en línea recta" si no hay
       ninguno en la zona actual. `openRestroomFinder()` la activa
       automáticamente (banner en `mapGeoBanner`, reutilizando el
       contenedor existente) — si el usuario ya había concedido GPS antes,
       ver el baño más cercano no pide ningún toque adicional.
     - Verificado en Chromium: banner de baño más cercano correcto en 3
       ubicaciones simuladas (LEGO City → distancia real ~35 m; LEGO
       Pirates → distancia real ~60 m; Bricktopia, sin geo en su baño →
       fallback de zona "~1 m de LEGO Factory Adventure Ride" en vez de
       inventar una distancia al baño); sin GPS, banner invita a activar
       "Mi ubicación" y los 4 baños sin geo siguen listados por texto; los
       3 baños con geo aparecen como pines; badge "🧭 Ubicación estimada"
       + línea "Estimado a partir de: ..." visibles en el popup de
       restroom-city; botón "🗺️ Ver mapa oficial" y el toggle de zoom
       cerca/completo funcionan para un baño (antes solo para
       atracciones); sin regresión en Story Land (BY_ID pasa de solo
       atracciones a atracciones+POIs sin romper nada, mismo resultado de
       siempre). */
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
    mapNote:'El mapa oficial nos ayuda a ubicarnos por zona (Brick Street, Nature Way, LEGO Castle, Bricktopia, LEGO NINJAGO World, LEGO City, LEGO Pirates y Miniland). Nuestra app sigue decidiendo qué conviene hacer ahora.',
    doneTitle:'¡Completaron el plan de LEGOLAND New York!',
    doneBody:'Ya hicieron todo lo importante. Si el parque sigue abierto, repitan alguna favorita o vuelvan a Miniland antes de irse.',
    resetConfirm:'¿Borrar todo el progreso del día en LEGOLAND New York? Esta acción no se puede deshacer.',
    lunchTip:'Brickolini’s Pizza & Pasta (LEGO City) tiene pizza, pasta y ensaladas — buena opción para las dos familias. Coman temprano (~11:15) o tarde (~14:00) para evitar el pico.',
  },
  map:{
    // Página oficial del mapa (enlace externo, "Abrir mapa oficial" — nunca embebido).
    url:'https://www.legoland.com/new-york/plan-your-visit/planning-tools/park-map/',
    // Copia local del mapa oficial 2026 (assets/legoland-map-2026.webp) — el usuario adjuntó
    // la imagen directamente (misma fuente que la URL oficial gushogjw/2026-legoland-new-york-
    // park-map.jpg, ver legoland-research-findings.md sección 3) y pidió alojarla en el repo
    // para no depender de un hotlink al CDN de legoland.com mientras tanto — mismo motivo que
    // storyland-map-2026.webp (ver assets/theme-park-core.js / specs sección 21). Es
    // esquemática ("not to scale"), y ninguna atracción tiene mapMarker calibrado en pixeles
    // (no hubo visita previa al parque) — el visor la muestra completa, sin círculos ni zoom
    // automático, mismo comportamiento que Story Land para una atracción sin marcador.
    // "Fija por el momento" (pedido explícito del usuario, 23-ago-2026): si LEGOLAND publica
    // un mapa nuevo, hay que reemplazar este archivo a mano — no hay sincronización automática.
    image:'assets/legoland-map-2026.webp',
    center:[41.37806,-74.31333], // LEGOLAND New York Resort, Goshen NY — coordenada pública del predio (Wikipedia/registros públicos), NO una dirección residencial.
    // SIGUE SIN geoCalibration — recalculada desde cero (décima pasada, 23-ago-2026) ahora que
    // hay cobertura confirmed_on_site en las 3 zonas principales (Castle, City, Pirates), pero
    // el resultado sigue sin cruzar la barra que pidió el usuario: "es preferible NO mostrar
    // 'Estás aquí' que mostrarlo desplazado decenas de metros o en una zona incorrecta".
    //
    // Candidatos: TODOS los puntos con geo.confidence==='confirmed_on_site' Y mapMarker propio.
    // 14 registros cumplen ambos, pero restroom-city/restroom-miniland comparten el mismo baño
    // físico (mismo geo, mismo mapMarker) — cuentan como UN solo punto espacial, no dos, o se
    // duplicaría su peso en el ajuste. Quedan 13 puntos independientes:
    //   Castle (4):   dragon, builders, towerclimb, restroom-castle       — x%≈22–34, y%≈13–18
    //   City (6):     fireacademy, waterplayground, coastguard,
    //                 oceanexplorer, drivingschool, restroom-city         — x%≈49–67, y%≈11–30
    //   Pirates (3):  anchorsaway, splashbattle, minifigureskyflyer       — x%≈69–79, y%≈31–54
    //
    // Excluido explícitamente: minifigureskyflyer. Es confirmed_on_site (Plus Code real) pero su
    // `mapMarker` apunta a la estación de Brick Street (#9, x%≈69,y%≈54) mientras su `geo` mide
    // el acceso inferior del lado Pirates (documentado en su propio registro desde que se agregó:
    // "el punto decodifica a ~21 m de Anchors Away... no necesariamente la entrada de fila oficial
    // de ninguna de las dos estaciones") — el par (geo,mapMarker) no describe el mismo lugar
    // físico, así que meterlo en el ajuste degrada la calibración sin ser un error de medición.
    // Confirmado empíricamente: con este punto adentro, LOO máximo salta a 21.39pp; sin él, a
    // 7.53pp — la misma señal que ya predecía el análisis de su propio registro.
    //
    // También excluidos (por diseño, no por esta pasada): todo geo con confidence 'approximate'
    // u 'official_map', y cualquier centroide de terceros (dragonsapprentice/legofactory/
    // ninjagoride: OSM; dragon-antes-de-la-sexta-pasada: Google Maps — ya reemplazado). El
    // usuario pidió explícitamente no mezclarlos si degradan el ajuste, y las pasadas anteriores
    // ya habían mostrado que sí lo hacían (ver historial más abajo).
    //
    // AJUSTE AFÍN GLOBAL (13 puntos, mínimos cuadrados, ecuaciones normales 3×3 por eje):
    //     ax=-4680.494347 bx=10602.289577 cx=981625.741483
    //     ay=-12321.526089 by=-1657.054646 cy=386766.820217
    //     residual mediano 2.49pp · máximo 5.48pp (restroom-city)
    //     LOO mediano 3.93pp · LOO máximo 7.53pp (dragon)
    // Mejor que cualquier ajuste anterior de este archivo (el de la novena pasada llegaba a
    // 15.15pp de LOO máximo) — la cobertura de las 3 zonas ayuda mucho. Pero 7.53pp con la escala
    // local de esa zona (~6.8 m/pp, medido entre dragon y splashbattle) son **~51 m** de error
    // esperado en el peor caso — eso es "decenas de metros" tal cual lo definió el usuario. NO
    // se activa.
    //
    // ¿Y una calibración local/piecewise por zona, como sugirió el usuario si la global no
    // alcanza? Se probó:
    //   Castle (4 puntos): in-sample excelente (mediano 0.91pp / máx 1.93pp, ~2-4 m a la escala
    //     local de Castle, ~2.1 m/pp), pero con solo 4 puntos y 3 parámetros por eje, el ajuste
    //     tiene apenas 1 grado de libertad — el LOO se vuelve estadísticamente inestable (saltó a
    //     54.93pp al excluir towerclimb, un artefacto de la falta de muestra, no evidencia de mal
    //     dato). No hay forma honesta de validar esto con tan pocos puntos — no se activa aunque
    //     los números en bruto luzcan buenos.
    //   City (6 puntos): LOO mediano 6.23pp / máximo 9.54pp (waterplayground) — a la escala local
    //     de City (~6.4 m/pp) son hasta ~61 m, peor que el ajuste global. No mejora nada — no se
    //     activa.
    //   Pirates (2 puntos, tras excluir minifigureskyflyer): imposible ajustar un afín propio
    //     (mínimo 3 puntos no colineales) — sin datos suficientes.
    // Conclusión: ni la global ni la piecewise cruzan la barra en las 3 zonas a la vez. Se
    // documenta todo acá para que la próxima pasada no repita el análisis desde cero.
    //
    // Historial de intentos previos (para no repetir el argumento): la sexta pasada ya había
    // probado mezclar puntos onsite con centroides de terceros (dragon/dragonsapprentice/
    // legofactory/ninjagoride) y confirmado que degradaban el ajuste (LOO hasta 15.15pp); esta
    // pasada confirma que el problema real no era la mezcla de fuentes sino la falta de densidad
    // — con 13 puntos confirmed_on_site bien distribuidos el residual bajó bastante (15.15pp →
    // 7.53pp) pero todavía no lo suficiente.
    //
    // Criterio para activarla en el futuro: alcanzar LOO máximo global < ~30-40pp-equivalente-a-
    // ~20-30m en las 3 zonas principales, o reunir ≥6-8 puntos confirmed_on_site bien distribuidos
    // DENTRO de una sola zona (para que un piecewise local ahí sí tenga grados de libertad para
    // validarse con LOO real) — lo que llegue primero. Bricktopia, NINJAGO World, Brick Street y
    // Miniland siguen sin ningún punto confirmed_on_site — cualquier Plus Code medido ahí ayudaría
    // más que uno nuevo en Castle/City/Pirates, que ya están relativamente bien cubiertas.
    //
    // Mientras tanto NO se pierde nada de lo pedido: el mapa geográfico (Leaflet/OSM) sigue
    // siendo la alternativa basada en coordenadas reales (GPS, distancia, Google Maps, "baño más
    // cercano" — todo ya funciona con geo real, sin depender de geoCalibration). El mapa
    // ilustrado sigue mostrando los pines por `mapMarker` exactamente como hoy. Lo único que
    // `geoCalibration` activaría es el punto azul "🔵 Estás aquí" sobre esa imagen — la función ya
    // está implementada de forma genérica en el motor (opt-in por `PARK.map.geoCalibration`,
    // círculo de precisión, aviso de precisión pobre, throttle de movimiento — ver
    // assets/theme-park-core.js) y ya funciona hoy en Story Land, que sí tiene su propia
    // calibración. Para LEGOLAND New York queda lista para activarse en cuanto los números lo
    // justifiquen, sin tocar el motor de nuevo — solo escribir el objeto acá.
  },
  storageKey:'legoland_ny_state_v1',
  mustIds:['dragon','dragonsapprentice','fireacademy','legofactory','ninjagoride','miniland'],
  calmIds:['miniland','buildtest','brickparty','steppingtones','duploexpress'],
  categories:[['rides','🎢 Rides'],['lego','🧱 LEGO / construcción'],['miniland','🏙️ Miniland'],['agua','💦 Agua'],['descanso','😌 Descanso / interactivo']],
  childFavoriteIds:['dragonsapprentice','fireacademy','legofactory','duploexpress','brickparty','ferraribuildrace'],
  waterIds:['splashbattle','waterplayground'],
  priorityGroups:[],
  reactionSystem:null, // LEGOLAND no usa el sistema de reacción dinámica de Story Land (era específico de Polar→Roar) — campo opcional, se omite sin afectar nada más.
  tips:[
    ['📏','Los tres niños miden ~47" (aproximado, sin medir en el parque todavía) — verificar altura real antes de atracciones cerca del límite (48"/52").'],
    ['👨‍👦','Varias atracciones piden adulto acompañante incluso cumpliendo la altura mínima — revisar la ficha de elegibilidad de cada niño en la tarjeta.'],
    ['🍕','Brickolini’s Pizza & Pasta (LEGO City) para comer — pizza/pasta/ensalada, buena opción para ambas familias.'],
    ['🔌','Kia EV6 2025: cargar en el Tesla Supercharger de Newburgh Mall (NACS nativo, sin adaptador) camino al parque. Los 2 cargadores del parque (Lot B) son solo respaldo — oficialmente limitados a 2 horas y sin carga nocturna, no sirven para dejar el auto cargando todo el día.'],
    ['🕐','Horario oficial del 23 de agosto de 2026 todavía sin confirmar (el calendario oficial no lo publicaba al momento de esta investigación) — revisarlo cerca de la fecha y llegar con margen antes de la apertura para parking/entrada.'],
    ['📱','Usar la app oficial de LEGOLAND New York en el parque para horarios de shows/personajes y tiempos de espera en vivo — confirmado que varían día a día y no se publican con antelación en la web.'],
    ['🧱','Miniland USA está en el centro del parque — buena referencia para reagruparse si las familias se separan.'],
    ['🏎️','Nueva atracción 2026 "LEGO Ferrari Build & Race" ya está en el plan interactivo (Bricktopia #25, confirmada por el mapa oficial), sin restricción de altura/edad.'],
    ['🚡','Minifigure Skyflyer conecta Brick Street con LEGO Pirates por el aire — el mapa/guía oficial menciona una condición de "14 años" sin regla clara; preguntar en la entrada antes de subir con los niños.'],
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
{id:'dragon',name:'The Dragon',cat:'rides',priorityTier:1,zone:'🏰 LEGO Castle',mapNumber:45,mapMarker:{x:21.96,y:13.48},adult:true,
  restrictions:{minHeightIn:42,minAge:4,adultRequiredBelowInAndAge:{heightIn:48,ageYears:6},source:'2026 Accessibility Guide V6 (05.29.2026) + Height Restrictions Help Center — https://www.legoland.com/new-york/media/o0uhthqm/llny-accessibility-guide-v6-52926.pdf',lastVerified:'2026-08-19',confidence:'verified-official'},
  // geo: MEDIDO EN SITIO (octava pasada, 23-ago-2026) — Plus Code "9MJP+X2J Goshen, New York" →
  // 87H79MJP+X2J. Reemplaza el Plus Code buscado en Google Maps antes de la visita (source
  // 'google-maps-poi', nunca medido físicamente) que tenía este registro — la jerarquía de
  // procedencia obliga a esto (medido en sitio > terceros). El punto nuevo cae a ~16 m del
  // anterior, una distancia coherente con "misma atracción, entrada real vs. centroide buscado"
  // y no con un error de decodificación — buena verificación cruzada. mapMarker/mapNumber/demás
  // metadata sin cambios.
  plusCode:'9MJP+X2J Goshen, New York',
  geo:{lat:41.382453,lng:-74.314937,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  tags:['🔥 IMPERDIBLE','🎢 COASTER FAMILIAR','🐉 CASTLE'],
  why:'El coaster principal de LEGO Castle: familiar pero con emoción real — conviene temprano antes de que se formen filas.',
  tip:'Nuestro niño de 6 años puede calificar para ir sin adulto (verificar en el parque si "6 años" cuenta como "menor de 6" o no); las dos niñas de 5 necesitan acompañante por la regla combinada edad+altura.'},
// Builder's Guild: no estaba en la lista — la leyenda del mapa oficial la lista bajo LEGO CASTLE,
// RIDES & ATTRACTIONS #46 (junto a la torre/puerta de The Dragon). Se agrega en la octava pasada
// con Plus Code propio medido en sitio, en el mismo pedido que actualizó The Dragon.
{id:'builders',name:"Builder's Guild",cat:'descanso',priorityTier:2,zone:'🏰 LEGO Castle',mapNumber:46,mapMarker:{x:27.1,y:15.76},adult:false,
  // geo: MEDIDO EN SITIO (octava pasada, 23-ago-2026) — Plus Code "9MJP+X3X Goshen, New York" →
  // 87H79MJP+X3X. A ~15 m de The Dragon (#45) y ~9 m del baño de Castle — coherente con estar en
  // la misma torre/puerta del castillo, buena verificación cruzada entre los tres puntos nuevos.
  plusCode:'9MJP+X3X Goshen, New York',
  geo:{lat:41.382484,lng:-74.314763,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  nearbyAttractions:['dragon'],
  tags:['🧱 CONSTRUCCIÓN','⚠️ VERIFICAR RESTRICCIONES'],
  tip:'⚠️ Sin restricción de altura/edad verificada en esta actualización — confirmar en el parque.',
  why:'Experiencia de construcción dentro del castillo, junto a The Dragon — sin verificar en esta pasada si es la misma actividad que Master Model Builder Experience (Bricktopia #18) o algo distinto.'},
// Tower Climb Tournament: pedido en la pasada anterior pero el merge de esa PR quedó anclado en
// el commit previo al que lo agregaba (el squash/merge tomó 399f236, no e711101) — nunca llegó a
// main. Se re-agrega acá desde cero, mismos datos ya derivados entonces: sin nada que duplicar.
// #51, LEGO CASTLE, RIDES & ATTRACTIONS según la leyenda del mapa oficial.
{id:'towerclimb',name:'Tower Climb Tournament',cat:'rides',priorityTier:2,zone:'🏰 LEGO Castle',mapNumber:51,mapMarker:{x:33.59,y:17.97},adult:false,
  // geo: MEDIDO EN SITIO (23-ago-2026) — Plus Code "9MJP+W5Q Goshen, New York" → 87H79MJP+W5Q. A
  // 18-29 m de los otros 3 puntos confirmados de este mismo cluster de Castle (Dragon, Builder's
  // Guild, restroom-castle) — coherente con estar en la misma zona de la fuente/torre central.
  plusCode:'9MJP+W5Q Goshen, New York',
  geo:{lat:41.382359,lng:-74.31461,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  nearbyAttractions:['dragon','builders'],
  tags:['🧗 TREPAR','⚠️ VERIFICAR RESTRICCIONES'],
  tip:'⚠️ Sin restricción de altura/edad verificada en esta actualización — confirmar en el parque.',
  why:'Torres de escalada temáticas en el centro de LEGO Castle, junto a la fuente — buena opción física entre The Dragon y Builder\'s Guild.'},
{id:'dragonsapprentice',name:"Dragon's Apprentice",cat:'rides',priorityTier:0,zone:'🏰 LEGO Castle',mapNumber:42,mapMarker:{x:34.51,y:22.27},adult:false,
  restrictions:{minHeightIn:36,adultRequiredBelowIn:42,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (mínimo 36"; acompañante requerido debajo de 42").',lastVerified:'2026-08-19',confidence:'verified-official'},
  // geo: coordenada de coasterpedia.net (base de datos independiente de coasters), NO oficial de
  // LEGOLAND — centroide/ubicación del coaster, no la entrada de fila medida en sitio. Ver
  // jerarquía de procedencia geográfica en specs/SPECIFICATIONS.md.asc sección 21bis.
  geo:{lat:41.38205,lng:-74.31466,source:'third-party-ride-poi',reference:'ride-poi'},
  tags:['🔥 IMPERDIBLE','🎢 COASTER SUAVE','⭐ PUEDE IR SOLO'],
  why:'Coaster pequeño para entrenar "dragones bebé" — a ~47" los tres niños califican para subir solos, buena primera montaña rusa del día.'},
{id:'merlin',name:"Merlin's Flying Machines",cat:'rides',priorityTier:2,zone:'🏰 LEGO Castle',mapNumber:40,mapMarker:{x:34.78,y:26.30},adult:true,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #40 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  restrictions:{minHeightIn:36,adultRequiredBelowIn:48,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center.',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🎠 GIRO SUAVE','👨‍👦 CON ADULTO'],
  why:'Vueltas suaves en el aire, temática de dragones — buen contraste de ritmo cerca de The Dragon.'},
{id:'fireacademy',name:'Fire Academy',cat:'lego',priorityTier:0,zone:'🌆 LEGO City',mapNumber:71,mapMarker:{x:58.82,y:26.82},adult:true,
  restrictions:{minHeightIn:34,adultRequiredBelowInAndAge:{heightIn:52,ageYears:12},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (mínimo 34"; acompañante para menores de 52" Y de 12 años — condición combinada, no altura sola).',lastVerified:'2026-08-19',confidence:'verified-official'},
  // geo: MEDIDO EN SITIO (23-ago-2026) — Plus Code "9MJQ+H24 Goshen, New York" leído parado en la
  // atracción, decodificado a 87H79MJQ+H24 (celda OLC de ~3.5 × 2.1 m). Reemplaza el centroide de
  // OpenStreetMap que había antes (41.38117,-74.31250, mapcarta.com/N9758190678), que queda ~25 m
  // al suroeste — el dato de terceros era razonable, pero este es de mayor jerarquía (entrada
  // medida en sitio > coordenada oficial > POI de mapa/terceros) y tiene prioridad.
  plusCode:'9MJQ+H24 Goshen, New York',
  geo:{lat:41.381391,lng:-74.312438,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  tags:['🔥 IMPERDIBLE','🚒 INTERACTIVA','👨‍👦 CON ADULTO'],
  why:'Manejan un camión de bomberos y "apagan" un incendio con agua — de las experiencias interactivas favoritas de los niños en LEGO City.'},
// Water Playground: no estaba en la lista (solo se lo mencionaba como referencia de First Aid
// #72). Se agrega en esta pasada porque ahora tiene ubicación confirmada en sitio. Sin
// `restrictions`: el Accessibility Guide / Help Center no se volvieron a consultar en esta
// pasada y no se inventa una regla — la app cae al indicador genérico de adulto, y el `tip`
// pide confirmarlo en el parque.
// mapNumber/mapMarker corregidos (23-ago-2026, revisión posterior): el usuario señaló que la
// zona de juegos de agua con toboganes junto a Fire Academy/First Aid SÍ es Water Playground —
// se había pasado por alto que el mapa oficial 2026 la lista explícitamente como #76 (LEGO City,
// "RIDES & ATTRACTIONS"), no solo como referencia de texto de otro POI. mapMarker leído
// visualmente del mismo mapa (assets/legoland-map-2026.webp, 5100×3300px), mismo método que el
// resto del archivo — el recorte confirma visualmente la estructura de toboganes/splash pad
// bajo el pin #76.
{id:'waterplayground',name:'Water Playground',cat:'agua',priorityTier:2,waterBoostTier:1.5,zone:'🌆 LEGO City',mapNumber:76,mapMarker:{x:66.7,y:25.2},adult:false,
  // geo: MEDIDO EN SITIO (23-ago-2026) — Plus Code "9MJQ+C59 Goshen, New York" → 87H79MJQ+C59.
  plusCode:'9MJQ+C59 Goshen, New York',
  geo:{lat:41.381047,lng:-74.312062,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  nearbyAttractions:['fireacademy'],
  tags:['💦 TE MOJAS','👨‍👩‍👦 FAMILIAR','⚠️ VERIFICAR RESTRICCIONES'],
  tip:'👕 Se mojan de verdad — muda de ropa a mano. Confirmar en el parque si hay altura/edad mínima (no verificado oficialmente en esta versión).',
  why:'Zona de juegos de agua en LEGO City, justo al lado de Fire Academy (#71) y del First Aid (#72) — la mejor parada para refrescarse en la parte más calurosa del día.'},
{id:'coastguard',name:'Coast Guard Academy',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',mapNumber:63,mapMarker:{x:51.7,y:15.7},adult:true,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px)
  // — pin #63 recortado a resolución original y ubicado por la punta de la bandera, mismo método
  // que el resto de mapMarker de este archivo.
  // geo: MEDIDO EN SITIO (séptima pasada) — Plus Code "9MJP+VX7 Goshen, New York" → 87H79MJP+VX7.
  // Reemplaza el estado anterior sin geo (solo tenía mapMarker).
  plusCode:'9MJP+VX7 Goshen, New York',
  geo:{lat:41.382172,lng:-74.312613,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  restrictions:{minHeightIn:34,adultRequiredBelowIn:52,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center.',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚤 INTERACTIVA','👨‍👦 CON ADULTO'],
  why:'Manejan botes patrulla en un canal de agua — similar en espíritu a Fire Academy, buena alternativa si hay fila ahí.'},
// Ocean Explorer (#64): no estaba en la lista — el mapa oficial la muestra junto a Coast Guard
// Academy (a ~25 m según sus dos Plus Codes en sitio), pero no se había agregado hasta tener una
// ubicación confirmada. Sin `restrictions`: no se volvió a consultar el Accessibility Guide en
// esta pasada — cae al indicador genérico de adulto, con tip pidiendo confirmar en el parque.
{id:'oceanexplorer',name:'Ocean Explorer',cat:'rides',priorityTier:2,zone:'🌆 LEGO City',mapNumber:64,mapMarker:{x:55.96,y:11.21},adult:true,
  // geo: MEDIDO EN SITIO (séptima pasada) — Plus Code "9MJQ+W37 Goshen, New York" → 87H79MJQ+W37.
  plusCode:'9MJQ+W37 Goshen, New York',
  geo:{lat:41.382297,lng:-74.312363,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  nearbyAttractions:['coastguard'],
  tags:['🌀 GIRO/PÉNDULO','⚠️ VERIFICAR RESTRICCIONES'],
  tip:'⚠️ Sin restricción de altura/edad verificada en esta actualización — confirmar en el parque antes de hacer fila.',
  why:'Ride de péndulo/giro junto a Coast Guard Academy — buena alternativa si hay fila ahí, sin haberse verificado su regla de altura en esta pasada.'},
{id:'drivingschool',name:'Driving School',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',mapNumber:58,mapMarker:{x:48.5,y:22.6},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #58 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo.
  // geo: MEDIDO EN SITIO (séptima pasada) — Plus Code "9MJP+PP3 Goshen, New York" → 87H79MJP+PP3.
  plusCode:'9MJP+PP3 Goshen, New York',
  geo:{lat:41.381766,lng:-74.313213,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  restrictions:{minAgeUnaccompanied:6,maxAge:13,soloOnly:true,source:'Página oficial de la atracción + 2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima, edades 6–13, autos que se manejan solos (no admite ir "con adulto" en el mismo auto) — https://www.legoland.com/new-york/things-to-do/theme-park/rides-attractions/driving-school/',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚗 MANEJAN SOLOS','6-13 AÑOS'],
  why:'Autos eléctricos con carril propio — solo para quien ya cumple la edad mínima; los demás pueden hacer Junior Driving School.'},
{id:'juniordriving',name:'Junior Driving School',cat:'lego',priorityTier:1,zone:'🌆 LEGO City',mapNumber:56,mapMarker:{x:45.6,y:22.3},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #56 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  restrictions:{minAgeUnaccompanied:3,maxAge:6,source:'Página oficial vigente de la atracción (edades 3–6) — https://www.legoland.com/new-york/things-to-do/theme-park/rides-attractions/junior-driving-school/ — en acuerdo con 2026 Accessibility Guide V6 + Height Restrictions Help Center. El mapa ilustrado oficial 2026 (#56) rotula la atracción "AGES 3-5" (texto más antiguo/genérico); por regla de prioridad de fuentes se prefiere la página específica y vigente de la atracción sobre el rótulo del mapa esquemático — de todos modos, confirmar en el parque para la niña que ya cumple 6.',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚗 MANEJAN SOLOS','3-6 AÑOS'],
  why:'Versión para más pequeños de Driving School — pensada para nuestro rango de edad (5 y 6 años); el mapa ilustrado dice "3-5" pero la página oficial vigente de la atracción confirma 3–6, así que la niña de 6 años sí califica — verificar en el parque de todos modos.'},
{id:'anchorsaway',name:'Anchors Away!',cat:'rides',priorityTier:2,zone:'🏴‍☠️ LEGO Pirates',mapNumber:83,mapMarker:{x:70.6,y:30.9},adult:false,
  // geo: MEDIDO EN SITIO (23-ago-2026) — Plus Code "9MJQ+68Q Goshen, New York" → 87H79MJQ+68Q.
  // Primer punto real de LEGO Pirates: hasta ahora toda la zona este del parque no tenía ninguna
  // coordenada (ver nota de calibración en map:{}). El mapMarker #83 ya estaba listo esperándolo.
  plusCode:'9MJQ+68Q Goshen, New York',
  geo:{lat:41.380609,lng:-74.311738,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  nearbyAttractions:['splashbattle','minifigureskyflyer'],
  restrictions:{minHeightIn:34,adultRequiredBelowIn:42,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (34" confirmado — contenido más antiguo indexado decía 36", usar el valor 2026 vigente).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🏴‍☠️ PIRATAS','⭐ PUEDE IR SOLO'],
  why:'Vueltas en barco pirata — a ~47" los tres niños ya califican para ir sin adulto.'},
{id:'splashbattle',name:'Splash Battle',cat:'agua',priorityTier:2,waterBoostTier:1.5,zone:'🏴‍☠️ LEGO Pirates',mapNumber:87,mapMarker:{x:79.02,y:33.64},adult:false,
  // geo: MEDIDO EN SITIO (23-ago-2026) — Plus Code "9MJQ+5MP Goshen, New York" → 87H79MJQ+5MP.
  // Punto más al este con coordenada real hoy (~83 m de Anchors Away), y el que mejor ajusta en el
  // diagnóstico de calibración (residual 0.78pp) — ver map:{}.
  plusCode:'9MJQ+5MP Goshen, New York',
  geo:{lat:41.380453,lng:-74.310762,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'},
  nearbyAttractions:['anchorsaway','minifigureskyflyer'],
  restrictions:{adultRequiredBelowInAndAge:{heightIn:52,ageYears:8},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima, acompañante requerido para menores de 8 años Y de 52" (condición combinada).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['💦 TE MOJAS','🎮 INTERACTIVA','👨‍👩‍👦 FAMILIAR'],
  tip:'👕 Confirmen que traen muda de ropa antes de empezar.',
  why:'Batalla de agua interactiva temática pirata — buena para la parte más calurosa del día.'},
{id:'legofactory',name:'LEGO Factory Adventure Ride',cat:'lego',priorityTier:0,zone:'🎡 Bricktopia',mapNumber:22,mapMarker:{x:46.37,y:43.33},adult:true,
  restrictions:{adultRequiredBelowIn:48,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima para subir, acompañante requerido para menores de 48" (contenido más antiguo indexado decía 52" — usar 48" vigente).',lastVerified:'2026-08-19',confidence:'verified-official'},
  // geo: centroide derivado de OpenStreetMap (mapcarta.com/W993708873), NO oficial de LEGOLAND —
  // huella del edificio/atracción, no la entrada de fila medida en sitio. Buen candidato de
  // calibración futura, pero debe reemplazarse por la entrada real medida en sitio.
  geo:{lat:41.38009,lng:-74.31435,source:'openstreetmap-poi',reference:'ride-poi'},
  tags:['🔥 IMPERDIBLE','🏭 DARK RIDE','👨‍👦 CON ADULTO'],
  why:'Recorrido tranquilo tipo dark ride mostrando cómo se hacen los ladrillos LEGO — imperdible, apto para toda la familia, ritmo suave.'},
{id:'duploexpress',name:'LEGO DUPLO Express',cat:'descanso',priorityTier:2.6,zone:'🎡 Bricktopia',mapNumber:17,mapMarker:{x:55.16,y:46.67},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #17 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  restrictions:{adultRequiredBelowIn:34,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center.',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🚂 SUAVE','👨‍👩‍👦 FAMILIAR'],
  why:'Tren tranquilo pensado para los más chicos — buen respiro entre atracciones más activas.'},
{id:'dizzydisco',name:"DJ's Dizzy Disco Spin",cat:'rides',priorityTier:2.6,zone:'🎡 Bricktopia',mapNumber:15,mapMarker:{x:58.84,y:48.88},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #15 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  restrictions:{adultRequiredBelowIn:40,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center (contenido más antiguo indexado decía 42" — usar 40" vigente).',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🎵 GIRO SUAVE'],
  why:'Vueltas suaves con música — buena opción ligera dentro de Bricktopia.'},
{id:'ninjagoride',name:'LEGO NINJAGO The Ride',cat:'lego',priorityTier:1,zone:'🥷 LEGO NINJAGO World',mapNumber:32,mapMarker:{x:36.08,y:32.12},adult:true,
  restrictions:{adultRequiredBelowIn:48,source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: sin altura mínima, acompañante requerido para menores de 48".',lastVerified:'2026-08-19',confidence:'verified-official'},
  // geo: centroide derivado de OpenStreetMap (mapcarta.com/W993708875, Plus Code 87H79MJP+52), NO
  // oficial de LEGOLAND — huella del edificio/atracción, no la entrada de fila medida en sitio.
  geo:{lat:41.38048,lng:-74.31494,source:'openstreetmap-poi',reference:'ride-poi'},plusCode:'87H79MJP+52',
  tags:['🔥 IMPERDIBLE','🥷 INTERACTIVA (GESTOS)','🏠 INDOOR'],
  tip:'👟 Puede pedir calzado cerrado — no confirmado en esta actualización si sigue vigente ese requisito, preguntar en la entrada de la atracción.',
  why:'Dark ride interactivo: "lanzan" energía con gestos de las manos contra villanos — de las experiencias más pedidas por los niños, indoor (buen plan si llueve).'},
{id:'gravityforce',name:"Jay's Gravity Force Trainer",cat:'rides',priorityTier:2,zone:'🥷 LEGO NINJAGO World',mapNumber:27,mapMarker:{x:44.6,y:29.8},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #27 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  restrictions:{minHeightIn:42,minAge:4,adultRequiredBelowInAndAge:{heightIn:52,ageYears:8},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: mínimo 42"/4 años; acompañante para menores de 8 años Y de 52".',lastVerified:'2026-08-19',confidence:'verified-official'},
  // plusCode expuesto directamente por la búsqueda estructurada de lugares (9MJP+7F, Goshen, NY
  // 10924) — NO se decodificó a lat/lng offline (sin decodificador local de Open Location Code
  // disponible), así que geo queda null a propósito en vez de inventar coordenadas. Buen
  // candidato para medir la entrada de fila real en sitio (ver lista de prioridad de captura).
  plusCode:'9MJP+7F Goshen, NY',geo:null,
  tags:['🌀 GIRO MÁS INTENSO'],
  why:'Entrenamiento giratorio estilo ninja — el ride "más emocionante" del día si los niños quieren algo con más intensidad, sin ser un coaster grande.'},
{id:'miniland',name:'Miniland USA',cat:'miniland',priorityTier:0,zone:'🏙️ Miniland',mapNumber:98,mapMarker:{x:54.4,y:28.5},adult:false,
  tags:['🔥 IMPERDIBLE','🏙️ RECORRIDO','📸 FOTOS'],
  why:'Miniaturas de ciudades de EE.UU. hechas con millones de piezas LEGO — el corazón visual del parque, sin restricciones, ritmo libre.'},
{id:'buildtest',name:'Build + Test',cat:'descanso',priorityTier:3,zone:'🎡 Bricktopia',mapNumber:14,mapMarker:{x:55.06,y:53.3},adult:false,
  // Corrección (23-ago-2026, auditoría de mismatches pedida por el usuario): tenía zone:'🧱 Brick
  // Street' y name:'Build & Test', ninguno de los dos correcto — la leyenda del mapa oficial 2026
  // lista #14 bajo BRICKTOPIA (no Brick Street) con el nombre "Build + Test" (signo más, no
  // ampersand). El error de zona no era solo cosmético: `zone` alimenta sameZoneBonus(),
  // el aviso de "zona cerrada" y el texto "📍 Mapa #N · zona" del motor — con el dato viejo, la
  // app habría dicho zona equivocada parado frente a la atracción real.
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #14 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  tags:['🧱 CONSTRUCCIÓN','😌 TRANQUILA'],
  why:'Mesa de construcción libre — buena pausa creativa entre atracciones, sin filas largas.'},
{id:'brickparty',name:'Brick Party',cat:'descanso',priorityTier:3,zone:'🧱 Brick Street',mapNumber:10,mapMarker:{x:63.86,y:55.24},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #10 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  restrictions:{adultRequiredBelowInAndAge:{heightIn:44,ageYears:5},source:'2026 Accessibility Guide V6 + Height Restrictions Help Center: acompañante requerido para menores de 5 años Y de 44".',lastVerified:'2026-08-19',confidence:'verified-official'},
  tags:['🎈 INTERACTIVA','👨‍👩‍👦 FAMILIAR'],
  why:'Área de juego temática de fiesta — a ~47" y 5-6 años los tres niños ya superan el umbral de acompañante obligatorio, pero sigue siendo buena para ir en familia.'},
{id:'steppingtones',name:'Stepping Tones',cat:'descanso',priorityTier:3.2,zone:'🎡 Bricktopia',mapNumber:19,mapMarker:{x:50.41,y:46.09},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #19 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  tags:['🎵 INTERACTIVA','😌 TRANQUILA'],
  why:'Piso musical interactivo — ideal cuando estén cansados de caminar, cerca de Bricktopia.'},
// Master Model Builder Experience: no estaba en la lista — la leyenda del mapa oficial la lista
// bajo BRICKTOPIA #18 (el mismo hueco de cobertura que encontró la auditoría de mismatches).
// El § junto al ícono en la leyenda significa "puede no estar disponible durante sesiones
// escolares" — se guarda como tip, no como `restrictions` (no es una regla de altura/edad).
{id:'mmbe',name:'Master Model Builder Experience',cat:'descanso',priorityTier:3,zone:'🎡 Bricktopia',mapNumber:18,mapMarker:{x:51.37,y:50.58},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #18 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo. Sin geo — no participa del ajuste de geoCalibration.
  tags:['🧱 CONSTRUCCIÓN','😌 TRANQUILA','⚠️ PUEDE CERRAR EN TEMPORADA ESCOLAR'],
  tip:'⚠️ El mapa oficial marca esta atracción como posiblemente no disponible durante sesiones escolares — confirmar en el parque.',
  why:'Sesión de construcción guiada por un Model Builder — buena pausa creativa, cerca de Build + Test y LEGO DUPLO Express.'},
// Ferrari Build & Race y Minifigure Skyflyer: no estaban en la lista original
// (research doc no confirmaba su zona) — se agregan ahora porque el mapa
// oficial 2026 (imagen compartida por el usuario) SÍ confirma su ubicación
// y número. Ferrari Build & Race está marcada "NEW FOR 2026" en el mapa.
{id:'ferraribuildrace',name:'LEGO Ferrari Build & Race',cat:'lego',priorityTier:1,zone:'🎡 Bricktopia',mapNumber:25,mapMarker:{x:54.16,y:38.7},adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #25 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  tags:['🏎️ NUEVA 2026','🧱 CONSTRUCCIÓN','⭐ SIN RESTRICCIÓN DE ALTURA/EDAD'],
  why:'Atracción nueva de 2026: construyen su propio Ferrari de LEGO y lo "corren" — la página oficial de la atracción confirma que no tiene restricción de altura ni edad, buena para las dos familias completas juntas.'},
// Minifigure Skyflyer aparece dos veces en el mapa (#9 Brick Street, #81 LEGO
// Pirates) — probablemente conecta ambas zonas por el aire. El 2026
// Accessibility Guide la lista con una notación de "14 yrs" cuya regla
// exacta no se tradujo a un campo `restrictions` en esta actualización.
// geo (23-ago-2026): el usuario registró en sitio "9MJQ+76H Goshen, New York" como
// "Minifigure Skyline", tomado cerca de Splash Battle, con la nota "acceso por la parte de
// abajo". Se interpreta como el ACCESO INFERIOR del lado LEGO Pirates (#81) — no la estación
// de Brick Street (#9), que es la que da nombre y mapNumber a este registro. Dos salvedades
// registradas a propósito en vez de resolverlas por nuestra cuenta:
//   - El nombre dictado ("Skyline") no coincide con el oficial ("Skyflyer"); se asume la misma
//     atracción por la zona y por la nota del acceso, no por el nombre.
//   - El punto decodifica a ~21 m de Anchors Away y ~104 m de Splash Battle, aunque se describió
//     como "cerca de Splash Battle" — se guarda la coordenada tal como se midió, sin corregirla.
// Por eso reference:'lower-access' y no 'entrance': ubica el acceso de abajo, no la fila oficial.
{id:'minifigureskyflyer',name:'Minifigure Skyflyer',cat:'rides',priorityTier:2,zone:'🧱 Brick Street',mapNumber:9,mapMarker:{x:69.12,y:53.64},nearbyMapNumbers:[81],adult:false,
  // mapMarker leído visualmente del mapa oficial 2026 (assets/legoland-map-2026.webp, 5100×3300px) — pin #9 recortado a resolución original y ubicado por la punta de la bandera, mismo método que el resto de mapMarker de este archivo (verificado reproduciendo primero el mapMarker ya calibrado de Fire Academy #71). Sin geo — no participa del ajuste de geoCalibration.
  plusCode:'9MJQ+76H Goshen, New York',
  geo:{lat:41.380703,lng:-74.311963,source:'onsite-plus-code',reference:'lower-access',confidence:'confirmed_on_site'},
  nearbyAttractions:['anchorsaway','splashbattle'],
  tags:['🚡 TRANSPORTE/RIDE','⚠️ VERIFICAR REGLA DE ACOMPAÑANTE'],
  tip:'⚠️ El mapa/guía oficial menciona una condición de "14 años" para esta atracción que no se tradujo a una regla clara en esta actualización — preguntar en la entrada antes de hacer fila con los niños.',
  why:'Conecta Brick Street con LEGO Pirates por el aire — puede servir como transporte además de experiencia, siempre que la regla de acompañante lo permita.'},
  ],
  pois:[
// Ninja Kitchen y Wu's Warehouse: no estaban en la lista — la leyenda del mapa oficial las lista
// bajo LEGO NINJAGO WORLD, DINING #29 y SHOPPING #30 respectivamente (el mismo hueco de cobertura
// que encontró la auditoría de mismatches). mapMarker leído visualmente del mapa oficial 2026,
// mismo método que el resto del archivo.
{id:'ninjakitchen',type:'food',icon:'🥢',name:'Ninja Kitchen',zone:'🥷 LEGO NINJAGO World',mapNumber:29,mapMarker:{x:42.71,y:35.0},nearbyText:'Junto a Wu’s Warehouse y Jay’s Gravity Force Trainer.',source:'Mapa oficial 2026 (número/zona) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'verified-official',geo:null},
{id:'wuswarehouse',type:'store',icon:'🛍️',name:'Wu’s Warehouse',zone:'🥷 LEGO NINJAGO World',mapNumber:30,mapMarker:{x:39.08,y:36.97},nearbyText:'Junto a Ninja Kitchen.',source:'Mapa oficial 2026 (número/zona) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'verified-official',geo:null},
{id:'brickolinis',type:'food',icon:'🍕',name:'Brickolini’s Pizza & Pasta',zone:'🌆 LEGO City',mapNumber:68,nearbyText:'Pizza, pasta y ensaladas — recomendado para las dos familias.',source:'Mapa oficial 2026 (número/zona) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'royalfeast',type:'food',icon:'🍔',name:'Royal Feast',zone:'🏰 LEGO Castle',mapNumber:50,nearbyText:'Hamburguesas y menú infantil.',source:'Mapa oficial 2026 (número/zona) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'smokeys',type:'food',icon:'🍖',name:'Smokey’s Brick-B-Que',zone:'🎡 Bricktopia',mapNumber:20,nearbyText:'Barbacoa clásica.',source:'Mapa oficial 2026 (número/zona) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'verified-official',geo:null}, // nombre corregido (auditoría 23-ago-2026): la leyenda dice "Brick-B-Que", no "Brick B-Q-Que" — zona/número ya estaban correctos.
{id:'brickbeards',type:'food',icon:'🌮',name:'Brickbeard’s Food Market',zone:'🏴‍☠️ LEGO Pirates',mapNumber:84,nearbyText:'Hamburguesas, ensaladas, tacos y más. Sin coordenada propia: en el mapa oficial queda entre Anchors Away (#83) y Splash Battle (#87), los dos con ubicación confirmada en sitio — orientarse por ellos.',source:'Mapa oficial 2026 (número/zona) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'legocoffee',type:'food',icon:'☕',name:'LEGOLAND Coffee Company',zone:'🧱 Brick Street',mapNumber:8,nearbyText:'Café, pastelería y sándwiches.',source:'Mapa oficial 2026 (número/zona) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'restroom-entrance',type:'restroom',icon:'🚻',name:'Restrooms — junto a Ticket Windows',zone:'🧱 Brick Street',mapMarker:{x:54.7,y:59.76},nearbyText:'Junto a las Ticket Windows (#1) de la entrada — confirmado por el mapa oficial 2026 y por el Services page (kiosco Cash-to-Card justo al lado).',source:'Mapa oficial 2026 + Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null}, // sin geo: no hay 2+ anchors confirmados en sitio lo bastante cerca en Brick Street para una estimación 'approximate' defendible (entrance-main es un único punto 'official-map', no confirmado en sitio) — queda para cuando se mida un Plus Code acá.
{id:'restroom-city',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🌆 LEGO City',mapMarker:{x:58.18,y:29.76},nearbyText:'Junto al grupo Fire Academy (#71) / First Aid (#72) / Water Playground — el mismo ícono de baños sirve también a Miniland (ver restroom-miniland), en el borde entre ambas zonas.',source:'Mapa oficial 2026 (mapMarker) + Plus Code medido en sitio (geo) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'verified-official',
  // geo: MEDIDO EN SITIO (23-ago-2026) — Plus Code "9MJQ+G4H Goshen, New York" → 87H79MJQ+G4H.
  // Reemplaza la estimación 'approximate' de la séptima pasada (41.381083,-74.312709, derivada de
  // 5 anchors por ajuste afín local) — el punto medido cae a ~50 m de esa estimación y a ~20 m de
  // Fire Academy, exactamente donde el `nearbyText` ya decía que estaba el ícono. Compartido con
  // restroom-miniland (mismo baño físico, en el borde de ambas zonas — ver ese registro).
  plusCode:'9MJQ+G4H Goshen, New York',
  geo:{lat:41.381328,lng:-74.312213,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'}},
{id:'restroom-miniland',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🏙️ Miniland',mapMarker:{x:58.18,y:29.76},nearbyText:'Mismo ícono físico que restroom-city (ver ese registro) — está justo en el borde LEGO City/Miniland, junto a Miniland Hub (#98) y Fire Academy (#71).',source:'Mapa oficial 2026 (mapMarker) + Plus Code medido en sitio (geo) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'verified-official',
  // geo: mismo Plus Code medido en sitio que restroom-city — es el mismo baño físico compartido
  // entre las dos zonas. Ver ese registro para el detalle de la actualización.
  plusCode:'9MJQ+G4H Goshen, New York',
  geo:{lat:41.381328,lng:-74.312213,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'}},
{id:'restroom-bricktopia',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🎡 Bricktopia',mapMarker:{x:46.73,y:49.58},nearbyText:'Cerca de LEGO Factory Adventure Ride (#22) y del grupo Build + Test (#14) / DUPLO Express (#17).',source:'Mapa oficial 2026 — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'approximate',geo:null}, // sin geo: los anchors de Bricktopia (legofactory, ninjagoride) son de terceros/OSM, no confirmados en sitio — encadenar una estimación sobre otra estimación sería demasiado ruido; queda para un Plus Code medido en sitio.
// Baños de LEGO Castle, NINJAGO World y LEGO Pirates: no estaban en la lista — el mapa oficial
// 2026 marca su ícono en las tres zonas, agregados en la séptima pasada al hacer el barrido
// completo de baños pedido por el usuario ("agrega los baños para poder ubicar el más cercano
// según la ubicación").
{id:'restroom-castle',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🏰 LEGO Castle',mapMarker:{x:33.47,y:13.64},nearbyText:'Junto a Royal Feast (#50), entre The Dragon (#45) y Tower Climb Tournament (#51).',source:'Mapa oficial 2026 (mapMarker) + Plus Code medido en sitio (geo) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'verified-official',
  // geo: MEDIDO EN SITIO (octava pasada, 23-ago-2026) — Plus Code "9MMP+245 Goshen, New York" →
  // 87H79MMP+245. Reemplaza el `geo:null` anterior (hasta ahora sin coordenada real porque los
  // anchors de Castle disponibles eran todos de terceros) — se conserva el `mapMarker` oficial tal
  // cual (posición del ícono en el mapa ilustrado, no necesariamente exacta contra `geo` real en
  // un mapa "not to scale").
  plusCode:'9MMP+245 Goshen, New York',
  geo:{lat:41.382516,lng:-74.314663,source:'onsite-plus-code',reference:'entrance',confidence:'confirmed_on_site'}},
{id:'restroom-ninjago',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🥷 LEGO NINJAGO World',mapMarker:{x:41.24,y:36.45},nearbyText:'Entre Ninja Kitchen (#29) y Wu’s Warehouse (#30), cerca de LEGO NINJAGO The Ride (#32).',source:'Mapa oficial 2026 — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'approximate',geo:null}, // sin geo: LEGO NINJAGO The Ride es de OpenStreetMap, no confirmado en sitio — mismo criterio.
{id:'restroom-pirates',type:'restroom',icon:'🚻',name:'Restrooms',zone:'🏴‍☠️ LEGO Pirates',mapMarker:{x:76.86,y:28.7},nearbyText:'Entre Portable Charger Rental (#85) y Splash Battle (#87), junto a Anchors Away (#83).',source:'Mapa oficial 2026 (posición del ícono) + anchors en sitio (estimación) — https://www.legoland.com/new-york/media/gushogjw/2026-legoland-new-york-park-map.jpg',lastVerified:'2026-08-23',confidence:'approximate',
  geo:{lat:41.380481,lng:-74.311003,confidence:'approximate',estimatedFrom:['Anchors Away','Splash Battle','Minifigure Skyflyer']}}, // geo estimado (séptima pasada): ajuste afín local con los 3 anchors confirmados en sitio de LEGO Pirates (a diferencia del cluster de LEGO City, son solo 3 puntos — el ajuste los reproduce exactos por construcción, sin margen propio para validar el residual; tratar con más cautela que el estimado de restroom-city). NUNCA 'confirmed_on_site': reemplazar cuando se mida un Plus Code parado en la puerta real.
{id:'firstaid-brickstreet',type:'firstaid',icon:'🩹',name:'First Aid — Brick Street',zone:'🧱 Brick Street',mapNumber:7,nearbyText:'Junto al Guest Experience Center.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'firstaid-legocity',type:'firstaid',icon:'🩹',name:'First Aid — LEGO City',zone:'🌆 LEGO City',mapNumber:72,nearbyText:'Junto al Water Playground, cuya ubicación sí quedó confirmada en sitio (23-ago-2026) — usar ese punto del mapa geográfico como referencia para llegar. Sin coordenada propia registrada.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'familycare',type:'familycare',icon:'👶',name:'DUPLO Family Care Center',zone:'🌆 LEGO City',mapNumber:69,nearbyText:'Áreas privadas de lactancia, calentador de biberones, microondas, cambiadores para bebé/adulto y sala sensorial del parque. Un mapa oficial más antiguo (2023) la ubicaba junto a Brickolini’s Pizza & Pasta — referencia de apoyo, no confirmada contra el mapa 2026.',source:'Services page (zona) — https://www.legoland.com/new-york/things-to-do/theme-park/services/ · referencia de ubicación más precisa: LLNY Sensory Guide 2023 — https://www.legoland.com/new-york/media/bgfbqheo/llny-sensory-guide-2023.pdf',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'lockers-bricktopia',type:'locker',icon:'🔒',name:'Lockers — Build + Test, Bricktopia',zone:'🎡 Bricktopia',mapNumber:13,nearbyText:'Sistema sin llave (keyless). Tarifa oficial vigente: $9–$12/día según tamaño.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'lockers-familycare',type:'locker',icon:'🔒',name:'Lockers — junto a Family Care',zone:'🌆 LEGO City',mapNumber:73,nearbyText:'Sistema sin llave (keyless). Tarifa oficial vigente: $9–$12/día según tamaño.',source:'Services page — https://www.legoland.com/new-york/things-to-do/theme-park/services/',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'show-police4d',type:'show',icon:'🎬',name:'LEGO CITY 4D: Officer in Pursuit',zone:'🌆 LEGO City',nearbyText:'Horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita, sin agenda fija publicada en la web.',source:'https://newyork-support.legoland.com/hc/en-us/articles/22950265526557-What-4D-shows-do-you-have-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'show-friends4d',type:'show',icon:'🎬',name:'LEGO Friends 4D: Alien Invasion',zone:'🌆 LEGO City',nearbyText:'Horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita, sin agenda fija publicada en la web.',source:'https://newyork-support.legoland.com/hc/en-us/articles/22950265526557-What-4D-shows-do-you-have-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'show-dreamzzz4d',type:'show',icon:'🎬',name:'LEGO DREAMZzz 4D: Z-Blob Rescue Rush',zone:'🌆 LEGO City',nearbyText:'Horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita, sin agenda fija publicada en la web.',source:'https://newyork-support.legoland.com/hc/en-us/articles/22950265526557-What-4D-shows-do-you-have-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'character-meetgreet',type:'character',icon:'👋',name:'Meet & Greet con Minifiguras',zone:'Varía',nearbyText:'Personajes y horarios confirmados oficialmente como variables — se consultan en la app oficial el día de la visita.',source:'https://newyork-support.legoland.com/hc/en-us/articles/23710553919901-What-shows-and-entertainment-can-I-enjoy-at-LEGOLAND-New-York-Resort',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'ev-lotb',type:'ev',icon:'🔌',name:'Carga EV — Park Lot B (2 estaciones)',zone:'🅿️ Estacionamiento',nearbyText:'Confirmado oficialmente: 2 estaciones de carga hacia el frente, lado más lejano del Lot B. Máximo 2 horas de carga, sin carga nocturna, espacios solo para carga activa. El FAQ oficial NO especifica marca, tipo de conector ni costo — no asumir "Livingston Charge Port"/J1772/gratis sin confirmarlo en el parque. Llevar el adaptador J1772→NACS por si acaso, pero no está garantizado que sea compatible.',source:'https://newyork-support.legoland.com/hc/en-us/articles/6344836333725-Do-you-have-Car-Charging-Stations-at-LEGOLAND-New-York',lastVerified:'2026-08-19',confidence:'verified-official',geo:null},
{id:'entrance-main',type:'entrance',icon:'🚪',mapNumber:1,mapMarker:{x:52.94,y:63.64},name:'Entrada principal',zone:'🚪 Entrada',nearbyText:'1 LEGOLAND Way, Goshen, NY — dirección pública del parque (no residencial). mapNumber/mapMarker: Ticket Windows (#1), leídos visualmente del mapa oficial 2026 local (torre del reloj de la plaza de entrada).',source:'Búsqueda web (iloveny.com, Wikipedia) — dirección pública del predio.',lastVerified:'2026-08-19',confidence:'approximate',geo:{lat:41.37806,lng:-74.31333,source:'official-map',reference:'entrance'}},
{id:'parking-main',type:'parking',icon:'🅿️',name:'Estacionamiento principal',zone:'🅿️ Estacionamiento',nearbyText:'Llegar antes de la apertura para tiempo de parking + caminata a la entrada.',source:'Recomendación general — sin tarifa/ubicación exacta confirmada en esta implementación.',lastVerified:'2026-08-19',confidence:'inferred',geo:null},
  ],
};
