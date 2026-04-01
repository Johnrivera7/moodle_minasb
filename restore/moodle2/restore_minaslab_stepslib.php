<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Restore de instancias minaslab.
 */
class restore_minaslab_activity_structure_step extends restore_activity_structure_step {

    protected function define_structure() {
        $paths = [];
        $paths[] = new restore_path_element('minaslab', '/activity/minaslab');
        return $paths;
    }

    /**
     * @param array|object $data
     */
    protected function process_minaslab($data): void {
        global $DB;

        $data = (object) $data;
        $oldid = $data->id;
        unset($data->id);
        $data->course = $this->get_courseid();
        $newid = $DB->insert_record('minaslab', $data);
        $this->apply_activity_instance($newid);
        $this->set_mapping('minaslab', $oldid, $newid, true);
    }

    protected function after_execute(): void {
        $this->add_related_files('mod_minaslab', 'intro', null);
    }
}
