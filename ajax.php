<?php
// This file is part of Moodle - http://moodle.org/
//
// AJAX: guardar / recuperar progreso y calificación.

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

global $CFG, $DB, $USER;

use mod_minaslab\local\progress_manager;

$cmid = required_param('cmid', PARAM_INT);
// get_state / save_state llevan guión bajo; PARAM_ALPHA no lo permite.
$action = required_param('action', PARAM_ALPHANUMEXT);

require_login();
$cm = get_coursemodule_from_id('minaslab', $cmid, 0, false, MUST_EXIST);
require_sesskey();
$context = context_module::instance($cm->id);
require_capability('mod/minaslab:view', $context);

$minaslab = $DB->get_record('minaslab', ['id' => $cm->instance], '*', MUST_EXIST);

header('Content-Type: application/json; charset=utf-8');

if ($action === 'get_state') {
    $row = progress_manager::get_state($minaslab, $USER->id);
    $payload = [
        'progress' => null,
        'finalgrade' => null,
        'completed' => false,
        'grademax' => (float) $minaslab->grade,
    ];
    if ($row) {
        $payload['progress'] = json_decode($row->progressjson ?? '{}', true);
        $payload['finalgrade'] = $row->finalgrade !== null ? (float) $row->finalgrade : null;
        $payload['completed'] = !empty($row->completed);
        $payload['timecompleted'] = $row->timecompleted ?? null;
    }
    echo json_encode($payload);
    die;
}

if ($action === 'save_state') {
    $progressraw = optional_param('progress', '', PARAM_RAW);
    $scoreraw = optional_param('score', '', PARAM_RAW);
    $score = null;
    if ($scoreraw !== '' && is_numeric($scoreraw)) {
        $score = (float) $scoreraw;
    }
    $finalize = optional_param('finalize', 0, PARAM_BOOL);

    $progress = [];
    if ($progressraw !== '') {
        $decoded = json_decode($progressraw, true);
        if (!is_array($decoded)) {
            throw new moodle_exception('invalidparameter', 'error');
        }
        $progress = minaslab_ajax_sanitize_progress($decoded);
    }

    $grademax = (float) $minaslab->grade;
    $finalscore = null;
    if ($finalize && $grademax > 0 && $score !== null) {
        $finalscore = min($grademax, max(0, (float) $score));
    }

    $row = progress_manager::save_state($minaslab, $USER->id, $progress, $finalscore, $finalize && $finalscore !== null);

    echo json_encode([
        'ok' => true,
        'finalgrade' => $row->finalgrade !== null ? (float) $row->finalgrade : null,
        'completed' => !empty($row->completed),
        'grademax' => $grademax,
    ]);
    die;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'bad_action']);

/**
 * @param array $p
 * @return array
 */
function minaslab_ajax_sanitize_progress(array $p): array {
    $out = [];
    $allowed = ['steps', 'archetype', 'lastStep', 'meta', 'scoreDraft'];
    foreach ($allowed as $k) {
        if (!array_key_exists($k, $p)) {
            continue;
        }
        if ($k === 'steps' && is_array($p[$k])) {
            $out['steps'] = array_map('strval', array_slice($p[$k], 0, 40));
        } else if ($k === 'meta' && is_array($p[$k])) {
            $out['meta'] = [];
            foreach ($p[$k] as $mk => $mv) {
                $out['meta'][clean_param((string) $mk, PARAM_ALPHANUMEXT)] = clean_param((string) $mv, PARAM_TEXT);
            }
        } else if ($k === 'scoreDraft') {
            $out['scoreDraft'] = clean_param($p[$k], PARAM_FLOAT);
        } else {
            $out[$k] = clean_param($p[$k], PARAM_TEXT);
        }
    }
    return $out;
}
