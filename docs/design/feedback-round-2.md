# Segunda ronda de interfaz

Base: `938127d`. Destino solicitado: `LluisCuenca/ultimate-pachanga`, rama `main`, sin pull request a David.

## Cambios de la ronda

- Cabecera móvil: logo enlazado a Liga, nombre fijo ULTIMATE PACHANGAS centrado y avatar propio enlazado al perfil. Cinco destinos inferiores conservados, sin menú lateral móvil. Administración y cierre de sesión al final del perfil, con los permisos existentes.
- Liga: eliminados el encabezado redundante y los cuatro indicadores de resumen. Próxima jornada y último partido conservados. Panel 7 ideal ampliado con escudo propio, cifra decorativa y tratamiento dorado. Palmarés desarrollado en tarjetas por categoría, con foto, nombre y recuento.
- Jugadores: eliminado el recuento junto al título. Banda de nombres y pie de cartas con alturas consistentes. Carta individual a todo el ancho de su columna móvil. Código de importación retirado de ficha y perfil; conservado en datos y herramientas administrativas. Atributos con más espacio.
- Historial individual: filas uniformes, sin fecha, abreviaturas J/A/D/T/F/G y puntuación final destacada. Base, victorias y atributos conservados en una segunda línea compacta. Cada fila enlaza al identificador real del partido; los títulos sin jornada explícita no reciben números inventados.
- Partidos: el próximo encuentro aparece primero. Archivo con búsqueda por jornada/equipos/campo y filtro de año, con doce encuentros por tanda. Siempre limitado a la liga autorizada; no se modifica el modelo de ligas ni se mezclan registros de otras ligas.
- Ficha de partido: ampliación de la imagen existente en un diálogo accesible, manteniendo su versión de caché y alternativa de sede. Resultados primero para encuentros terminados; después alineaciones y convocados. Avatares, divisores y puntuaciones compactas sin tabla horizontal. Edición administrativa de resultados conservada.
- Alineaciones: más espacio relativo para la fotografía dentro de cada carta, manteniendo posiciones y dimensiones de las casillas. Instrucciones de intercambio bajo un botón de ayuda; estado de selección y cancelación visibles durante la interacción. Convocados con foto, nombre y posición.
- Estadísticas: encabezados con iconos, filas con fotos y divisores coherentes con Liga. Fotos también en selección, leyenda y tooltip de evolución. Cálculos, ordenación y valores originales intactos.
- 7 ideal: título principal sin enlace de regreso; formación, valoración y valor del equipo destacados. Cartas sobre el campo con fotografía mayor y distinciones de color en los bordes sobre fondo oscuro. Lista de elegidos con foto, posición, valoración, métricas y valor real sustituye a las cartas grandes duplicadas. Criterios existentes en sección desplegable.

## Componentes compartidos

`PlayerAvatar`, `PlayerHistory`, `ScoreStrip` y `ProfileActions`; estilos compartidos en `src/index.css`. La resolución de la fotografía de partido se comparte entre la cabecera y su ampliación.

No se modifican migraciones, APIs de escritura, algoritmos de puntuación, valoración, elección del 7 ideal, intercambio de alineaciones, permisos ni rutas. La cabecera reutiliza la consulta de ficha propia para mostrar su foto; no se añaden datos simulados a la aplicación. Los datos sintéticos solo pertenecen a pruebas automatizadas.

## Validación

- 545 pruebas de la suite completa, más 3 nuevas pruebas de cierre de sesión y acceso administrativo: 548 pruebas correctas.
- TypeScript, lint y build de producción correctos. Pruebas nuevas para enlace real del historial, métricas, filtros por año/texto, carga progresiva, ampliación de imágenes y gestión del cierre de sesión.
- Pendiente: revisión visual real a 390 y 1440 px, overflow y pantallas autenticadas. El navegador de la sesión bloquea las URLs porque no puede verificar la política de seguridad administrada. No se ha evitado esa restricción. Las verificaciones de componentes no sustituyen la revisión visual.
