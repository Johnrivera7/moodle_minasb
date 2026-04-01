<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Estructura XML del backup de la tabla minaslab.
 */
class backup_minaslab_activity_structure_step extends backup_activity_structure_step {

    protected function define_structure() {

        $minaslab = new backup_nested_element('minaslab', ['id'], [
            'course', 'name', 'intro', 'introformat', 'activity_key', 'config', 'grade',
            'timecreated', 'timemodified',
        ]);

        $minaslab->set_source_table('minaslab', ['id' => backup::VAR_ACTIVITYID]);
        $minaslab->annotate_files('mod_minaslab', 'intro', null);

        return $this->prepare_structure([$minaslab]);
    }
}
