<?php
// This file is part of Moodle - http://moodle.org/

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

global $DB, $OUTPUT, $PAGE;

$id = required_param('id', PARAM_INT);

$course = $DB->get_record('course', ['id' => $id], '*', MUST_EXIST);
require_course_login($course);

$coursecontext = context_course::instance($course->id);

$PAGE->set_pagelayout('incourse');
$PAGE->set_url('/mod/minaslab/index.php', ['id' => $id]);
$PAGE->set_title(format_string($course->shortname) . ': ' . get_string('modulenameplural', 'mod_minaslab'));
$PAGE->set_heading($course->fullname);

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('modulenameplural', 'mod_minaslab'));

if (has_capability('mod/minaslab:viewcoursereport', $coursecontext)) {
    $reporturl = new moodle_url('/mod/minaslab/course_report.php', ['id' => $course->id]);
    echo $OUTPUT->single_button($reporturl, get_string('coursereport_nav', 'mod_minaslab'), 'get');
}

if (!$minaslabs = get_all_instances_in_course('minaslab', $course)) {
    notice(
        get_string('thereareno', 'moodle', get_string('modulenameplural', 'mod_minaslab')),
        new moodle_url('/course/view.php', ['id' => $course->id])
    );
}

$table = new html_table();
$table->head = [get_string('minaslabname', 'mod_minaslab'), get_string('lastmodified')];
$table->align = ['left', 'left'];

foreach ($minaslabs as $minaslab) {
    $link = html_writer::link(
        new moodle_url('/mod/minaslab/view.php', ['id' => $minaslab->coursemodule]),
        format_string($minaslab->name)
    );
    $table->data[] = [$link, userdate($minaslab->timemodified)];
}

echo html_writer::table($table);

echo $OUTPUT->footer();
