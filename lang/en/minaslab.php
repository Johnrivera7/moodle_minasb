<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'MinasLab — Virtual mining lab';
$string['modulenameplural'] = 'MinasLab activities';
$string['modulename_help'] = <<<'MINASLABHELP'
<div style="max-width:100%;font-size:0.92em;line-height:1.5;color:#1d2125;">
<div style="padding:10px 12px;margin-bottom:10px;border-radius:10px;border-left:5px solid #f4a23a;background:linear-gradient(90deg,rgba(244,162,58,0.14),rgba(61,214,198,0.08));box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<strong style="font-size:1.05em;">MinasLab</strong> — <strong>5 semester practical assessments ★</strong> (one per semester, with per-student data, automatic grading, continuous autosave and a 1.0–7.0 grade) and <strong>84 curricular practices</strong> (3 per subject) with interactive 3D/2D scenarios: tunnels, open pits, metallurgical flow, ventilation, math labs, safety, surveying, technical office, mining English, drilling, thesis structure and innovation. Each activity instance selects <strong>one</strong> practice from the catalog when you create it.
</div>
<p><strong>Purpose:</strong> Reinforce official syllabi, graduate profile outcomes and competencies C1–C6, with optional progress and gradebook integration.</p>
<p><strong>28 subjects</strong> (3 practices each):</p>
<ul style="margin:6px 0 10px 18px;padding:0;column-count:2;column-gap:18px;">
<li>Algebra</li>
<li>Fundamentals of Mining Operations</li>
<li>Mineral Processing Elements</li>
<li>Technical English</li>
<li>Risk Prevention</li>
<li>Surveying and Plan Reading</li>
<li>Calculus</li>
<li>Advanced Physics</li>
<li>Structural and Mining Geology</li>
<li>Probability and Statistics</li>
<li>Strength of Materials</li>
<li>Mine Surveying</li>
<li>Differential Equations</li>
<li>Rock Mechanics Elements</li>
<li>Fluid Mechanics and Thermodynamics</li>
<li>Drilling and Blasting</li>
<li>Exploration and Deposit Evaluation</li>
<li>Underground Mining Systems</li>
<li>Project Design and Evaluation</li>
<li>General Economics</li>
<li>Innovation and Technology</li>
<li>Metallurgical Processes</li>
<li>Open Pit Mining Systems</li>
<li>Mine Ventilation</li>
<li>Business Management</li>
<li>Mining Project</li>
<li>Capstone Project</li>
<li>Mining Services</li>
</ul>
<p><strong>Scenario types (archetypes)</strong></p>
<ul style="margin:6px 0 10px 18px;">
<li><strong>tunnel_3d</strong> — underground gallery 3D</li>
<li><strong>pit_3d</strong> — open pit 3D</li>
<li><strong>math_mine</strong> — numeric workshop</li>
<li><strong>flow_process</strong> — metallurgical flow</li>
<li><strong>safety_module</strong> — safety / PPE</li>
<li><strong>survey_field</strong> — surveying</li>
<li><strong>vent_shaft</strong> — ventilation</li>
<li><strong>office_sim</strong> — technical office / indicators</li>
<li><strong>english_mine</strong> — mining technical English</li>
<li><strong>drill_site</strong> — drilling (2D)</li>
<li><strong>thesis_lab</strong> — thesis report structure</li>
<li><strong>innovation_board</strong> — innovation / R&amp;D</li>
</ul>
<p><strong>Graduate profile competencies (C1–C6)</strong></p>
<ul style="margin:6px 0 10px 18px;">
<li><strong>C1</strong> — Mining operations</li>
<li><strong>C2</strong> — Sustainability and project management</li>
<li><strong>C3</strong> — Safety and risk prevention</li>
<li><strong>C4</strong> — Design, analysis and innovation</li>
<li><strong>C5</strong> — Communication (incl. technical English)</li>
<li><strong>C6</strong> — Professional and civic ethics</li>
</ul>
<div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,rgba(244,162,58,0.18),rgba(61,214,198,0.12));border:1px solid rgba(0,0,0,0.08);box-shadow:0 4px 14px rgba(244,162,58,0.15);">
<p style="margin:0 0 6px 0;"><strong style="color:#b45309;">Author</strong></p>
<p style="margin:0;"><strong>John Rivera González</strong><br />
<a href="mailto:johnriveragonzalez7@gmail.com" style="color:#0f766e;font-weight:600;">johnriveragonzalez7@gmail.com</a></p>
<p style="margin:8px 0 0 0;font-size:0.9em;opacity:0.9;">Curricular design, MinasLab integration and mining engineering scenarios.</p>
</div>
</div>
MINASLABHELP;
$string['pluginname_help'] = $string['modulename_help'];
$string['pluginname'] = 'MinasLab';
$string['pluginadministration'] = 'MinasLab administration';
$string['minaslabname'] = 'Activity name';
$string['minaslabname_help'] = 'Title shown in the course and at the top of the activity.';
$string['practice_section'] = 'Curricular practice';
$string['activity_key'] = 'Practice (subject + scenario)';
$string['activity_key_help'] = 'Options marked with ★ are automatically graded semester practical assessments. Choose one of 84 practices (3 per subject), aligned with the degree programme and graduate profile. Each combines an interactive scenario (3D mine, pit, workshop, etc.) and learning objectives.';
$string['practice_catalog_hint'] = 'The catalog links each subject from the official syllabi to competencies C1–C6 of the graduate profile: mining operations, sustainability and projects, safety, design and innovation, communication and leadership, and civic/professional ethics.';
$string['invalidactivity'] = 'Invalid practice key.';
$string['semester_group'] = 'Semester {$a}';
$string['author_name'] = 'John Rivera González';
$string['author_role'] = 'Curricular design & MinasLab integration';
$string['author_footer'] = 'Educational design and mining engineering scenarios';
$string['profile_label'] = 'Graduate profile (competencies)';
$string['lab_intro_tagline'] = 'Immersive digital practice for mining engineering';
$string['lab_objectives'] = 'Learning focus';
$string['lab_feedback_ok'] = 'Correct — well done.';
$string['lab_feedback_retry'] = 'Not quite — review the hint and try again.';
$string['lab_check'] = 'Check answer';
$string['lab_next'] = 'Continue';
$string['lab_hint'] = 'Hint';
$string['lab_3d_drag'] = 'Orbit: click-drag (or two-finger drag on trackpad). Zoom: mouse wheel or vertical scroll; on trackpad, pinch or Ctrl+scroll often works.';
$string['lab_conceptual'] = 'Educational simulation — not a substitute for field studies or legal/engineering sign-off.';
$string['lab_what_to_do'] = 'Complete the guided practice (right panel): checklists, work sequence, calculations, or questions. Use the 3D view for context. Footer progress updates as you finish steps; then save or submit your grade.';
$string['practice_kicker'] = 'Guided practice — complete all 3 steps (competency demonstration)';
$string['practice_order_hint'] = 'Click each stage in the correct real-world process order (one button after another).';
$string['practice_order_drag_hint'] = 'Drag each row to stack them: top = first stage in the real cycle, bottom = last. Then click Check.';
$string['practice_aside_tip'] = 'Answer in this activity panel. Orbit the 3D view only by dragging on the central canvas; avoid clicks very close to the screen edge where the course navigation sits.';
$string['practice_cycle_order_intro'] = 'In the 3D view, under the model, click <strong>Cycle stages</strong>: the camera frames <strong>Drilling</strong>, <strong>Loading</strong>, <strong>Haulage</strong>, or <strong>Dump</strong>. Then order the four stages by dragging the rows.';
$string['pit_cycle_tour_label'] = 'Stages:';
$string['pit_cycle_stage_perf'] = 'Drilling';
$string['pit_cycle_stage_load'] = 'Loading';
$string['pit_cycle_stage_haul'] = 'Haulage';
$string['pit_cycle_stage_dump'] = 'Dump';
$string['practice_data_focus'] = 'Numbers and scenes are didactic practice datasets (they do not replace mine databases, tools such as RecMin, or real studies).';
$string['flow_competency_hint'] = 'Plant-style sequence: ties to process-mineral competencies and traceability of mass flows.';
$string['office_sensitivity_title'] = 'Economic sensitivity (indicative NPV)';
$string['office_sensitivity_blurb'] = 'Adjust investment, discount rate, and horizon to see the effect on NPV in this teaching model (decision blocks similar to pre-feasibility studies).';
$string['english_hud_prompt'] = 'Radio briefing — complete the guided practice on the right (C5 technical communication).';
$string['scene_legend_algebra'] = '3D: blast face with drill holes; frame = 2×2 charge matrix. Not a rail tunnel.';
$string['scene_legend_tunnel'] = '3D: walkthrough interior — drag to look; mouse wheel or pinch to move forward/back along the gallery. Rails, sets, portal mouth, floor arrows, lamps and DS N° 132-style signs (PPE, evacuation, ventilation).';
$string['scene_legend_pit'] = '3D: open pit (technical-style view) — blue lines = benches/berms; dark strip = ramp; outer contours = terrain; equipment on levels.';
$string['scene_legend_pit_berm'] = 'Reference berm width (step 1): ## m.';
$string['scene_legend_pit_cycle'] = 'Open-pit cycle: haul trucks on a spiral ramp, drills, excavator and waste dump. Use «Stages» to focus each phase. Illustrative scale.';
$string['pit_preset_iso'] = 'ISO view';
$string['pit_preset_plan'] = 'Plan';
$string['pit_preset_section'] = 'Section';
$string['pit_measure_toggle'] = 'Measure distance';
$string['pit_clear_measure'] = 'Clear measurement';
$string['pit_layer_contours'] = 'Contours';
$string['pit_layer_equip'] = 'Equipment';
$string['pit_measure_hint'] = 'Measure mode: drag does not orbit; click twice on the model. Zoom still works (wheel or pinch / Ctrl+scroll).';
$string['pit_dist_label'] = 'Distance';
$string['lab_fullscreen'] = 'Full screen';
$string['lab_exit_fullscreen'] = 'Exit full screen';
$string['lab_flow_instruction'] = 'Activate the stages in order (mine to product). Each click must follow the correct metallurgical sequence.';
$string['lab_flow_sequence'] = 'Sequence:';
$string['lab_flow_reset'] = 'Reset';
$string['lab_thesis_hint'] = 'Drag the blocks in the left panel into the logical order for a thesis report.';
$string['lab_thesis_check'] = 'Check order';
$string['progress_label'] = 'Progress toward completion';
$string['progress_save'] = 'Save progress (draft)';
$string['progress_final'] = 'Submit final grade';
$string['progress_done'] = 'Graded — you can still review the scene.';
$string['progress_no_grade'] = 'This activity is not graded (max grade 0). Progress is still saved.';
$string['privacy:metadata'] = 'Each student\'s practice progress and grade are stored in the module database (minaslab_user_state table), in addition to standard Moodle logging.';
$string['privacy:metadata:minaslab_user_state'] = 'Interactive practice progress and grade.';
$string['privacy:metadata:minaslab_user_state:minaslabid'] = 'MinasLab instance id.';
$string['privacy:metadata:minaslab_user_state:userid'] = 'User id.';
$string['privacy:metadata:minaslab_user_state:progressjson'] = 'Progress state (JSON).';
$string['privacy:metadata:minaslab_user_state:finalgrade'] = 'Final grade sent to the gradebook.';
$string['privacy:metadata:minaslab_user_state:completed'] = 'Whether the attempt is closed for editing.';
$string['privacy:metadata:minaslab_user_state:timecompleted'] = 'Completion time.';
$string['privacy:metadata:minaslab_user_state:timecreated'] = 'Record creation time.';
$string['privacy:metadata:minaslab_user_state:timemodified'] = 'Last modification time.';

$string['minaslab:addinstance'] = 'Add a new MinasLab activity';
$string['minaslab:view'] = 'View MinasLab content';
$string['minaslab:viewcoursereport'] = 'View MinasLab course reports (progress and grades)';

$string['coursereport_nav'] = 'MinasLab report';
$string['coursereport_title'] = 'MinasLab course report';
$string['coursereport_intro'] = 'MinasLab activities in this course: enrolled users who can view the activity, how many have saved progress, completed attempts, and mean grade (only when the activity is graded).';
$string['coursereport_catalog_hint'] = 'Global plugin catalog: {$a} curricular practices (subject + scenario) available when creating each activity.';
$string['coursereport_no_instances'] = 'There are no MinasLab activities in this course.';
$string['coursereport_col_activity'] = 'Activity';
$string['coursereport_col_practice'] = 'Practice key';
$string['coursereport_col_subject'] = 'Subject (catalog)';
$string['coursereport_col_enrolled'] = 'Enrolled';
$string['coursereport_col_withprogress'] = 'With progress';
$string['coursereport_col_completed'] = 'Completed';
$string['coursereport_col_avggrade'] = 'Mean grade';
$string['coursereport_col_actions'] = 'Detail';
$string['coursereport_open_detail'] = 'Students';

$string['instancereport_title'] = 'MinasLab detail';
$string['instancereport_meta'] = 'Practice: <strong>{$a->key}</strong> — {$a->practice} (archetype: {$a->archetype}). Max grade item: {$a->grademax}.';
$string['instancereport_export_csv'] = 'Download CSV';
$string['instancereport_col_progress'] = 'Progress (draft %)';
$string['instancereport_col_final'] = 'Final grade';
$string['instancereport_col_done'] = 'Closed';
$string['instancereport_col_updated'] = 'Last updated';
$string['instancereport_noprog'] = 'No data';

// Evaluaciones prácticas semestrales.
$string['minaslab:submit'] = 'Answer MinasLab practical assessments';
$string['minaslab:manageattempts'] = 'Manage practical assessment attempts (reset and review)';
$string['eval_settings'] = 'Semester practical assessment';
$string['eval_settings_info'] = 'These settings apply to activities marked with ★ (practical assessments with automatic server-side grading). Each student receives their own data and their progress is saved automatically.';
$string['eval_maxtries'] = 'Attempts per task';
$string['eval_maxtries_help'] = 'Maximum number of submissions per task. A task closes when answered correctly or when attempts run out.';
$string['eval_penalty'] = 'Penalty per retry';
$string['eval_penalty_help'] = 'Percentage deducted from the task score for each additional attempt. The best score obtained is kept.';
$string['eval_showsolution'] = 'Show worked solution when a task closes';
$string['eval_showsolution_help'] = 'If enabled, when a task closes the student sees the correct answer and the worked solution with their own data.';
$string['eval_passpercent'] = 'Pass threshold (grade 4.0)';
$string['eval_passpercent_help'] = 'Achievement required to obtain 4.0 on the Chilean 1.0–7.0 scale (default 60 %).';
$string['eval_alreadyfinished'] = 'The assessment has already been finished.';
$string['eval_invalidtask'] = 'The task does not exist in this assessment.';
$string['eval_taskclosed'] = 'This task is already closed.';
$string['eval_drafttoolarge'] = 'The saved progress exceeds the allowed size.';
$string['eval_notevaluation'] = 'This activity is not a practical assessment.';
$string['event_task_answered'] = 'Assessment task answered';
$string['event_evaluation_finished'] = 'Practical assessment finished';
$string['event_attempt_reset'] = 'Practical assessment reset';
$string['reset_attempts'] = 'Delete MinasLab progress, answers and grades';
$string['results_title'] = 'Assessment results';
$string['results_intro'] = 'Results per student: score for each task, achievement per learning outcome and grade on the 1.0–7.0 scale (threshold {$a} %).';
$string['results_student'] = 'Student';
$string['results_status'] = 'Status';
$string['results_notstarted'] = 'Not started';
$string['results_inprogress'] = 'In progress';
$string['results_finished'] = 'Finished';
$string['results_percent'] = 'Achievement';
$string['results_chile'] = 'Grade';
$string['results_grade'] = 'Gradebook';
$string['results_review'] = 'Review';
$string['results_reset'] = 'Reset';
$string['results_reset_confirm'] = 'Reset the assessment of {$a}? Their answers and grade will be deleted and they will receive a new case with different data.';
$string['results_reset_done'] = 'The assessment was reset.';
$string['results_download'] = 'Download CSV';
$string['results_ra_summary'] = 'Course average achievement per learning outcome';
$string['results_none'] = 'No students have progress in this assessment yet.';
$string['results_lastsaved'] = 'Last saved';
$string['review_title'] = 'Assessment review for {$a}';
$string['review_task'] = 'Task';
$string['review_response'] = 'Student answer';
$string['review_correct'] = 'Correct answer';
$string['review_tries'] = 'Attempts';
$string['review_score'] = 'Score';
$string['review_draft'] = 'Draft (not submitted)';
$string['review_notes'] = 'Field notebook notes';
$string['review_measures'] = 'Recorded measurements';
$string['privacy:metadata:minaslab_response'] = 'Graded answers for each practical assessment task.';
$string['privacy:metadata:minaslab_response:minaslabid'] = 'MinasLab instance id.';
$string['privacy:metadata:minaslab_response:userid'] = 'User id.';
$string['privacy:metadata:minaslab_response:taskid'] = 'Task id.';
$string['privacy:metadata:minaslab_response:response'] = 'Last submitted answer.';
$string['privacy:metadata:minaslab_response:score'] = 'Score obtained in the task.';
$string['privacy:metadata:minaslab_response:tries'] = 'Number of attempts.';
$string['privacy:metadata:minaslab_response:timemodified'] = 'Time of last submission.';
$string['privacy:metadata:core_grades'] = 'The final grade is sent to the gradebook.';
$string['evui_semester'] = 'Semester';
$string['evui_curriculum'] = 'Assessed learning outcomes and competencies';
$string['evui_ra'] = 'Learning outcomes';
$string['evui_competencies'] = 'Graduate profile competencies';
$string['evui_loading'] = 'Preparing the virtual mine site…';
$string['evui_scene_loading'] = 'Generating terrain and equipment…';
$string['evui_previewmode'] = 'Teacher preview: you can solve the assessment to try it out. Your answers are not shown in course results.';
$string['evui_noattempt'] = 'You can explore the scene, but you are not allowed to answer this assessment.';
$string['evui_webgl_error'] = 'The 3D viewer could not start. Make sure WebGL and hardware acceleration are enabled in your browser.';
$string['evui_tools'] = 'Scene tools';
$string['evui_tool_explore'] = 'Explore';
$string['evui_tool_measure'] = 'Measure';
$string['evui_tool_compass'] = 'Compass';
$string['evui_view_iso'] = 'Isometric view';
$string['evui_view_plan'] = 'Plan view';
$string['evui_view_section'] = 'Profile view';
$string['evui_layer_survey'] = 'Crest and toe lines';
$string['evui_layer_underground'] = 'Show subsurface';
$string['evui_clear_measures'] = 'Clear measurements';
$string['evui_fullscreen'] = 'Full screen';
$string['evui_hint_explore'] = 'Drag to orbit · right-click or Shift to pan · wheel to zoom · click an object or marker to inspect it.';
$string['evui_hint_measure'] = 'Click two points. Snaps to nearby crest/toe lines, stakes and survey marks.';
$string['evui_hint_compass'] = 'Click a discontinuity plane or a surface to read dip direction and dip.';
$string['evui_case'] = 'Case';
$string['evui_tasks'] = 'Assessment tasks';
$string['evui_task'] = 'Task';
$string['evui_weight'] = 'Weight';
$string['evui_triesleft'] = 'Attempts left: {$a->left} of {$a->max}';
$string['evui_submit'] = 'Submit answer';
$string['evui_gotoscene'] = 'Go to scene';
$string['evui_showhint'] = 'Show hint';
$string['evui_correct'] = 'Correct';
$string['evui_partial'] = 'Partially correct';
$string['evui_incorrect'] = 'Incorrect';
$string['evui_invalid'] = 'The answer format is not valid. Use numbers only (comma or point as decimal separator, no thousands separator).';
$string['evui_notanswered'] = 'Not answered';
$string['evui_closed'] = 'task closed';
$string['evui_scoretask'] = 'score';
$string['evui_correctanswer'] = 'Correct answer';
$string['evui_youranswer'] = 'Your answer';
$string['evui_inprogress'] = 'In progress';
$string['evui_pending'] = 'Pending';
$string['evui_drafted'] = 'Draft answer';
$string['evui_notebook'] = 'Field notebook';
$string['evui_notes'] = 'Notes and calculations';
$string['evui_notesplaceholder'] = 'Write your data and calculations here. Saved automatically.';
$string['evui_nomeasures'] = 'No measurements yet. Use Measure or Compass in the scene.';
$string['evui_measure_first'] = 'First point set. Click the second point.';
$string['evui_measure_d'] = 'Slope distance';
$string['evui_measure_dh'] = 'Horizontal distance (HD)';
$string['evui_measure_dz'] = 'Elevation difference (ΔZ)';
$string['evui_measure_az'] = 'Azimuth';
$string['evui_measure_slope'] = 'Grade';
$string['evui_snapped'] = 'snapped to survey reference';
$string['evui_compass_dd'] = 'Dip direction';
$string['evui_compass_dip'] = 'Dip';
$string['evui_compass_surface'] = 'Slope surface';
$string['evui_info_close'] = 'Close';
$string['evui_mark_answer'] = 'Mark as answer';
$string['evui_unmark_answer'] = 'Remove from answer';
$string['evui_selected'] = 'Selected as answer';
$string['evui_select_in_scene'] = 'You can select the option from its card in the scene.';
$string['evui_order_hint'] = 'Drag the items or use the arrows to order them.';
$string['evui_moveup'] = 'Move up';
$string['evui_movedown'] = 'Move down';
$string['evui_number_placeholder'] = 'e.g. 12.5';
$string['evui_answer_required'] = 'Enter an answer before submitting.';
$string['evui_achievement'] = 'Weighted achievement';
$string['evui_grade_cl'] = 'Estimated grade (1.0–7.0)';
$string['evui_grade_cl_final'] = 'Final grade (1.0–7.0)';
$string['evui_progress'] = 'Closed tasks';
$string['evui_gradebook'] = 'Gradebook';
$string['evui_finish'] = 'Finish assessment';
$string['evui_finish_help'] = 'Finishing publishes your grade and reveals the solutions. Your progress is saved automatically while you work.';
$string['evui_finish_confirm_title'] = 'Finish assessment';
$string['evui_finish_confirm'] = 'Your grade will be published and you will not be able to change your answers. Finish now?';
$string['evui_finish_unanswered'] = 'You have {$a} task(s) not closed: they will be graded with the score obtained so far. Finish anyway?';
$string['evui_final_title'] = 'Assessment finished';
$string['evui_final_detail'] = 'Weighted achievement {$a->pct} % · threshold {$a->pass} % for grade 4.0';
$string['evui_ra_attainment'] = 'Achievement per learning outcome';
$string['evui_saved'] = 'Progress saved at {$a}';
$string['evui_saving'] = 'Saving progress…';
$string['evui_unsaved'] = 'Unsaved changes';
$string['evui_savefailed'] = 'Could not save; it will retry automatically.';
$string['evui_core_aria'] = 'Diagram of core pieces in the tray';
$string['evui_core_legend'] = 'Dark: pieces ≥ 10 cm · light: fragments < 10 cm. Numbers: length in cm.';
$string['evui_qaqc_aria'] = 'Certified standard control chart';
