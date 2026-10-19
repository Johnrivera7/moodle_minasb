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

namespace mod_minaslab\event;

/**
 * Un estudiante envió la respuesta a una tarea de la evaluación práctica.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class task_answered extends \core\event\base {

    protected function init() {
        $this->data['objecttable'] = 'minaslab_response';
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    public static function get_name() {
        return get_string('event_task_answered', 'mod_minaslab');
    }

    public function get_description() {
        return "El usuario con id '{$this->userid}' respondió la tarea '{$this->other['taskid']}' " .
            "(intento {$this->other['tries']}, estado {$this->other['status']}) en la actividad con cmid " .
            "'{$this->contextinstanceid}'.";
    }

    public function get_url() {
        return new \moodle_url('/mod/minaslab/view.php', ['id' => $this->contextinstanceid]);
    }

    public static function get_objectid_mapping() {
        return ['db' => 'minaslab_response', 'restore' => 'minaslab_response'];
    }

    public static function get_other_mapping() {
        return false;
    }
}
