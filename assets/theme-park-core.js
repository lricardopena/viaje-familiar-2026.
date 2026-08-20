/* ============================================================================
   theme-park-core.js — Theme Park Companion, motor reutilizable
   ============================================================================
   Extraído de la implementación original de Story Land (agosto 2026) al
   separarla en "core reutilizable + park.js por parque" — ver
   specs/SPECIFICATIONS.md.asc sección 22. Este archivo NO contiene ningún
   dato ni texto específico de un parque: todo lo que varía por parque vive
   en window.PARK, cargado por un <script> previo (parks/story-land.js,
   parks/legoland-new-york.js, ...). Story Land y cualquier parque nuevo
   comparten exactamente este archivo — agregar un parque nuevo es escribir
   su park.js, no copiar/tocar este motor.

   Contrato de window.PARK (ver parks/story-land.js y
   parks/legoland-new-york.js para instancias reales, y
   specs/SPECIFICATIONS.md.asc sección 22 para el detalle campo por campo):
     id, name, emoji, theme:{accent,accentDark,themeColor}
     copy:{backHref,backLabel,headerTitle,mapOfficialTitle,mapAltText,mapNote,
           doneTitle,doneBody,resetConfirm}
     map:{url,image,center:[lat,lng],
          geoCalibration:{ax,bx,cx,ay,by,cy,controlPointIds,fittedOn,
                          medianResidualPct,maxResidualPct,excludedIds} | undefined}
     storageKey
     attractions: [...]   (antes "ALL")
     pois: [...]           (antes "PARK_POIS" — restaurantes/baños/servicios)
     mustIds, calmIds, childFavoriteIds, waterIds: [id,...]
     categories: [[key,label],...]
     priorityGroups: [{ids,earlyBonus,earlyBonusMaxDone,reasonLabel}]
     reactionSystem: {...} | null   (ej. la pregunta "¿Cómo le fue en Polar?")
     tips: [[icon,texto],...]
     family: {children:[{name,ageYears,heightIn,heightApprox}]} | null
     shows: [{id,name,zone,times:['11:00',...],description}] | []
     closingTime: 'HH:MM' | null

   Cada atracción admite (todos opcionales salvo id/name/cat):
     id,name,cat,adult,zone,mapNumber,mapMarker:{x,y},mapRegion,
     visualLandmark,nearbyMapNumbers,nearbyAttractions,tags,why,tip,
     priorityTier,waterBoostTier,geo:{lat,lng,source,reference},plusCode,
     restrictions:{minHeightIn,maxHeightIn,adultAccompaniedMinHeightIn,
                   adultRequiredBelowIn,adultRequiredBelowInAndAge:{heightIn,ageYears},
                   minAge,maxAge,minAgeUnaccompanied,soloOnly,
                   source,lastVerified,confidence}
   ============================================================================ */
const PARK=window.PARK;
if(!PARK)throw new Error('theme-park-core.js requiere que window.PARK esté definido antes de cargarlo (ver parks/*.js)');
const ALL=PARK.attractions||[];
const POIS=PARK.pois||[];
const MUST=PARK.mustIds||[];
const CALM_IDS=PARK.calmIds||[];
const CATS=PARK.categories||[];
const CHILD_FAVORITE_IDS=PARK.childFavoriteIds||[];
const WATER_IDS=PARK.waterIds||[];
const MAP_URL=PARK.map&&PARK.map.url;
const MAP_IMAGE=PARK.map&&PARK.map.image;
const BY_ID={};ALL.forEach((a,i)=>BY_ID[a.id]={...a,_i:i});

/* ---------- Tema: aplica los colores/textos del parque a la página ----------
   Un único punto que traduce PARK.theme/PARK.copy a la UI ya presente en el
   HTML (compartido entre todos los parques) — así storyland.html y
   legoland.html pueden ser el mismo esqueleto salvo por el <script src> de
   datos que cargan. */
function applyParkTheme(){
  const th=PARK.theme||{};
  if(th.accent)document.documentElement.style.setProperty('--orange',th.accent);
  if(th.accentDark)document.documentElement.style.setProperty('--orange-dark',th.accentDark);
  const metaTheme=document.querySelector('meta[name="theme-color"]');
  if(metaTheme&&th.themeColor)metaTheme.setAttribute('content',th.themeColor);
  const cp=PARK.copy||{};
  document.title=cp.pageTitle||`${PARK.name} · Plan interactivo`;
  const back=document.getElementById('backLink');
  if(back){ if(cp.backHref)back.setAttribute('href',cp.backHref); back.textContent=cp.backLabel||'← Itinerario'; }
  const h1=document.getElementById('parkHeaderTitle');
  if(h1)h1.textContent=cp.headerTitle||`${PARK.emoji||''} ${PARK.name}`.trim();
  document.querySelectorAll('#mapMain img,#mapThumbViewport img').forEach(im=>{ im.alt=cp.mapAltText||`Mapa oficial de ${PARK.name}`; });
}

/* ---------- Utilidades geográficas (Haversine) ---------- */
function haversineMeters(a,b){
  const R=6371000,toRad=d=>d*Math.PI/180;
  const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
}
/* Todos los puntos con coordenada geográfica real conocida hoy — atracciones
   de ALL con geo + POIs de POIS con geo. Único lugar que arma esta lista
   combinada, para que el mapa geográfico y el cálculo de "cerca de" siempre
   lean del mismo conjunto. */
function geoKnownPoints(){
  return [
    ...ALL.filter(a=>a.geo).map(a=>({id:a.id,type:'attraction',icon:null,name:a.name,mapNumber:a.mapNumber,zone:a.zone,geo:a.geo,plusCode:a.plusCode,nearbyText:null,attraction:a})),
    ...POIS.filter(p=>p.geo).map(p=>({id:p.id,type:p.type,icon:p.icon,name:p.name,mapNumber:p.mapNumber!=null?p.mapNumber:null,zone:p.zone,geo:p.geo,plusCode:p.plusCode,nearbyText:p.nearbyText,attraction:null})),
  ];
}
function zoneLine(a){return a.mapNumber!=null?`📍 Mapa #${a.mapNumber} · ${a.zone}`:`📍 ${a.zone}`}

/* ---------- Elegibilidad por niño (nueva capacidad genérica) ----------
   Solo se activa cuando la atracción trae `restrictions` Y el parque trae
   `family.children` — si cualquiera de los dos falta, el llamador debe caer
   al indicador genérico anterior ("👨‍👦 Adulto: Requerido/No requerido"),
   así Story Land (que no define `restrictions` en ninguna atracción) se ve
   exactamente igual que antes. Nunca infiere que todos los niños pueden
   subir porque uno cumple la altura — se evalúa uno por uno. */
function eligibilityForChild(a,child){
  const r=a.restrictions;
  if(!r)return null;
  const h=child.heightIn;
  if(h==null)return {status:'unknown',label:'❓ Altura no registrada',reason:'No se registró la altura de este niño.'};
  if(r.minHeightIn!=null&&h<r.minHeightIn){
    if(r.adultAccompaniedMinHeightIn!=null&&h>=r.adultAccompaniedMinHeightIn){
      return {status:'with-adult',label:'👨‍👦 Con adulto',reason:`Puede subir acompañado por un adulto (mínimo ${r.adultAccompaniedMinHeightIn}" acompañado; tiene ~${h}").`};
    }
    return {status:'cannot-ride',label:'🚫 No cumple altura',reason:`No cumple la altura mínima (${r.minHeightIn}"; tiene ~${h}").`};
  }
  if(r.maxHeightIn!=null&&h>r.maxHeightIn){
    return {status:'cannot-ride',label:'🚫 Excede altura máx.',reason:`Excede la altura máxima permitida (${r.maxHeightIn}").`};
  }
  /* minAge/maxAge: umbral de edad independiente de la altura (ej. The Dragon
     en LEGOLAND New York exige 42"/4 años como mínimo — dos condiciones
     separadas, no una combinada como adultRequiredBelowInAndAge). Sin
     `ageYears` registrado no se puede evaluar: no se asume que cumple. */
  if(r.minAge!=null){
    if(child.ageYears==null)return {status:'unknown',label:'❓ Edad no registrada',reason:'No se registró la edad de este niño.'};
    if(child.ageYears<r.minAge)return {status:'cannot-ride',label:'🚫 No cumple edad mínima',reason:`Edad mínima para esta atracción: ${r.minAge} años.`};
  }
  if(r.maxAge!=null&&child.ageYears!=null&&child.ageYears>r.maxAge){
    return {status:'cannot-ride',label:'🚫 Excede edad máx.',reason:`Edad máxima para esta atracción: ${r.maxAge} años.`};
  }
  if(r.adultRequiredBelowIn!=null&&h<r.adultRequiredBelowIn){
    return {status:'with-adult',label:'👨‍👦 Con adulto',reason:`Debe ir acompañado por un adulto (requerido debajo de ${r.adultRequiredBelowIn}").`};
  }
  /* Regla combinada (ej. The Dragon en LEGOLAND New York: "menores de 6 años
     Y menores de 48\" deben ir con adulto" — un AND, no un OR de altura/edad
     independientes). Solo aplica si el niño no cumple AMBOS umbrales a la
     vez. */
  if(r.adultRequiredBelowInAndAge&&h<r.adultRequiredBelowInAndAge.heightIn&&child.ageYears!=null&&child.ageYears<r.adultRequiredBelowInAndAge.ageYears){
    return {status:'with-adult',label:'👨‍👦 Con adulto',reason:`Debe ir acompañado por un adulto (menores de ${r.adultRequiredBelowInAndAge.ageYears} años y de ${r.adultRequiredBelowInAndAge.heightIn}").`};
  }
  if(r.minAgeUnaccompanied!=null&&child.ageYears!=null&&child.ageYears<r.minAgeUnaccompanied){
    // soloOnly: la atracción no admite acompañante (ej. autos que se manejan
    // solos) — no cumplir la edad mínima significa que no puede subir, no
    // que pueda subir "con adulto".
    if(r.soloOnly)return {status:'cannot-ride',label:'🚫 No cumple edad',reason:`Edad mínima para esta atracción: ${r.minAgeUnaccompanied} años (no admite acompañante).`};
    return {status:'with-adult',label:'👨‍👦 Con adulto',reason:`Edad mínima para ir solo: ${r.minAgeUnaccompanied} años.`};
  }
  return {status:'can-ride-alone',label:'✅ Puede subir solo',reason:'Cumple los requisitos para subir.'};
}
function eligibilitySummary(a){
  const children=(PARK.family&&PARK.family.children)||[];
  if(!a.restrictions||!children.length)return null;
  return children.map(c=>({child:c,elig:eligibilityForChild(a,c)}));
}
function eligibilityConfidenceNote(a){
  const r=a.restrictions;
  if(!r)return '';
  if(r.confidence&&r.confidence!=='verified-official'){
    return `<div class="tipline">⚠️ Restricción ${r.confidence==='unknown'?'sin verificar':'aproximada'} — confirmar en taquilla/entrada de la atracción antes de hacer fila.${r.source?` Fuente: ${r.source}.`:''}</div>`;
  }
  return '';
}
function eligibilityFactHtml(a){
  const summ=eligibilitySummary(a);
  if(!summ){
    // Story Land y cualquier atracción sin `restrictions`: comportamiento
    // idéntico al original (una sola fila con el flag `adult` general).
    return `<div class="factrow"><div class="fact">📏 Altura<b>✅ Puede subir</b></div><div class="fact">👨‍👦 Adulto<b>${a.adult?'Requerido':'No requerido'}</b></div></div>`;
  }
  const rows=summ.map(({child,elig})=>`<div class="fact">${child.name}${child.heightApprox?' (~alt.)':''}<b class="${elig.status==='cannot-ride'?'priohigh':elig.status==='with-adult'?'priomed':''}">${elig.label}</b></div>`).join('');
  return `<div class="factrow">${rows}</div>${eligibilityConfidenceNote(a)}`;
}
/* Penalización suave (no exclusión) cuando NINGÚN niño de la familia puede
   subir (ni solo ni acompañado) — nunca decide por la familia, solo evita
   que una atracción "solo para adultos" domine la recomendación de un día
   pensado en familia (item de la spec: "no queremos que el día esté
   centrado en rides intensos"). */
const ADULT_ONLY_PENALTY=40;
function adultOnlyPenalty(a){
  const summ=eligibilitySummary(a);
  if(!summ||!summ.length)return 0;
  return summ.every(({elig})=>elig.status==='cannot-ride')?ADULT_ONLY_PENALTY:0;
}

/* ---------- Referencia visual rápida para el Park Map (mapRegion) ----------
   Ubicación aproximada dentro de una cuadrícula 3×3 (front/center/back ×
   left/center/right), orientativa — nunca coordenadas ni distancias. Un
   único componente reutilizable (mapOrientationHtml) para toda la app. */
const MAP_REGION_LABEL={
  'front-left':'Frente izquierda del parque, cerca de la entrada',
  'front-center':'Entrada / parte frontal del parque',
  'front-right':'Frente derecha del parque, cerca de la entrada',
  'center-left':'Zona central izquierda',
  'center':'Zona central',
  'center-right':'Zona central derecha',
  'back-left':'Parte trasera izquierda del parque',
  'back-center':'Parte trasera del parque',
  'back-right':'Parte trasera derecha del parque',
};
const MAP_REGION_CELL={ // [fila, columna] en la cuadrícula 3×3, fila1=trasera, fila3=entrada
  'back-left':[1,1],'back-center':[1,2],'back-right':[1,3],
  'center-left':[2,1],'center':[2,2],'center-right':[2,3],
  'front-left':[3,1],'front-center':[3,2],'front-right':[3,3],
};
function mapGridHtml(region){
  let cell=MAP_REGION_CELL[region];
  if(!cell)return '';
  let [r,c]=cell;
  return `<div class="mapgrid" aria-hidden="true"><div class="mapgrid-box"><span class="mapgrid-dot" style="grid-row:${r};grid-column:${c}"></span></div><div class="mapgrid-entrance">🚪 Entrada</div></div>`;
}
function nearbyMapChips(a){
  if(!a.nearbyMapNumbers||!a.nearbyMapNumbers.length)return [];
  return a.nearbyMapNumbers.map(n=>ALL.find(x=>x.mapNumber===n)).filter(Boolean).slice(0,3).map(x=>`#${x.mapNumber} ${x.name}`);
}
function mapOrientationHtml(a){
  let region=a.mapRegion&&MAP_REGION_LABEL[a.mapRegion]?a.mapRegion:null;
  let chips=nearbyMapChips(a);
  let orientLine=region?`🗺️ ${MAP_REGION_LABEL[region]}`:(a.visualLandmark?`🗺️ ${a.visualLandmark}`:null);
  if(!orientLine&&!chips.length)return ''; // sin datos verificados: no mostrar nada, no inventar
  return `<div class="maporient">${mapGridHtml(region)}<div class="maporienttext">
    ${orientLine?`<div>${orientLine}</div>`:''}
    ${chips.length?`<div>👀 Busca también: ${chips.join(' · ')}</div>`:''}
  </div></div>`;
}

/* ---------- Visor de mapa (openParkMap) ----------
   Un único visor reutilizable para "Ver en el mapa" en toda la app:
   recomendación actual, checklist, favoritas, alternativas y el bloque
   general de "Tips". openParkMap(attractionId) — con id abre mostrando la
   tarjeta de ayuda de esa atracción; sin id abre el mapa general, sin
   inventar ninguna atracción "seleccionada".

   Arquitectura: PDF oficial 2026 (MAP_URL, fuente de verdad, enlace
   externo "Abrir PDF oficial") → imagen local de alta resolución
   (MAP_IMAGE, generada del PDF — ver specs sección 21) → visor
   interactivo propio (createMapViewport, pan/zoom con pointer events) →
   marcadores de atracción (mapMarker, % sobre la imagen). No se usa
   PDF.js ni un iframe con el PDF para la experiencia principal — un
   iframe con PDF no es fiable en todos los navegadores móviles (Safari
   /iOS y apps "home screen" con WKWebView en particular pueden no
   renderizarlo), mientras que una imagen local funciona igual en todos.

   Doble vista: cuando la atracción tiene mapMarker, se muestran dos
   representaciones de la MISMA imagen + el MISMO mapMarker (nunca dos
   ubicaciones distintas) — una vista "near" (zoom cercano, centrada en el
   marcador) y una vista "full" (parque completo). mapViewerState.mode
   ('near'|'full') decide cuál es la vista principal (grande, interactiva)
   y cuál la miniatura flotante (pequeña, no interactiva salvo tocarla
   para intercambiar). mapViewerState.selectedAttractionId es la única
   fuente de qué atracción está activa — nunca se guardan dos posiciones. */
let mapPrevFocus=null,mapPrevScrollY=0;
let mapViewerState={selectedAttractionId:null,mode:'near'};
let mapCurrentAttraction=null;
const MAP_MIN_SCALE=1,MAP_MAX_SCALE=4,MAP_LOCATE_SCALE=2.4;
/* Nombre + número de las atracciones vecinas, ordenadas por número de mapa
   (no por el orden en que aparecen en nearbyAttractions) para que la frase
   "Cerca de #X y #Y" salga en el mismo orden en que aparecerían los
   números si se recorre el mapa — solo usa datos que ya existen. */
function nearbyAttractionsSorted(a){
  if(!a.nearbyAttractions||!a.nearbyAttractions.length)return [];
  return a.nearbyAttractions.map(id=>BY_ID[id]).filter(x=>x&&x.mapNumber!=null).sort((x,y)=>x.mapNumber-y.mapNumber);
}
function nearbyHelpLine(a){
  let near=nearbyAttractionsSorted(a);
  if(!near.length)return '';
  let parts=near.map(x=>`#${x.mapNumber} ${x.name}`);
  let joined=parts.length>1?parts.slice(0,-1).join(', ')+' y '+parts[parts.length-1]:parts[0];
  return `Cerca de ${joined}`;
}
/* Tarjeta de ayuda de la atracción: el elemento dominante es "🔎 BUSCA EL
   #N" cuando hay mapMarker calibrado (el visor va a poder centrar y
   acercar el zoom automáticamente ahí); si no hay mapMarker se usa "📍
   Busca el #N en el mapa" — no se finge una ubicación que no se pudo
   confirmar. El resto (zona, vecinas, orientación) usa exactamente los
   mismos campos/función que ya usa el resto de la app (mapOrientationHtml),
   sin inventar coordenadas nuevas. */
function mapHelpData(a){
  let icon=(catLabel(a.cat)||'📍').split(' ')[0];
  let hasMarker=!!a.mapMarker;
  let big=hasMarker
    ?(a.mapNumber!=null?`🔎 BUSCA EL #${a.mapNumber}`:'🔎 Búscala en el mapa oficial')
    :(a.mapNumber!=null?`📍 Busca el #${a.mapNumber} en el mapa`:'📍 Búscala en el mapa oficial');
  let near=nearbyHelpLine(a);
  let body=`<div class="mapsheet-helpzone">${a.zone}</div>${near?`<div>${near}</div>`:''}${mapOrientationHtml(a)}`;
  return {icon,big,body};
}

/* ----- Motor de pan/zoom reutilizable -----
   Una instancia por contenedor (#mapMain = vista principal, interactiva;
   #mapThumbViewport = miniatura, solo lectura). "base" es el tamaño (sin
   escalar) de la imagen ya encajada por completo dentro del contenedor
   ("contain": ambos lados caben, con márgenes si la proporción no calza
   exacto) — así scale=1 siempre muestra el mapa completo sin necesidad de
   scroll, y escalar hacia arriba desde ahí da el acercamiento. El marcador
   vive DENTRO del mismo elemento que se transforma (.maptransform), nunca
   fuera, para que nunca se desalinee del mapa al hacer zoom o pan. */
function createMapViewport(rootId,opts){
  const root=document.getElementById(rootId);
  const transform=root.querySelector('.maptransform');
  const img=root.querySelector('img');
  const marker=root.querySelector('.mapmarker');
  const markerLabel=marker.querySelector('.mapmarker-label');
  const me=root.querySelector('.mapme');
  const interactive=!!(opts&&opts.interactive);
  let base={w:0,h:0};
  let view={scale:MAP_MIN_SCALE,tx:0,ty:0};
  function clampAxis(t,scaled,vp){ if(scaled<=vp)return (vp-scaled)/2; return Math.min(0,Math.max(vp-scaled,t)); }
  function clamp(v){
    const vw=root.clientWidth||1,vh=root.clientHeight||1;
    v.scale=Math.min(MAP_MAX_SCALE,Math.max(MAP_MIN_SCALE,v.scale));
    v.tx=clampAxis(v.tx,base.w*v.scale,vw);
    v.ty=clampAxis(v.ty,base.h*v.scale,vh);
    return v;
  }
  function layout(){
    if(!img.naturalWidth)return;
    const vw=root.clientWidth||1,vh=root.clientHeight||1;
    const contain=Math.min(vw/img.naturalWidth,vh/img.naturalHeight);
    base.w=img.naturalWidth*contain; base.h=img.naturalHeight*contain;
  }
  function apply(){
    transform.style.width=base.w+'px';
    transform.style.height=base.h+'px';
    transform.style.transform=`translate(${view.tx}px,${view.ty}px) scale(${view.scale})`;
  }
  function setView(v,animated){ view=v; transform.classList.toggle('animated',!!animated); apply(); }
  function setFull(animated){
    layout();
    const vw=root.clientWidth||1,vh=root.clientHeight||1;
    setView(clamp({scale:MAP_MIN_SCALE,tx:(vw-base.w)/2,ty:(vh-base.h)/2}),animated);
  }
  /* mePos (opcional): posición estimada del GPS del usuario (% imagen, ver
     geoToImagePercent()). Con ella, en vez de solo centrar la atracción,
     encuadra atracción + usuario juntos ("yo estoy aquí → la atracción está
     allá") — mismo criterio que ya usa el mapa geográfico (fitBounds de los
     dos puntos). Sin GPS, comportamiento idéntico al de siempre. */
  function setNear(mk,animated,mePos){
    layout();
    const vw=root.clientWidth||1,vh=root.clientHeight||1;
    if(mePos){
      const p1={x:mk.x/100*base.w,y:mk.y/100*base.h};
      const p2={x:mePos.x/100*base.w,y:mePos.y/100*base.h};
      const minX=Math.min(p1.x,p2.x),maxX=Math.max(p1.x,p2.x);
      const minY=Math.min(p1.y,p2.y),maxY=Math.max(p1.y,p2.y);
      const pad=70; // margen en px de pantalla alrededor de ambos puntos
      const spanX=Math.max(maxX-minX,1),spanY=Math.max(maxY-minY,1);
      const s=Math.min((vw-pad*2)/spanX,(vh-pad*2)/spanY);
      const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
      setView(clamp({scale:s,tx:vw/2-cx*s,ty:vh/2-cy*s}),animated);
    }else{
      const cx=mk.x/100*base.w,cy=mk.y/100*base.h,s=MAP_LOCATE_SCALE;
      setView(clamp({scale:s,tx:vw/2-cx*s,ty:vh/2-cy*s}),animated);
    }
  }
  function setMarker(a){
    if(a&&a.mapMarker){
      marker.style.setProperty('--mx',a.mapMarker.x);
      marker.style.setProperty('--my',a.mapMarker.y);
      if(markerLabel)markerLabel.textContent=a.mapNumber!=null?`#${a.mapNumber} ${a.name}`:a.name;
      marker.hidden=false;
    }else{
      marker.hidden=true;
    }
  }
  function pulse(){ marker.classList.remove('pulse'); void marker.offsetWidth; marker.classList.add('pulse'); }
  /* "Estás aquí" ESTIMADO sobre la imagen — posición derivada cruzando GPS
     real con mapMarker vía geoToImagePercent() (ver más abajo), nunca una
     medición directa sobre la imagen. Mismo mecanismo que setMarker(): vive
     dentro de .maptransform, así que nunca se desalinea al hacer zoom/pan. */
  function setMe(pos){
    if(!me)return;
    if(pos){
      me.style.setProperty('--mx',pos.x);
      me.style.setProperty('--my',pos.y);
      me.hidden=false;
    }else{
      me.hidden=true;
    }
  }
  function zoomBy(factor){
    const vw=root.clientWidth||1,vh=root.clientHeight||1;
    const sx=vw/2,sy=vh/2;
    const cx=(sx-view.tx)/view.scale,cy=(sy-view.ty)/view.scale;
    const newScale=Math.min(MAP_MAX_SCALE,Math.max(MAP_MIN_SCALE,view.scale*factor));
    setView(clamp({scale:newScale,tx:sx-cx*newScale,ty:sy-cy*newScale}),true);
  }
  function doubleTapZoom(sx,sy){
    const target=view.scale<MAP_MAX_SCALE-.3?Math.min(MAP_MAX_SCALE,view.scale*1.8):MAP_MIN_SCALE;
    const cx=(sx-view.tx)/view.scale,cy=(sy-view.ty)/view.scale;
    setView(clamp({scale:target,tx:sx-cx*target,ty:sy-cy*target}),true);
  }
  if(interactive){
    // Pointer Events unifica touch/mouse: 1 puntero = pan, 2 = pinch-zoom.
    // touch-action:none (CSS) + preventDefault evita que el gesto mueva la
    // página/el fondo detrás del visor en vez del mapa.
    let pointers=new Map(),pinchStart=null,dragStart=null,lastTapAt=0,lastTapPos=null;
    root.addEventListener('pointerdown',e=>{
      e.preventDefault();
      try{root.setPointerCapture(e.pointerId)}catch(err){}
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      transform.classList.remove('animated');
      if(pointers.size===2){
        const pts=[...pointers.values()];
        const rect=root.getBoundingClientRect();
        pinchStart={
          dist:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),
          scale:view.scale,
          mid:{x:(pts[0].x+pts[1].x)/2-rect.left,y:(pts[0].y+pts[1].y)/2-rect.top},
          tx:view.tx,ty:view.ty
        };
        dragStart=null;
      }else if(pointers.size===1){
        dragStart={x:e.clientX,y:e.clientY,tx:view.tx,ty:view.ty};
      }
    });
    root.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId))return;
      e.preventDefault();
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2&&pinchStart){
        const pts=[...pointers.values()];
        const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        const factor=dist/(pinchStart.dist||1);
        const newScale=Math.min(MAP_MAX_SCALE,Math.max(MAP_MIN_SCALE,pinchStart.scale*factor));
        const cx=(pinchStart.mid.x-pinchStart.tx)/pinchStart.scale,cy=(pinchStart.mid.y-pinchStart.ty)/pinchStart.scale;
        setView(clamp({scale:newScale,tx:pinchStart.mid.x-cx*newScale,ty:pinchStart.mid.y-cy*newScale}),false);
      }else if(pointers.size===1&&dragStart){
        setView(clamp({scale:view.scale,tx:dragStart.tx+(e.clientX-dragStart.x),ty:dragStart.ty+(e.clientY-dragStart.y)}),false);
      }
    });
    function endPointer(e){
      if(!pointers.has(e.pointerId))return;
      pointers.delete(e.pointerId);
      pinchStart=null;
      if(pointers.size===1){
        const p=[...pointers.values()][0];
        dragStart={x:p.x,y:p.y,tx:view.tx,ty:view.ty};
      }else if(pointers.size===0){
        dragStart=null;
        const now=Date.now(),pos={x:e.clientX,y:e.clientY};
        if(lastTapPos&&now-lastTapAt<320&&Math.hypot(pos.x-lastTapPos.x,pos.y-lastTapPos.y)<24){
          const rect=root.getBoundingClientRect();
          doubleTapZoom(pos.x-rect.left,pos.y-rect.top);
          lastTapAt=0; lastTapPos=null;
        }else{ lastTapAt=now; lastTapPos=pos; }
      }
    }
    root.addEventListener('pointerup',endPointer);
    root.addEventListener('pointercancel',endPointer);
  }
  return {layout,setFull,setNear,setMarker,setMe,pulse,zoomBy};
}
const mainViewport=createMapViewport('mapMain',{interactive:true});
const thumbViewport=createMapViewport('mapThumbViewport',{interactive:false});

/* ----- Carga de la imagen (una sola vez por sesión, con caché) ----- */
let mapImageStatus='idle',mapImagePending=[],mapLoadTimer=null;
function flushMapImagePending(){ let p=mapImagePending; mapImagePending=[]; p.forEach(fn=>fn()); }
function ensureMapImage(cb){
  mapImagePending.push(cb);
  if(!MAP_IMAGE){ onMapImageError(); return; } // parque sin imagen local calibrada (ej. LEGOLAND todavía) — directo al fallback "Abrir mapa oficial", sin intentar pedir una URL vacía
  if(mapImageStatus==='loaded'){ flushMapImagePending(); return; }
  if(mapImageStatus==='loading')return;
  mapImageStatus='loading';
  document.getElementById('mapSheetLoading').hidden=false;
  document.getElementById('mapSheetFallback').hidden=true;
  clearTimeout(mapLoadTimer);
  mapLoadTimer=setTimeout(onMapImageError,10000); // red caída/colgada: no depender solo de onerror
  const loader=new Image();
  loader.onload=()=>{
    clearTimeout(mapLoadTimer);
    mapImageStatus='loaded';
    // src recién ahora, sobre elementos ya en el DOM: el navegador sirve
    // esta segunda asignación desde caché — no se vuelve a descargar.
    document.querySelectorAll('#mapMain img,#mapThumbViewport img').forEach(im=>{ im.src=MAP_IMAGE; });
    document.getElementById('mapSheetLoading').hidden=true;
    flushMapImagePending();
  };
  loader.onerror=onMapImageError;
  loader.src=MAP_IMAGE; // no cache-busting: debe poder cachearse normalmente
}
function onMapImageError(){
  clearTimeout(mapLoadTimer);
  mapImageStatus='idle'; // no 'error' permanente: la próxima apertura reintenta la carga
  mapImagePending=[];
  document.getElementById('mapSheetLoading').hidden=true;
  document.getElementById('mapSheetFallback').hidden=false;
}

/* ----- Render de las dos vistas según mapViewerState.mode ----- */
function renderMapViewers(){
  const a=mapCurrentAttraction;
  const hasMarker=!!(a&&a.mapMarker);
  const thumb=document.getElementById('mapThumb');
  const locateBtn=document.getElementById('mapSheetLocateBtn');
  const toggleBtn=document.getElementById('mapSheetToggleBtn');
  const caption=document.getElementById('mapMainCaption');
  mainViewport.setMarker(hasMarker?a:null);
  updateIllustratedGpsMarker();
  if(!hasMarker){
    thumb.hidden=true; locateBtn.hidden=true; toggleBtn.hidden=true; caption.hidden=true;
    mainViewport.setFull(true);
    return;
  }
  thumb.hidden=false; locateBtn.hidden=false; toggleBtn.hidden=false; caption.hidden=false;
  thumbViewport.setMarker(a);
  const thumbLabel=document.getElementById('mapThumbLabel');
  // Posición GPS estimada (% imagen) para que la vista cercana encuadre
  // atracción + usuario juntos, igual que ya hace el mapa geográfico.
  const mePos=mapGpsState.coords?geoToImagePercent(mapGpsState.coords.lat,mapGpsState.coords.lng):null;
  if(mapViewerState.mode==='near'){
    mainViewport.setNear(a.mapMarker,true,mePos);
    mainViewport.pulse();
    thumbViewport.setFull(true);
    caption.textContent=`🔎 Cerca de #${a.mapNumber}`;
    toggleBtn.textContent='🗺️ Completo';
    thumbLabel.textContent='🗺️ Parque completo';
  }else{
    mainViewport.setFull(true);
    thumbViewport.setNear(a.mapMarker,true,mePos);
    caption.textContent='🗺️ Ubicación en el parque';
    toggleBtn.textContent='🔎 Ver cerca';
    thumbLabel.textContent='🔎 Ver cerca';
  }
}
function mapToggleMode(){ mapViewerState.mode=mapViewerState.mode==='near'?'full':'near'; renderMapViewers(); }
function mapLocate(){ mapViewerState.mode='near'; renderMapViewers(); }
function mapZoomStep(dir){ mainViewport.zoomBy(dir>0?1.4:1/1.4); }
function onMapResize(){
  if(mapViewType==='oficial'&&mapImageStatus==='loaded')renderMapViewers();
  if(mapViewType==='geo'&&mapGeoMap){ mapGeoMap.invalidateSize(); mapGeoApplyZoom(); }
}

/* Aplica una atracción (o null = mapa general) al header + tarjeta de ayuda.
   Separado de openParkMap() porque también lo usa el botón "Ver mapa
   oficial" de una tarjeta del mapa geográfico (mapGeoOpenOfficial()), que
   cambia la atracción activa del visor sin volver a abrir/animar la hoja
   completa. Devuelve true si la atracción cambió respecto a la anterior
   (se usa para decidir si hay que resetear las vistas "cercana" a su
   estado inicial en vez de conservar el zoom/pan de la atracción previa). */
function mapApplyAttraction(attractionId){
  const help=document.getElementById('mapSheetHelp'),titleSub=document.getElementById('mapSheetTitleSub'),
    titleMain=document.getElementById('mapSheetTitleMain');
  const a=attractionId?BY_ID[attractionId]:null;
  const isNewAttraction=mapViewerState.selectedAttractionId!==(attractionId||null);
  mapCurrentAttraction=a;
  mapViewerState.selectedAttractionId=attractionId||null;
  if(isNewAttraction){
    mapViewerState.mode='near'; // nueva atracción siempre entra por la vista cercana (mapa oficial)
    mapGeoZoomMode=(a&&a.geo)?'near':'full'; // ídem para el mapa geográfico
  }
  document.getElementById('mapSheetApprox').hidden=!(a&&a.mapMarker);
  if(a){
    titleMain.textContent=a.name;
    titleSub.textContent=a.mapNumber!=null?`Mapa #${a.mapNumber}`:'';
    let h=mapHelpData(a);
    document.getElementById('mapSheetHelpName').textContent=`${h.icon} ${a.name}`;
    document.getElementById('mapSheetHelpBig').textContent=h.big;
    document.getElementById('mapSheetHelpBody').innerHTML=h.body;
    help.hidden=false;
    help.classList.remove('collapsed');
    document.getElementById('mapSheetHelpToggle').setAttribute('aria-expanded','true');
  }else{
    titleMain.textContent=(PARK.copy&&PARK.copy.mapOfficialTitle)||`🗺️ Mapa oficial de ${PARK.name}`;
    titleSub.textContent='';
    help.hidden=true;
  }
  return isNewAttraction;
}
/* openParkMap(attractionId, opts) — opts.forceView:'oficial'|'geo' fuerza esa
   pestaña (usado por "📍 Mapa del parque" y "🚻 ¿Dónde hay un baño?"); sin
   forceView se respeta mapViewType tal como quedó ("recordar durante esa
   sesión la última vista utilizada" — nunca se resetea a 'oficial' solo por
   abrir otra atracción). opts.geoFilterOnly fuerza el filtro del mapa
   geográfico a un único tipo (ej. 'restroom' para la acción rápida de baños). */
function openParkMap(attractionId,opts){
  opts=opts||{};
  const sheet=document.getElementById('mapSheet');
  mapApplyAttraction(attractionId);
  document.getElementById('mapSheetExternalTop').href=MAP_URL;
  document.getElementById('mapSheetExternalBottom').href=MAP_URL;
  document.getElementById('mapSheetFallbackLink').href=MAP_URL;
  document.getElementById('mapSheetControls').hidden=false;
  document.getElementById('mapViewTabs').hidden=false;
  if(opts.geoFilterOnly){ mapGeoFilters=new Set([opts.geoFilterOnly]); }
  mapPrevFocus=document.activeElement;
  mapPrevScrollY=window.scrollY;
  document.body.classList.add('noscroll');
  document.body.style.top=`-${mapPrevScrollY}px`;
  sheet.setAttribute('aria-hidden','false');
  sheet.classList.add('show');
  document.addEventListener('keydown',onMapKeydown);
  window.addEventListener('resize',onMapResize);
  mapSetViewType(opts.forceView||mapViewType); // respeta la última vista usada en la sesión salvo forceView
  requestAnimationFrame(()=>document.getElementById('mapSheetClose').focus());
}
function closeParkMap(){
  const sheet=document.getElementById('mapSheet');
  if(!sheet.classList.contains('show'))return; // evita restaurar scroll dos veces si se cierra repetido
  sheet.classList.remove('show');
  sheet.setAttribute('aria-hidden','true');
  document.removeEventListener('keydown',onMapKeydown);
  window.removeEventListener('resize',onMapResize);
  mapGpsStopWatch(); // no seguir consultando el GPS con la hoja cerrada — se reanuda solo (sin pedir permiso otra vez) al reabrir en la pestaña geográfica
  document.body.classList.remove('noscroll');
  document.body.style.top='';
  window.scrollTo(0,mapPrevScrollY);
  if(mapPrevFocus&&typeof mapPrevFocus.focus==='function')mapPrevFocus.focus();
}
function onMapKeydown(e){if(e.key==='Escape')closeParkMap()}
function toggleMapHelp(){
  const help=document.getElementById('mapSheetHelp');
  let collapsed=help.classList.toggle('collapsed');
  document.getElementById('mapSheetHelpToggle').setAttribute('aria-expanded',String(!collapsed));
}

/* ---------- Mapa geográfico (Leaflet + OpenStreetMap) ----------
   Complementa (no reemplaza) el mapa oficial ilustrado — dos pestañas
   dentro del mismo visor ("🗺️ Oficial" / "📍 Geográfico", mapSetViewType()).
   Usa coordenadas reales solo donde existen (geo, ver geoKnownPoints() y el
   comentario grande sobre POIS más arriba) — nunca fabrica ni interpola
   una posición. mapViewType se recuerda durante la sesión (variable de
   módulo — no localStorage, no debe sobrevivir a un refresh) y openParkMap()
   la respeta salvo que se pida opts.forceView explícitamente (usado por
   "📍 Mapa del parque" y "🚻 ¿Dónde hay un baño?", ambos en la pestaña Tips). */
let mapViewType='oficial';
let mapGeoZoomMode='full';
const MAP_GEO_ALL_FILTERS=['attraction','restroom','food','help'];
let mapGeoFilters=new Set(['attraction','restroom','food']); // por defecto, sin saturar el mapa
let mapGeoMap=null,mapGeoTileLayer=null,mapGeoMarkersById={},mapGeoTileTimer=null,mapGeoTileOk=false;

function mapSetViewType(type){
  mapViewType=type;
  document.getElementById('mapTabOficial').classList.toggle('active',type==='oficial');
  document.getElementById('mapTabGeo').classList.toggle('active',type==='geo');
  document.getElementById('mapSheetViewer').hidden=type!=='oficial';
  document.getElementById('mapSheetGeo').hidden=type!=='geo';
  // El GPS ahora se usa en las dos pestañas (marcador real en la
  // geográfica, posición estimada sobre la imagen en la oficial — ver
  // updateIllustratedGpsMarker()), así que ya no se pausa al cambiar de
  // pestaña: sigue corriendo hasta que se cierra la hoja (closeParkMap()).
  // mapGpsStart() no vuelve a pedir permiso si ya estaba concedido — el
  // guard interno (watchId!=null) hace que llamarla de más sea inofensivo.
  if(mapGpsState.status==='granted')mapGpsStart();
  if(type==='oficial'){
    ensureMapImage(()=>{ renderMapViewers(); });
  }else{
    renderMapGeo();
  }
}
/* Crea el mapa Leaflet UNA sola vez por sesión (no se recrea cada vez que se
   abre/cierra el visor — reutiliza la instancia, solo se le pide
   invalidateSize()/fitBounds de nuevo). Timeout + evento 'tileerror' cubren
   el caso de que los tiles de OpenStreetMap no puedan cargar (sin red, o el
   dominio bloqueado) — nunca se deja una pantalla vacía, se cae a la lista
   de texto con "Abrir en Google Maps" por punto (mapGeoShowFallback()). */
function ensureGeoMap(){
  if(mapGeoMap)return;
  mapGeoMap=L.map('mapGeoLeaflet',{zoomControl:true,attributionControl:true});
  mapGeoTileLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
  }).addTo(mapGeoMap);
  mapGeoMap.setView((PARK.map&&PARK.map.center)||[0,0],17); // centro provisorio — se ajusta enseguida con fitBounds/setView reales
  let tileErrors=0;
  // "load" de un GridLayer se dispara cuando terminan TODOS los intentos
  // pendientes, hayan tenido éxito o no — no sirve solo, por eso el éxito
  // real se marca en "tileload" (un tile individual sí cargó). Si "load"
  // llega sin que ningún "tileload" haya marcado éxito, todos los intentos
  // fallaron → fallback inmediato, sin esperar los 7s del timeout de respaldo.
  mapGeoTileLayer.on('tileload',()=>{ mapGeoTileOk=true; clearTimeout(mapGeoTileTimer); document.getElementById('mapGeoFallback').hidden=true; document.getElementById('mapGeoMapWrap').hidden=false; });
  mapGeoTileLayer.on('tileerror',()=>{ tileErrors++; });
  mapGeoTileLayer.on('load',()=>{ if(!mapGeoTileOk)mapGeoShowFallback(); });
  mapGeoTileTimer=setTimeout(()=>{ if(!mapGeoTileOk)mapGeoShowFallback(); },7000);
}
function mapGeoShowFallback(){
  clearTimeout(mapGeoTileTimer);
  document.getElementById('mapGeoMapWrap').hidden=true;
  document.getElementById('mapGeoFallback').hidden=false;
  const pts=geoKnownPoints();
  document.getElementById('mapGeoFallbackList').innerHTML=pts.length
    ?pts.map(mapGeoListItemHtml).join('')
    :'<p style="font-weight:800;color:var(--muted)">Todavía no hay puntos con coordenada geográfica registrada.</p>';
}
function mapGeoListItemHtml(p){
  const label=p.mapNumber!=null?`#${p.mapNumber} ${p.name}`:`${p.icon||'📍'} ${p.name}`;
  const gmapsUrl=`https://www.google.com/maps/search/?api=1&query=${p.geo.lat},${p.geo.lng}`;
  return `<div class="mapgeo-item"><span class="ic">${p.icon||'📍'}</span><div class="txt"><b>${label}</b><small>Ubicación registrada</small></div><a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">Abrir en Maps ↗</a></div>`;
}
/* Badge del punto según procedencia de `geo` (genérico, cualquier parque —
   ver jerarquía de fuentes en specs/SPECIFICATIONS.md.asc y en el handoff
   de investigación de LEGOLAND New York):
     - 'onsite-plus-code' (Story Land): medido en sitio con Plus Code —
       texto histórico preservado tal cual para no cambiar la UI existente.
     - 'user-measured' o reference 'queue-entrance'/'service-entrance':
       punto físicamente medido en el parque (entrada de fila/servicio) —
       el más confiable, aunque no venga de Story Land.
     - fuentes de mapa/terceros (OpenStreetMap, Google Places, otro mapa de
       terceros) o reference 'ride-poi'/'service-poi': centroide aproximado
       de la atracción/servicio, NUNCA la entrada de fila real.
     - cualquier otra cosa (ej. 'official-map'): referencia general según
       el mapa oficial del parque. */
function geoSourceBadge(geo){
  const src=geo.source||'',ref=geo.reference||'';
  if(src==='onsite-plus-code')return '📍 Ubicación registrada en sitio';
  if(src==='user-measured'||ref==='queue-entrance'||ref==='service-entrance')return '📍 Entrada medida en el parque';
  if(src==='openstreetmap-poi'||src==='third-party-ride-poi'||src==='google-maps-poi'||ref==='ride-poi'||ref==='service-poi')return '📍 Ubicación aproximada de la atracción (no es la entrada de fila)';
  return '🗺️ Ubicación según mapa oficial';
}
/* Contenido de la tarjeta al tocar un marcador: badge según geo.source/
   geo.reference (ver geoSourceBadge arriba), zona, "cerca de"
   (nearbyAttractions vía nearbyHelpLine si es una atracción, o nearbyText
   si es un POI), distancia en línea recta al punto conocido más cercano
   (Haversine, nunca "caminando" — ver haversineMeters() arriba), y los tres
   botones pedidos: Ver mapa oficial / Abrir en Google Maps / Cerrar. */
function mapGeoPopupHtml(p){
  const badge=geoSourceBadge(p.geo);
  const zoneLine=p.zone?`<div class="geopopup-zone">${p.zone}</div>`:'';
  let nearLine='';
  if(p.attraction){
    const nh=nearbyHelpLine(p.attraction);
    if(nh)nearLine=`<div class="geopopup-near">${nh}</div>`;
  }else if(p.nearbyText){
    nearLine=`<div class="geopopup-near">📍 ${p.nearbyText}</div>`;
  }
  const others=geoKnownPoints().filter(x=>x.id!==p.id);
  const nearest=others.map(o=>({o,d:haversineMeters(p.geo,o.geo)})).filter(x=>x.d<=250).sort((a,b)=>a.d-b.d)[0];
  const distLine=nearest?`<div class="geopopup-near">~${Math.round(nearest.d)} m en línea recta de ${nearest.o.name}</div>`:'';
  // Distancia desde el GPS del usuario (si dio permiso) — siempre línea recta,
  // nunca "caminando": no tenemos una red de senderos internos verificada.
  const gpsLine=mapGpsState.coords?`<div class="geopopup-near">📍 ~${Math.round(haversineMeters(mapGpsState.coords,p.geo))} m de tu ubicación (línea recta)</div>`:'';
  const mapNum=p.mapNumber!=null?`#${p.mapNumber} `:'';
  const officialBtn=(p.attraction&&p.attraction.mapMarker)?`<button onclick="mapGeoOpenOfficial('${p.id}')">🗺️ Ver mapa oficial</button>`:'';
  const gmapsUrl=`https://www.google.com/maps/search/?api=1&query=${p.geo.lat},${p.geo.lng}`;
  return `<div class="geopopup">
    <b>${mapNum}${p.name}</b>
    <span class="geopopup-badge">${badge}</span>
    ${zoneLine}${nearLine}${distLine}${gpsLine}
    <div class="geopopup-btns">
      ${officialBtn}
      <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">Abrir en Google Maps ↗</a>
      <button onclick="mapGeoMap.closePopup()">Cerrar</button>
    </div>
  </div>`;
}
/* Cambia la atracción activa del visor (mismo mecanismo que abrir el mapa
   desde "Ver en el mapa") y salta a la pestaña oficial — botón "Ver mapa
   oficial" dentro de una tarjeta del mapa geográfico. */
function mapGeoOpenOfficial(id){
  if(mapGeoMap)mapGeoMap.closePopup();
  mapApplyAttraction(id);
  mapSetViewType('oficial');
}
function mapGeoRenderMarkers(){
  if(!mapGeoMap)return;
  Object.values(mapGeoMarkersById).forEach(m=>mapGeoMap.removeLayer(m));
  mapGeoMarkersById={};
  // El pin de la atracción seleccionada (el destino) siempre se muestra,
  // aunque su tipo esté desmarcado en los filtros — es "dónde vamos", no
  // debería poder desaparecer por accidente al tocar un chip de filtro.
  geoKnownPoints().filter(p=>mapGeoFilters.has(p.type)||p.id===mapViewerState.selectedAttractionId).forEach(p=>{
    const selected=mapViewerState.selectedAttractionId===p.id;
    const html=p.type==='attraction'
      ?`<div class="geo-pin${selected?' selected':''}"><div class="pinnum">#${p.mapNumber} ${p.name.split(' ')[0]}</div></div>`
      :`<div class="geo-pin${selected?' selected':''}"><div class="pinic">${p.icon}${p.mapNumber!=null?` #${p.mapNumber}`:''}</div></div>`;
    const icon=L.divIcon({className:'geo-divicon',html,iconSize:[0,0],iconAnchor:[0,0]});
    const marker=L.marker([p.geo.lat,p.geo.lng],{icon}).addTo(mapGeoMap);
    marker.bindPopup(mapGeoPopupHtml(p),{maxWidth:240});
    mapGeoMarkersById[p.id]=marker;
  });
}
/* Servicios con "geo:null" (ej. baños, por ahora — ver comentario de
   POIS): NUNCA un pin fabricado en Leaflet, solo esta lista de texto
   con la zona/referencia que sí conocemos, debajo del mapa. */
function mapGeoRenderNoGeoList(){
  const items=POIS.filter(p=>!p.geo&&mapGeoFilters.has(p.type));
  document.getElementById('mapGeoNoGeo').hidden=!items.length;
  document.getElementById('mapGeoNoGeoList').innerHTML=items.map(p=>`<div class="mapgeo-item"><span class="ic">${p.icon}</span><div class="txt"><b>${p.icon} ${p.name}${p.zone?` — ${p.zone}`:''}</b><small>${p.nearbyText||'Según el mapa oficial'} · sin coordenada registrada</small></div></div>`).join('');
}
function mapGeoApplyZoom(){
  if(!mapGeoMap)return;
  const a=mapCurrentAttraction;
  const gps=mapGpsState.coords;
  if(mapGeoZoomMode==='near'&&a&&a.geo){
    // Con GPS: encuadra usuario + atracción a la vez ("yo estoy aquí → la
    // atracción está allá"), pedido explícito. Sin GPS, el comportamiento
    // anterior sigue exactamente igual (setView centrado en la atracción).
    if(gps)mapGeoMap.fitBounds(L.latLngBounds([[a.geo.lat,a.geo.lng],[gps.lat,gps.lng]]),{padding:[50,50],maxZoom:18});
    else mapGeoMap.setView([a.geo.lat,a.geo.lng],18);
  }else{
    const pts=geoKnownPoints().map(p=>[p.geo.lat,p.geo.lng]);
    if(gps)pts.push([gps.lat,gps.lng]);
    if(pts.length)mapGeoMap.fitBounds(L.latLngBounds(pts),{padding:[30,30],maxZoom:18});
  }
  const zoomBtn=document.getElementById('mapGeoZoomBtn');
  zoomBtn.hidden=!(a&&a.geo);
  zoomBtn.textContent=mapGeoZoomMode==='near'?'🗺️ Ver todo':'🔎 Acercar';
}
function mapGeoToggleZoom(){ mapGeoZoomMode=mapGeoZoomMode==='near'?'full':'near'; mapGeoApplyZoom(); }
function mapGeoToggleFilter(name){
  if(mapGeoFilters.has(name))mapGeoFilters.delete(name); else mapGeoFilters.add(name);
  if(!mapGeoFilters.size)mapGeoFilters.add(name); // no permitir quedar sin ningún filtro activo
  renderMapGeo();
}
function mapGeoSetAllFilter(){ mapGeoFilters=new Set(MAP_GEO_ALL_FILTERS); renderMapGeo(); }
function renderMapGeo(){
  ensureGeoMap();
  const a=mapCurrentAttraction;
  const banner=document.getElementById('mapGeoBanner');
  if(a&&!a.geo){
    banner.hidden=false;
    banner.textContent=`📍 Ubicación geográfica de ${a.name} todavía no registrada — mostrando el parque completo.`;
  }else{
    banner.hidden=true;
  }
  document.querySelectorAll('#mapGeoFilters button[data-filter]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.filter==='all'?mapGeoFilters.size===MAP_GEO_ALL_FILTERS.length:mapGeoFilters.has(btn.dataset.filter));
  });
  mapGeoRenderMarkers();
  mapGeoRenderNoGeoList();
  mapGpsSyncButton();
  mapGpsRenderMarker();
  mapGpsUpdateDistanceLine();
  mapGeoApplyZoom();
  if(mapGeoMap)setTimeout(()=>mapGeoMap.invalidateSize(),50);
}
/* Acción rápida "🚻 ¿Dónde hay un baño?" (Tips) y "📍 Mapa del parque"
   (Tips, mapBlockHtml()) — ambas abren el visor en modo mapa general
   (sin atracción) forzando la pestaña geográfica; la de baños además fuerza
   el filtro a solo 'restroom'. currentZone (si hay una atracción reciente)
   se usa nada más que como contexto visual del banner — nunca se afirma
   "este es el más cercano" sin coordenadas para comprobarlo. */
function openRestroomFinder(){ openParkMap(null,{forceView:'geo',geoFilterOnly:'restroom'}); }
function openParkGeoMap(){ openParkMap(null,{forceView:'geo'}); }

/* ---------- Geolocalización del usuario ("📍 Mi ubicación") ----------
   100% client-side: la posición nunca se envía a ningún servidor, no se
   guarda historial de movimientos (ni en localStorage — solo vive en esta
   variable de módulo mientras dure la sesión), sin analytics de
   coordenadas. El permiso se pide únicamente como consecuencia de un toque
   explícito en "📍 Mi ubicación" (mapGpsButtonTap()) — nunca automático al
   cargar la página ni al abrir el mapa. La Geolocation API exige un
   "secure context" (HTTPS o localhost); GitHub Pages ya sirve por HTTPS,
   así que no hace falta nada especial de nuestro lado — si el navegador no
   soporta la API o el contexto no es seguro, navigator.geolocation
   simplemente no existe y se cae al camino "unsupported" de abajo, la app
   sigue funcionando igual sin GPS. */
let mapGpsState={status:'idle',watchId:null,coords:null,marker:null,circle:null};

function mapGpsButtonTap(){
  if(!navigator.geolocation){
    mapGpsState.status='unsupported';
    mapGpsShowMessage('Este navegador no soporta ubicación GPS. El mapa sigue funcionando sin ella.');
    mapGpsSyncButton();
    return;
  }
  if(mapGpsState.status==='granted'&&mapGpsState.coords){
    // Ya la tenemos: el botón sirve para volver a centrar el mapa en "mí".
    if(mapGeoMap)mapGeoMap.setView([mapGpsState.coords.lat,mapGpsState.coords.lng],Math.max(mapGeoMap.getZoom(),17));
    return;
  }
  mapGpsStart();
}
/* watchPosition (no getCurrentPosition): se actualiza sola mientras el
   usuario camina, sin volver a pedir permiso. maximumAge/timeout evitan
   forzar un fix nuevo en cada tick (batería) y evitan colgarse esperando
   uno; enableHighAccuracy tiene sentido caminando dentro de un parque
   chico, donde unos metros de más importan. */
function mapGpsStart(){
  if(!navigator.geolocation)return;
  if(mapGpsState.watchId!=null)return; // ya hay un watch activo — no pedir de nuevo
  mapGpsState.status='requesting';
  mapGpsSyncButton();
  mapGpsState.watchId=navigator.geolocation.watchPosition(mapGpsOnSuccess,mapGpsOnError,{
    enableHighAccuracy:true,
    maximumAge:5000,
    timeout:12000,
  });
}
function mapGpsStopWatch(){
  if(mapGpsState.watchId!=null){
    navigator.geolocation.clearWatch(mapGpsState.watchId);
    mapGpsState.watchId=null;
  }
}
function mapGpsOnSuccess(pos){
  const firstFix=!mapGpsState.coords;
  mapGpsState.status='granted';
  mapGpsState.coords={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};
  mapGpsHideMessage();
  mapGpsSyncButton();
  mapGpsRenderMarker();
  mapGpsUpdateDistanceLine();
  updateIllustratedGpsMarker(); // actualiza el "Estás aquí (estimado)" del mapa ilustrado aunque esa pestaña no esté activa ahora mismo
  // Solo se reencuadra el mapa en el primer fix — encuadra usuario (+
  // atracción seleccionada si tiene geo). Actualizaciones siguientes de
  // watchPosition NO vuelven a mover el mapa solas: el usuario está
  // caminando y no queremos que el mapa "salte" cada pocos segundos.
  if(firstFix){
    mapGeoApplyZoom();
    if(mapImageStatus==='loaded')renderMapViewers(); // recalcula el encuadre "cerca de" del mapa ilustrado ahora que ya hay GPS para fijar los dos puntos
  }
}
function mapGpsOnError(err){
  mapGpsStopWatch();
  if(err&&err.code===1){ // PERMISSION_DENIED
    mapGpsState.status='denied';
    mapGpsShowMessage('Ubicación no disponible. Puedes seguir usando el mapa sin GPS.');
  }else{ // POSITION_UNAVAILABLE (2) o TIMEOUT (3)
    mapGpsState.status='error';
    mapGpsShowMessage('No pudimos obtener tu ubicación por ahora. Puedes seguir usando el mapa sin GPS.');
  }
  mapGpsSyncButton();
}
function mapGpsShowMessage(text){
  const el=document.getElementById('mapGpsStatus');
  el.textContent=text; el.hidden=false;
}
function mapGpsHideMessage(){ document.getElementById('mapGpsStatus').hidden=true; }
function mapGpsSyncButton(){
  // Dos botones (pestaña oficial + pestaña geográfica) comparten el mismo
  // mapGpsState — un solo permiso, un solo flujo, dos lugares para verlo.
  ['mapGpsBtn','mapGpsBtnOficial'].forEach(id=>{
    const btn=document.getElementById(id);
    if(!btn)return;
    btn.classList.toggle('active',mapGpsState.status==='granted');
    btn.classList.toggle('requesting',mapGpsState.status==='requesting');
    btn.textContent=mapGpsState.status==='granted'?'📍 Mi ubicación ✓'
      :mapGpsState.status==='requesting'?'📍 Buscando…'
      :'📍 Mi ubicación';
  });
}
/* Marcador "Estás aquí": un único marcador + un único círculo de precisión,
   reutilizados (setLatLng/setRadius) en cada actualización de watchPosition
   — nunca se reconstruyen junto con los demás marcadores del mapa (eso
   cerraría un popup abierto y sería trabajo innecesario en cada tick de
   GPS). Visualmente distinto de los pines de atracciones/POIs: punto azul
   con halo pulsante, en vez de la píldora numerada o el emoji de un POI. */
function mapGpsRenderMarker(){
  if(!mapGeoMap||!mapGpsState.coords)return;
  const {lat,lng,accuracy}=mapGpsState.coords;
  if(!mapGpsState.marker){
    const icon=L.divIcon({className:'geo-divicon',html:'<div class="geo-me"><div class="geo-me-dot"></div><div class="geo-me-label">📍 Estás aquí</div></div>',iconSize:[0,0],iconAnchor:[0,0]});
    mapGpsState.marker=L.marker([lat,lng],{icon,zIndexOffset:1000}).addTo(mapGeoMap);
    mapGpsState.circle=L.circle([lat,lng],{radius:accuracy||0,color:'#1a73e8',weight:1,fillColor:'#1a73e8',fillOpacity:.12}).addTo(mapGeoMap);
  }else{
    mapGpsState.marker.setLatLng([lat,lng]);
    mapGpsState.circle.setLatLng([lat,lng]);
    if(accuracy)mapGpsState.circle.setRadius(accuracy);
  }
}
/* "Yo estoy aquí → la atracción está allá": distancia en línea recta
   (Haversine) a la atracción seleccionada, si tiene geo — más la precisión
   GPS reportada, para no transmitir una exactitud falsa. Nunca "caminando":
   no hay una red de senderos internos de Story Land verificada contra
   OpenStreetMap (ver "No implementado a propósito" en specs sección 21). */
function mapGpsUpdateDistanceLine(){
  const el=document.getElementById('mapGpsDistance');
  const a=mapCurrentAttraction;
  if(!mapGpsState.coords||!a||!a.geo){ el.hidden=true; return; }
  const meters=haversineMeters(mapGpsState.coords,a.geo);
  const acc=mapGpsState.coords.accuracy;
  el.hidden=false;
  el.textContent=`📍 Estás a ~${Math.round(meters)} m de ${a.name} en línea recta${acc?` · Precisión aprox. ±${Math.round(acc)} m`:''}`;
}

/* ---------- GPS proyectado sobre el mapa oficial ilustrado ----------
   El mapa ilustrado no tiene coordenadas propias (es un dibujo, no un
   mapa a escala) — no hay forma de ubicar el GPS ahí de forma exacta. Lo
   que sí podemos hacer es ESTIMAR la posición cruzando los dos sistemas
   de coordenadas que ya conocemos: para las atracciones que tienen tanto
   geo (coordenada real) como mapMarker (posición en la imagen, calibrada a
   mano), tenemos pares (lat/lng) ↔ (x%,y%). Con esos pares se puede ajustar
   offline, una única vez, una transformación afín por mínimos cuadrados
   (numpy.lstsq) que convierte cualquier lat/lng en una posición (x%,y%)
   estimada sobre la imagen.

   GENÉRICO POR DISEÑO (no específico de ningún parque): el ajuste vive en
   `PARK.map.geoCalibration` (ver contrato arriba), no acá. Cada parque trae
   su propio mapa ilustrado y por tanto su propia transformación — jamás la
   de otro parque. Un parque sin `geoCalibration` (ej. LEGOLAND New York
   hoy: no hubo visita previa para calibrar mapMarker, y los puntos
   geográficos disponibles no están bien distribuidos — ver comentario en
   parks/legoland-new-york.js) simplemente no proyecta el GPS sobre el mapa
   ilustrado (geoToImagePercent devuelve null, "Tu ubicación (estimada)"
   nunca se activa) — el resto de la app (mapa geográfico, checklist,
   elegibilidad) sigue funcionando igual sin eso.

   Story Land es la única instancia con `geoCalibration` hoy (ver
   parks/story-land.js): 6 pares control point, ajuste conservado tal cual
   se calculó originalmente (mismo resultado numérico que antes de mover la
   constante a datos de parque). Es una ESTIMACIÓN, nunca una medición: el
   ajuste tiene hasta ~5 puntos porcentuales de error en los propios puntos
   de calibración (el mapa ilustrado no está dibujado a escala/proyección
   real), así que el marcador se etiqueta siempre "(estimada)" y nunca se
   presenta como una posición GPS exacta — mismo principio que "La zona
   marcada es aproximada" para mapMarker. */
function geoToImagePercent(lat,lng){
  const cal=PARK.map&&PARK.map.geoCalibration;
  if(!cal)return null; // parque sin calibración ajustada: no inventar una posición
  let x=cal.ax*lat+cal.bx*lng+cal.cx;
  let y=cal.ay*lat+cal.by*lng+cal.cy;
  return {x:Math.max(0,Math.min(100,x)),y:Math.max(0,Math.min(100,y))};
}
function updateIllustratedGpsMarker(){
  if(!mapGpsState.coords){ mainViewport.setMe(null); thumbViewport.setMe(null); return; }
  const pos=geoToImagePercent(mapGpsState.coords.lat,mapGpsState.coords.lng); // null si el parque no tiene geoCalibration
  mainViewport.setMe(pos);
  thumbViewport.setMe(pos);
}


/* ---------- Estado / localStorage ----------
   PARK.storageKey (antes la constante fija "storyland_state_v1") separa el
   progreso de cada parque — Story Land sigue usando exactamente la misma
   clave que ya tenía (ver parks/story-land.js) para no perder el progreso
   guardado en el teléfono de la familia a mitad del día. */
const KEY=PARK.storageKey;
function loadState(){
  let s;
  try{s=JSON.parse(localStorage.getItem(KEY))}catch(e){s=null}
  if(!s||typeof s!=='object')s={};
  if(!s.status)s.status={};
  if(!('reaction' in s))s.reaction=null;
  if(!('calmMode' in s))s.calmMode=false;
  if(!s.startTime)s.startTime=Date.now();
  if(!s.tab)s.tab='ahora';
  if(!('currentZone' in s))s.currentZone=null;       // zona de la última atracción completada/repetida
  if(!('lastCompletedId' in s))s.lastCompletedId=null;
  if(!s.deferred)s.deferred={};                       // id -> {atCount, zone} cuando se marca "fila muy larga"
  if(!('recommendationCount' in s))s.recommendationCount=0; // avanza con cada acción, usado para el cooldown
  if(!s.skipped)s.skipped={};                          // id -> {atCount} cuando se toca "saltar por ahora"
  return s;
}
let state=loadState();
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function getStatus(id){return state.status[id]||'pending'}
function setStatus(id,val){state.status[id]=val;save();renderAll()}

/* ---------- Lógica de recomendación ----------
   NO es un itinerario: no hay una secuencia fija de atracciones guardada en
   ningún sitio. Cada vez que se pide "¿Qué sigue?" se recalcula un score
   para TODAS las atracciones todavía no completadas (incluidas las
   marcadas "repeat"), y gana la de mayor score. Cualquier interacción
   (hecho / saltar / fila larga / repetir / reacción / modo tranquilo)
   cambia el contexto y por tanto puede cambiar quién gana la próxima vez —
   ver renderAll() / setStatus(), que recalculan siempre.

   score = priorityScore(tier) + sameZoneBonus + proximityBonus(routeEfficiency)
           + childAffinityBonus(familySuitability) + timeOfDayBonus(agua,
           weatherSuitability aproximada por calor) + groupEarlyBonus
           + reactionBonus + restBonus + closingSoonBonus
           - deferredPenalty(waitTimeScore) - skipPenalty - adultOnlyPenalty

   La prioridad (tier) manda: cada nivel vale TIER_W puntos, y la suma de
   los bonus de contexto normalmente no alcanza un nivel completo — así un
   imperdible pendiente razonablemente cerca sigue ganando a una atracción
   secundaria que está pegada a nosotros. La ubicación/contexto desempata
   entre cosas de prioridad parecida y evita cruzar el parque sin
   necesidad, pero no puede "inventar" prioridad donde no la hay.
   Las restricciones de seguridad (elegibilidad por niño) SIEMPRE se
   muestran de forma prominente sobre la tarjeta, nunca ocultas detrás del
   score — ver eligibilityFactHtml() en el core y adultOnlyPenalty().

   Pesos ajustables aquí abajo — están comentados para que cambiarlos más
   adelante (o durante el día, si algo no se siente bien) sea fácil. */
const TIER_W=100;          // peso de cada nivel de prioridad (factor dominante)
const SAME_ZONE_BONUS=35;  // seguimos en la misma zona que la última atracción
const PROXIMITY_BONUS=15;  // está en la lista "nearbyAttractions" de lo último hecho
const CHILD_BONUS=12;      // atracción marcada como favorita probable de los niños
const WATER_BONUS=20;      // agua + hace calor (bonus, no regla obligatoria)
const WATER_BONUS_SECONDARY=10; // agua "opcional" del parque recibe la mitad
const REACTION_EARLY_BONUS=20; // mientras no sepamos la reacción al trigger, probarlo primero tiene sentido
const REACTION_BOOST_DEFAULT=45; // boost genérico si PARK.reactionSystem no especifica uno por valor
const AFTER_LUNCH_BONUS=18;   // boost temporal para descanso/tranquilas después del mediodía
const CLOSING_SOON_BONUS=25;  // últimos ~90 min del día: empuja imperdibles pendientes antes que cerrar
const CLOSING_SOON_WINDOW_MIN=90;
// Los cooldowns deben superar el mayor stack de bonus plausible para
// garantizar que, justo después de saltar/diferir algo, otra cosa gane la
// recomendación en vez de repetir lo mismo.
const DEFERRED_PENALTY=130; // "fila muy larga": penalización temporal (cooldown) — proxy de waitTimeScore
const SKIP_PENALTY=120;     // "saltar por ahora": penalización temporal (cooldown más corto)
const SKIP_COOLDOWN_STEPS=3; // nº de acciones antes de que vuelva a competir con normalidad

/* baseTier(id): prioridad "de catálogo" de una atracción, sin secuencia fija
   — no hay ningún array que imponga un orden dentro de un mismo tier; el
   orden dentro de un tier lo decide el score completo (zona, proximidad,
   afinidad, hora, etc. — ver computeScore). Totalmente data-driven:
   a.priorityTier (obligatorio en la práctica, default 4 = baja), con dos
   ajustes opcionales por contexto:
     - a.waterBoostTier: tier alternativo cuando hace calor y toca agua
       (reemplaza a priorityTier mientras waterBoostActive()).
     - PARK.reactionSystem.tierOverride: baja/sube temporalmente el tier del
       `targetId` de la reacción configurada, según el valor elegido — ver
       parks/story-land.js (Polar → Roar) para el único caso que lo usa hoy;
       un parque sin reactionSystem simplemente no tiene este ajuste. */
function baseTier(id){
  const a=BY_ID[id];
  if(!a)return 4;
  const rs=PARK.reactionSystem;
  if(rs&&rs.targetId===id&&state.reaction&&rs.tierOverride&&rs.tierOverride[state.reaction]!=null){
    return rs.tierOverride[state.reaction];
  }
  if(waterBoostActive()&&a.waterBoostTier!=null)return a.waterBoostTier;
  return a.priorityTier!=null?a.priorityTier:4;
}
function waterBoostActive(){
  let hour=new Date().getHours();
  let pendingMust=MUST.filter(id=>getStatus(id)==='pending'||getStatus(id)==='skipped').length;
  return hour>=13 && pendingMust<=3;
}
/* Cuántas atracciones ya se consideran "hechas" (done o repeat) — se usa
   para saber si todavía estamos en las primeras horas del día. */
function doneTotalCount(){return ALL.filter(a=>['done','repeat'].includes(getStatus(a.id))).length}
/* Después de que ya se resolvieron varios imperdibles y pasado el mediodía,
   las opciones de descanso/tranquilas reciben un empujón temporal — sin
   convertir el almuerzo en una hora fija. */
function afterLunchWindowActive(){
  let mustHandled=MUST.filter(id=>getStatus(id)!=='pending').length;
  let hour=new Date().getHours();
  return mustHandled>=3 && hour>=12;
}
/* Los favoritos para repetir tienen prioridad baja mientras haya mucho
   pendiente, pero ganan relevancia en la última parte del día. */
function isLateDayForFavorites(){
  let hour=new Date().getHours();
  let mustDone=MUST.filter(id=>['done','repeat'].includes(getStatus(id))).length;
  return hour>=15 || (MUST.length&&mustDone>=MUST.length-1);
}
/* closingSoonBonus: cuando PARK.closingTime está configurado (hora oficial
   del día verificada, ver parks/*.js) y quedan CLOSING_SOON_WINDOW_MIN
   minutos o menos para el cierre, los imperdibles pendientes (tier<=1) se
   priorizan para no quedarse sin hacerlos. Sin closingTime, esta función no
   aporta nada (0) — Story Land no lo configura, así que no cambia su
   comportamiento. */
function minutesToClosing(){
  if(!PARK.closingTime)return null;
  const [h,m]=PARK.closingTime.split(':').map(Number);
  const now=new Date();
  const close=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0);
  const diff=(close-now)/60000;
  return diff;
}
function closingSoonActive(){
  const mins=minutesToClosing();
  return mins!=null && mins>0 && mins<=CLOSING_SOON_WINDOW_MIN;
}
function closingSoonBonus(a){
  if(!closingSoonActive())return 0;
  const tier=a.priorityTier!=null?a.priorityTier:4;
  return tier<=1?CLOSING_SOON_BONUS:0;
}
/* Tier "efectivo" usado por el motor de recomendación: igual a baseTier()
   salvo para las atracciones marcadas "repeat", que quedan en un nivel bajo
   (para no forzar la repetición) pero pueden subir mucho al final del día
   o si estamos justo en su zona (via sameZoneBonus/proximityBonus, que se
   aplican igual sobre cualquier tier). */
function effectiveTier(a){
  if(getStatus(a.id)==='repeat')return isLateDayForFavorites()?1.4:3.4;
  return baseTier(a.id);
}
/* ----- cooldown para "fila muy larga" -----
   No calculamos minutos: contamos acciones. Mientras no hayan pasado al
   menos 2 acciones desde que se difirió Y sigamos en la misma zona, la
   atracción recibe DEFERRED_PENALTY y deja de ser la recomendación
   automática — pero sigue en la lista (no desaparece) y se puede "revisar
   la fila" a mano en cualquier momento. */
function deferredInfo(id){return state.deferred&&state.deferred[id]}
function isOnCooldown(id){
  let d=deferredInfo(id);
  if(!d)return false;
  let recDelta=state.recommendationCount-d.atCount;
  let zoneChanged=state.currentZone&&d.zone&&state.currentZone!==d.zone;
  return recDelta<2&&!zoneChanged;
}
/* ----- cooldown para "saltar por ahora" -----
   Igual mecánica que el cooldown de fila larga (por conteo de acciones, no
   minutos), pero sin depender de la zona: saltar no dice nada de por qué,
   así que simplemente deja de ser la recomendación top durante
   SKIP_COOLDOWN_STEPS acciones y después vuelve a competir normal. */
function skippedInfo(id){return state.skipped&&state.skipped[id]}
function isOnSkipCooldown(id){
  let d=skippedInfo(id);
  if(!d)return false;
  return state.recommendationCount-d.atCount<SKIP_COOLDOWN_STEPS;
}
function sameZoneBonus(a){return state.currentZone&&a.zone===state.currentZone?SAME_ZONE_BONUS:0}
function proximityBonus(a){
  let lastId=state.lastCompletedId;
  if(!lastId||!BY_ID[lastId]||!BY_ID[lastId].nearbyAttractions)return 0;
  return BY_ID[lastId].nearbyAttractions.includes(a.id)?PROXIMITY_BONUS:0;
}
function childBonus(a){return CHILD_FAVORITE_IDS.includes(a.id)?CHILD_BONUS:0}
function timeOfDayBonus(a){
  if(!waterBoostActive()||!WATER_IDS.includes(a.id))return 0;
  return a.secondaryWaterBonus?WATER_BONUS_SECONDARY:WATER_BONUS;
}
/* groupEarlyBonus: generaliza el antiguo "bloque de dinosaurios pesa más en
   las primeras horas" a cualquier PARK.priorityGroups configurado (ids +
   earlyBonus + earlyBonusMaxDone) — un parque sin grupos configurados
   simplemente no aporta nada acá. Además, si hay un PARK.reactionSystem
   activo y todavía no se respondió, su `triggerId` recibe un empujón extra
   para probarlo primero (es el que reordena todo lo demás). */
function groupEarlyBonus(a){
  let total=0;
  (PARK.priorityGroups||[]).forEach(g=>{
    if(g.ids.includes(a.id)&&doneTotalCount()<(g.earlyBonusMaxDone!=null?g.earlyBonusMaxDone:3))total+=(g.earlyBonus||0);
  });
  const rs=PARK.reactionSystem;
  if(rs&&a.id===rs.triggerId&&state.reaction==null)total+=(rs.earlyBonus!=null?rs.earlyBonus:REACTION_EARLY_BONUS);
  return total;
}
function reactionBonus(a){
  const rs=PARK.reactionSystem;
  if(!rs||a.id!==rs.targetId||!state.reaction)return 0;
  if(rs.boost&&rs.boost[state.reaction]!=null)return rs.boost[state.reaction];
  return 0;
}
function restBonus(a){
  if(!afterLunchWindowActive())return 0;
  return (a.cat==='descanso'||CALM_IDS.includes(a.id))?AFTER_LUNCH_BONUS:0;
}
function computeScore(a){
  let tier=effectiveTier(a);
  let priorityScore=(5-tier)*TIER_W;
  let deferredPenalty=isOnCooldown(a.id)?DEFERRED_PENALTY:0;
  let skipPenalty=isOnSkipCooldown(a.id)?SKIP_PENALTY:0;
  return priorityScore+sameZoneBonus(a)+proximityBonus(a)+childBonus(a)+timeOfDayBonus(a)
    +groupEarlyBonus(a)+reactionBonus(a)+restBonus(a)+closingSoonBonus(a)
    -deferredPenalty-skipPenalty-adultOnlyPenalty(a);
}
/* candidateList(): TODO lo que no esté "done" ni "closed" — incluye
   "repeat", para que los favoritos puedan volver a competir más adelante en
   vez de desaparecer del todo. "closed" (atracción cerrada — mantenimiento,
   clima, etc.) se excluye igual que "done": no tiene sentido seguir
   recomendándola mientras esté marcada así. A diferencia de "done", closed
   no significa que ya la disfrutaron — por eso no cuenta para
   "Imperdibles: x/N" ni aparece en Favoritas, solo deja de competir.
   Se recalcula por completo en cada llamada: no hay itinerario guardado,
   solo el estado actual de cada atracción. */
function candidateList(){
  return ALL.filter(a=>!['done','closed'].includes(getStatus(a.id)))
    .map(a=>({...a,tier:effectiveTier(a),score:computeScore(a),deferred:isOnCooldown(a.id),skipCooldown:isOnSkipCooldown(a.id)}))
    .sort((a,b)=>b.score-a.score||a._i-b._i);
}
/* candidatePool(): candidateList() ya filtrado por modo tranquilo si está
   activo. Único punto que usan tanto getRecommendation() como
   getAlternatives(), para que la recomendación principal y las alternativas
   salgan siempre del mismo conjunto/orden. */
function candidatePool(){
  let list=candidateList();
  if(state.calmMode){
    let calm=list.filter(a=>CALM_IDS.includes(a.id));
    if(calm.length)return calm;
  }
  return list;
}
function getRecommendation(){
  let list=candidatePool();
  return list.length?list[0]:null;
}
/* Como máximo dos alternativas, calculadas con el mismo motor de scoring —
   nunca una lista larga. */
function getAlternatives(rec){
  if(!rec)return [];
  return candidatePool().filter(a=>a.id!==rec.id).slice(0,2);
}
function whyNow(a){
  let status=getStatus(a.id);
  if(status==='repeat'){
    return state.currentZone&&state.currentZone===a.zone
      ? 'La habían marcado para repetir y están justo en esta zona — buen momento antes de seguir.'
      : 'La habían marcado para repetir y ya casi terminan el plan — vale la pena volver antes de irse.';
  }
  const rs=PARK.reactionSystem;
  if(rs&&state.reaction&&rs.whyMessages&&rs.whyMessages[a.id]&&rs.whyMessages[a.id][state.reaction]){
    return rs.whyMessages[a.id][state.reaction];
  }
  if(status==='later')return `Ya pasó un rato desde que la fila estaba muy larga — vale la pena volver a intentarlo. ${a.why||''}`;
  return a.why||'';
}
/* Razones cortas (máx. 2) que explican por qué se sugiere esto ahora mismo,
   sin convertir la tarjeta en un párrafo largo ni mostrar puntajes. El orden
   de los "if" es la prioridad editorial: lo más específico al contexto
   actual va primero, así slice(0,2) muestra lo más relevante. */
function reasonsFor(a){
  let r=[],status=getStatus(a.id);
  if(status==='repeat')r.push('❤️ La quería repetir.');
  if(status==='later'&&!isOnCooldown(a.id))r.push('🕐 La fila larga anterior ya puede revisarse.');
  if(a.tier<=1&&status==='pending')r.push('🔥 Sigue siendo un imperdible pendiente.');
  if(sameZoneBonus(a))r.push('📍 Ya estás en esta zona.');
  else if(proximityBonus(a))r.push('📍 Está cerca de lo que acabamos de hacer.');
  (PARK.priorityGroups||[]).forEach(g=>{
    if(g.ids.includes(a.id)&&g.ids.some(id=>id!==a.id&&BY_ID[id]&&BY_ID[id].zone===a.zone&&['pending','later'].includes(getStatus(id))))r.push(g.reasonLabel);
  });
  if(timeOfDayBonus(a))r.push('☀️ Buen momento para las atracciones de agua.');
  if(childBonus(a)&&status==='pending')r.push('⭐ Tiene alta probabilidad de gustarle.');
  if(restBonus(a))r.push('😌 Buena opción para descansar.');
  if(closingSoonBonus(a))r.push('⏰ Quedan pocas horas — mejor no dejarla para el final.');
  return r.slice(0,2);
}
/* tipFor(a): el tip por atracción vive directamente en el dato (a.tip) —
   cada parque lo escribe en su park.js. Un reactionSystem activo puede
   sobreescribir el tip del `targetId` según la reacción elegida (ej. "es
   normal parar aquí" solo aplica después de la reacción "ok" a Polar). */
function tipFor(a){
  const rs=PARK.reactionSystem;
  if(rs&&a.id===rs.targetId&&state.reaction&&rs.tip&&rs.tip[state.reaction])return rs.tip[state.reaction];
  return a.tip||null;
}
/* prioLabel(a): recibe un candidato (id + tier + deferred/skipCooldown
   opcionales, como los que produce candidateList()). El estado "repeat" se
   revisa primero porque manda sobre el tier numérico. "closed" también se
   revisa primero, aunque en la práctica solo se llega acá para una cerrada
   desde el detalle del checklist (candidateList() ya la excluye de la
   recomendación) — mostrar su tier numérico ahí sería engañoso, como si
   siguiera compitiendo. */
function prioLabel(a){
  if(getStatus(a.id)==='closed')return {t:'🚫 CERRADA',c:'priolow'};
  if(getStatus(a.id)==='repeat')return {t:'🔁 REPETIR (favorita)',c:'priorepeat'};
  if(a.deferred)return {t:'🕐 EN ESPERA (fila larga)',c:'priomed'};
  if(a.skipCooldown)return {t:'⏭️ SALTADA HACE POCO',c:'priomed'};
  let tier=a.tier;
  if(tier===0)return {t:'MUY ALTA',c:'priohigh'};
  if(tier===1)return {t:'ALTA',c:'priohigh'};
  if(tier===1.5)return {t:'ALTA (buen momento)',c:'priohigh'};
  if(tier===2.4)return {t:'OPCIONAL PARA DESPUÉS',c:'priomed'};
  if(tier===2||tier===2.6)return {t:'MEDIA',c:'priomed'};
  if(tier===2.8)return {t:'OPCIONAL',c:'priolow'};
  return {t:'BAJA',c:'priolow'};
}

/* ---------- Acciones ----------
   tick() avanza el contador que usa el cooldown de "fila muy larga".
   currentZone solo se actualiza con hecho/repetir: son las dos acciones que
   significan "de verdad estuvimos ahí". Saltar o marcar fila larga no mueve
   la zona porque no llegamos a montarnos. */
function tick(){state.recommendationCount=(state.recommendationCount||0)+1}
function actDone(id){
  tick();
  state.currentZone=BY_ID[id].zone;
  state.lastCompletedId=id;
  if(state.deferred)delete state.deferred[id];
  if(state.skipped)delete state.skipped[id];
  setStatus(id,'done');
}
function actSkip(id){
  tick();
  if(!state.skipped)state.skipped={};
  state.skipped[id]={atCount:state.recommendationCount};
  setStatus(id,'skipped');
}
function actRepeat(id){
  tick();
  state.currentZone=BY_ID[id].zone;
  state.lastCompletedId=id;
  if(state.deferred)delete state.deferred[id];
  if(state.skipped)delete state.skipped[id];
  setStatus(id,'repeat');
}
function actLong(id){
  tick();
  if(!state.deferred)state.deferred={};
  state.deferred[id]={atCount:state.recommendationCount,zone:BY_ID[id].zone};
  if(state.skipped)delete state.skipped[id];
  setStatus(id,'later');
}
/* Atracción cerrada (mantenimiento, clima, etc.) — deja de competir por la
   recomendación (candidateList()) sin marcarla como "hecha". Reabrir es
   simétrico a los demás estados: tocar de nuevo el mismo botón (🚫 en el
   checklist, o "🚫 Cerrada" repetido) la vuelve a "pending" — mismo
   mecanismo genérico de cycleStatus(), no hace falta una acción aparte. */
function actClose(id){
  tick();
  if(state.deferred)delete state.deferred[id];
  if(state.skipped)delete state.skipped[id];
  setStatus(id,'closed');
}
function recheckLine(id){
  if(state.deferred)delete state.deferred[id];
  setStatus(id,'pending');
}
function setReaction(v){state.reaction=v;save();renderAll()}
function toggleCalm(){state.calmMode=!state.calmMode;save();renderAll()}
function resetDay(){
  const msg=(PARK.copy&&PARK.copy.resetConfirm)||`¿Borrar todo el progreso del día en ${PARK.name}? Esta acción no se puede deshacer.`;
  if(confirm(msg)){
    localStorage.removeItem(KEY);
    state=loadState();
    renderAll();
  }
}

/* ---------- Tabs ---------- */
function setTab(t){
  state.tab=t;save();
  document.querySelectorAll('.tabpane').forEach(p=>p.classList.remove('on'));
  document.getElementById('tab-'+t).classList.add('on');
  ['ahora','checklist','favoritas','tips'].forEach(n=>document.getElementById('nav'+n[0].toUpperCase()+n.slice(1)).classList.toggle('on',n===t));
  document.getElementById('fabNext').classList.toggle('show',t!=='ahora');
  window.scrollTo(0,0);
}
function goAhora(){setTab('ahora')}

/* ---------- "Próximo show" ----------
   PARK.shows (opcional): funciones/personajes con horario publicado. No
   compiten por la recomendación (son informativos, como los POIs) — solo se
   avisan cuando faltan ≤30 min, como un banner más. Un parque sin `shows`
   configurado simplemente no muestra nada acá (Story Land no los usa). */
const SHOW_SOON_WINDOW_MIN=30;
function parseTimeToday(hhmm){
  const [h,m]=hhmm.split(':').map(Number);
  const now=new Date();
  return new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0);
}
function nextShowSoon(){
  const shows=PARK.shows||[];
  const now=new Date();
  let best=null;
  shows.forEach(sh=>(sh.times||[]).forEach(t=>{
    const dt=parseTimeToday(t);
    const diffMin=(dt-now)/60000;
    if(diffMin>=0&&diffMin<=SHOW_SOON_WINDOW_MIN&&(!best||diffMin<best.diffMin))best={show:sh,time:t,diffMin};
  }));
  return best;
}
function showSoonBannerHtml(){
  const next=nextShowSoon();
  if(!next)return '';
  const mins=Math.round(next.diffMin);
  return `<div class="banner water"><b>🎭 ${next.show.name} empieza pronto</b>${next.time} · ${next.show.zone||''} — en ~${mins} min.</div>`;
}

/* ---------- Render: Ahora ---------- */
function renderAhora(){
  let el=document.getElementById('tab-ahora');
  let html='';

  // pregunta de reacción (opcional, ver PARK.reactionSystem)
  const rs=PARK.reactionSystem;
  if(rs&&getStatus(rs.triggerId)==='done'&&state.reaction===null){
    html+=`<div class="reactcard"><div style="font-size:2rem">${rs.promptEmoji||'❓'}</div><h2>${rs.promptTitle}</h2><p>${rs.promptSubtitle||''}</p><div class="reactopts">
    ${rs.options.map(o=>`<button onclick="setReaction('${o.value}')">${o.label}</button>`).join('')}
    </div></div>`;
    el.innerHTML=html+calmToggleHtml()+extraSectionsHtml();
    return;
  }

  // banners contextuales
  let mustHandled=MUST.filter(id=>getStatus(id)!=='pending').length;
  let hour=new Date().getHours();
  if(mustHandled>=3&&hour>=11&&hour<15&&MUST.length){
    html+=`<div class="banner lunch"><b>🍽️ Buen momento para una pausa</b>Recuerden: almuerzo, baño, agua y protector solar.${PARK.copy&&PARK.copy.lunchTip?`<ul><li>${PARK.copy.lunchTip}</li></ul>`:''}</div>`;
  }
  let waterPending=WATER_IDS.some(id=>{let s=getStatus(id);return s==='pending'||s==='skipped'||s==='later'});
  if(waterBoostActive()&&waterPending){
    html+=`<div class="banner water"><b>💦 Ahora conviene mojarse</b>Es buen momento para las atracciones de agua.<ul><li>👕 ¿Tenemos muda de ropa?</li></ul></div>`;
  }
  html+=showSoonBannerHtml();
  if(state.calmMode){
    html+=`<div class="banner calmnotice"><span>😴 Modo tranquilo activado</span><button onclick="toggleCalm()" style="background:#5b3ea8;color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:900">🔥 Volver al plan</button></div>`;
  }

  let rec=getRecommendation();
  // Aviso de "no abandonar la zona": si lo que se sugiere ahora NO es la
  // atracción diferida por fila larga, pero esa atracción sigue en la misma
  // zona en la que estamos, ofrecemos revisarla en vez de recomendarla en
  // bucle automáticamente.
  if(state.currentZone&&state.deferred){
    let stuck=Object.keys(state.deferred).map(id=>BY_ID[id]).find(a=>a&&a.zone===state.currentZone&&getStatus(a.id)==='later'&&(!rec||rec.id!==a.id));
    if(stuck){
      html+=`<div class="banner zonehint"><span>📍 ${stuck.name} sigue pendiente en esta zona. ¿Revisamos la fila antes de movernos?</span><button onclick="recheckLine('${stuck.id}')">🔁 Revisar fila</button></div>`;
    }
  }
  // "Cierre de zona": si la recomendación nos manda a otra zona, avisar (sin
  // bloquear) si queda algo importante aquí — imperdible pendiente,
  // favorita del niño, o favorita para repetir. Las "later" ya las cubre el
  // banner de arriba, así que no se duplican aquí.
  let zoneClose=zoneCloseCandidate(rec);
  if(zoneClose){
    html+=`<div class="banner zoneclose"><b>📍 Antes de movernos</b>Todavía queda <b>${zoneClose.name}</b> en esta zona (${zoneClose.zone}).</div>`;
  }
  if(!rec){
    const doneTitle=(PARK.copy&&PARK.copy.doneTitle)||`¡Completaron el plan de ${PARK.name}!`;
    const doneBody=(PARK.copy&&PARK.copy.doneBody)||'Ya hicieron todo lo importante. Si quieren, repitan alguna favorita antes de irse.';
    html+=`<div class="donebig"><div class="emoji">🎉</div><h2>${doneTitle}</h2><p>${doneBody}</p></div>`;
  }else{
    let prio=prioLabel(rec);
    let tags=rec.tags.map(t=>`<span class="tag ${t.includes('IMPERDIBLE')||t.includes('INTENSA')?'hot':t.includes('RECOMENDADA')?'star':''}">${t}</span>`).join('');
    let tip=tipFor(rec);
    let reasons=reasonsFor(rec);
    html+=`<div class="nowcard">
      <span class="kicker">⭐ AHORA</span>
      <h2>${rec.name}</h2>
      <div class="zonebadge">${zoneLine(rec)}</div>
      ${mapOrientationHtml(rec)}
      <div class="tagrow">${tags}</div>
      ${reasons.length?`<div class="reasonrow">${reasons.map(r=>`<span class="reasonchip">${r}</span>`).join('')}</div>`:''}
      <div class="whybox"><b>🎯 Por qué ahora:</b> ${whyNow(rec)}</div>
      ${eligibilityFactHtml(rec)}
      <div class="factrow">
        <div class="fact">🔥 Prioridad<b class="${prio.c}">${prio.t}</b></div>
        <div class="fact">📂 Categoría<b>${catLabel(rec.cat)}</b></div>
      </div>
      ${tip?`<div class="tipline">${tip}</div>`:''}
      <div class="actionsgrid">
        <button class="actbtn done" onclick="actDone('${rec.id}')">✅ HECHO</button>
        <button class="actbtn skip" onclick="actSkip('${rec.id}')">⏭️ SALTAR POR AHORA</button>
        <button class="actbtn repeat" onclick="actRepeat('${rec.id}')">❤️ QUIERE REPETIR</button>
        <button class="actbtn long" onclick="actLong('${rec.id}')">👥 FILA MUY LARGA</button>
        <button class="actbtn closed" onclick="actClose('${rec.id}')">🚫 CERRADA</button>
        <button class="actbtn map" onclick="openParkMap('${rec.id}')">🗺️ VER PARK MAP OFICIAL</button>
      </div>
    </div>`;
    html+=alternativesHtml(rec);
  }

  html+=calmToggleHtml();
  html+=extraSectionsHtml();
  el.innerHTML=html;
}
/* Qué queda "importante" en la zona actual antes de mandarnos a otra. No
   bloquea nada — solo informa; la familia decide si lo ignora. */
function zoneCloseCandidate(rec){
  if(!state.currentZone)return null;
  if(rec&&rec.zone===state.currentZone)return null; // ya nos quedamos en la zona, no hace falta avisar
  return ALL.find(a=>{
    if(a.zone!==state.currentZone)return false;
    let s=getStatus(a.id);
    if(s==='done'||s==='later')return false; // "later" ya lo cubre el banner de fila larga
    if(s==='repeat')return true;
    if(s!=='pending')return false;
    return MUST.includes(a.id)||CHILD_FAVORITE_IDS.includes(a.id);
  })||null;
}
/* Máximo dos alternativas, mismo motor de scoring que la recomendación
   principal, con acciones rápidas para no obligar a buscarlas en el
   checklist. */
function alternativesHtml(rec){
  let alts=getAlternatives(rec);
  if(!alts.length)return '';
  return `<div class="miniSectTitle alts">Si prefieren otra cosa</div><div class="altgrid">${alts.map(alt=>{
    let reasons=reasonsFor(alt);
    return `<div class="altcard">
      <div class="altname">${alt.name}</div>
      <div class="altmeta">${zoneLine(alt)}</div>
      ${reasons.length?`<div class="reasonrow">${reasons.map(r=>`<span class="reasonchip">${r}</span>`).join('')}</div>`:''}
      <div class="altbtns">
        <button onclick="actDone('${alt.id}')">✅ Hecho</button>
        <button onclick="actSkip('${alt.id}')">⏭️ Saltar</button>
        <button onclick="openParkMap('${alt.id}')">🗺️ Mapa</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}
function catLabel(c){const f=CATS.find(x=>x[0]===c);return f?f[1]:c}
function calmToggleHtml(){
  return `<button class="calmtoggle ${state.calmMode?'active':''}" onclick="toggleCalm()">${state.calmMode?'🔥 Volver al plan normal':'😴 Necesitamos algo tranquilo'}</button>`;
}
function extraSectionsHtml(){
  let html='';
  let repeats=ALL.filter(a=>getStatus(a.id)==='repeat');
  if(repeats.length){
    html+=`<div class="miniSectTitle">❤️ Repetir antes de irnos</div><div class="minilist">${repeats.map(a=>`<div class="miniitem"><span>${a.name}</span><span class="pill">❤️ favorita</span></div>`).join('')}</div>`;
  }
  let recentlySkipped=ALL.filter(a=>getStatus(a.id)==='skipped'&&isOnSkipCooldown(a.id));
  if(recentlySkipped.length){
    html+=`<div class="miniSectTitle">⏭️ Saltadas por ahora</div><div class="minilist">${recentlySkipped.map(a=>`<div class="miniitem"><span>${a.name}<small>La volveremos a sugerir en un rato.</small></span><span class="pill">⏭️</span></div>`).join('')}</div>`;
  }
  let laters=ALL.filter(a=>getStatus(a.id)==='later');
  const rs=PARK.reactionSystem;
  let optionalTarget=rs&&state.reaction&&rs.optionalNoteValues&&rs.optionalNoteValues.includes(state.reaction)&&BY_ID[rs.targetId]&&getStatus(rs.targetId)==='pending'?BY_ID[rs.targetId]:null;
  if(laters.length||optionalTarget){
    html+=`<div class="miniSectTitle">🕐 Pendientes de volver / opcional</div><div class="minilist">`;
    laters.forEach(a=>html+=`<div class="miniitem"><span>${a.name}<small>Fila muy larga — la volveremos a sugerir más tarde.</small></span><span class="pill">🕐</span></div>`);
    if(optionalTarget)html+=`<div class="miniitem"><span>${optionalTarget.name}<small>Opcional para después — no insistimos por ahora.</small></span><span class="pill">Opcional</span></div>`;
    html+='</div>';
  }
  let closed=ALL.filter(a=>getStatus(a.id)==='closed');
  if(closed.length){
    html+=`<div class="miniSectTitle">🚫 Cerradas</div><div class="minilist">${closed.map(a=>`<div class="miniitem"><span>${a.name}<small>No la sugerimos mientras esté cerrada. Tocá 🚫 de nuevo en el checklist si reabre.</small></span><span class="pill">🚫</span></div>`).join('')}</div>`;
  }
  return html;
}

/* ---------- Render: Checklist ----------
   expandedItems: qué tarjetas del checklist están abiertas mostrando
   detalle. Es solo estado de UI (no se guarda en localStorage) — se
   reinicia si se recarga la página, igual que cualquier acordeón. */
const expandedItems=new Set();
function toggleExpand(id){
  if(expandedItems.has(id))expandedItems.delete(id);else expandedItems.add(id);
  renderChecklist();
}
function cycleStatus(id,val){
  if(getStatus(id)===val){ // tocar de nuevo el mismo botón = volver a pendiente
    if(state.deferred)delete state.deferred[id];
    if(state.skipped)delete state.skipped[id];
    setStatus(id,'pending');
    return;
  }
  if(val==='done')actDone(id);
  else if(val==='later')actLong(id);
  else if(val==='repeat')actRepeat(id);
  else if(val==='skipped')actSkip(id);
  else if(val==='closed')actClose(id);
}
function renderChecklist(){
  let el=document.getElementById('tab-checklist');
  let html='<div class="miniSectTitle">☑️ Checklist por categoría</div>';
  CATS.forEach(([cat,label])=>{
    let items=ALL.filter(a=>a.cat===cat);
    if(!items.length)return;
    html+=`<div class="catblock"><h3>${label}</h3>`;
    items.forEach(a=>{
      let s=getStatus(a.id);
      let stLabel={pending:'⬜ Pendiente',done:'✅ Hecho',skipped:'⏭️ Saltado',later:'🕐 Volver después',repeat:'❤️ Repetir',closed:'🚫 Cerrada'}[s];
      let open=expandedItems.has(a.id);
      // Mismo tipo de detalle que la tarjeta "Ahora" (por qué + prioridad +
      // tip), pero sin los datos que solo tienen sentido para "lo próximo a
      // hacer ahora mismo" (razones de zona/proximidad, botones de acción).
      let prio=prioLabel({id:a.id,tier:baseTier(a.id),deferred:isOnCooldown(a.id),skipCooldown:isOnSkipCooldown(a.id)});
      let tip=tipFor(a);
      html+=`<div class="item">
      <div class="top2" role="button" tabindex="0" aria-expanded="${open}" onclick="toggleExpand('${a.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleExpand('${a.id}')}">
        <h4><span class="expandicon">${open?'▾':'▸'}</span>${a.name}</h4>
        <span class="statusChip st-${s}">${stLabel}</span>
      </div>
      <div class="itemzone"><span>${zoneLine(a)}</span><button class="zonemapbtn" onclick="event.stopPropagation();openParkMap('${a.id}')">🗺️ Ver mapa</button></div>
      <div class="tagrow">${(a.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      ${open?`<div class="expandbox">
        ${mapOrientationHtml(a)}
        <div class="whybox"><b>🎯 Por qué:</b> ${a.why||''}</div>
        ${eligibilityFactHtml(a)}
        <div class="factrow">
          <div class="fact">🔥 Prioridad<b class="${prio.c}">${prio.t}</b></div>
        </div>
        ${tip?`<div class="tipline">${tip}</div>`:''}
      </div>`:''}
      <div class="itembtns">
        <button class="${s==='done'?'active':''}" title="Hecho" onclick="event.stopPropagation();cycleStatus('${a.id}','done')">✅</button>
        <button class="${s==='skipped'?'active':''}" title="Saltar" onclick="event.stopPropagation();cycleStatus('${a.id}','skipped')">⏭️</button>
        <button class="${s==='later'?'active':''}" title="Fila muy larga / volver después" onclick="event.stopPropagation();cycleStatus('${a.id}','later')">🕐</button>
        <button class="${s==='repeat'?'active':''}" title="Quiere repetir" onclick="event.stopPropagation();cycleStatus('${a.id}','repeat')">❤️</button>
        <button class="${s==='closed'?'active':''}" title="Cerrada (tocar de nuevo para reabrir)" onclick="event.stopPropagation();cycleStatus('${a.id}','closed')">🚫</button>
      </div></div>`;
    });
    html+='</div>';
  });
  el.innerHTML=html;
}

/* ---------- Render: Favoritas ---------- */
function renderFavoritas(){
  let el=document.getElementById('tab-favoritas');
  let repeats=ALL.filter(a=>getStatus(a.id)==='repeat');
  if(!repeats.length){
    el.innerHTML=`<div class="favempty"><span class="emoji">❤️</span>Aún no han marcado ninguna atracción para repetir.<br>Cuando algo le encante, toca <b>❤️ QUIERE REPETIR</b>.</div>`;
    return;
  }
  el.innerHTML=`<div class="miniSectTitle">❤️ Quiere repetir</div><div class="minilist">${repeats.map(a=>`<div class="miniitem"><span>${a.name}<small>${catLabel(a.cat)}</small></span><button class="zonemapbtn" onclick="openParkMap('${a.id}')">🗺️ Ver mapa</button><span class="pill">❤️</span></div>`).join('')}</div>`;
}

/* ---------- Render: Servicios (restaurantes/baños/primeros auxilios/etc.) ----------
   POIS (PARK.pois) nunca compite por la recomendación — es puramente
   informativo, igual que en Story Land. Agrupado por tipo con su propio
   ícono/etiqueta; un parque puede traer tipos que otro no usa. */
const POI_TYPE_LABEL={food:'🍴 Comida',restroom:'🚻 Baños',firstaid:'🩹 First Aid',
  familycare:'👶 Family Care',locker:'🔒 Lockers',water:'🚰 Estaciones de agua',playground:'🛝 Playgrounds',show:'🎭 Shows',
  character:'👋 Personajes',store:'🛍️ Tiendas',entrance:'🚪 Entradas',parking:'🅿️ Estacionamiento',
  ev:'🔌 Carga EV'};
function poiCardHtml(p){
  const near=p.nearbyText?`<small>${p.nearbyText}</small>`:'';
  const mapBtn=p.geo?`<button class="zonemapbtn" onclick="openParkMap('${p.id}')">🗺️ Ver mapa</button>`:'';
  return `<div class="miniitem"><span>${p.icon||'📍'} ${p.name}${p.zone?` — ${p.zone}`:''}${near}</span>${mapBtn}</div>`;
}
function servicesHtml(){
  // Plegado dentro de la pestaña Tips (no una 5ª pestaña) para no tocar el
  // bottom-nav de 4 botones que ya usa Story Land — un parque con más
  // servicios (restaurantes, First Aid, lockers, EV...) simplemente agrega
  // más bloques acá, mismo lugar que ya usaban las Restrooms de Story Land.
  if(!POIS.length)return '';
  let html='<div class="miniSectTitle">🧭 Servicios del parque</div>';
  const types=[...new Set(POIS.map(p=>p.type))];
  types.forEach(t=>{
    const items=POIS.filter(p=>p.type===t);
    html+=`<div class="miniSectTitle">${POI_TYPE_LABEL[t]||t}</div><div class="minilist">${items.map(poiCardHtml).join('')}</div>`;
  });
  return html;
}

/* ---------- Render: Tips + Mapa ---------- */
function mapBlockHtml(){
  // Zona a mostrar: la última completada; si todavía no hay nada hecho,
  // usamos la zona de la recomendación actual como referencia inicial.
  let rec=getRecommendation();
  let zone=state.currentZone||(rec&&rec.zone)||null;
  let guide='';
  if(zone){
    let pending=ALL.filter(a=>a.zone===zone&&!['done','repeat'].includes(getStatus(a.id)));
    guide=`<div class="zoneguide"><b>${state.currentZone?'Zona actual':'Próxima zona sugerida'}</b>${zone}
      ${pending.length?`<div style="margin-top:6px">Pendientes aquí:</div><ul>${pending.map(a=>`<li>${a.name}${getStatus(a.id)==='later'?' · 🕐 fila larga':''}</li>`).join('')}</ul>`:'<div style="margin-top:6px">No queda nada pendiente en esta zona 🎉</div>'}
    </div>`;
  }else{
    guide=`<div class="zoneguide">Todavía no han completado ninguna atracción — el mapa oficial les ayuda a ubicar la primera zona.</div>`;
  }
  const mapNote=(PARK.copy&&PARK.copy.mapNote)||`El mapa oficial de ${PARK.name} nos ayuda a ubicarnos físicamente (zona / número). Nuestra app sigue decidiendo qué conviene hacer ahora.`;
  return `<div class="mapblock">
    <div class="miniSectTitle" style="margin-top:0">🗺️ Park Map</div>
    <button class="mapbig" onclick="openParkMap()">🗺️ ABRIR PARK MAP OFICIAL</button>
    <button class="mapbig geo" onclick="openParkGeoMap()">📍 MAPA GEOGRÁFICO DEL PARQUE</button>
    <p class="mapnote">${mapNote}</p>
    ${guide}
    <button class="restroombtn" onclick="openRestroomFinder()">🚻 ¿Dónde hay un baño?</button>
  </div>`;
}
function renderTips(){
  let el=document.getElementById('tab-tips');
  const tips=PARK.tips||[];
  el.innerHTML=mapBlockHtml()+servicesHtml()+(tips.length?`<div class="miniSectTitle">ℹ️ Tips rápidos</div><div class="tipsList">${tips.map(t=>`<div class="tipitem"><span class="ic">${t[0]}</span><span>${t[1]}</span></div>`).join('')}</div>`:'')+`<button class="resetbtn" onclick="resetDay()">🔄 Resetear día</button>`;
}

/* ---------- Progreso ---------- */
function renderProgress(){
  let doneTotal=ALL.filter(a=>{let s=getStatus(a.id);return s==='done'||s==='repeat'}).length;
  let pct=ALL.length?Math.round(doneTotal/ALL.length*100):0;
  document.getElementById('progTxt').textContent=`${doneTotal} de ${ALL.length} realizadas · ${pct}%`;
  document.getElementById('progBar').style.width=pct+'%';
  let mustDone=MUST.filter(id=>{let s=getStatus(id);return s==='done'||s==='repeat'}).length;
  let repeatsPending=ALL.filter(a=>getStatus(a.id)==='repeat').length;
  document.getElementById('mustTxt').textContent=`🔥 Imperdibles: ${mustDone}/${MUST.length}`+(repeatsPending?` · ❤️ ${repeatsPending}`:'');
}

/* ---------- Render total ---------- */
function renderAll(){
  renderProgress();
  renderAhora();
  renderChecklist();
  renderFavoritas();
  renderTips();
}

/* ---------- Arranque ---------- */
applyParkTheme();
setTab(state.tab||'ahora');
renderAll();
