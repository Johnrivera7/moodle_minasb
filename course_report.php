<?php
// This file is part of Moodle - http://moodle.org/
//
// Informe por curso: actividades MinasLab, resumen de progreso y enlaces al detalle.

require(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/tablelib.php');

$id = required_param('id', PARAM_INT);

$course = get_course($id);
require_login($course);
$context = context_course::instance($course->id);
require_capability('mod/minaslab:viewcoursereport', $context);

$PAGE->set_url('/mod/minaslab/course_report.php', ['id' => $id]);
$PAGE->set_pagelayout('report');
$PAGE->set_title(get_string('coursereport_title', 'mod_minaslab'));
$PAGE->set_heading($course->fullname);
$PAGE->navbar->add(get_string('coursereport_title', 'mod_minaslab'));

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('coursereport_title', 'mod_minaslab'));

$instances = \mod_minaslab\local\course_report_service::get_instances_in_course((int) $course->id);
$ids = array_keys($instances);
$summaries = \mod_minaslab\local\course_report_service::get_instance_summaries((int) $course->id, $ids);

echo $OUTPUT->box(get_string('coursereport_intro', 'mod_minaslab'), 'generalbox');

$catalogcount = count(\mod_minaslab\local\activity_catalog::entries());
echo $OUTPUT->box(
    get_string('coursereport_catalog_hint', 'mod_minaslab', $catalogcount),
    'generalbox'
);

if ($instances === []) {
    echo $OUTPUT->notification(get_string('coursereport_no_instances', 'mod_minaslab'), 'info');
    echo $OUTPUT->footer();
    exit;
}

$table = new html_table();
$table->head = [
    get_string('coursereport_col_activity', 'mod_minaslab'),
    get_string('coursereport_col_practice', 'mod_minaslab'),
    get_string('coursereport_col_subject', 'mod_minaslab'),
    get_string('coursereport_col_enrolled', 'mod_minaslab'),
    get_string('coursereport_col_withprogress', 'mod_minaslab'),
    get_string('coursereport_col_completed', 'mod_minaslab'),
    get_string('coursereport_col_avggrade', 'mod_minaslab'),
    get_string('coursereport_col_actions', 'mod_minaslab'),
];
$table->attributes['class'] = 'generaltable mod_minaslab_report';
$table->data = [];

foreach ($instances as $m) {
    $sum = $summaries[$m->id] ?? null;
    $detailurl = new moodle_url('/mod/minaslab/instance_report.php', [
        'id' => $course->id,
        'instance' => $m->id,
    ]);
    $link = html_writer::link($detailurl, get_string('coursereport_open_detail', 'mod_minaslab'));
    $activityline = format_string($m->name);
    if (!empty($m->cmid)) {
        $viewurl = new moodle_url('/mod/minaslab/view.php', ['id' => $m->cmid]);
        $activityline = html_writer::link($viewurl, format_string($m->name));
    }
    $table->data[] = [
        $activityline,
        s($m->activity_key),
        s($m->catalog_subject),
        $sum ? $sum->enrolled : '—',
        $sum ? $sum->withstate : '—',
        $sum ? $sum->completed : '—',
        ($sum && $sum->avggrade !== null) ? format_float($sum->avggrade, 2) : '—',
        $link,
    ];
}

echo html_writer::table($table);

echo $OUTPUT->footer();
