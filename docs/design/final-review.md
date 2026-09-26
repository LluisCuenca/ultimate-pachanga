# Revisión final de móvil y escritorio

## Comprobaciones

- Navegación principal y menú móvil; enlaces a fichas de jugadores y partidos.
- Búsqueda por nombre de jugador y búsqueda de una jornada real.
- Carga de liga, jugadores, ficha individual, partidos, resultados, estadísticas, 7 ideal y perfil.
- Distribución de tarjetas, tablas, rankings y resúmenes a 390 px y 1440 px.
- Estados de carga y fotografías: los esqueletos dan paso a los datos; no se detectaron imágenes rotas en las vistas comprobadas.
- Se mantiene el ajuste anterior de la leyenda de evolución para evitar que un nombre largo empuje el botón de cierre.

## Mejoras aplicadas

1. Estadísticas: las tres pestañas comparten el ancho disponible y conservan su etiqueta completa; no requieren desplazamiento horizontal.
2. Marca: el fondo negro del PNG se integra visualmente con los paneles oscuros mediante mezcla de pantalla, manteniendo el recurso original.
3. Jugadores: texto de búsqueda más directo, «Buscar por nombre o apodo».
4. 7 ideal: el valor del equipo aparece primero también en escritorio, con formación y media a continuación.

## Validación

593 pruebas existentes superadas; lint, formato y build de GitHub Pages correctos. No se modifican consultas, permisos, cálculos ni datos. Las pruebas manuales en producción son de consulta: no se han enviado puntuaciones, cambiado alineaciones, editado perfiles ni cerrado la sesión para comprobarlos.
