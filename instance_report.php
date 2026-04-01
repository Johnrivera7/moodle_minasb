<?php
// This file is part of Moodle - http://moodle.org/
//
// Detalle por instancia: estudiantes, progreso y calificaciones.

require(__DIR__ . '/../../config.php');

$id = required_param('id', PARAM_INT);
$instance = required_param('instance', PARAM_INT);

$course = get_course($id);
require_login($course);
$context = context_course::instance($course->id);
require_capability('mod/minaslab:viewcoursereport', $context);

global $DB, $PAGE, $OUTPUT;

$minaslab = $DB->get_record('minaslab', ['id' => $instance], '*', MUST_EXIST);
if ((int) $minaslab->course !== (int) $course->id) {
    throw new moodle_exception('invalidcourseid');
}

$export = optional_param('export', '', PARAM_ALPHA);

$PAGE->set_url('/mod/minaslab/instance_report.php', ['id' => $id, 'instance' => $instance]);
$PAGE->set_pagelayout('report');
$entry = \mod_minaslab\local\activity_catalog::get($minaslab->activity_key) ?? [];
$title = get_string('instancereport_title', 'mod_minaslab') . ': ' . format_string($minaslab->name);
$PAGE->set_title($title);
$PAGE->set_heading($course->fullname);
$PAGE->navbar->add(
    get_string('coursereport_title', 'mod_minaslab'),
    new moodle_url('/mod/minaslab/course_report.php', ['id' => $id])
);
$PAGE->navbar->add(format_string($minaslab->name));

$rows = \mod_minaslab\local\course_report_service::get_rows_for_instance($minaslab, (int) $course->id);

if ($export === 'csv') {
    require_sesskey();
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename=minaslab_report_' . $instance . '.csv');
    $sep = ';';
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
    fputcsv($out, [
        'userid',
        'lastname',
        'firstname',
        'email',
        'idnumber',
        'has_state',
        'score_draft_pct',
        'final_grade',
        'completed',
        'timemodified',
        'timecompleted',
    ], $sep);
    foreach ($rows as $r) {
        fputcsv($out, [
            $r->userid,
            $r->lastname,
            $r->firstname,
            $r->email,
            $r->idnumber,
            $r->hasstate ? '1' : '0',
            $r->score_draft !== null ? $r->score_draft : '',
            $r->finalgrade !== null ? $r->finalgrade : '',
            $r->completed ? '1' : '0',
            $r->timemodified ? userdate($r->timemodified) : '',
            $r->timecompleted ? userdate($r->timecompleted) : '',
        ], $sep);
    }
    fclose($out);
    exit;
}

echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($minaslab->name));

$meta = html_writer::tag('p', get_string('instancereport_meta', 'mod_minaslab', [
    'key' => s($minaslab->activity_key),
    'practice' => s($entry['title'] ?? ''),
    'archetype' => s($entry['archetype'] ?? ''),
    'grademax' => format_float((float) $minaslab->grade, 0),
]));
echo $OUTPUT->box($meta, 'generalbox');

$csvurl = new moodle_url('/mod/minaslab/instance_report.php', [
    'id' => $id,
    'instance' => $instance,
    'export' => 'csv',
    'sesskey' => sesskey(),
]);
echo $OUTPUT->single_button($csvurl, get_string('instancereport_export_csv', 'mod_minaslab'), 'get');

$table = new html_table();
$table->head = [
    get_string('lastname'),
    get_string('firstname'),
    get_string('email'),
    get_string('idnumber'),
    get_string('instancereport_col_progress', 'mod_minaslab'),
    get_string('instancereport_col_final', 'mod_minaslab'),
    get_string('instancereport_col_done', 'mod_minaslab'),
    get_string('instancereport_col_updated', 'mod_minaslab'),
];
$table->attributes['class'] = 'generaltable mod_minaslab_report';
$table->data = [];

foreach ($rows as $r) {
    $prog = $r->hasstate
        ? ($r->score_draft !== null ? $r->score_draft . '%' : '—')
        : get_string('instancereport_noprog', 'mod_minaslab');
    $final = $r->finalgrade !== null ? format_float((float) $r->finalgrade, 2) : '—';
    $done = $r->completed ? get_string('yes') : get_string('no');
    $tm = $r->timemodified ? userdate($r->timemodified) : '—';
    $table->data[] = [
        s($r->lastname),
        s($r->firstname),
        s($r->email),
        s($r->idnumber),
        $prog,
        $final,
        $done,
        $tm,
    ];
}

echo html_writer::table($table);

echo $OUTPUT->footer();
