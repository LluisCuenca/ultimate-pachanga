# Ultimate Pachangas · Rediseño visual

Rama: `design/ultimate-premium`. Base: `cbd1b95` (origin/main comprobado el 14 de septiembre de 2026).

## Dirección

Negro profundo, superficies grafito, texto blanco y gris legible. El dorado del escudo identifica la marca, las cartas y la navegación de escritorio. Coral para acciones y navegación móvil; verde para rendimiento positivo. Plata para información neutral. Geist, ya incluida en el proyecto, conserva carga local y cifras tabulares.

Las referencias se utilizan como inspiración de jerarquía, densidad y navegación. Solo se incorpora el logo propio aportado por el usuario; las fotografías del campo y sedes ya pertenecían al proyecto.

## Implementación

- Tokens y reglas compartidas en `src/index.css`: colores semánticos, radios, sombras, escala de espaciado de Tailwind, controles táctiles, estados de foco y movimiento reducido.
- `AppLayout`: cinco destinos en barra inferior, safe areas, espacio inferior para contenido, sidebar desde 1024 px, perfil y administración conservados en menú. Se conserva el control de permisos `AdminOnly`.
- `Brand` y acceso: escudo original, presentación deportiva con fotografía existente y formularios de acceso/registro intactos. Recuperación de contraseña y onboarding heredan controles y superficies.
- Dashboard: contexto de liga, próximo encuentro prioritario, resumen y clasificaciones con avatares, llamada al 7 ideal.
- Jugadores: cartas metálicas oscuras y mates, nombres con salto de línea, rejilla menos densa en escritorio y resumen de ficha en dos columnas.
- Partidos: fotografías en banda, equipos destacados, navegación horizontal basada en títulos reales y enlaces internos a alineaciones, convocatoria y resultados.
- Rankings, gráficos, administración y formularios adoptan el sistema compartido; el 7 ideal mantiene sus variantes, ahora con superficies coordinadas.
- Carga, error y vacío conservan sus condiciones y acciones, con superficies consistentes.

## Datos y alcance

No se modifican rutas, consultas, API, autenticación, migraciones, cálculos, permisos, puntuaciones ni valores de mercado. No se agregan datos ficticios ni se realizan escrituras en Supabase. El listado de partidos no contiene un marcador agregado ni un estado en directo: no se inventan; la ficha conserva sus resultados existentes. La navegación de jornadas usa los títulos disponibles y no deduce números de jornada.

No se ejecutan migraciones ni pruebas de base de datos porque no hay cambios en esa capa. La prueba del dashboard adapta el mock existente al nuevo avatar. Las pruebas de navegación cubren selección de la ruta anidada 7 ideal y acceso al perfil sin mostrar administración a miembros.

## Validación y pendientes

Compilación, lint y pruebas automatizadas ejecutados localmente. El navegador bloquea tanto el sitio publicado como localhost porque no puede verificar una política de seguridad administrada. No se ha eludido ese bloqueo.

Por tanto, quedan pendientes la inspección visual a 390 y 1440 px, la comprobación de overflow real en navegador y la revisión de pantallas con una sesión autenticada y datos reales. Las pruebas unitarias no sustituyen esas comprobaciones; no debe considerarse una revisión visual final aprobada.

Publicar esta rama no actualiza GitHub Pages: el flujo existente despliega `main`. No se modifica ese flujo ni se mezcla la rama de diseño con producción.
