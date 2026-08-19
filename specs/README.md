# specs/

## Contexto interno (privado)

`SPECIFICATIONS.md.asc` contiene las especificaciones técnicas, de arquitectura y de diseño del proyecto: guardrails de código/contenido implementados, convenciones del repositorio, y la especificación completa del asistente interactivo de Story Land (`storyland.html`). Es el documento hermano de `HANDOVER.md.asc` (raíz del repo) — ese cubre las decisiones de negocio/viaje, este cubre cómo está construido y debe comportarse el sitio.

Está cifrado con GPG (simétrico, AES-256) y no es legible sin la contraseña, que se comparte solo con quienes deben tener acceso — no está en este repositorio. Es la misma contraseña que la de `HANDOVER.md.asc`.

Para descifrarlo:

```
gpg --output SPECIFICATIONS.md --decrypt SPECIFICATIONS.md.asc
```

GPG pedirá la contraseña de forma interactiva.

Para volver a cifrarlo después de editar:

```
gpg --symmetric --cipher-algo AES256 --armor -o SPECIFICATIONS.md.asc SPECIFICATIONS.md
```

(y borrar el `.md` sin cifrar del disco antes de terminar).

**Pista de contraseña (solo para el propietario):** es la misma que la del wifi de casa.
