<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace mod_minaslab\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

/**
 * Privacidad: progreso, calificación y respuestas de evaluación por usuario.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider {

    /** @var string[] Tablas con datos personales. */
    private const TABLES = ['minaslab_user_state', 'minaslab_response'];

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

        $collection->add_database_table('minaslab_response', [
            'minaslabid' => 'privacy:metadata:minaslab_response:minaslabid',
            'userid' => 'privacy:metadata:minaslab_response:userid',
            'taskid' => 'privacy:metadata:minaslab_response:taskid',
            'response' => 'privacy:metadata:minaslab_response:response',
            'score' => 'privacy:metadata:minaslab_response:score',
            'tries' => 'privacy:metadata:minaslab_response:tries',
            'timemodified' => 'privacy:metadata:minaslab_response:timemodified',
        ], 'privacy:metadata:minaslab_response');

        $collection->add_subsystem_link('core_grades', [], 'privacy:metadata:core_grades');

        return $collection;
    }

    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();
        foreach (self::TABLES as $table) {
            $sql = "SELECT ctx.id
                      FROM {context} ctx
                      JOIN {course_modules} cm ON cm.id = ctx.instanceid AND ctx.contextlevel = :ctxlevel
                      JOIN {modules} m ON m.id = cm.module AND m.name = :modname
                      JOIN {{$table}} t ON t.minaslabid = cm.instance
                     WHERE t.userid = :userid";
            $contextlist->add_from_sql($sql, [
                'userid' => $userid,
                'modname' => 'minaslab',
                'ctxlevel' => CONTEXT_MODULE,
            ]);
        }
        return $contextlist;
    }

    public static function get_users_in_context(userlist $userlist) {
        $context = $userlist->get_context();
        if (!$context instanceof \context_module) {
            return;
        }
        foreach (self::TABLES as $table) {
            $sql = "SELECT t.userid
                      FROM {course_modules} cm
                      JOIN {modules} m ON m.id = cm.module AND m.name = :modname
                      JOIN {{$table}} t ON t.minaslabid = cm.instance
                     WHERE cm.id = :cmid";
            $userlist->add_from_sql('userid', $sql, ['modname' => 'minaslab', 'cmid' => $context->instanceid]);
        }
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
            $state = $DB->get_record('minaslab_user_state', ['minaslabid' => $cm->instance, 'userid' => $userid]);
            $responses = $DB->get_records('minaslab_response', ['minaslabid' => $cm->instance, 'userid' => $userid],
                'taskid', 'taskid, response, score, tries, status, timemodified');
            if (!$state && !$responses) {
                continue;
            }
            $data = (object) [
                'state' => $state ? (object) (array) $state : null,
                'responses' => array_values(array_map(fn($r) => (object) (array) $r, $responses)),
            ];
            writer::with_context($context)->export_data([get_string('pluginname', 'mod_minaslab')], $data);
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
        foreach (self::TABLES as $table) {
            $DB->delete_records($table, ['minaslabid' => $cm->instance]);
        }
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
            foreach (self::TABLES as $table) {
                $DB->delete_records($table, ['minaslabid' => $cm->instance, 'userid' => $userid]);
            }
        }
    }

    public static function delete_data_for_users(approved_userlist $userlist) {
        global $DB;
        $context = $userlist->get_context();
        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }
        $cm = get_coursemodule_from_id('minaslab', $context->instanceid);
        if (!$cm || !$userlist->get_userids()) {
            return;
        }
        [$insql, $params] = $DB->get_in_or_equal($userlist->get_userids(), SQL_PARAMS_NAMED);
        $params['minaslabid'] = $cm->instance;
        foreach (self::TABLES as $table) {
            $DB->delete_records_select($table, "minaslabid = :minaslabid AND userid $insql", $params);
        }
    }
}
