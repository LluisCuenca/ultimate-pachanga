# Tercera ronda · coherencia móvil

Base: `4d15d8f`. Destino: `main` del fork `LluisCuenca/ultimate-pachanga`, sin pull request.

## Lista de cambios

- Cabecera móvil con el título contextual: La Liga, Jugadores, Partidos, Estadísticas, 7 ideal, Mi perfil y administración. Las fichas muestran el nombre real del jugador o del partido reutilizando su consulta existente. Se ocultan los títulos duplicados en móvil; escritorio mantiene su cabecera de marca.
- Dorado como único acento de acciones, navegación, puntuaciones y estados. Neutros para información secundaria. Formas e iconos siguen diferenciando estados, errores y tendencias. Gráficos con dorados/platas y patrones de trazo estables, además de nombres y valores.
- Liga: promoción del 7 ideal con escudo mayor y un siete de gran formato al fondo. Palmarés dentro de una superficie común con tarjetas subordinadas y jerarquía de encabezados.
- Jugadores: cartas del directorio más cortas, con menos espacio entre alias y nombre y altura uniforme. La carta grande conserva sus proporciones. J del historial alineada con las jornadas.
- Partidos: retirado el recuento introductorio. Archivo con año, liga real, búsqueda opcional y elección de jornada después de buscar. Cada opción dirige al partido real. La lista general de jugados continúa debajo, con carga progresiva.
- El modelo actual permite una liga por usuario: el selector muestra esa liga autorizada, sin simular otras ligas ni ampliar permisos. Los errores al cargarla tienen reintento. Las categorías/temporadas nuevas requerirían ampliar el modelo, fuera de esta ronda visual.
- Ficha de partido: retirados los accesos internos Resultados/Alineaciones/Convocados y el indicador Estás convocado. Apuntarme continúa disponible para quien puede hacerlo; todas las acciones administrativas permanecen. Resultados en cuadrícula Jugador/A/D/T/F/G/Final, con fotografía, enlace y datos secundarios conservados. Sin alterar puntuaciones ni ordenaciones.
- Cartas del campo un 10% mayores en móvil, sin cambiar coordenadas, formación, convocatoria ni intercambio. Verificado matemáticamente que caben y no se solapan en las quince formaciones existentes.
- Rankings con foto y nombre, sin posición debajo, tanto en general como en palmarés. Posiciones conservadas en fichas y convocatorias, donde tienen utilidad.
- 7 ideal: valor del equipo primero en móvil, formación y media debajo en una fila compacta. Lista de elegidos reducida a dos líneas con métricas y valor. Criterios conservados; sus nombres de color se adaptan a la nueva paleta.
- La etiqueta Media antes imprimía la suma de las siete valoraciones. Ahora muestra esa suma dividida por siete; es una corrección de presentación y no modifica la selección, desempates ni valoraciones oficiales.
- Perfil sin cambios internos: solo traslado del título a la cabecera móvil.

## Verificación

574 pruebas correctas, TypeScript, lint y build con la configuración de GitHub Pages. Incluyen navegación y títulos, aislamiento del archivo por liga, filtros, enlaces a jornadas, conservación de las puntuaciones y dimensiones del campo.

Contraste calculado: texto del botón dorado 11,01:1; texto secundario sobre tarjeta 8,03:1; acento dorado 10,59:1; línea más oscura de gráfica 5,27:1.

La inspección visual real a 390 px sigue pendiente: el navegador de esta sesión deniega el acceso porque no puede verificar la política de seguridad administrada. No se ha sorteado ese bloqueo. Los controles de geometría y contraste no equivalen a una captura o revisión visual completa.

Sin cambios en base de datos, APIs de escritura, permisos, autenticación, cálculos de puntuación, valor de mercado o elección del 7 ideal. No se añaden datos ficticios a la aplicación.
