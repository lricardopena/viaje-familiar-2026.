# viaje-familiar-2026.

## Contexto interno (privado)

`HANDOVER.md.asc` contiene el documento de contexto, decisiones y reglas operativas del viaje (handover para quien continúe la planificación). Está cifrado con GPG (simétrico, AES-256) y no es legible sin la contraseña, que se comparte solo con quienes deben tener acceso — no está en este repositorio.

Para descifrarlo:

```
gpg --output HANDOVER.md --decrypt HANDOVER.md.asc
```

GPG pedirá la contraseña de forma interactiva.

**Pista de contraseña (solo para el propietario):** es la misma que la del wifi de casa.

La carpeta `specs/` contiene, con el mismo esquema de cifrado y la misma contraseña, las especificaciones técnicas/de arquitectura/de diseño del proyecto (`specs/SPECIFICATIONS.md.asc`) — ver `specs/README.md`. `HANDOVER.md.asc` se enfoca en decisiones de negocio/viaje; `specs/SPECIFICATIONS.md.asc` en cómo está construido y debe comportarse el sitio.
