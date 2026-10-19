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

        // Parámetros de la evaluación práctica semestral (solo aplican a las actividades ★).
        $mform->addElement('header', 'minaslab_evaluation', get_string('eval_settings', 'mod_minaslab'));
        $mform->addElement('static', 'eval_settings_info', '', get_string('eval_settings_info', 'mod_minaslab'));

        $mform->addElement('select', 'eval_maxtries', get_string('eval_maxtries', 'mod_minaslab'),
            array_combine(range(1, 5), range(1, 5)));
        $mform->setDefault('eval_maxtries', 3);
        $mform->addHelpButton('eval_maxtries', 'eval_maxtries', 'mod_minaslab');

        $penalties = [];
        foreach ([0, 10, 20, 25, 33, 50] as $p) {
            $penalties[(string) ($p / 100)] = $p . ' %';
        }
        $mform->addElement('select', 'eval_penalty', get_string('eval_penalty', 'mod_minaslab'), $penalties);
        $mform->setDefault('eval_penalty', '0.2');
        $mform->addHelpButton('eval_penalty', 'eval_penalty', 'mod_minaslab');

        $mform->addElement('selectyesno', 'eval_showsolution', get_string('eval_showsolution', 'mod_minaslab'));
        $mform->setDefault('eval_showsolution', 1);
        $mform->addHelpButton('eval_showsolution', 'eval_showsolution', 'mod_minaslab');

        $mform->addElement('select', 'eval_passpercent', get_string('eval_passpercent', 'mod_minaslab'),
            [50 => '50 %', 55 => '55 %', 60 => '60 %', 70 => '70 %']);
        $mform->setDefault('eval_passpercent', 60);
        $mform->addHelpButton('eval_passpercent', 'eval_passpercent', 'mod_minaslab');


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

        $config = is_array($defaultvalues) ? ($defaultvalues['config'] ?? '') : ($defaultvalues->config ?? '');
        $cfg = $config ? (json_decode($config, true) ?: []) : [];
        foreach (['maxtries', 'penalty', 'showsolution', 'passpercent'] as $k) {
            if (array_key_exists($k, $cfg)) {
                $v = $k === 'penalty' ? (string) (float) $cfg[$k] : (int) $cfg[$k];
                if (is_array($defaultvalues)) {
                    $defaultvalues['eval_' . $k] = $v;
                } else {
                    $defaultvalues->{'eval_' . $k} = $v;
                }
            }
        }

        if (!empty($this->current->instance) && !empty($this->current->coursemodule)) {
            // file_prepare_standard_editor() asigna propiedades (p. ej. intro_editor) sobre stdClass; con array falla en PHP 8.2+.
            if (is_array($defaultvalues)) {
                $defaultvalues = (object) $defaultvalues;
            }
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
