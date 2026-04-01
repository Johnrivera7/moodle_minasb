<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * @param int $oldversion
 * @return bool
 */
function xmldb_minaslab_upgrade($oldversion) {
    global $CFG, $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2026033101) {
        $table = new xmldb_table('minaslab');

        // Añadir activity_key si no existe.
        $field = new xmldb_field('activity_key', XMLDB_TYPE_CHAR, '128', null, XMLDB_NOTNULL, null, 's1_algebra_a', 'introformat');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Migrar practice_type antiguo.
        $oldfield = new xmldb_field('practice_type');
        if ($dbman->field_exists($table, $oldfield)) {
            $map = [
                'plano_mina' => 's1_topo_planos_a',
                'ventilacion_demo' => 's4_vent_mina_a',
            ];
            $records = $DB->get_records('minaslab');
            foreach ($records as $r) {
                $pt = $r->practice_type ?? '';
                $nk = $map[$pt] ?? \mod_minaslab\local\activity_catalog::default_key();
                $DB->set_field('minaslab', 'activity_key', $nk, ['id' => $r->id]);
            }
            $dbman->drop_field($table, $oldfield);
        }

        upgrade_mod_savepoint(true, 2026033101, 'minaslab');
    }

    if ($oldversion < 2026033102) {
        global $CFG;
        $table = new xmldb_table('minaslab_user_state');
        if (!$dbman->table_exists($table)) {
            $dbman->install_one_table_from_xmldb_file(
                $CFG->dirroot . '/mod/minaslab/db/install.xml',
                'minaslab_user_state'
            );
        }
        upgrade_mod_savepoint(true, 2026033102, 'minaslab');
    }

    if ($oldversion < 2026033105) {
        // Capacidad mod/minaslab:viewcoursereport (informes por curso).
        upgrade_mod_savepoint(true, 2026033105, 'minaslab');
    }

    if ($oldversion < 2026033106) {
        // Evento course_module_viewed del plugin; intro del editor.
        upgrade_mod_savepoint(true, 2026033106, 'minaslab');
    }

    return true;
}
