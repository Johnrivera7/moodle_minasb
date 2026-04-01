<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'MinasLab — Laboratorio virtual minero';
$string['modulenameplural'] = 'Actividades MinasLab';
$string['modulename_help'] = <<<'MINASLABHELP'
<div style="max-width:100%;font-size:0.92em;line-height:1.5;color:#1d2125;">
<div style="padding:10px 12px;margin-bottom:10px;border-radius:10px;border-left:5px solid #f4a23a;background:linear-gradient(90deg,rgba(244,162,58,0.14),rgba(61,214,198,0.08));box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<strong style="font-size:1.05em;">MinasLab</strong> — <strong>84 prácticas curriculares</strong> (3 por asignatura) con escenarios interactivos 3D/2D: galerías, rajos, planta metalúrgica, ventilación, taller numérico, seguridad, topografía, oficina técnica, inglés minero, perforación, tesis e innovación. Cada instancia elige <strong>una</strong> práctica del catálogo al crear la actividad.
</div>
<p><strong>¿Para qué sirve?</strong> Reforzar contenidos del programa oficial, el perfil de egreso y competencias C1–C6, con progreso y calificación opcional en el libro de calificaciones.</p>
<p><strong>28 asignaturas</strong> con 3 prácticas cada una:</p>
<ul style="margin:6px 0 10px 18px;padding:0;column-count:2;column-gap:18px;">
<li>Álgebra</li>
<li>Bases de las Operaciones Mineras</li>
<li>Elementos de Preparación de Minerales</li>
<li>Inglés Técnico</li>
<li>Prevención de Riesgos</li>
<li>Topografía e Interpretación de Planos</li>
<li>Cálculo</li>
<li>Física Superior</li>
<li>Geología Estructural y de Minas</li>
<li>Probabilidad y Estadística</li>
<li>Resistencia de Materiales</li>
<li>Topografía de Minas</li>
<li>Ecuaciones Diferenciales</li>
<li>Elementos Mecánicos de Rocas</li>
<li>Mecánica de Fluidos y Termodinámica</li>
<li>Perforación y Tronadura</li>
<li>Prospección y Evaluación de Yacimientos Mineros</li>
<li>Sistema de Explotación Subterráneo</li>
<li>Diseño y Evaluación de Proyectos</li>
<li>Economía General</li>
<li>Innovación y Tecnología</li>
<li>Procesos Metalúrgicos</li>
<li>Sistema de Explotación a Rajo Abierto</li>
<li>Ventilación de Minas</li>
<li>Dirección y Gestión de Empresas</li>
<li>Proyecto Minero</li>
<li>Proyecto de Título</li>
<li>Servicios Mineros</li>
</ul>
<p><strong>Tipos de escenario (arquetipos)</strong></p>
<ul style="margin:6px 0 10px 18px;">
<li><strong>tunnel_3d</strong> — galería subterránea 3D</li>
<li><strong>pit_3d</strong> — rajo abierto 3D</li>
<li><strong>math_mine</strong> — taller numérico / problemas</li>
<li><strong>flow_process</strong> — flujo metalúrgico</li>
<li><strong>safety_module</strong> — seguridad y EPI</li>
<li><strong>survey_field</strong> — topografía / replanteo</li>
<li><strong>vent_shaft</strong> — ventilación</li>
<li><strong>office_sim</strong> — oficina técnica / indicadores</li>
<li><strong>english_mine</strong> — inglés técnico minero</li>
<li><strong>drill_site</strong> — perforación (vista 2D)</li>
<li><strong>thesis_lab</strong> — estructura de informe de título</li>
<li><strong>innovation_board</strong> — innovación y I+D</li>
</ul>
<p><strong>Competencias del perfil de egreso (referencia C1–C6)</strong></p>
<ul style="margin:6px 0 10px 18px;">
<li><strong>C1</strong> — Operación minera (faena, procesos, criterios técnicos)</li>
<li><strong>C2</strong> — Sustentabilidad y gestión de proyectos</li>
<li><strong>C3</strong> — Seguridad y prevención de riesgos</li>
<li><strong>C4</strong> — Diseño, análisis e innovación</li>
<li><strong>C5</strong> — Comunicación efectiva (incl. inglés técnico)</li>
<li><strong>C6</strong> — Ética profesional y ciudadana</li>
</ul>
<div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,rgba(244,162,58,0.18),rgba(61,214,198,0.12));border:1px solid rgba(0,0,0,0.08);box-shadow:0 4px 14px rgba(244,162,58,0.15);">
<p style="margin:0 0 6px 0;"><strong style="color:#b45309;">Autoría</strong></p>
<p style="margin:0;"><strong>John Rivera González</strong><br />
<a href="mailto:johnriveragonzalez7@gmail.com" style="color:#0f766e;font-weight:600;">johnriveragonzalez7@gmail.com</a></p>
<p style="margin:8px 0 0 0;font-size:0.9em;opacity:0.9;">Diseño curricular, integración MinasLab y escenarios de ingeniería de minas.</p>
</div>
</div>
MINASLABHELP;
$string['pluginname_help'] = $string['modulename_help'];
$string['pluginname'] = 'MinasLab';
$string['pluginadministration'] = 'Administración de MinasLab';
$string['minaslabname'] = 'Nombre de la actividad';
$string['minaslabname_help'] = 'Título que verán los estudiantes en el curso y al abrir la actividad.';
$string['practice_section'] = 'Práctica curricular';
$string['activity_key'] = 'Práctica (asignatura + escenario)';
$string['activity_key_help'] = 'Elige una de las 84 prácticas (3 por asignatura), alineadas al programa de carrera y al perfil de egreso. Cada una combina un escenario interactivo (mina 3D, rajo, taller, etc.) y objetivos de aprendizaje.';
$string['practice_catalog_hint'] = 'El catálogo vincula cada asignatura de los programas oficiales con las competencias C1–C6 del perfil de egreso: operación minera, sustentabilidad y proyectos, seguridad, diseño e innovación, comunicación y liderazgo, y ética ciudadana/profesional.';
$string['invalidactivity'] = 'Clave de práctica no válida.';
$string['semester_group'] = 'Semestre {$a}';
$string['author_name'] = 'John Rivera González';
$string['author_role'] = 'Diseño curricular e integración MinasLab';
$string['author_footer'] = 'Diseño pedagógico y escenarios de ingeniería de minas';
$string['profile_label'] = 'Perfil de egreso (competencias)';
$string['lab_intro_tagline'] = 'Práctica digital inmersiva para ingeniería de minas';
$string['lab_objectives'] = 'Enfoque de aprendizaje';
$string['lab_feedback_ok'] = 'Correcto — muy bien.';
$string['lab_feedback_retry'] = 'Aún no — revisa la pista e inténtalo de nuevo.';
$string['lab_check'] = 'Comprobar';
$string['lab_next'] = 'Siguiente';
$string['lab_hint'] = 'Pista';
$string['lab_3d_drag'] = 'Orbitar: clic y arrastre (o dos dedos en trackpad). Zoom: rueda del mouse o desplazamiento vertical; en trackpad suele funcionar pellizco o Ctrl+desplazamiento.';
$string['lab_conceptual'] = 'Simulación educativa — no sustituye faena real ni signos profesionales o legales.';
$string['lab_what_to_do'] = 'Ejecuta la práctica guiada (panel derecho): checklist, orden de trabajo, cálculos o preguntas. Usa el 3D para contextualizar. El avance del pie de página se actualiza al completar pasos; luego guarda o envía calificación.';
$string['practice_kicker'] = 'Práctica guiada — completa los 3 pasos (demostración de competencias)';
$string['practice_order_hint'] = 'Pulsa cada etapa en el orden real del proceso minero (un botón tras otro).';
$string['practice_order_drag_hint'] = 'Arrastra cada fila (☰ orden) para dejar arriba la primera etapa del ciclo real y abajo la última. Luego pulsa Verificar.';
$string['practice_aside_tip'] = 'Responde en este panel de la actividad. El modelo 3D solo gira si arrastras sobre la vista central; evita hacer clic muy cerca del borde de la pantalla, donde está el menú del curso.';
$string['practice_cycle_order_intro'] = 'En la vista 3D, bajo el modelo, pulsa <strong>Etapas del ciclo</strong>: la cámara se centrará en <strong>Perforación</strong>, <strong>Carguío</strong>, <strong>Transporte</strong> o <strong>Botadero</strong>. Después ordena las cuatro etapas arrastrando las filas.';
$string['pit_cycle_tour_label'] = 'Etapas:';
$string['pit_cycle_stage_perf'] = 'Perforación';
$string['pit_cycle_stage_load'] = 'Carguío';
$string['pit_cycle_stage_haul'] = 'Transporte';
$string['pit_cycle_stage_dump'] = 'Botadero';
$string['practice_data_focus'] = 'Los números y escenas son bases de práctica didáctica (no sustituyen bases de datos de mina, software tipo RecMin ni estudios reales).';
$string['flow_competency_hint'] = 'Secuencia tipo planta: vinculada a competencias de proceso mineral (preparación y metalurgia) y trazabilidad de flujos masivos.';
$string['office_sensitivity_title'] = 'Sensibilidad económica (VPN indicativa)';
$string['office_sensitivity_blurb'] = 'Ajusta inversión, tasa y horizonte para ver el efecto en la VPN del modelo didáctico (bloques de decisión tipo estudio de pre-factibilidad).';
$string['english_hud_prompt'] = 'Briefing de radio en faena — completa la práctica guiada a la derecha (C5 comunicación técnica).';
$string['scene_legend_algebra'] = 'Escena 3D: frente de voladura con barrenos; el marco simboliza la matriz 2×2 (cargas). No es túnel con rieles.';
$string['scene_legend_tunnel'] = 'Escena 3D: recorrido interior — arrastra para mirar; rueda del ratón o pellizco (trackpad) para avanzar o retroceder por la galería. Rieles, cerchas, boca de acceso, flechas en el piso, lámparas y carteles DS N° 132 (EPP, evacuación, ventilación).';
$string['scene_legend_pit'] = 'Escena 3D: tajo (vista tipo plano) — líneas azules = bancos y bermas; franja oscura = rampa; curvas exteriores = terreno; equipos en niveles.';
$string['scene_legend_pit_berm'] = 'Berma de referencia (paso 1): ## m.';
$string['scene_legend_pit_cycle'] = 'Ciclo de rajo: camiones de acarreo en rampa helicoidal, perforadoras, excavadora y botadero. Usa «Etapas» para enfocar cada fase. Escala didáctica.';
$string['pit_preset_iso'] = 'Vista ISO';
$string['pit_preset_plan'] = 'Planta';
$string['pit_preset_section'] = 'Perfil';
$string['pit_measure_toggle'] = 'Medir distancia';
$string['pit_clear_measure'] = 'Borrar medición';
$string['pit_layer_contours'] = 'Contornos';
$string['pit_layer_equip'] = 'Equipos';
$string['pit_measure_hint'] = 'Modo medición: al arrastrar no orbita; haz clic en el modelo para dos puntos. Zoom: rueda o pellizco (Ctrl+desplazamiento).';
$string['pit_dist_label'] = 'Distancia';
$string['lab_fullscreen'] = 'Pantalla completa';
$string['lab_exit_fullscreen'] = 'Salir de pantalla completa';
$string['lab_flow_instruction'] = 'Activa las etapas en orden (de mina a producto). Cada clic debe seguir la secuencia metalúrgica correcta.';
$string['lab_flow_sequence'] = 'Secuencia:';
$string['lab_flow_reset'] = 'Reiniciar';
$string['lab_thesis_hint'] = 'Arrastra los bloques en el panel izquierdo hasta el orden lógico de un informe de título.';
$string['lab_thesis_check'] = 'Comprobar orden';
$string['progress_label'] = 'Progreso hacia la finalización';
$string['progress_save'] = 'Guardar progreso (borrador)';
$string['progress_final'] = 'Enviar calificación final';
$string['progress_done'] = 'Calificación registrada — puedes seguir revisando el escenario.';
$string['progress_no_grade'] = 'Esta actividad no tiene nota (nota máxima 0). El progreso igual se guarda.';
$string['privacy:metadata'] = 'Se guarda el progreso y la calificación de cada estudiante en la base de datos del módulo (tabla minaslab_user_state), además del registro estándar de Moodle.';
$string['privacy:metadata:minaslab_user_state'] = 'Progreso y calificación de la práctica interactiva.';
$string['privacy:metadata:minaslab_user_state:minaslabid'] = 'Identificador de la instancia MinasLab.';
$string['privacy:metadata:minaslab_user_state:userid'] = 'Identificador del usuario.';
$string['privacy:metadata:minaslab_user_state:progressjson'] = 'Estado de avance (JSON).';
$string['privacy:metadata:minaslab_user_state:finalgrade'] = 'Nota final enviada al libro de calificaciones.';
$string['privacy:metadata:minaslab_user_state:completed'] = 'Si la actividad quedó cerrada para edición.';
$string['privacy:metadata:minaslab_user_state:timecompleted'] = 'Marca de tiempo de finalización.';
$string['privacy:metadata:minaslab_user_state:timecreated'] = 'Creación del registro.';
$string['privacy:metadata:minaslab_user_state:timemodified'] = 'Última modificación.';

$string['minaslab:addinstance'] = 'Añadir actividad MinasLab';
$string['minaslab:view'] = 'Ver MinasLab';
$string['minaslab:viewcoursereport'] = 'Ver informes MinasLab del curso (progreso y calificaciones)';

$string['coursereport_nav'] = 'Informe MinasLab';
$string['coursereport_title'] = 'Informe MinasLab por curso';
$string['coursereport_intro'] = 'Actividades MinasLab en este curso: inscritos con permiso de ver la actividad, cuántos tienen progreso guardado, finalizaciones enviadas y nota media (solo si la actividad tiene calificación).';
$string['coursereport_catalog_hint'] = 'Catálogo global del plugin: {$a} prácticas curriculares (combinación asignatura + escenario) disponibles al crear cada actividad.';
$string['coursereport_no_instances'] = 'No hay actividades MinasLab en este curso.';
$string['coursereport_col_activity'] = 'Actividad';
$string['coursereport_col_practice'] = 'Clave de práctica';
$string['coursereport_col_subject'] = 'Asignatura (catálogo)';
$string['coursereport_col_enrolled'] = 'Inscritos';
$string['coursereport_col_withprogress'] = 'Con progreso';
$string['coursereport_col_completed'] = 'Finalizados';
$string['coursereport_col_avggrade'] = 'Nota media';
$string['coursereport_col_actions'] = 'Detalle';
$string['coursereport_open_detail'] = 'Estudiantes';

$string['instancereport_title'] = 'Detalle MinasLab';
$string['instancereport_meta'] = 'Práctica: <strong>{$a->key}</strong> — {$a->practice} (arquetipo: {$a->archetype}). Nota máxima del ítem: {$a->grademax}.';
$string['instancereport_export_csv'] = 'Descargar CSV';
$string['instancereport_col_progress'] = 'Progreso (borrador %)';
$string['instancereport_col_final'] = 'Nota final';
$string['instancereport_col_done'] = 'Cerrado';
$string['instancereport_col_updated'] = 'Última modificación';
$string['instancereport_noprog'] = 'Sin datos';
