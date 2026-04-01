<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'MinasLab — Virtual mining lab';
$string['modulenameplural'] = 'MinasLab activities';
$string['pluginname'] = 'MinasLab';
$string['pluginadministration'] = 'MinasLab administration';
$string['minaslabname'] = 'Activity name';
$string['minaslabname_help'] = 'Title shown in the course and at the top of the activity.';
$string['practice_section'] = 'Curricular practice';
$string['activity_key'] = 'Practice (subject + scenario)';
$string['activity_key_help'] = 'Choose one of 84 practices (3 per subject), aligned with the degree programme and graduate profile. Each combines an interactive scenario (3D mine, pit, workshop, etc.) and learning objectives.';
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
$string['lab_3d_drag'] = 'Drag to orbit · scroll to zoom';
$string['lab_conceptual'] = 'Educational simulation — not a substitute for field studies or legal/engineering sign-off.';
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
