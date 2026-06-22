<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/minaslab/backup/moodle2/backup_minaslab_stepslib.php');

/**
 * Define el backup de MinasLab.
 */
class backup_minaslab_activity_task extends backup_activity_task {

    protected function define_my_settings() {
    }

    protected function define_my_steps() {
        $this->add_step(new backup_minaslab_activity_structure_step('minaslab_structure', 'minaslab.xml'));
    }

    /**
     * @param string $content
     * @return string
     */
    public static function encode_content_links($content) {
        global $CFG;

        $base = preg_quote($CFG->wwwroot, '/');

        $search = '/(' . $base . '\/mod\/minaslab\/index.php\?id=)([0-9]+)/';
        $content = preg_replace($search, '$@MINASLABINDEX*$2@$', $content);

        $search = '/(' . $base . '\/mod\/minaslab\/view.php\?id=)([0-9]+)/';
        $content = preg_replace($search, '$@MINASLABVIEWBYID*$2@$', $content);

        return $content;
    }
}
