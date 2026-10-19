<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Resultados de una evaluación práctica: por estudiante, tarea y resultado de aprendizaje.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->libdir . '/csvlib.class.php');

use mod_minaslab\local\evaluation_manager;
use mod_minaslab\local\progress_manager;

$id = required_param('id', PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHA);
$download = optional_param('download', 0, PARAM_BOOL);

[$course, $cm] = get_course_and_cm_from_cmid($id, 'minaslab');
$minaslab = $DB->get_record('minaslab', ['id' => $cm->instance], '*', MUST_EXIST);
require_login($course, false, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/minaslab:viewcoursereport', context_course::instance($course->id));

if (!evaluation_manager::is_evaluation($minaslab)) {
    redirect(new moodle_url('/mod/minaslab/instance_report.php', ['id' => $course->id, 'instance' => $minaslab->id]));
}

$url = new moodle_url('/mod/minaslab/results.php', ['id' => $cm->id]);
$PAGE->set_url($url);
$PAGE->set_title(format_string($minaslab->name) . ': ' . get_string('results_title', 'mod_minaslab'));
$PAGE->set_heading($course->fullname);
$PAGE->set_pagelayout('report');
$PAGE->activityheader->disable();
$PAGE->requires->css(new moodle_url('/mod/minaslab/styles.css'));

// Reinicio de la evaluación de un estudiante.
if ($action === 'reset') {
    require_capability('mod/minaslab:manageattempts', $context);
    $userid = required_param('userid', PARAM_INT);
    $user = core_user::get_user($userid, '*', MUST_EXIST);
    if (optional_param('confirm', 0, PARAM_BOOL) && confirm_sesskey()) {
        evaluation_manager::reset_user($minaslab, $userid);
        \mod_minaslab\event\attempt_reset::create([
            'objectid' => $minaslab->id, 'context' => $context, 'relateduserid' => $userid,
        ])->trigger();
        redirect($url, get_string('results_reset_done', 'mod_minaslab'), null, \core\output\notification::NOTIFY_SUCCESS);
    }
    echo $OUTPUT->header();
    echo $OUTPUT->confirm(
        get_string('results_reset_confirm', 'mod_minaslab', fullname($user)),
        new moodle_url($url, ['action' => 'reset', 'userid' => $userid, 'confirm' => 1, 'sesskey' => sesskey()]),
        $url
    );
    echo $OUTPUT->footer();
    die;
}

$ev = evaluation_manager::evaluation($minaslab);
$meta = $ev->meta();
$cfg = evaluation_manager::config($minaslab);
$users = get_enrolled_users($context, 'mod/minaslab:submit', 0, 'u.*', 'u.lastname, u.firstname');

$rows = [];
$rasum = [];
$racount = 0;
$tasksref = null;
foreach ($users as $u) {
    $case = evaluation_manager::case_for($minaslab, (int) $u->id);
    $tasksref = $tasksref ?? $case['tasks'];
    $responses = evaluation_manager::responses($minaslab, (int) $u->id);
    $state = progress_manager::get_state($minaslab, (int) $u->id);
    $summary = evaluation_manager::summary($minaslab, $case['tasks'], $responses, $state, $cfg);
    $status = 'notstarted';
    if ($state && !empty($state->completed)) {
        $status = 'finished';
    } else if ($state || $responses) {
        $status = 'inprogress';
    }
    if ($status !== 'notstarted') {
        foreach ($summary['ra'] as $ra => $v) {
            $rasum[$ra] = ($rasum[$ra] ?? 0) + $v;
        }
        $racount++;
    }
    $rows[] = ['user' => $u, 'case' => $case, 'responses' => $responses, 'state' => $state,
        'summary' => $summary, 'status' => $status];
}
if ($tasksref === null) {
    $tasksref = $ev->generate(0)['tasks'];
}

if ($download) {
    require_sesskey();
    $csv = new csv_export_writer();
    $csv->set_filename(clean_filename(format_string($minaslab->name) . '_resultados'));
    $head = [get_string('results_student', 'mod_minaslab'), get_string('email'), get_string('results_status', 'mod_minaslab')];
    foreach ($tasksref as $i => $t) {
        $head[] = 'T' . ($i + 1) . ' ' . $t['title'] . ' (%)';
    }
    $head = array_merge($head, [get_string('results_percent', 'mod_minaslab') . ' (%)',
        get_string('results_chile', 'mod_minaslab'), get_string('results_grade', 'mod_minaslab')]);
    foreach (array_keys($meta['ra']) as $ra) {
        $head[] = $ra . ' (%)';
    }
    $csv->add_data($head);
    foreach ($rows as $r) {
        $line = [fullname($r['user']), $r['user']->email, get_string('results_' . $r['status'], 'mod_minaslab')];
        foreach ($r['case']['tasks'] as $t) {
            $line[] = isset($r['responses'][$t['id']]) ? round((float) $r['responses'][$t['id']]->score * 100, 1) : '';
        }
        $line[] = $r['summary']['percent'];
        $line[] = $r['status'] === 'notstarted' ? '' : $r['summary']['chile'];
        $line[] = $r['summary']['finalgrade'] ?? '';
        foreach (array_keys($meta['ra']) as $ra) {
            $line[] = round(($r['summary']['ra'][$ra] ?? 0) * 100, 1);
        }
        $csv->add_data($line);
    }
    $csv->download_file();
    die;
}

$canmanage = has_capability('mod/minaslab:manageattempts', $context);

echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($minaslab->name) . ' — ' . get_string('results_title', 'mod_minaslab'));
echo html_writer::tag('p', s($meta['title']), ['class' => 'lead']);
echo html_writer::tag('p', get_string('results_intro', 'mod_minaslab', $cfg['passpercent']), ['class' => 'text-muted']);

echo html_writer::start_div('d-flex gap-2 mb-3');
echo $OUTPUT->single_button(new moodle_url($url, ['download' => 1, 'sesskey' => sesskey()]),
    get_string('results_download', 'mod_minaslab'), 'get');
echo $OUTPUT->single_button(new moodle_url('/mod/minaslab/view.php', ['id' => $cm->id]), get_string('back'), 'get');
echo html_writer::end_div();

// Logro promedio por RA.
if ($racount) {
    echo $OUTPUT->heading(get_string('results_ra_summary', 'mod_minaslab'), 4);
    echo html_writer::start_tag('ul', ['class' => 'mlx-bars mlx-bars--report']);
    foreach ($meta['ra'] as $code => $desc) {
        $v = ($rasum[$code] ?? 0) / $racount * 100;
        echo html_writer::tag('li',
            html_writer::span(s($code), 'mlx-code', ['title' => $desc]) .
            html_writer::span(html_writer::span('', '', ['style' => 'width:' . round($v) . '%']), 'mlx-bar') .
            html_writer::span(format_float($v, 0) . ' %') .
            html_writer::span(s($desc), 'mlx-bars__desc'));
    }
    echo html_writer::end_tag('ul');
}

if (!$rows) {
    echo $OUTPUT->notification(get_string('results_none', 'mod_minaslab'), 'info');
} else {
    $table = new html_table();
    $table->attributes['class'] = 'generaltable mlx-results';
    $table->head = [get_string('results_student', 'mod_minaslab'), get_string('results_status', 'mod_minaslab')];
    foreach ($tasksref as $i => $t) {
        $table->head[] = html_writer::span('T' . ($i + 1), '', ['title' => $t['title']]);
    }
    $table->head = array_merge($table->head, [get_string('results_percent', 'mod_minaslab'),
        get_string('results_chile', 'mod_minaslab'), get_string('results_grade', 'mod_minaslab'), '']);
    foreach ($rows as $r) {
        $u = $r['user'];
        $cells = [fullname($u), html_writer::span(get_string('results_' . $r['status'], 'mod_minaslab'),
            'badge ' . ['notstarted' => 'bg-secondary', 'inprogress' => 'bg-warning text-dark',
                'finished' => 'bg-success'][$r['status']])];
        foreach ($r['case']['tasks'] as $t) {
            $resp = $r['responses'][$t['id']] ?? null;
            if (!$resp) {
                $cells[] = html_writer::span('—', 'text-muted');
                continue;
            }
            $pct = round((float) $resp->score * 100);
            $cls = $pct >= 99 ? 'is-ok' : ($pct > 0 ? 'is-part' : 'is-bad');
            $cells[] = html_writer::span($pct . ' %', 'mlx-cell ' . $cls,
                ['title' => get_string('review_tries', 'mod_minaslab') . ': ' . $resp->tries]);
        }
        $cells[] = format_float($r['summary']['percent'], 1) . ' %';
        $cells[] = $r['status'] === 'notstarted' ? '—' : html_writer::tag('strong', format_float($r['summary']['chile'], 1),
            ['class' => $r['summary']['chile'] >= 4 ? 'text-success' : 'text-danger']);
        $cells[] = $r['summary']['finalgrade'] !== null ? format_float($r['summary']['finalgrade'], 2) : '—';
        $actions = '';
        if ($r['status'] !== 'notstarted') {
            $actions .= html_writer::link(new moodle_url('/mod/minaslab/review.php', ['id' => $cm->id, 'userid' => $u->id]),
                get_string('results_review', 'mod_minaslab'), ['class' => 'btn btn-sm btn-outline-primary me-1']);
            if ($canmanage) {
                $actions .= html_writer::link(new moodle_url($url, ['action' => 'reset', 'userid' => $u->id]),
                    get_string('results_reset', 'mod_minaslab'), ['class' => 'btn btn-sm btn-outline-danger']);
            }
        }
        $cells[] = $actions;
        $table->data[] = $cells;
    }
    echo html_writer::div(html_writer::table($table), 'table-responsive');
    echo html_writer::start_tag('ol', ['class' => 'small text-muted']);
    foreach ($tasksref as $t) {
        echo html_writer::tag('li', s($t['title']) . ' (' . (int) $t['weight'] . ' %) · ' . s(implode(', ', $t['ra'])));
    }
    echo html_writer::end_tag('ol');
}

echo $OUTPUT->footer();
