<?php
// This file is part of Moodle - http://moodle.org/

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

global $CFG, $DB, $OUTPUT, $PAGE;

$id = required_param('id', PARAM_INT);

$cm = get_coursemodule_from_id('minaslab', $id, 0, false, MUST_EXIST);
$course = get_course($cm->course);
$minaslab = $DB->get_record('minaslab', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/minaslab:view', $context);

$event = \core\event\course_module_viewed::create([
    'objectid' => $minaslab->id,
    'context' => $context,
]);
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('minaslab', $minaslab);
$event->trigger();

$completion = new completion_info($course);
$completion->set_module_viewed($cm);

$PAGE->set_url('/mod/minaslab/view.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($minaslab->name));
$PAGE->set_heading($course->fullname);
$PAGE->set_activity_record($minaslab);
$PAGE->requires->css(new moodle_url('/mod/minaslab/styles.css'));

$entry = \mod_minaslab\local\activity_catalog::get($minaslab->activity_key);
if (!$entry) {
    $entry = \mod_minaslab\local\activity_catalog::get(\mod_minaslab\local\activity_catalog::default_key());
}

$str = function(string $key) {
    return get_string($key, 'mod_minaslab');
};

$config = [
    'wwwroot' => $CFG->wwwroot,
    'cmid' => $cm->id,
    'sesskey' => sesskey(),
    'grademax' => (float) $minaslab->grade,
    'activityKey' => $minaslab->activity_key,
    'activity' => $entry,
    'author' => $str('author_name'),
    'authorRole' => $str('author_role'),
    'strings' => [
        'tagline' => $str('lab_intro_tagline'),
        'objectives' => $str('lab_objectives'),
        'feedbackOk' => $str('lab_feedback_ok'),
        'feedbackRetry' => $str('lab_feedback_retry'),
        'check' => $str('lab_check'),
        'next' => $str('lab_next'),
        'hint' => $str('lab_hint'),
        'drag3d' => $str('lab_3d_drag'),
        'conceptual' => $str('lab_conceptual'),
        'profileLabel' => $str('profile_label'),
        'progressSave' => $str('progress_save'),
        'progressFinal' => $str('progress_final'),
        'progressLabel' => $str('progress_label'),
        'progressDone' => $str('progress_done'),
        'progressNoGrade' => $str('progress_no_grade'),
        'flowInstruction' => $str('lab_flow_instruction'),
        'flowSequence' => $str('lab_flow_sequence'),
        'flowReset' => $str('lab_flow_reset'),
        'thesisHint' => $str('lab_thesis_hint'),
        'thesisCheck' => $str('lab_thesis_check'),
    ],
];

$PAGE->requires->js_call_amd('mod_minaslab/lab', 'init', [$config]);

echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($minaslab->name));

if (trim($minaslab->intro ?? '')) {
    echo $OUTPUT->box(format_module_intro('minaslab', $minaslab, $cm->id), 'generalbox mod_introbox minaslab-intro');
}

$profile = $entry['profile'] ?? [];
$profilebadges = [];
foreach ($profile as $p) {
    $profilebadges[] = 'C' . (int) $p;
}

$templatecontext = [
    'name' => format_string($minaslab->name),
    'activitytitle' => format_string($entry['title'] ?? ''),
    'subjectname' => format_string($entry['subject_name'] ?? ''),
    'summary' => s($entry['summary'] ?? ''),
    'tagline' => $str('lab_intro_tagline'),
    'author' => $str('author_name'),
    'authorrole' => $str('author_role'),
    'authorfooter' => $str('author_footer'),
    'profilelabel' => $str('profile_label'),
    'profilebadges' => $profilebadges,
];

echo $OUTPUT->render_from_template('mod_minaslab/view', $templatecontext);

echo $OUTPUT->footer();
