<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Estructura XML del backup de la tabla minaslab.
 */
class backup_minaslab_activity_structure_step extends backup_activity_structure_step {

    protected function define_structure() {
        $userinfo = $this->get_setting_value('userinfo');

        $minaslab = new backup_nested_element('minaslab', ['id'], [
            'course', 'name', 'intro', 'introformat', 'activity_key', 'config', 'grade',
            'timecreated', 'timemodified',
        ]);

        $userstates = new backup_nested_element('user_states');
        $userstate = new backup_nested_element('user_state', ['id'], [
            'userid', 'progressjson', 'finalgrade', 'completed', 'timecompleted',
            'timecreated', 'timemodified',
        ]);

        $minaslab->add_child($userstates);
        $userstates->add_child($userstate);

        $minaslab->set_source_table('minaslab', ['id' => backup::VAR_ACTIVITYID]);
        $minaslab->annotate_files('mod_minaslab', 'intro', null);

        if ($userinfo) {
            $userstate->set_source_table('minaslab_user_state', ['minaslabid' => backup::VAR_PARENTID]);
            $userstate->annotate_ids('user', 'userid');
        }

        return $this->prepare_activity_structure($minaslab);
    }
}
