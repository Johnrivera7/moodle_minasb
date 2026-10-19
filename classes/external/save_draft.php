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
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use mod_minaslab\local\evaluation_manager;

/**
 * Guarda automáticamente el avance del estudiante en la actividad.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class save_draft extends external_api {

    /**
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Course module id'),
            'draft' => new external_value(PARAM_RAW, 'Borrador JSON (entradas, mediciones, tarea activa)'),
        ]);
    }

    /**
     * @param int $cmid
     * @param string $draft
     * @return array
     */
    public static function execute(int $cmid, string $draft): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['cmid' => $cmid, 'draft' => $draft]);
        [$minaslab] = access::validate($params['cmid'], 'mod/minaslab:submit');
        $time = evaluation_manager::save_draft($minaslab, (int) $USER->id, $params['draft']);
        return ['savedat' => $time];
    }

    /**
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'savedat' => new external_value(PARAM_INT, 'Marca de tiempo del guardado'),
        ]);
    }
}
