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
 * Un docente reinició la evaluación de un estudiante (caso nuevo).
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class attempt_reset extends \core\event\base {

    protected function init() {
        $this->data['objecttable'] = 'minaslab';
        $this->data['crud'] = 'd';
        $this->data['edulevel'] = self::LEVEL_TEACHING;
    }

    public static function get_name() {
        return get_string('event_attempt_reset', 'mod_minaslab');
    }

    public function get_description() {
        return "El usuario con id '{$this->userid}' reinició la evaluación del usuario con id " .
            "'{$this->relateduserid}' en la actividad con cmid '{$this->contextinstanceid}'.";
    }

    public function get_url() {
        return new \moodle_url('/mod/minaslab/view.php', ['id' => $this->contextinstanceid]);
    }

    public static function get_objectid_mapping() {
        return ['db' => 'minaslab', 'restore' => 'minaslab'];
    }
}
