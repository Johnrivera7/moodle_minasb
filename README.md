# MinasLab — `mod_minaslab`

Plugin de actividad para **Moodle 4.5+**: laboratorio virtual de Ingeniería en Minas (escenarios 3D/2D, catálogo curricular, progreso y calificación).

## Instalación

1. Copiar esta carpeta como `mod/minaslab` dentro del árbol de Moodle (o clonar este repositorio en esa ruta).
2. Como administrador: **Notificaciones** para ejecutar el instalador / actualización de la base de datos.
3. Añadir la actividad desde un curso: **Añadir actividad o recurso → MinasLab**.

## Informes (docentes / gestores)

- **Informe por curso** (listado de prácticas MinasLab, inscritos, progreso, finalizados, nota media):  
  `mod/minaslab/course_report.php?id=<ID_DEL_CURSO>`
- **Detalle por actividad** (tabla de estudiantes, borrador %, nota final, CSV):  
  `mod/minaslab/instance_report.php?id=<ID_DEL_CURSO>&instance=<ID_INSTANCIA_MINASLAB>`  
  (`instance` es el `id` de la tabla `mdl_minaslab`, no el `cmid`.)

Acceso: capacidad **`mod/minaslab:viewcoursereport`** (por defecto profesor no editor, profesor editor y gestor). También hay un botón al **índice del módulo** en el curso (`mod/minaslab/index.php?id=...`) y un enlace en el **menú de navegación del curso** cuando el tema lo muestra.

## Catálogo

Las prácticas disponibles están definidas en `classes/local/activity_catalog_data.php` (84 entradas). La documentación descriptiva está en `docs/DOCUMENTACION_ACTIVIDADES.md`.

## Autoría

Diseño curricular e integración: John Rivera González.

## Licencia

GPL v3 (igual que Moodle).
