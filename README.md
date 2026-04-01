# MinasLab — `mod_minaslab`

Plugin de actividad para **Moodle 4.5+**: laboratorio virtual de Ingeniería en Minas (escenarios 3D/2D, catálogo curricular, progreso y calificación).

## Instalación

1. Copiar esta carpeta como `mod/minaslab` dentro del árbol de Moodle (o clonar este repositorio en esa ruta).
2. Como administrador: **Notificaciones** para ejecutar el instalador / actualización de la base de datos.
3. Añadir la actividad desde un curso: **Añadir actividad o recurso → MinasLab**.
4. Tras cada actualización del plugin: **Administración del sitio → Desarrollo → Purgar todas las cachés** (sobre todo si cambian módulos AMD o cadenas de idioma).

### Si la consola muestra error en `three.min.js` o “WebGL no disponible”

El motor 3D se carga desde `mod/minaslab/js/three.min.js`. El bundle oficial de Three (r150+) incluye una **primera línea** `console.warn(...),` necesaria para que el UMD sea válido. Si falta (archivo recortado), aparece `SyntaxError: Function statements require a function name` y no existe `window.THREE`.

**Desde la versión 2026033117**, `lab.js` descarga el texto, añade esa línea si falta y ejecuta vía blob URL (suele bastar). Si sigue fallando, sustituye `js/three.min.js` por el `build/three.min.js` íntegro de `three@0.159.x` y purga cachés. Los avisos de Moodle sobre *drawer region* no vienen de MinasLab.

## Interacción y escenas 3D

- **Navegación**: órbita con arrastre (ratón o trackpad), zoom con rueda; en trackpad suele funcionar pellizco o **Ctrl + desplazamiento** (comportamiento similar a “zoom con Ctrl” en navegadores).
- **Tajo a cielo abierto (`pit_3d`)**:
  - **Vistas rápidas**: ISO, planta aproximada y perfil (animación suave de cámara).
  - **Medición**: modo “Medir distancia” — dos clics sobre el modelo (terreno, bancos, rampa, equipos) para ver una distancia en metros en el escenario didáctico (1 unidad ≈ 1 m).
  - **Capas**: mostrar u ocultar **contornos** (líneas de nivel y bancos) y **equipos** (camiones y excavadora).
- **Otras escenas** (túnel, voladura/álgebra, ventilación, etc.) comparten el mismo patrón de órbita y zoom donde aplica.

Los textos de ayuda y botones se cargan desde los idiomas (`lang/*/minaslab.php`) y el payload embebido en `view.php`.

## Informes (docentes / gestores)

- **Informe por curso** (listado de prácticas MinasLab, inscritos, progreso, finalizados, nota media):  
  `mod/minaslab/course_report.php?id=<ID_DEL_CURSO>`
- **Detalle por actividad** (tabla de estudiantes, borrador %, nota final, CSV):  
  `mod/minaslab/instance_report.php?id=<ID_DEL_CURSO>&instance=<ID_INSTANCIA_MINASLAB>`  
  (`instance` es el `id` de la tabla `mdl_minaslab`, no el `cmid`.)

Acceso: capacidad **`mod/minaslab:viewcoursereport`** (por defecto profesor no editor, profesor editor y gestor). También hay un botón al **índice del módulo** en el curso (`mod/minaslab/index.php?id=...`) y un enlace en el **menú de navegación del curso** cuando el tema lo muestra.

## Catálogo y documentación

Las prácticas disponibles están definidas en `classes/local/activity_catalog_data.php` (84 entradas). La documentación descriptiva está en `docs/DOCUMENTACION_ACTIVIDADES.md`.

## Código front (AMD)

Los módulos fuente están en `amd/src/` (p. ej. `scenes3d.js`, `lab.js`, `lab_practices.js`). Moodle sirve los bundles en `amd/build/`; en este proyecto se mantienen **copiados** desde `src` tras cambios (o mediante el flujo de `grunt` si lo configuras en tu entorno).

## Autoría

Diseño curricular e integración: John Rivera González.

## Licencia

GPL v3 (igual que Moodle).
