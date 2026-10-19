<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'MinasLab — Laboratorio virtual minero';
$string['modulenameplural'] = 'Actividades MinasLab';
$string['modulename_help'] = <<<'MINASLABHELP'
<div style="max-width:100%;font-size:0.92em;line-height:1.5;color:#1d2125;">
<div style="padding:10px 12px;margin-bottom:10px;border-radius:10px;border-left:5px solid #f4a23a;background:linear-gradient(90deg,rgba(244,162,58,0.14),rgba(61,214,198,0.08));box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<strong style="font-size:1.05em;">MinasLab</strong> — <strong>5 evaluaciones prácticas semestrales ★</strong> (una por semestre, con datos únicos por estudiante, corrección automática, guardado continuo y nota en escala 1,0–7,0) y <strong>84 prácticas curriculares</strong> (3 por asignatura) con escenarios interactivos 3D/2D: galerías, rajos, planta metalúrgica, ventilación, taller numérico, seguridad, topografía, oficina técnica, inglés minero, perforación, tesis e innovación. Cada instancia elige <strong>una</strong> práctica del catálogo al crear la actividad.
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
$string['activity_key_help'] = 'Las opciones marcadas con ★ son evaluaciones prácticas semestrales calificadas automáticamente. Elige una de las 84 prácticas (3 por asignatura), alineadas al programa de carrera y al perfil de egreso. Cada una combina un escenario interactivo (mina 3D, rajo, taller, etc.) y objetivos de aprendizaje.';
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

// Evaluaciones prácticas semestrales.
$string['minaslab:submit'] = 'Responder evaluaciones prácticas MinasLab';
$string['minaslab:manageattempts'] = 'Gestionar intentos de evaluaciones prácticas (reiniciar y revisar)';
$string['eval_settings'] = 'Evaluación práctica semestral';
$string['eval_settings_info'] = 'Estos parámetros aplican a las actividades marcadas con ★ (evaluaciones prácticas con corrección automática en servidor). Cada estudiante recibe datos propios y su avance se guarda automáticamente.';
$string['eval_maxtries'] = 'Intentos por tarea';
$string['eval_maxtries_help'] = 'Número máximo de envíos por tarea. La tarea se cierra al responder correctamente o al agotar los intentos.';
$string['eval_penalty'] = 'Penalización por reintento';
$string['eval_penalty_help'] = 'Porcentaje que se descuenta del puntaje de la tarea por cada intento adicional. Se conserva el mejor puntaje obtenido.';
$string['eval_showsolution'] = 'Mostrar desarrollo al cerrar la tarea';
$string['eval_showsolution_help'] = 'Si se activa, al cerrar una tarea el estudiante ve la respuesta correcta y el desarrollo numérico con sus propios datos.';
$string['eval_passpercent'] = 'Exigencia para nota 4,0';
$string['eval_passpercent_help'] = 'Porcentaje de logro requerido para obtener nota 4,0 en la escala chilena de 1,0 a 7,0 (por defecto 60 %).';
$string['eval_alreadyfinished'] = 'La evaluación ya fue finalizada.';
$string['eval_invalidtask'] = 'La tarea indicada no existe en esta evaluación.';
$string['eval_taskclosed'] = 'Esta tarea ya está cerrada.';
$string['eval_drafttoolarge'] = 'El avance guardado supera el tamaño permitido.';
$string['eval_notevaluation'] = 'Esta actividad no es una evaluación práctica.';
$string['event_task_answered'] = 'Tarea de evaluación respondida';
$string['event_evaluation_finished'] = 'Evaluación práctica finalizada';
$string['event_attempt_reset'] = 'Evaluación práctica reiniciada';
$string['reset_attempts'] = 'Eliminar avances, respuestas y calificaciones de MinasLab';
$string['results_title'] = 'Resultados de la evaluación';
$string['results_intro'] = 'Resultados por estudiante: puntaje de cada tarea, logro por resultado de aprendizaje y nota en escala 1,0–7,0 (exigencia {$a} %).';
$string['results_student'] = 'Estudiante';
$string['results_status'] = 'Estado';
$string['results_notstarted'] = 'Sin iniciar';
$string['results_inprogress'] = 'En curso';
$string['results_finished'] = 'Finalizada';
$string['results_percent'] = 'Logro';
$string['results_chile'] = 'Nota';
$string['results_grade'] = 'Calificación';
$string['results_review'] = 'Revisar';
$string['results_reset'] = 'Reiniciar';
$string['results_reset_confirm'] = '¿Reiniciar la evaluación de {$a}? Se eliminarán sus respuestas y calificación, y recibirá un caso nuevo con otros datos.';
$string['results_reset_done'] = 'La evaluación fue reiniciada.';
$string['results_download'] = 'Descargar CSV';
$string['results_ra_summary'] = 'Logro promedio del curso por resultado de aprendizaje';
$string['results_none'] = 'Aún no hay estudiantes con avance en esta evaluación.';
$string['results_lastsaved'] = 'Último guardado';
$string['review_title'] = 'Revisión de la evaluación de {$a}';
$string['review_task'] = 'Tarea';
$string['review_response'] = 'Respuesta del estudiante';
$string['review_correct'] = 'Respuesta correcta';
$string['review_tries'] = 'Intentos';
$string['review_score'] = 'Puntaje';
$string['review_draft'] = 'Borrador (sin enviar)';
$string['review_notes'] = 'Notas de la libreta de campo';
$string['review_measures'] = 'Mediciones registradas';
$string['privacy:metadata:minaslab_response'] = 'Respuestas corregidas de cada tarea de la evaluación práctica.';
$string['privacy:metadata:minaslab_response:minaslabid'] = 'Identificador de la instancia MinasLab.';
$string['privacy:metadata:minaslab_response:userid'] = 'Identificador del usuario.';
$string['privacy:metadata:minaslab_response:taskid'] = 'Identificador de la tarea.';
$string['privacy:metadata:minaslab_response:response'] = 'Última respuesta enviada.';
$string['privacy:metadata:minaslab_response:score'] = 'Puntaje obtenido en la tarea.';
$string['privacy:metadata:minaslab_response:tries'] = 'Número de intentos.';
$string['privacy:metadata:minaslab_response:timemodified'] = 'Fecha del último envío.';
$string['privacy:metadata:core_grades'] = 'La calificación final se envía al libro de calificaciones.';
$string['evui_semester'] = 'Semestre';
$string['evui_curriculum'] = 'Resultados de aprendizaje y competencias evaluadas';
$string['evui_ra'] = 'Resultados de aprendizaje';
$string['evui_competencies'] = 'Competencias del perfil de egreso';
$string['evui_loading'] = 'Preparando la faena virtual…';
$string['evui_scene_loading'] = 'Generando terreno y equipos…';
$string['evui_previewmode'] = 'Vista previa docente: puedes resolver la evaluación para probarla. Tus respuestas no se muestran en los resultados del curso.';
$string['evui_noattempt'] = 'Puedes explorar la escena, pero no tienes permiso para responder esta evaluación.';
$string['evui_webgl_error'] = 'No fue posible iniciar el visor 3D. Verifica que tu navegador tenga WebGL activo y la aceleración por hardware habilitada.';
$string['evui_tools'] = 'Herramientas de la escena';
$string['evui_tool_explore'] = 'Explorar';
$string['evui_tool_measure'] = 'Medir';
$string['evui_tool_compass'] = 'Brújula';
$string['evui_view_iso'] = 'Vista isométrica';
$string['evui_view_plan'] = 'Vista en planta';
$string['evui_view_section'] = 'Vista de perfil';
$string['evui_layer_survey'] = 'Líneas de cresta y pata';
$string['evui_layer_underground'] = 'Ver subsuelo';
$string['evui_clear_measures'] = 'Borrar mediciones';
$string['evui_fullscreen'] = 'Pantalla completa';
$string['evui_hint_explore'] = 'Arrastra para orbitar · clic derecho o Shift para desplazar · rueda para acercar · clic en un objeto o marcador para inspeccionarlo.';
$string['evui_hint_measure'] = 'Haz clic en dos puntos. Se ajusta a líneas de cresta y pata, estacas e hitos cercanos.';
$string['evui_hint_compass'] = 'Haz clic sobre un plano de discontinuidad o una superficie para leer dirección de manteo y manteo.';
$string['evui_case'] = 'Caso';
$string['evui_tasks'] = 'Tareas de la evaluación';
$string['evui_task'] = 'Tarea';
$string['evui_weight'] = 'Ponderación';
$string['evui_triesleft'] = 'Intentos disponibles: {$a->left} de {$a->max}';
$string['evui_submit'] = 'Enviar respuesta';
$string['evui_gotoscene'] = 'Ir a la escena';
$string['evui_showhint'] = 'Ver pista';
$string['evui_correct'] = 'Correcto';
$string['evui_partial'] = 'Parcialmente correcto';
$string['evui_incorrect'] = 'Incorrecto';
$string['evui_invalid'] = 'La respuesta no tiene un formato válido. Usa solo números (coma o punto decimal, sin separador de miles).';
$string['evui_notanswered'] = 'Sin respuesta';
$string['evui_closed'] = 'tarea cerrada';
$string['evui_scoretask'] = 'puntaje';
$string['evui_correctanswer'] = 'Respuesta correcta';
$string['evui_youranswer'] = 'Tu respuesta';
$string['evui_inprogress'] = 'En curso';
$string['evui_pending'] = 'Pendiente';
$string['evui_drafted'] = 'Respuesta en borrador';
$string['evui_notebook'] = 'Libreta de campo';
$string['evui_notes'] = 'Notas y cálculos';
$string['evui_notesplaceholder'] = 'Anota aquí tus datos y desarrollo. Se guarda automáticamente.';
$string['evui_nomeasures'] = 'Aún no hay mediciones. Usa Medir o Brújula en la escena.';
$string['evui_measure_first'] = 'Primer punto fijado. Haz clic en el segundo punto.';
$string['evui_measure_d'] = 'Distancia inclinada';
$string['evui_measure_dh'] = 'Distancia horizontal (DH)';
$string['evui_measure_dz'] = 'Desnivel (ΔZ)';
$string['evui_measure_az'] = 'Azimut';
$string['evui_measure_slope'] = 'Pendiente';
$string['evui_snapped'] = 'ajustado a referencia topográfica';
$string['evui_compass_dd'] = 'Dirección de manteo';
$string['evui_compass_dip'] = 'Manteo';
$string['evui_compass_surface'] = 'Superficie del talud';
$string['evui_info_close'] = 'Cerrar ficha';
$string['evui_mark_answer'] = 'Marcar como respuesta';
$string['evui_unmark_answer'] = 'Quitar de la respuesta';
$string['evui_selected'] = 'Seleccionado como respuesta';
$string['evui_select_in_scene'] = 'Puedes seleccionar la opción desde su ficha en la escena.';
$string['evui_order_hint'] = 'Arrastra los elementos o usa las flechas para ordenarlos.';
$string['evui_moveup'] = 'Subir';
$string['evui_movedown'] = 'Bajar';
$string['evui_number_placeholder'] = 'Ej.: 12,5';
$string['evui_answer_required'] = 'Ingresa una respuesta antes de enviar.';
$string['evui_achievement'] = 'Logro ponderado';
$string['evui_grade_cl'] = 'Nota estimada (1,0–7,0)';
$string['evui_grade_cl_final'] = 'Nota final (1,0–7,0)';
$string['evui_progress'] = 'Tareas cerradas';
$string['evui_gradebook'] = 'Libro de calificaciones';
$string['evui_finish'] = 'Finalizar evaluación';
$string['evui_finish_help'] = 'Al finalizar se publica tu calificación y se muestran las soluciones. Tu avance se guarda automáticamente mientras trabajas.';
$string['evui_finish_confirm_title'] = 'Finalizar evaluación';
$string['evui_finish_confirm'] = 'Se publicará tu calificación y no podrás modificar tus respuestas. ¿Deseas finalizar?';
$string['evui_finish_unanswered'] = 'Tienes {$a} tarea(s) sin cerrar: se calificarán con el puntaje obtenido hasta ahora. ¿Deseas finalizar de todos modos?';
$string['evui_final_title'] = 'Evaluación finalizada';
$string['evui_final_detail'] = 'Logro ponderado {$a->pct} % · exigencia {$a->pass} % para nota 4,0';
$string['evui_ra_attainment'] = 'Logro por resultado de aprendizaje';
$string['evui_saved'] = 'Avance guardado a las {$a}';
$string['evui_saving'] = 'Guardando avance…';
$string['evui_unsaved'] = 'Cambios sin guardar';
$string['evui_savefailed'] = 'No se pudo guardar; se reintentará automáticamente.';
$string['evui_core_aria'] = 'Esquema de los trozos de testigo en la caja';
$string['evui_core_legend'] = 'Gris oscuro: trozos ≥ 10 cm · claro: fragmentos < 10 cm. Números: longitud en cm.';
$string['evui_qaqc_aria'] = 'Carta de control del estándar certificado';
$string['evui_env_night'] = 'Turno de noche (focos y torres de iluminación)';
$string['evui_env_wind'] = 'Viento con polvo en suspensión';
$string['evui_env_fog'] = 'Neblina costera (camanchaca)';
