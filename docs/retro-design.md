# Rediseño compacto

## Dirección visual

Álbum de cromos y menús de un juego de fútbol clásico: superficies oscuras,
marcos rectos, amarillo para selección y cifras, retratos rectangulares y
tipografía condensada. Las tablas usan números monoespaciados. Se conserva
el logo y se reduce el espacio decorativo para priorizar la consulta.

## Cambios de uso

- Portada: próxima jornada y últimos partidos juntos en escritorio; filas
  compactas en móvil. Clasificaciones y reconocimientos debajo.
- Navegación móvil inferior con acceso directo a las cinco áreas principales.
- Jugadores: cromos o tabla comparativa, compartiendo búsqueda, filtros y orden.
- Ficha: cromo y resumen compactos, historial visible antes del rendimiento.
- Partido: resultados, alineaciones y convocados separados en pestañas.
  Los partidos puntuados abren resultados; los demás, alineaciones.
- Estadísticas: listados densos, pestañas consistentes y gráfica de altura
  moderada, con leyenda y selección de jugadores.

## Vista de comprobación local

Con el servidor de desarrollo iniciado, abrir
`http://127.0.0.1:5173/retro-qa.html#/league`. No abrir el HTML directamente
desde el explorador de archivos: necesita el servidor para cargar React.

Esta entrada reutiliza las páginas reales con datos ficticios identificados
por una franja amarilla. Bloquea las mutaciones para no guardar cambios.
Permite revisar también `#/players`, `#/matches`, `#/stats` y `#/profile`.
Es una herramienta de desarrollo, no un sustituto de los datos reales ni un
modo de visitante. La compilación normal de Vite solo incluye `index.html`;
esta entrada no se publica y contiene una protección adicional de desarrollo.

La aplicación real está en `/league`. El acceso anónimo sigue requiriendo
la función `get_public_league_snapshot` en Supabase; este rediseño no cambia
permisos, autenticación, cálculos ni datos de producción.
