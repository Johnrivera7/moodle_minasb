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
 * Revisión docente de la evaluación práctica de un estudiante.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

use mod_minaslab\local\evaluation_manager;
use mod_minaslab\local\progress_manager;

$id = required_param('id', PARAM_INT);
$userid = required_param('userid', PARAM_INT);

[$course, $cm] = get_course_and_cm_from_cmid($id, 'minaslab');
$minaslab = $DB->get_record('minaslab', ['id' => $cm->instance], '*', MUST_EXIST);
require_login($course, false, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/minaslab:viewcoursereport', context_course::instance($course->id));
$user = core_user::get_user($userid, '*', MUST_EXIST);

$PAGE->set_url('/mod/minaslab/review.php', ['id' => $cm->id, 'userid' => $userid]);
$PAGE->set_title(get_string('review_title', 'mod_minaslab', fullname($user)));
$PAGE->set_heading($course->fullname);
$PAGE->set_pagelayout('report');
$PAGE->activityheader->disable();
$PAGE->requires->css(new moodle_url('/mod/minaslab/styles.css'));
$PAGE->navbar->add(get_string('results_title', 'mod_minaslab'), new moodle_url('/mod/minaslab/results.php', ['id' => $cm->id]));

$case = evaluation_manager::case_for($minaslab, $userid);
$responses = evaluation_manager::responses($minaslab, $userid);
$state = progress_manager::get_state($minaslab, $userid);
$cfg = evaluation_manager::config($minaslab);
$summary = evaluation_manager::summary($minaslab, $case['tasks'], $responses, $state, $cfg);
$progress = $state ? (json_decode($state->progressjson ?? '{}', true) ?: []) : [];
$draft = $progress['draft'] ?? [];
$meta = evaluation_manager::evaluation($minaslab)->meta();

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('review_title', 'mod_minaslab', fullname($user)));
echo html_writer::tag('p', s($meta['title']), ['class' => 'lead']);
echo html_writer::div(
    html_writer::tag('strong', get_string('results_percent', 'mod_minaslab') . ': ') . format_float($summary['percent'], 1) .
    ' % · ' . html_writer::tag('strong', get_string('results_chile', 'mod_minaslab') . ': ') .
    format_float($summary['chile'], 1) . ' · ' .
    html_writer::tag('strong', get_string('results_status', 'mod_minaslab') . ': ') .
    get_string($summary['completed'] ? 'results_finished' : 'results_inprogress', 'mod_minaslab') .
    (!empty($progress['savedat']) ? ' · ' . get_string('results_lastsaved', 'mod_minaslab') . ': ' .
        userdate($progress['savedat']) : ''),
    'alert alert-light border'
);

$table = new html_table();
$table->attributes['class'] = 'generaltable mlx-review';
$table->head = [get_string('review_task', 'mod_minaslab'), get_string('review_response', 'mod_minaslab'),
    get_string('review_correct', 'mod_minaslab'), get_string('review_tries', 'mod_minaslab'),
    get_string('review_score', 'mod_minaslab')];
foreach ($case['tasks'] as $i => $t) {
    $resp = $responses[$t['id']] ?? null;
    $answer = $resp ? s(evaluation_manager::response_label($t, json_decode($resp->response, true))) : '—';
    if (!$resp && isset($draft['inputs'][$t['id']])) {
        $answer = html_writer::span(get_string('review_draft', 'mod_minaslab') . ': ', 'text-muted') .
            s(evaluation_manager::response_label($t, $draft['inputs'][$t['id']]));
    }
    $table->data[] = [
        html_writer::tag('strong', ($i + 1) . '. ' . s($t['title'])) . html_writer::empty_tag('br') .
            html_writer::span(s(implode(' · ', array_merge($t['ra'], $t['competencies']))) . ' · ' . (int) $t['weight'] . ' %',
                'small text-muted'),
        $answer,
        s(evaluation_manager::answer_label($t)) . html_writer::div(s($t['solution']), 'small text-muted'),
        $resp ? (int) $resp->tries : 0,
        $resp ? format_float((float) $resp->score * 100, 0) . ' %' : '—',
    ];
}
echo html_writer::div(html_writer::table($table), 'table-responsive');

if (!empty($draft['notes'])) {
    echo $OUTPUT->heading(get_string('review_notes', 'mod_minaslab'), 4);
    echo html_writer::tag('pre', s($draft['notes']), ['class' => 'mlx-notes-pre']);
}
$nm = count($draft['measures'] ?? []) + count($draft['compass'] ?? []);
if ($nm) {
    echo html_writer::tag('p', get_string('review_measures', 'mod_minaslab') . ': ' . $nm, ['class' => 'text-muted']);
}

echo $OUTPUT->single_button(new moodle_url('/mod/minaslab/results.php', ['id' => $cm->id]),
    get_string('results_title', 'mod_minaslab'), 'get');
echo $OUTPUT->footer();
