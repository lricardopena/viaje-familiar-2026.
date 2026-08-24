# T2.E — Seguridad, privacidad y hardening

**Skill:** `agentic-skills/skills/coding-security-and-hardening` + lente de `/security-review` · **Alcance:** `auth.js`, `auth.css`, `tools/generate-auth-verifier.html`, `localStorage` en el core, geolocalización, `data.js`, `parks/*.js`.

## 1. Fuga de ubicación residencial: ✅ sin hallazgos

Búsqueda de direcciones/coordenadas residenciales y verificación de la convención `"Home"`:
- `data.js` usa la etiqueta literal `"Home"` — 10 ocurrencias, incluida en URLs de Maps (`data.js:1-5` documenta la regla en un comentario de cabecera del propio archivo).
- Todas las coordenadas numéricas encontradas en `parks/*.js` corresponden a LEGOLAND New York (Goshen, NY, ~41.38,-74.31) y Story Land (NH, ~44.12,-71.18) — geográficamente consistentes con parques públicos, no con una residencia.
- No se encontró ninguna dirección, Plus Code o Place ID fuera de contexto de parque/hotel/actividad publicada.

**Convención respetada correctamente en todo el repo auditado.**

## 2. Modelo de amenaza real de `auth.js`: ✅ ya está bien documentado

A diferencia de lo que el plan anticipaba como riesgo (que el código sugiriera más garantía de la que da), `auth.js` **se auto-documenta con precisión** en su propio docblock (`auth.js:1-27`):

> "NO es seguridad fuerte (sitio 100% estático, sin backend): solo eleva el costo de un vistazo casual, no de un ataque dirigido."

Lo verifica el código: PBKDF2-SHA256 con 400,000 iteraciones (`auth.js:38`) contra un verifier público — protege contra fuerza bruta offline del verifier filtrado, pero el verifier y el salt están en el propio JS servido públicamente (`auth.js:39-40`), así que cualquiera con acceso al código fuente del sitio (que es exactamente cualquiera que visita la URL) puede intentar crackear el verifier offline sin límite de intentos. Esto es coherente con el modelo de amenaza declarado ("vistazo casual"), no una garantía rota.

**No se eleva a P1** porque el propio código y sus comentarios dejan claro el límite — no hay expectativa falsa que corregir. Es una nota positiva, no un hallazgo.

Único matiz: el "kill switch" (`AUTH_CONFIG.enabled=false`, `auth.js:47`) está documentado como forma de retirar el gate después del viaje, pero es un cambio de código commiteado, no una fecha de expiración automática — si nadie lo desactiva manualmente después del viaje, el gate persiste indefinidamente. No es un riesgo de seguridad (el gate es benigno incluso si se olvida), pero si el objetivo es "solo durante el viaje", vale una nota operativa. **P3.**

## 3. Secretos y hashes débiles: ✅ sin hallazgos
No se encontraron tokens, API keys ni secretos de servicios externos en ningún archivo auditado. `salt`/`verifier` en `auth.js` son, por diseño, seguros de publicar (ver arriba).

## 4. Datos de los niños (`family.children`): revisar alcance
`parks/legoland-new-york.js:439` contiene `family:{children:[{name, ageYears, heightIn, heightApprox}]}` — nombres reales, edades y estaturas de los hijos, en un repo que (según `README.md`) es **privado**. Esto es exactamente el uso previsto por el contrato (`family-and-eligibility.md.asc`), y el repo está protegido por `auth.js` para el acceso público al sitio desplegado — pero el repositorio de GitHub en sí es una superficie de exposición aparte del sitio desplegado.

**P2** — no es una fuga nueva ni un error, es una decisión de diseño ya tomada (guardar datos de elegibilidad de los niños en texto plano en un repo privado), pero vale la pena que quede confirmada explícitamente como decisión aceptada en `HANDOVER.md.asc` si no lo está ya — este agente no puede verificarlo (regla del plan: `HANDOVER.md.asc` no se descifra). Se anota en "Pendiente de registrar" del reporte final.

## 5. `innerHTML`/`insertAdjacentHTML`: bajo riesgo, confirmado
`index.html` (2 usos) y `assets/theme-park-core.js` (11 usos) usan inyección de HTML, pero **todo el contenido inyectado proviene de `TRIP_DATA`/`window.PARK`**, datos propios del repo, nunca de input de usuario ni de una API externa en runtime. No hay superficie de XSS realista con el estado actual del código — el sitio no acepta ningún input libre de texto que se refleje en el DOM. **Sin hallazgo.**

## Resumen de hallazgos de este eje
- P2 — confirmar que guardar datos reales de los niños en `parks/legoland-new-york.js` (repo privado) es una decisión aceptada, no un descuido (ver "Pendiente de registrar").
- P3 — el kill switch de `auth.js` requiere acción manual post-viaje; no es un riesgo, es una nota operativa.
