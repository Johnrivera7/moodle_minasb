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

    if ($oldversion < 2026033107) {
        // AMD payload, Three/RequireJS, ajax action PARAM.
        upgrade_mod_savepoint(true, 2026033107, 'minaslab');
    }

    if ($oldversion < 2026033108) {
        // UI: instrucciones, pantalla completa; túnel 3D más visible.
        upgrade_mod_savepoint(true, 2026033108, 'minaslab');
    }

    if ($oldversion < 2026033109) {
        // Texto de ayuda del selector de actividades (modulename_help).
        upgrade_mod_savepoint(true, 2026033109, 'minaslab');
    }

    if ($oldversion < 2026033140) {
        // Backup/restore Moodle 2 API: minaslab.xml y prepare_activity_structure().
        upgrade_mod_savepoint(true, 2026033140, 'minaslab');
    }

    if ($oldversion < 2026101800) {
        // Evaluaciones prácticas semestrales: respuestas corregidas por tarea.
        $table = new xmldb_table('minaslab_response');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('minaslabid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('taskid', XMLDB_TYPE_CHAR, '32', null, XMLDB_NOTNULL, null, null);
        $table->add_field('response', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('fraction', XMLDB_TYPE_NUMBER, '10, 5', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('score', XMLDB_TYPE_NUMBER, '10, 5', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('tries', XMLDB_TYPE_INTEGER, '4', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('status', XMLDB_TYPE_CHAR, '16', null, XMLDB_NOTNULL, null, 'new');
        $table->add_field('closed', XMLDB_TYPE_INTEGER, '2', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('minaslabid', XMLDB_KEY_FOREIGN, ['minaslabid'], 'minaslab', ['id']);
        $table->add_key('userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
        $table->add_index('minaslab_user_task', XMLDB_INDEX_UNIQUE, ['minaslabid', 'userid', 'taskid']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        $field = new xmldb_field('activity_key', XMLDB_TYPE_CHAR, '128', null, XMLDB_NOTNULL, null,
            'ev_s1_operaciones', 'introformat');
        $dbman->change_field_default(new xmldb_table('minaslab'), $field);

        upgrade_mod_savepoint(true, 2026101800, 'minaslab');
    }

    if ($oldversion < 2026102000) {
        // Se retiran las prácticas formativas antiguas: las instancias con claves que ya no
        // existen pasan a la evaluación práctica de su semestre.
        $map = ['s1' => 'ev_s1_operaciones', 's2' => 'ev_s2_geologia', 's3' => 'ev_s3_yacimientos',
            's4' => 'ev_s4_rajo', 's5' => 'ev_s5_proyecto'];
        $valid = array_keys(\mod_minaslab\local\evaluation\registry::all());
        foreach ($DB->get_records('minaslab', null, '', 'id, activity_key') as $r) {
            if (in_array($r->activity_key, $valid, true)) {
                continue;
            }
            $prefix = substr((string) $r->activity_key, 0, 2);
            $DB->set_field('minaslab', 'activity_key', $map[$prefix] ?? 'ev_s1_operaciones', ['id' => $r->id]);
        }
        upgrade_mod_savepoint(true, 2026102000, 'minaslab');
    }

    return true;
}
