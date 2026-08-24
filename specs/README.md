# specs/

## Contexto interno (privado)

Este es el índice de toda la documentación técnica/de arquitectura/de diseño del proyecto. Antes vivía como un único documento monolítico (`SPECIFICATIONS.md.asc`); desde el 24 de agosto de 2026 está dividida en documentos temáticos más pequeños y mantenibles bajo `architecture/`, `product/` y `operations/`. `SPECIFICATIONS.md.asc` ya no es necesario para entender el sistema — ver "El monolito anterior" más abajo.

Este archivo (`specs/README.md`) **no está cifrado a propósito** — no contiene información sensible ni datos de negocio/familia, solo un mapa de qué documento cubre qué tema. Todo lo demás bajo `specs/` está cifrado (`.md.asc`), con el mismo esquema y la misma contraseña que `HANDOVER.md.asc` (raíz del repo).

## Índice de documentos

| Documento | Cubre |
|---|---|
| `architecture/theme-park-core.md.asc` | Objetivo del motor genérico, prohibición de leakage específico de parque, progressive degradation, separación core/`PARK`, reglas de extensibilidad, historial resumido de la evolución del motor |
| `architecture/park-contract.md.asc` | El contrato completo `window.PARK` — campos, semántica Required/Optional/Derived, matriz de capacidades, contrato de tipos de POI |
| `architecture/recommendation-engine.md.asc` | Algoritmo de scoring, hard constraints vs. soft signals, prioridad, cooldowns, registro de razones, determinismo |
| `architecture/geolocation-and-maps.md.asc` | `geo` vs. `mapMarker`, GPS, mapa ilustrado + mapa geográfico (Leaflet), `geoCalibration`, niveles de confianza, Plus Codes (metodología), proximidad |
| `architecture/family-and-eligibility.md.asc` | `PARK.family`, reglas de `restrictions`, elegibilidad por niño, "niños inelegibles ≠ familia inelegible", evolución futura a `family.members` |
| `architecture/observations-and-state.md.asc` | Estados por atracción, observación de tiempo de espera, estado efímero vs. conocimiento durable |
| `product/theme-park-companion-ux.md.asc` | Comportamiento visible del Theme Park Companion: pestañas, tarjeta "Ahora", checklist, favoritas, servicios, UX del mapa, vocabulario de íconos |
| `product/itinerary-app.md.asc` | Especificaciones generales del sitio no específicas del Theme Park Companion: arquitectura de `index.html`/`data.js`, convenciones de repo, guardrails de contenido, checklist de publicación, privacidad, capa de autenticación |
| `operations/new-park-checklist.md.asc` | Guía práctica paso a paso para agregar un parque nuevo |
| `operations/testing-and-validation.md.asc` | El fixture mínimo de prueba, el test automatizado, la regla de regresión, Definición de Terminado |
| `operations/data-provenance.md.asc` | Procedencia concreta de los datos geográficos de Story Land y LEGOLAND New York — historial de mediciones, tablas de residuales/LOO, reglas de promoción de una observación a dato durable |

## Reglas para futuros agentes

- **Cada tema tiene una sola fuente canónica.** Un documento puede referenciar la regla completa de otro (`"ver architecture/geolocation-and-maps.md.asc"`), pero nunca debe copiar un bloque normativo completo que pueda divergir con el tiempo. Si al editar encuentras la misma regla escrita en dos lugares, es una señal de que algo se duplicó por error — consolidar en el documento canónico y dejar solo una referencia en el otro.
- **Actualizar sin introducir contradicciones.** Si una decisión nueva reemplaza a una anterior, actualizar el documento canónico correspondiente en el momento — no dejar la regla vieja "por si acaso" junto a la nueva. Si hay valor histórico en explicar la evolución (por qué se decidió así antes y qué cambió), eso vive en el historial/changelog del documento correspondiente (`architecture/theme-park-core.md.asc` para la evolución del motor genérico, `operations/data-provenance.md.asc` para el historial de datos geográficos concretos) — nunca como dos reglas activas contradictorias en el cuerpo principal de un documento.
- **`.md.asc` = cifrado.** Todo archivo con esa extensión bajo `specs/` está cifrado con GPG simétrico (AES-256, ASCII-armored), misma contraseña que `HANDOVER.md.asc`. No vive en texto plano en el repositorio.
- **Ninguno de estos documentos debe descifrarse ni editarse sin antes preguntarle al usuario si quiere hacerlo ahora o prefiere saltarlo (skip) por esa sesión** — mismo guardrail que ya aplicaba al monolito `SPECIFICATIONS.md.asc` y que sigue aplicando a `HANDOVER.md.asc`. El agente no tiene la contraseña, no debe intentar adivinarla ni reutilizarla de otro contexto, y pedirla implica que el usuario la pegue en el chat (queda en el historial de esa conversación). Si el usuario decide saltarlo, la tarea en curso continúa igual y el agente debe mencionar en su resumen qué quedó pendiente de registrar, para que no se pierda silenciosamente.
- **`CLAUDE.md` (raíz, sin cifrar)** sigue siendo la guía técnica pública para agentes de código, con la regla de enrutamiento entre "qué decidimos para el viaje" (`HANDOVER.md.asc`) y "cómo debe construirse/comportarse el sitio" (esta carpeta). Documentación de arquitectura/diseño/guardrails técnicos nueva va bajo `specs/`, nunca directamente en `CLAUDE.md` — `CLAUDE.md` puede resumir/enlazar, no duplicar.
- **No fragmentar en exceso.** Antes de crear un documento nuevo bajo `architecture/`/`product/`/`operations/`, confirmar que el tema no cabe razonablemente en uno existente. La estructura actual está organizada por responsabilidad/capacidad, no por parque — no crear archivos específicos de un parque real salvo que haya una razón documental fuerte (hoy no la hay: toda la generalización multi-parque vive en `architecture/`, y los datos concretos de cada parque real viven en su propio `parks/*.js`, no en `specs/`).

## Para actualizar cualquier `.md.asc` de esta carpeta

```bash
gpg --batch --yes --passphrase "<contraseña>" --output specs/<ruta>/<archivo>.md --decrypt specs/<ruta>/<archivo>.md.asc
# editar specs/<ruta>/<archivo>.md
gpg --batch --yes --symmetric --cipher-algo AES256 --armor --passphrase "<contraseña>" -o specs/<ruta>/<archivo>.md.asc specs/<ruta>/<archivo>.md
shred -u specs/<ruta>/<archivo>.md   # o `rm -f` si shred no está disponible
```

GPG pedirá la contraseña de forma interactiva si se omite `--batch --passphrase`. Antes de terminar cualquier sesión de edición: verificar que el `.md` sin cifrar fue borrado del disco (`git status` no debe mostrar ningún `.md` de esta carpeta sin su versión `.asc` correspondiente), y verificar el roundtrip descifrando de nuevo a un archivo temporal.

**Pista de contraseña (solo para el propietario):** es la misma que la del wifi de casa.

## El monolito anterior (`SPECIFICATIONS.md.asc`, en la raíz de `specs/`)

Existió entre el 19 y el 24 de agosto de 2026 como el único documento de especificaciones técnicas. Se dividió en la estructura de arriba el 24 de agosto de 2026 sin pérdida de información normativa — cada sección del monolito quedó representada en uno o más de los documentos temáticos listados arriba. El archivo se conserva como un stub corto que apunta acá, en vez de eliminarse, para que cualquier referencia externa antigua a `specs/SPECIFICATIONS.md.asc` siga resolviendo a algo legible en vez de a un archivo inexistente.

## Documento hermano

`HANDOVER.md.asc` (raíz del repo) — decisiones de negocio/viaje, cifrado con la misma contraseña. Esta carpeta cubre "cómo debe construirse y comportarse el sitio"; `HANDOVER.md.asc` cubre "qué decidió la familia para el viaje". Ver la regla de enrutamiento completa en `CLAUDE.md`.
