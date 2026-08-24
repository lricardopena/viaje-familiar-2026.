# Reporte de auditoría técnica — viaje-familiar-2026

**Fecha:** 2026-08-24 · **Alcance:** read-only, todo el repo · **Rama:** `claude/agentic-skill-audit-gubpxq`

> **Actualización 2026-08-24 (post-auditoría):** H1 y H2, los dos únicos P1, y H3 (P2)
> quedaron resueltos a petición del usuario tras entregar este reporte (commits
> "TICKET-1", "TICKET-2" y "TICKET-3"). Además, a petición explícita del usuario, se
> implementó un Third Park Contract Test explícito (verificación estática de
> ausencia de lógica específica de parque + degradación progresiva completa de
> `reactionSystem`/`shows` + negative contract test) — ver "TICKET-6" en
> `audits/04-tickets.md`, no derivado de un hallazgo original de esta auditoría sino
> de un encargo posterior que fortalece directamente el veredicto sobre un tercer
> parque de este reporte. El resto de este documento se dejó tal cual se entregó
> originalmente para conservar el registro de lo que encontró la auditoría — ver
> `audits/03-hallazgos-consolidados.md` para el detalle de la resolución.

## Resumen ejecutivo

El repo está en buen estado general. El eje más frágil no es el código de producto sino el **tooling de tests**: la única suite del repo no corre en un checkout limpio (versión de Playwright sin lockfile commiteado) y, aun cuando corra, nunca ejerció los dos parques reales (Story Land/LEGOLAND), sólo un fixture sintético. El itinerario (`index.html`+`data.js`), que es la parte que se usa todos los días del viaje, no tiene ningún test. En privacidad y seguridad no se encontró ninguna fuga: la convención `"Home"` se respeta en todo el repo, y `auth.js` documenta con precisión su propio límite ("eleva el costo de un vistazo casual, no de un ataque dirigido") sin prometer más de lo que da. La frontera arquitectónica entre el motor genérico del Theme Park Companion y los datos de cada parque está limpia — cero leakage de nombres/ids de parque fuera de comentarios, contrato `window.PARK` cumplido por ambos parques reales. No se encontró sobre-ingeniería real; el único problema de tamaño es que `theme-park-core.js` (2518 líneas) ya no tiene estructura interna proporcional a su tamaño.

**Los 3 riesgos que importan:** (1) `npm test` no corre hoy en un checkout limpio — H1; (2) ningún test cubre a Story Land/LEGOLAND reales pese a que la spec lo exige — H2; (3) el itinerario diario no tiene ningún test — H3.

**Veredicto sobre un tercer parque:** arquitectónicamente sí (frontera core/parque limpia, contrato cumplido, degradación progresiva verificada en producción real con dos parques que usan combinaciones distintas de campos opcionales). Sin red de seguridad automatizada hasta resolver H1/H2 — la verificación de "no rompí nada" sería 100% manual hoy.

## Hallazgos por severidad

| Sev. | Cantidad | IDs |
|---|---|---|
| P0 | 0 | — |
| P1 | 2 | H1, H2 |
| P2 | 4 | H3, H4, H5, H6 |
| P3 | 4 | H7, H8, H9, H10 |

Detalle completo con evidencia `archivo:línea` en `audits/03-hallazgos-consolidados.md`. Ambos P1 pasaron verificación adversarial (T3.2) sin degradarse.

## Antes del viaje (14 de agosto de 2026)

| ID | Qué | Esfuerzo | Por qué antes del viaje |
|---|---|---|---|
| H1 | Commitear `package-lock.json`, fijar versión de Playwright | S | Sin esto, nadie puede correr el único test suite del repo de forma confiable — incluye a quien tenga que hacer un cambio de último minuto |
| H3 | Test smoke mínimo para `index.html`+`data.js` | S | Es la parte que se usa todos los días del viaje; un día que no renderiza es peor que un parque con una recomendación subóptima |

El resto (H2, H4–H10) es deuda razonable de posponer — ninguno bloquea el uso del sitio durante el viaje.

## Deuda que puede esperar

- **H2** (regresión automatizada contra parques reales) — importante antes de tocar el core de nuevo o de sumar el tercer parque, no antes del viaje.
- **H4** (confirmar en `HANDOVER.md.asc` que los datos de los niños en texto plano son una decisión aceptada) — bajo riesgo, repo ya es privado.
- **H5** (modularizar `theme-park-core.js`) — sólo vale la pena si se toca el core de nuevo con frecuencia; no forzar por forzar.
- **H6, H8** (accesibilidad: `aria-*`, touch targets) — mejoras reales, no bloqueantes.
- **H7, H9, H10** — notas menores, sin urgencia.

## Pendiente de registrar

- **H4** debería confirmarse en `HANDOVER.md.asc` (sección de privacidad/decisiones de datos de los niños) si no está ya cubierto ahí — esta sesión no descifró `HANDOVER.md.asc` por regla del plan (requiere pregunta explícita al usuario, no se hizo en este encargo automatizado).
- El ajuste a **T0.2** (no existe mecanismo nativo de Claude Code para registrar un directorio de skills externo en `settings.json` — ver `audits/01-nota-T0.2.md`) no es un hallazgo del repo, pero vale que quede como contexto para quien reutilice este plan.

## Alcance de la auditoría

**Auditado:** todo el árbol de archivos de producto, `tests/`, `package.json`, ambos parques reales, `auth.js`, todas las specs bajo `specs/` (descifradas con passphrase provista por el usuario en esta sesión, plaintext borrado antes de terminar — verificado).

**No auditado / fuera de alcance:** `HANDOVER.md.asc` (por regla dura del plan — no se descifra sin pregunta explícita al usuario, no se hizo en esta sesión automatizada); contraste de color cuantitativo (T2.F); auditoría con lector de pantalla real; `archive/` (marcado como no-fuente-de-verdad en `CLAUDE.md`, se excluyó a propósito).

**Nada quedó bloqueado por falta de passphrase** — se proporcionó y se usó para las once specs bajo `specs/`.
