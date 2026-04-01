<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');
require_once(__DIR__ . '/lib.php');

class mod_minaslab_mod_form extends moodleform_mod {

    public function definition() {
        global $CFG;

        $mform = $this->_form;

        $mform->addElement('header', 'general', get_string('general', 'form'));

        $mform->addElement('text', 'name', get_string('minaslabname', 'mod_minaslab'), ['size' => 64]);
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', null, 'required', null, 'client');

        $this->standard_intro_elements();

        $mform->addElement('header', 'minaslab_practice', get_string('practice_section', 'mod_minaslab'));

        $groups = \mod_minaslab\local\activity_catalog::grouped_for_form();
        $mform->addElement('selectgroups', 'activity_key', get_string('activity_key', 'mod_minaslab'), $groups);
        $mform->addHelpButton('activity_key', 'activity_key', 'mod_minaslab');

        $mform->addElement('static', 'practice_hint', '', get_string('practice_catalog_hint', 'mod_minaslab'));

        $mform->setDefault('activity_key', \mod_minaslab\local\activity_catalog::default_key());

        $this->standard_grading_coursemodule_elements();

        $this->standard_coursemodule_elements();

        $this->add_action_buttons();
    }

    public function validation($data, $files) {
        $errors = parent::validation($data, $files);
        if (!empty($data['activity_key']) && !\mod_minaslab\local\activity_catalog::is_valid($data['activity_key'])) {
            $errors['activity_key'] = get_string('invalidactivity', 'mod_minaslab');
        }
        return $errors;
    }

    public function data_preprocessing(&$defaultvalues) {
        parent::data_preprocessing($defaultvalues);

        if (!empty($this->current->instance) && !empty($this->current->coursemodule)) {
            $context = context_module::instance($this->current->coursemodule);
            $opts = minaslab_intro_editor_options($context);
            $defaultvalues = file_prepare_standard_editor(
                $defaultvalues,
                'intro',
                $opts,
                $context,
                'mod_minaslab',
                'intro',
                0
            );
        }
    }
}
