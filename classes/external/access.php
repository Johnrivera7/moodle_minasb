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

namespace mod_minaslab\external;

use core_external\external_api;
use mod_minaslab\local\evaluation_manager;

/**
 * Validación común de contexto, capacidades y tipo de actividad.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class access {

    /**
     * @param int $cmid
     * @param string $capability capacidad adicional exigida
     * @return array{0: \stdClass, 1: \cm_info, 2: \stdClass} [minaslab, cm, course]
     */
    public static function validate(int $cmid, string $capability = 'mod/minaslab:view'): array {
        global $DB;
        [$course, $cm] = get_course_and_cm_from_cmid($cmid, 'minaslab');
        $context = \context_module::instance($cm->id);
        external_api::validate_context($context);
        require_capability('mod/minaslab:view', $context);
        if ($capability === 'mod/minaslab:submit') {
            // Los docentes pueden probar la evaluación en modo vista previa.
            if (!has_any_capability(['mod/minaslab:submit', 'mod/minaslab:manageattempts'], $context)) {
                throw new \required_capability_exception($context, $capability, 'nopermissions', '');
            }
        } else {
            require_capability($capability, $context);
        }
        $minaslab = $DB->get_record('minaslab', ['id' => $cm->instance], '*', MUST_EXIST);
        if (!evaluation_manager::is_evaluation($minaslab)) {
            throw new \moodle_exception('eval_notevaluation', 'mod_minaslab');
        }
        return [$minaslab, $cm, $course];
    }
}
