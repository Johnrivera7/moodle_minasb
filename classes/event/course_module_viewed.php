<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_minaslab\event;

defined('MOODLE_INTERNAL') || die();

/**
 * Evento al visualizar la actividad MinasLab (sustituye instanciar la clase abstracta del núcleo).
 */
class course_module_viewed extends \core\event\course_module_viewed {

    protected function init() {
        $this->data['objecttable'] = 'minaslab';
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    public static function get_objectid_mapping() {
        return ['db' => 'minaslab', 'field' => 'id', 'restore' => 'minaslab'];
    }
}
