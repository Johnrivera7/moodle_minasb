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
 * Funciones de la API de módulos de actividad para MinasLab.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Opciones del editor HTML de la descripción (intro), coherentes con mod_form.
 *
 * @param \context_module $context
 * @return array
 */
function minaslab_intro_editor_options(\context_module $context): array {
    return [
        'subdirs' => 0,
        'maxfiles' => EDITOR_UNLIMITED_FILES,
        'maxbytes' => 0,
        'context' => $context,
        'noclean' => 1,
        'trusttext' => false,
    ];
}

/**
 * Funcionalidades soportadas.
 *
 * @param string $feature FEATURE_xx
 * @return mixed
 */
function minaslab_supports(string $feature) {
    return match ($feature) {
        FEATURE_MOD_INTRO,
        FEATURE_SHOW_DESCRIPTION,
        FEATURE_COMPLETION_TRACKS_VIEWS,
        FEATURE_MODEDIT_DEFAULT_COMPLETION,
        FEATURE_GRADE_HAS_GRADE,
        FEATURE_BACKUP_MOODLE2 => true,
        FEATURE_MOD_PURPOSE => MOD_PURPOSE_ASSESSMENT,
        FEATURE_MOD_OTHERPURPOSE => MOD_PURPOSE_INTERACTIVECONTENT,
        default => null,
    };
}

/**
 * Serializa en el campo config los parámetros de la evaluación práctica del formulario.
 *
 * @param stdClass $data datos del formulario
 */
function minaslab_pack_config(stdClass $data): void {
    $keys = ['maxtries', 'penalty', 'showsolution', 'passpercent'];
    $cfg = [];
    foreach ($keys as $k) {
        if (property_exists($data, 'eval_' . $k)) {
            $cfg[$k] = $k === 'penalty' ? (float) $data->{'eval_' . $k} : (int) $data->{'eval_' . $k};
        }
    }
    if ($cfg) {
        $data->config = json_encode($cfg);
    }
}

function minaslab_add_instance(object $data, $mform = null): int {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = $data->timecreated;
    minaslab_pack_config($data);
    if (empty($data->activity_key) || !\mod_minaslab\local\activity_catalog::is_valid($data->activity_key)) {
        $data->activity_key = \mod_minaslab\local\activity_catalog::default_key();
    }

    if (!property_exists($data, 'intro') || $data->intro === null) {
        $data->intro = '';
    }
    if (!property_exists($data, 'introformat')) {
        $data->introformat = FORMAT_HTML;
    }

    $id = $DB->insert_record('minaslab', $data);

    $minaslab = $DB->get_record('minaslab', ['id' => $id]);
    minaslab_grade_item_update($minaslab);
    return $id;
}

function minaslab_update_instance($data, $mform = null): bool {
    global $DB;

    // El núcleo puede entregar stdClass o array según contexto.
    if (is_array($data)) {
        $data = (object) $data;
    }

    $data->timemodified = time();
    $data->id = $data->instance;
    minaslab_pack_config($data);

    if (empty($data->activity_key) || !\mod_minaslab\local\activity_catalog::is_valid($data->activity_key)) {
        $data->activity_key = \mod_minaslab\local\activity_catalog::default_key();
    }

    $old = $DB->get_record('minaslab', ['id' => $data->instance], '*', MUST_EXIST);
    $context = context_module::instance($data->coursemodule);
    $opts = minaslab_intro_editor_options($context);

    // file_postupdate_standard_editor() requiere intro_editor (texto/formato/itemid). Si no viene (envío parcial), se conserva la descripción previa.
    if (property_exists($data, 'intro_editor') && $data->intro_editor !== null) {
        $data = file_postupdate_standard_editor($data, 'intro', $opts, $context, 'mod_minaslab', 'intro', 0);
    } else {
        // get_record puede omitir claves null; evitar lectura de propiedades indefinidas (PHP 8.2+).
        $data->intro = (isset($old->intro) && $old->intro !== null) ? $old->intro : '';
        $data->introformat = isset($old->introformat) ? (int) $old->introformat : FORMAT_HTML;
    }

    if (!isset($data->intro) || $data->intro === null) {
        $data->intro = '';
    }
    if (!isset($data->introformat) || $data->introformat === null) {
        $data->introformat = FORMAT_HTML;
    }

    $DB->update_record('minaslab', $data);

    $minaslab = $DB->get_record('minaslab', ['id' => $data->instance]);
    minaslab_grade_item_update($minaslab);
    return true;
}

function minaslab_delete_instance(int $id): bool {
    global $DB;

    if (!$minaslab = $DB->get_record('minaslab', ['id' => $id])) {
        return false;
    }

    \mod_minaslab\local\progress_manager::delete_by_instance($minaslab->id);
    $DB->delete_records('minaslab_response', ['minaslabid' => $minaslab->id]);
    minaslab_grade_item_delete($minaslab);

    $DB->delete_records('minaslab', ['id' => $minaslab->id]);

    return true;
}

/**
 * @param cm_info|stdClass $coursemodule
 * @return cached_cm_info|null
 */
function minaslab_get_coursemodule_info($coursemodule) {
    global $DB;

    $minaslab = $DB->get_record('minaslab', ['id' => $coursemodule->instance]);
    if (!$minaslab) {
        return null;
    }

    $info = new cached_cm_info();
    $info->name = $minaslab->name;
    if ($coursemodule->showdescription) {
        $info->content = format_module_intro('minaslab', $minaslab, $coursemodule->id, false);
    }

    return $info;
}

/**
 * Enlace al informe MinasLab en el menú del curso (docentes con permiso).
 *
 * @param navigation_node $navigation
 * @param stdClass $course
 * @param context_course $context
 */
function minaslab_extend_navigation_course($navigation, $course, $context) {
    if (!has_capability('mod/minaslab:viewcoursereport', $context)) {
        return;
    }
    $url = new moodle_url('/mod/minaslab/course_report.php', ['id' => $course->id]);
    $navigation->add(
        get_string('coursereport_nav', 'mod_minaslab'),
        $url,
        navigation_node::TYPE_CUSTOM,
        null,
        'minaslabcoursereport',
        new pix_icon('i/report', '')
    );
}

/**
 * Sirve archivos incrustados en la descripción (intro) de la actividad.
 *
 * @param stdClass $course
 * @param stdClass $cm
 * @param context $context
 * @param string $filearea
 * @param array $args
 * @param bool $forcedownload
 * @param array $options
 * @return bool|null
 */
function minaslab_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    if ($context->contextlevel != CONTEXT_MODULE) {
        return false;
    }
    require_login($course, true, $cm);
    require_capability('mod/minaslab:view', $context);

    if ($filearea !== 'intro') {
        return false;
    }

    $fs = get_file_storage();
    $filename = array_pop($args);
    $filepath = $args ? '/' . implode('/', $args) . '/' : '/';
    $file = $fs->get_file($context->id, 'mod_minaslab', 'intro', 0, $filepath, $filename);
    if (!$file || $file->is_directory()) {
        return false;
    }
    send_stored_file($file, 86400, 0, $forcedownload, $options);
}

/**
 * Crea o actualiza el ítem de calificación en el libro de calificaciones.
 *
 * @param stdClass $minaslab
 * @param bool $delete si true, elimina el ítem
 * @return int
 */
function minaslab_grade_item_update(stdClass $minaslab, bool $delete = false): int {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $params = [
        'itemname' => $minaslab->name,
        'idnumber' => 'minaslab_instance_' . $minaslab->id,
    ];

    if ($delete) {
        $params['deleted'] = 1;
    } else if (!empty($minaslab->grade) && (float) $minaslab->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax'] = (float) $minaslab->grade;
        $params['grademin'] = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    return grade_update('mod/minaslab', $minaslab->course, 'mod', 'minaslab', $minaslab->id, 0, null, $params);
}

/**
 * Actualiza la nota de un usuario en el libro de calificaciones.
 *
 * @param stdClass $minaslab
 * @param int $userid
 * @param float $rawgrade nota en la escala del ítem (0–grademax)
 * @return int
 */
function minaslab_update_user_grade(stdClass $minaslab, int $userid, float $rawgrade): int {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    if (empty($minaslab->grade) || (float) $minaslab->grade <= 0) {
        return 0;
    }

    $rawgrade = min((float) $minaslab->grade, max(0, $rawgrade));

    $grades = [
        'userid' => $userid,
        'rawgrade' => $rawgrade,
    ];

    return grade_update('mod/minaslab', $minaslab->course, 'mod', 'minaslab', $minaslab->id, 0, $grades, null);
}

/**
 * Elimina el ítem de calificación al borrar la actividad.
 *
 * @param stdClass $minaslab
 * @return int
 */
function minaslab_grade_item_delete(stdClass $minaslab): int {
    return minaslab_grade_item_update($minaslab, true);
}

/**
 * Borra la nota de un usuario en el libro de calificaciones (reinicio docente).
 *
 * @param stdClass $minaslab
 * @param int $userid
 * @return int
 */
function minaslab_reset_user_grade(stdClass $minaslab, int $userid): int {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');
    $grade = ['userid' => $userid, 'rawgrade' => null];
    return grade_update('mod/minaslab', $minaslab->course, 'mod', 'minaslab', $minaslab->id, 0, $grade);
}

/**
 * Recalcula las notas desde el estado guardado (p. ej. tras cambiar la nota máxima).
 *
 * @param stdClass $minaslab
 * @param int $userid 0 = todos
 * @param bool $nullifnone
 */
function minaslab_update_grades(stdClass $minaslab, int $userid = 0, bool $nullifnone = true): void {
    global $DB;
    $params = ['minaslabid' => $minaslab->id, 'completed' => 1];
    if ($userid) {
        $params['userid'] = $userid;
    }
    $rows = $DB->get_records('minaslab_user_state', $params);
    foreach ($rows as $row) {
        $progress = json_decode($row->progressjson ?? '{}', true) ?: [];
        if (isset($progress['scoreDraft']) && (float) $minaslab->grade > 0) {
            minaslab_update_user_grade($minaslab, (int) $row->userid,
                (float) $progress['scoreDraft'] / 100 * (float) $minaslab->grade);
        }
    }
}

/**
 * Elementos del formulario de reinicio de curso.
 *
 * @param MoodleQuickForm $mform
 */
function minaslab_reset_course_form_definition(&$mform) {
    $mform->addElement('header', 'minaslabheader', get_string('modulenameplural', 'mod_minaslab'));
    $mform->addElement('advcheckbox', 'reset_minaslab_attempts', get_string('reset_attempts', 'mod_minaslab'));
}

/**
 * Valores por defecto del formulario de reinicio.
 *
 * @param stdClass $course
 * @return array
 */
function minaslab_reset_course_form_defaults($course) {
    return ['reset_minaslab_attempts' => 1];
}

/**
 * Elimina avances y respuestas al reiniciar el curso.
 *
 * @param stdClass $data
 * @return array estado para el informe de reinicio
 */
function minaslab_reset_userdata($data) {
    global $DB;
    $status = [];
    if (!empty($data->reset_minaslab_attempts)) {
        $ids = $DB->get_fieldset_select('minaslab', 'id', 'course = ?', [$data->courseid]);
        if ($ids) {
            [$insql, $params] = $DB->get_in_or_equal($ids);
            $DB->delete_records_select('minaslab_user_state', "minaslabid $insql", $params);
            $DB->delete_records_select('minaslab_response', "minaslabid $insql", $params);
        }
        foreach ($DB->get_records('minaslab', ['course' => $data->courseid]) as $ml) {
            grade_update('mod/minaslab', $ml->course, 'mod', 'minaslab', $ml->id, 0, null, ['reset' => true]);
        }
        $status[] = [
            'component' => get_string('modulenameplural', 'mod_minaslab'),
            'item' => get_string('reset_attempts', 'mod_minaslab'),
            'error' => false,
        ];
    }
    return $status;
}
