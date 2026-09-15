# Revisión móvil · Ronda 4

Los doce puntos de la revisión han sido autorizados. Se conserva Supabase, RLS, rutas y cálculos deportivos. Publicación solicitada en main de LluisCuenca, sin pull request al repositorio de David.

## Cambios

1. Preferencias de vista por pestaña (búsquedas, filtros, paginación, estadísticas y evolución), borradas al cerrar sesión. Restauración del desplazamiento al volver y retorno contextual desde fichas.
2. Fallos de lectura diferenciados de ausencia de liga/jugador. Reintentos locales en resultados, alineaciones, convocatoria y evolución. Datos existentes conservados en las vistas principales ante fallos de actualización. Refresco de consultas caducadas al volver a la aplicación.
3. Alineaciones con guardado provisional reconciliado al terminar, recuperación ante rechazo y bloqueo de intercambios simultáneos. Sin efectos de guardado dentro de actualizadores de estado. Supresión del clic posterior al arrastre.
4. Protagonismo del próximo partido y resultados finalizados; paneles secundarios con bordes neutros y ritmo de espaciado común.
5. Identidad y filas compartidas entre Liga, palmarés y rankings; enlaces de fila completa, foto y nombre sin posición secundaria.
6. Nombres de resultados con más espacio y hasta dos líneas, puntuación final mayor y atributos consultables por toque. Se elimina la repetición «Sin atributos». El historial conserva todas sus métricas y el enlace al partido.
7. Avisos coherentes con negro/dorado; estados diferenciados por icono y etiqueta; cancelado neutro.
8. Modo explícito de edición de alineaciones para permitir desplazarse sobre las cartas en lectura. Carta pequeña centrada en cara, nombre y valoración. Datos completos conservados en la ficha.
9. Distinción del siete ideal consultable sin depender del color; lista más corta con nombre, rating y valor. Métricas del mejor partido disponibles en el detalle de la distinción; criterios de selección intactos.
10. Archivo por año y liga real, con resultados directamente pulsables y lista acotada. La liga única aparece como dato fijo.
11. Evolución con tres jugadores inicialmente; tocar nombre/foto destaca una línea y quitarla tiene un control independiente. Se mantiene la selección de hasta ocho jugadores.
12. Fotografías nuevas reducidas antes de subir (768 px avatares, 1920 px partidos), preservando composición. Renovación de URL de avatares al reemplazarlos. Anatomía explícita de cartas y variables compartidas de tipografía/filas.

## Validación

Pruebas de regresión de navegación, preferencias, errores de acceso, edición explícita, guardado rechazado y guardado confirmado con cambios posteriores del servidor en StrictMode, optimización de imágenes y actualización de avatares. Pruebas existentes de cálculos y permisos conservadas. Suite completa: 586 pruebas aprobadas. Lint, formato y build verificados antes de publicar.

La inspección visual directa en navegador está bloqueada por la política de acceso de la sesión. Las pruebas de componentes y geometría no sustituyen esa comprobación: queda pendiente verificar visualmente 390 px y 1440 px, teclado de iPhone y ausencia de desbordamientos.
