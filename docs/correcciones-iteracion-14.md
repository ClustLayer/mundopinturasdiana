# Correcciones iteración 14 — panel y tienda

- Resumen: `GET /api/v1/auth/panel-resumen` (sin barra final), KPIs numéricos, top 5 inventario y auditoría reciente.
- Notificaciones: un solo sistema `toast()` arriba-derecha (borde cyan, × grande); `avisar()` del shell usa el mismo patrón.
- Sesión: renovación periódica y orígenes localhost en DEBUG para refresh/logout.
- Vitrinas del inicio: panel `/vitrinas` y carruseles en home desde API.
- Pedido WhatsApp: formato bloques en español; teléfono con `PhoneInput` (+57).
- Productos: importar con zona azul tipo adjuntar imagen; plantilla fuera del modal; quitar imagen con ×.
- Facturación externa: encabezado alineado con el resto del panel.