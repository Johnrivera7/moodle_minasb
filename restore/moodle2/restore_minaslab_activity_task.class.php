<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/minaslab/restore/moodle2/restore_minaslab_stepslib.php');

/**
 * Define el restore de MinasLab.
 */
class restore_minaslab_activity_task extends restore_activity_task {

    protected function define_my_settings() {
    }

    protected function define_my_steps() {
        $this->add_step(new restore_minaslab_activity_structure_step('minaslab_structure', 'minaslab.xml'));
    }

    /**
     * @return string
     */
    public static function define_decode_content_links() {
        return '';
    }

    /**
     * @return array
     */
    public static function define_decode_rules() {
        return [
            new restore_decode_rule('MINASLABVIEWBYID', '/mod/minaslab/view.php?id=$1', 'course_module'),
            new restore_decode_rule('MINASLABINDEX', '/mod/minaslab/index.php?id=$1', 'course'),
        ];
    }
}
