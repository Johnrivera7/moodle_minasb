<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_minaslab\privacy;

defined('MOODLE_INTERNAL') || die();

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\writer;

/**
 * Privacidad: progreso y calificación en minaslab_user_state.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {

    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('minaslab_user_state', [
            'minaslabid' => 'privacy:metadata:minaslab_user_state:minaslabid',
            'userid' => 'privacy:metadata:minaslab_user_state:userid',
            'progressjson' => 'privacy:metadata:minaslab_user_state:progressjson',
            'finalgrade' => 'privacy:metadata:minaslab_user_state:finalgrade',
            'completed' => 'privacy:metadata:minaslab_user_state:completed',
            'timecompleted' => 'privacy:metadata:minaslab_user_state:timecompleted',
            'timecreated' => 'privacy:metadata:minaslab_user_state:timecreated',
            'timemodified' => 'privacy:metadata:minaslab_user_state:timemodified',
        ], 'privacy:metadata:minaslab_user_state');

        return $collection;
    }

    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        $sql = "SELECT ctx.id
                  FROM {context} ctx
                  JOIN {course_modules} cm ON cm.id = ctx.instanceid
                  JOIN {modules} m ON m.id = cm.module AND m.name = :modname
                  JOIN {minaslab} ml ON ml.id = cm.instance
                  JOIN {minaslab_user_state} mus ON mus.minaslabid = ml.id AND mus.userid = :userid
                 WHERE ctx.contextlevel = :ctxlevel";

        $params = [
            'userid' => $userid,
            'modname' => 'minaslab',
            'ctxlevel' => CONTEXT_MODULE,
        ];

        $contextlist->add_from_sql($sql, $params);
        return $contextlist;
    }

    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;

        $userid = $contextlist->get_userid();
        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }
            $cm = get_coursemodule_from_id('minaslab', $context->instanceid);
            if (!$cm) {
                continue;
            }
            $row = $DB->get_record('minaslab_user_state', [
                'minaslabid' => $cm->instance,
                'userid' => $userid,
            ]);
            if (!$row) {
                continue;
            }
            writer::with_context($context)->export_data([], 'minaslab_user_state', (object) (array) $row);
        }
    }

    public static function delete_data_for_all_users_in_context(\context $context) {
        global $DB;
        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }
        $cm = get_coursemodule_from_id('minaslab', $context->instanceid);
        if (!$cm) {
            return;
        }
        $DB->delete_records('minaslab_user_state', ['minaslabid' => $cm->instance]);
    }

    public static function delete_data_for_user(approved_contextlist $contextlist) {
        global $DB;
        $userid = $contextlist->get_userid();
        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }
            $cm = get_coursemodule_from_id('minaslab', $context->instanceid);
            if (!$cm) {
                continue;
            }
            $DB->delete_records('minaslab_user_state', ['minaslabid' => $cm->instance, 'userid' => $userid]);
        }
    }
}
