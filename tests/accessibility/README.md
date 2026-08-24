# Pase de accesibilidad (axe-core)

Corre [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright)
(reglas WCAG 2.0/2.1 nivel A y AA) contra `storyland.html`/`legoland.html` con
datos reales — ver `audits/04-tickets.md` TICKET-5 (H6) y
`audits/2F-performance-a11y.md`, que dejó la accesibilidad del Theme Park
Companion como "no verificable sin herramienta dedicada" en la auditoría
original.

## Ejecutar

```bash
npm run test:a11y
```

o directamente:

```bash
node tests/accessibility/axe-audit.spec.js
```

## Por qué es una suite separada de `npm test`

A diferencia de `tests/theme-park/` (contrato) y `tests/itinerary/`
(renderizado), esto es un **audit**, no una regresión funcional — no está
encadenado en `npm test`. Una violación de accesibilidad nueva puede requerir
criterio humano para decidir cómo resolverla (falso positivo vs. violación
real, o un rediseño más allá de un cambio de color), así que no debe bloquear
silenciosamente cada corrida del pipeline principal.

## Qué verifica

Para cada parque (Story Land, LEGOLAND New York) y cada una de sus 4
pestañas (Ahora/Checklist/Favoritas/Tips): cero violaciones de impacto
`serious`/`critical` bajo las reglas WCAG 2.0/2.1 A+AA de axe-core.

La sesión de `auth.js` se inyecta ya autenticada vía `localStorage` (mismo
`storageKey`/forma que usa `auth.js`, nunca se modifica ni desactiva el
archivo) para auditar la vista real de la familia, no la pantalla de login.

## Qué NO verifica

axe-core automatiza aproximadamente un tercio a la mitad de los criterios
WCAG evaluables — cubre estructura del DOM, contraste de color, atributos
`aria-*`/name-role-value, pero no reemplaza una prueba con lector de
pantalla real (NVDA/VoiceOver) para flujo de navegación, orden de foco, o
anuncios dinámicos correctos. Ver `audits/2F-performance-a11y.md`
§Actualización para el detalle de qué se encontró y qué queda pendiente.
