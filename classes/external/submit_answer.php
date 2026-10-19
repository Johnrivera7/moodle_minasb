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
 * Corrige en servidor la respuesta a una tarea y la registra.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class submit_answer extends external_api {

    /**
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Course module id'),
            'taskid' => new external_value(PARAM_ALPHANUMEXT, 'Task id'),
            'response' => new external_value(PARAM_RAW, 'Respuesta codificada en JSON'),
        ]);
    }

    /**
     * @param int $cmid
     * @param string $taskid
     * @param string $response
     * @return array
     */
    public static function execute(int $cmid, string $taskid, string $response): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(),
            ['cmid' => $cmid, 'taskid' => $taskid, 'response' => $response]);
        [$minaslab] = access::validate($params['cmid'], 'mod/minaslab:submit');
        $decoded = json_decode($params['response'], true);
        if (is_array($decoded)) {
            $decoded = array_slice(array_map(fn($v) => clean_param((string) $v, PARAM_ALPHANUMEXT), $decoded), 0, 20);
        } else {
            $decoded = clean_param((string) $decoded, PARAM_TEXT);
            $decoded = \core_text::substr($decoded, 0, 64);
        }
        $result = evaluation_manager::submit($minaslab, (int) $USER->id, $params['taskid'], $decoded);
        return ['result' => json_encode($result, JSON_UNESCAPED_UNICODE)];
    }

    /**
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'result' => new external_value(PARAM_RAW, 'JSON con estado, puntaje, intentos y retroalimentación'),
        ]);
    }
}
