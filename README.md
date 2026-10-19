# MinasLab — `mod_minaslab`

Plugin de actividad para **Moodle 5.3** (probado con PHP 8.5): laboratorio virtual 3D de Ingeniería en Minas e Ingeniería Civil en Minas.

Incluye:

- **5 evaluaciones prácticas semestrales** (★), una por semestre (I a V). Tienen escenas 3D realistas, datos únicos por estudiante, corrección automática en servidor, guardado continuo del avance y calificación en el libro de calificaciones.
- **Práctica calificada de ciclo minero** (semestre I, clave `s1_bases_ops_b`), con el mismo motor 3D y la misma corrección.

En total, el catálogo tiene **6 prácticas evaluadas**. Las 84 prácticas formativas antiguas (motor anterior con nota autodeclarada) se retiraron en la versión 1.2.0. Al actualizar, cualquier actividad que usara una clave antigua pasa automáticamente a la evaluación práctica de su semestre.

**Repositorio:** [github.com/Johnrivera7/moodle_minasb](https://github.com/Johnrivera7/moodle_minasb) · rama de Moodle 5.3: `MOODLE_53`.

## Requisitos

| Componente | Versión |
|---|---|
| Moodle | 5.3 (`$plugin->requires = 2026100500`) |
| PHP | 8.5 (probado); las versiones soportadas por Moodle 5.3 |
| Navegador | Con WebGL 2 (Chrome, Edge, Firefox, Safari recientes) |

## Calidad gráfica y requisitos del equipo

Al abrir la actividad, el estudiante elige la calidad gráfica (**Alta**, **Media** o **Baja**). El selector detecta la tarjeta gráfica, recomienda un nivel y puede recordar la elección en el equipo; el botón de calidad en la barra de la escena permite cambiarla. La evaluación y la nota son idénticas en todos los niveles.

| Nivel | Resolución | Sombras | Terreno y detalle | Partículas | Luces nocturnas |
|---|---|---|---|---|---|
| Alta | hasta 2× | 4096 px suaves | 100 % | 100 % | 14 |
| Media | hasta 1,25× | 2048 px | 60 % | 60 % | 8 |
| Baja | 0,9× | sin sombras | 32 % | 30 % | 4 |

Requisitos estimados (pendiente medir en equipos reales):

- **Mínimo, calidad Baja:** procesador de 4 núcleos, gráficos integrados Intel UHD 620 o AMD Vega 8 y 8 GB de RAM.
- **Recomendado, calidad Alta:** Intel Iris Xe, AMD Radeon 680M, NVIDIA GTX 1650 o Apple M1, y 16 GB de RAM.

En todos los casos se necesita un navegador actual con aceleración por hardware (WebGL 2).

## Instalación

1. Copiar esta carpeta como `public/mod/minaslab` dentro de Moodle 5.3. En Moodle 5.x el código web vive en `public/`.
2. Como administrador, ir a **Administración del sitio → Notificaciones** o ejecutar `php admin/cli/upgrade.php`.
3. Purgar cachés después de cada actualización.
4. En un curso: **Añadir actividad o recurso → MinasLab** y elegir una práctica. Las evaluaciones semestrales aparecen con ★ al inicio de cada semestre.

La carpeta `Ingeniería en Minas PCE/` (documentación curricular institucional) **no** forma parte del plugin y está excluida en `.gitignore`. No debe copiarse al servidor.

## Evaluaciones prácticas semestrales

| Sem. | Asignatura eje (PNA) | Escena 3D | Tareas evaluadas |
|---|---|---|---|
| I | Bases de las Operaciones Mineras | Faena escuela a rajo con portal de galería | Inspección DS 132, ángulo interrampa, cubicación, transporte, pendiente de rampa, muestreo por canal, ciclo minero |
| II | Geología Estructural y de Minas | Pared de banco con 3 familias de diaclasas | Rumbo, manteo aparente, Markland, FS de falla plana, RQD, Q de Barton, replanteo |
| III | Prospección y Evaluación de Yacimientos | Campaña de sondajes sobre un pórfido + banco piloto | Compósito, QA/QC, cubicación por secciones, ley de corte, categorización, factor de carga, secuencia de carguío |
| IV | Sistema de Explotación a Rajo Abierto | Rajo de cobre en operación con flota animada | Ángulos interrampa y global, ancho de rampa, Taylor, flota, destino de bloques, ventilación |
| V | Proyecto Minero | Emplazamiento: rajo, planta, río, campamento, sitios de relaves | Vida útil, ingresos, VAN, TIR, sensibilidad, bombeo, sitio de relaves, ciclo de vida |

La matriz completa de tareas, fórmulas, tolerancias, RA y competencias está en [`docs/EVALUACIONES_PRACTICAS.md`](docs/EVALUACIONES_PRACTICAS.md).

### Configuración por actividad

En la sección *Evaluación práctica semestral* del formulario se definen:

- intentos por tarea (1–5);
- penalización por reintento (0–50 %);
- mostrar el desarrollo al cerrar la tarea;
- exigencia para nota 4,0 en escala 1,0–7,0.

### Informes y gestión docente

- `mod/minaslab/results.php?id=<cmid>`: puntaje por tarea, logro por RA, nota 1–7, calificación y exportación CSV.
- `mod/minaslab/review.php?id=<cmid>&userid=<id>`: revisión detallada (respuestas, solución, borradores, libreta de campo).
- **Reiniciar** un estudiante (capacidad `mod/minaslab:manageattempts`) le entrega un caso nuevo con otros datos.
- Los informes por curso de las prácticas formativas siguen disponibles en `course_report.php` e `instance_report.php`.

### Capacidades

| Capacidad | Uso | Arquetipos |
|---|---|---|
| `mod/minaslab:view` | Ver la actividad | todos |
| `mod/minaslab:submit` | Responder evaluaciones | estudiante |
| `mod/minaslab:manageattempts` | Vista previa, revisión y reinicio | profesor editor, gestor |
| `mod/minaslab:viewcoursereport` | Informes | profesores, gestor |

## Arquitectura

- **Servidor**
  - `classes/local/evaluation/`: generador determinista (`rng`), definición de cada semestre (`semester1`…`semester5`), corrección (`grader`) y registro.
  - `classes/local/evaluation_manager.php`: intentos, penalización, borradores, cierre y calificación.
  - `classes/external/` y `db/services.php`: servicios AJAX `mod_minaslab_get_evaluation`, `mod_minaslab_submit_answer`, `mod_minaslab_save_draft` y `mod_minaslab_finish_evaluation`.
  - `db/install.xml`: tabla `minaslab_response` (respuesta corregida por tarea).
- **Cliente (AMD)**
  - `eval_three`: carga Three.js r160 como módulo ES.
  - `eval_kit`: motor de render con cielo procedural, iluminación PMREM, sombras suaves y tono ACES. Genera un terreno con rajo de bancos exactos y rampa tallada, más equipos mineros y herramientas.
  - `eval_models`: equipos detallados a escala real: camión de extracción, pala de cables, perforadora con mástil reticulado, cargador frontal, sonda diamantina, camioneta, trabajador con EPP y estación total. Usan formas biseladas y extruidas, neumáticos torneados con banda en chevrón, cilindros hidráulicos, barandas y polvo de faena procedural. Las marcas que aparecen (MINEXA, ROCATRAX, KAIRO, SONDAX y Minera Cerro Aconcagua) son ficticias, para no usar marcas registradas sin autorización; se cambian en la constante `BRAND` de `eval_models.js`. Cada equipo se fusiona en una malla por material (≈ 10–17 llamadas de dibujo y 12–32 mil triángulos por máquina).
  - `eval_fx`: efectos de faena. Incluye polvo dinámico tras los vehículos (menor sobre camino regado), riego del aljibe con huella húmeda que se seca, viento con polvo en suspensión, neblina costera y turno de noche con focos de los equipos y torres de iluminación.
  - Animaciones del ciclo real: pala excavando, girando y vaciando el balde; cargador frontal en ciclo en «V»; camiones esperando el carguío y levantando la tolva al descargar; motoniveladora y bulldozer trabajando.
  - `eval_scenes`: las 5 escenas.
  - `eval_app`: interfaz, tareas, libreta de campo y autoguardado.
- **Respaldo y restauración** incluyen el estado y las respuestas. La semilla del caso se conserva al restaurar.
- **Privacidad**: proveedor completo (`core_userlist_provider`) para `minaslab_user_state` y `minaslab_response`.

### Compilación de JavaScript

Los fuentes están en `amd/src/` y los minificados en `amd/build/`. Para compilar con el grunt de Moodle:

```bash
cd public/mod/minaslab
npx grunt amd --force
```

Los módulos nuevos `eval_*` pasan `eslint` sin errores. `--force` es necesario mientras los módulos heredados (`lab*.js`, `scenes3d.js`) no completen su JSDoc.

## Autoría

Diseño curricular e integración: John Rivera González.

## Licencia

GPL v3 (igual que Moodle). Three.js: licencia MIT (ver `thirdpartylibs.xml`).
