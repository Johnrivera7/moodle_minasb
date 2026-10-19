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
 * Vista de la actividad MinasLab.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

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

$event = \mod_minaslab\event\course_module_viewed::create([
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

// Evaluación práctica semestral: motor 3D con corrección en servidor.
if (\mod_minaslab\local\evaluation_manager::is_evaluation($minaslab)) {
    $ev = \mod_minaslab\local\evaluation_manager::evaluation($minaslab);
    $meta = $ev->meta();
    $strings = get_string_manager()->load_component_strings('mod_minaslab', current_language());
    $ui = [];
    foreach ($strings as $k => $v) {
        if (str_starts_with($k, 'evui_')) {
            $ui[substr($k, 5)] = $v;
        }
    }
    $versionfile = @file_get_contents(__DIR__ . '/version.php') ?: '';
    $assetv = preg_match('/\$plugin->version\s*=\s*(\d+)/', $versionfile, $m) ? $m[1] : '1';
    $canreport = has_capability('mod/minaslab:viewcoursereport', context_course::instance($course->id));
    $canattempt = has_capability('mod/minaslab:submit', $context);
    $canpreview = !$canattempt && has_capability('mod/minaslab:manageattempts', $context);

    $PAGE->requires->js_call_amd('mod_minaslab/eval_app', 'init', [[
        'cmid' => (int) $cm->id,
        'threeUrl' => (new moodle_url('/mod/minaslab/js/three.module.min.js', ['v' => $assetv]))->out(false),
    ]]);

    // En Moodle 5 la cabecera de actividad ya muestra la descripción (intro).
    echo $OUTPUT->header();
    $competencies = [];
    foreach ($meta['competencies'] as $code => $desc) {
        $competencies[] = ['code' => $code, 'desc' => $desc];
    }
    $ras = [];
    foreach ($meta['ra'] as $code => $desc) {
        $ras[] = ['code' => $code, 'desc' => $desc];
    }
    echo $OUTPUT->render_from_template('mod_minaslab/evaluation', [
        'semester' => $ev->semester(),
        'semesterroman' => ['I', 'II', 'III', 'IV', 'V'][$ev->semester() - 1],
        'subject' => $meta['subject'],
        'support' => implode(' · ', $meta['support']),
        'title' => $meta['title'],
        'summary' => $meta['summary'],
        'competencies' => $competencies,
        'ras' => $ras,
        'canreport' => $canreport,
        'canattempt' => $canattempt || $canpreview,
        'ispreview' => $canpreview,
        'resultsurl' => (new moodle_url('/mod/minaslab/results.php', ['id' => $cm->id]))->out(false),
        'uijson' => json_encode($ui, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE),
    ]);
    echo $OUTPUT->footer();
    die;
}

$str = function(string $key) {
    return get_string($key, 'mod_minaslab');
};

// Payload AMD &lt; 1 KB: el resto va en JSON embebido (mustache) para evitar aviso del core.
$versionfilecontent = @file_get_contents(__DIR__ . '/version.php') ?: '';
$assetversion = 0;
if (preg_match('/\$plugin->version\s*=\s*(\d+)/', $versionfilecontent, $mv)) {
    $assetversion = (int) $mv[1];
}

$amdinit = [
    'wwwroot' => $CFG->wwwroot,
    'cmid' => $cm->id,
    'sesskey' => sesskey(),
    'grademax' => (float) $minaslab->grade,
    'activityKey' => $minaslab->activity_key,
    'assetVersion' => $assetversion,
];

$bootstrap = [
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
        'whatToDo' => $str('lab_what_to_do'),
        'practiceKicker' => $str('practice_kicker'),
        'practiceOrderHint' => $str('practice_order_hint'),
        'practiceOrderDragHint' => $str('practice_order_drag_hint'),
        'practiceAsideTip' => $str('practice_aside_tip'),
        'practiceDataFocus' => $str('practice_data_focus'),
        'flowCompetencyHint' => $str('flow_competency_hint'),
        'officeSensitivityTitle' => $str('office_sensitivity_title'),
        'officeSensitivityBlurb' => $str('office_sensitivity_blurb'),
        'englishHudPrompt' => $str('english_hud_prompt'),
        'sceneLegendAlgebra' => $str('scene_legend_algebra'),
        'sceneLegendTunnel' => $str('scene_legend_tunnel'),
        'sceneLegendPit' => $str('scene_legend_pit'),
        'sceneLegendPitBerm' => $str('scene_legend_pit_berm'),
        'sceneLegendPitCycle' => $str('scene_legend_pit_cycle'),
        'pitPresetIso' => $str('pit_preset_iso'),
        'pitPresetPlan' => $str('pit_preset_plan'),
        'pitPresetSection' => $str('pit_preset_section'),
        'pitMeasureToggle' => $str('pit_measure_toggle'),
        'pitClearMeasure' => $str('pit_clear_measure'),
        'pitLayerContours' => $str('pit_layer_contours'),
        'pitLayerEquip' => $str('pit_layer_equip'),
        'pitMeasureHint' => $str('pit_measure_hint'),
        'pitDistLabel' => $str('pit_dist_label'),
        'practiceCycleOrderIntro' => $str('practice_cycle_order_intro'),
        'pitCycleTourLabel' => $str('pit_cycle_tour_label'),
        'pitCycleStagePerf' => $str('pit_cycle_stage_perf'),
        'pitCycleStageLoad' => $str('pit_cycle_stage_load'),
        'pitCycleStageHaul' => $str('pit_cycle_stage_haul'),
        'pitCycleStageDump' => $str('pit_cycle_stage_dump'),
        'fullscreen' => $str('lab_fullscreen'),
        'exitFullscreen' => $str('lab_exit_fullscreen'),
    ],
];

$PAGE->requires->js_call_amd('mod_minaslab/lab', 'init', [$amdinit]);

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
    'bootstrapjson' => json_encode($bootstrap, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE),
];

echo $OUTPUT->render_from_template('mod_minaslab/view', $templatecontext);

echo $OUTPUT->footer();
