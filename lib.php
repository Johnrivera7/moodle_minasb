<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * @param string $feature
 * @return bool|null
 */
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

function minaslab_supports(string $feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}

function minaslab_add_instance(object $data, $mform = null): int {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = $data->timecreated;
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

function minaslab_update_instance(object $data, $mform = null): bool {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    if (empty($data->activity_key) || !\mod_minaslab\local\activity_catalog::is_valid($data->activity_key)) {
        $data->activity_key = \mod_minaslab\local\activity_catalog::default_key();
    }

    $DB->update_record('minaslab', $data);

    $context = context_module::instance($data->coursemodule);
    $opts = minaslab_intro_editor_options($context);
    $data = file_postupdate_standard_editor($data, 'intro', $opts, $context, 'mod_minaslab', 'intro', 0);
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
