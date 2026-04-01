<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_minaslab\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Consultas para informes por curso e instancia (progreso y calificaciones).
 */
final class course_report_service {

    /**
     * Instancias MinasLab en un curso con datos de módulo y catálogo.
     *
     * @return array<int, \stdClass> keyed by minaslab.id
     */
    public static function get_instances_in_course(int $courseid): array {
        global $DB;

        $modid = $DB->get_field('modules', 'id', ['name' => 'minaslab'], IGNORE_MISSING);
        if (!$modid) {
            return [];
        }

        $sql = "SELECT m.*, cm.id AS cmid, cm.visible AS cmvisible
                  FROM {minaslab} m
                  JOIN {course_modules} cm ON cm.instance = m.id AND cm.module = :modid AND cm.course = m.course
                 WHERE m.course = :courseid
              ORDER BY cm.section, cm.id";

        $rows = $DB->get_records_sql($sql, ['modid' => $modid, 'courseid' => $courseid]);

        foreach ($rows as $id => $row) {
            $entry = activity_catalog::get($row->activity_key);
            $row->catalog_title = $entry['title'] ?? $row->activity_key;
            $row->catalog_subject = $entry['subject_name'] ?? '';
            $row->catalog_archetype = $entry['archetype'] ?? '';
            $rows[$id] = $row;
        }

        return $rows;
    }

    /**
     * Resumen agregado por instancia: inscritos, con estado, completados, nota media.
     *
     * @param int $courseid
     * @param int[] $instanceids ids en tabla minaslab
     * @return array<int, \stdClass> keyed by minaslab id
     */
    public static function get_instance_summaries(int $courseid, array $instanceids): array {
        global $DB;

        if ($instanceids === []) {
            return [];
        }

        $ctx = \context_course::instance($courseid);
        $enrolled = get_enrolled_users($ctx, 'mod/minaslab:view');
        $enrolledcount = count($enrolled);

        list($insql, $params) = $DB->get_in_or_equal($instanceids, SQL_PARAMS_NAMED);
        $params['courseid'] = $courseid;

        $sql = "SELECT minaslabid,
                       COUNT(*) AS states,
                       SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed,
                       AVG(CASE WHEN completed = 1 AND finalgrade IS NOT NULL THEN finalgrade END) AS avggrade
                  FROM {minaslab_user_state}
                 WHERE minaslabid $insql
              GROUP BY minaslabid";

        $agg = [];
        $rs = $DB->get_recordset_sql($sql, $params);
        foreach ($rs as $row) {
            $agg[(int) $row->minaslabid] = $row;
        }
        $rs->close();

        $out = [];
        foreach ($instanceids as $mid) {
            $o = new \stdClass();
            $o->minaslabid = $mid;
            $o->enrolled = $enrolledcount;
            $o->withstate = isset($agg[$mid]) ? (int) $agg[$mid]->states : 0;
            $o->completed = isset($agg[$mid]) ? (int) $agg[$mid]->completed : 0;
            $o->avggrade = (isset($agg[$mid]) && $agg[$mid]->avggrade !== null)
                ? round((float) $agg[$mid]->avggrade, 2) : null;
            $out[$mid] = $o;
        }

        return $out;
    }

    /**
     * Filas por estudiante para una instancia: todos los inscritos al curso con estado opcional.
     *
     * @return \stdClass[] list of rows with user + state fields
     */
    public static function get_rows_for_instance(\stdClass $minaslab, int $courseid): array {
        global $DB;

        $ctx = \context_course::instance($courseid);
        $users = get_enrolled_users($ctx, 'mod/minaslab:view');
        if ($users === []) {
            return [];
        }

        $userids = array_keys($users);
        list($insql, $params) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
        $params['mid'] = $minaslab->id;

        $sql = "SELECT *
                  FROM {minaslab_user_state}
                 WHERE minaslabid = :mid AND userid $insql";

        $staterecs = $DB->get_records_sql($sql, $params);
        $states = [];
        foreach ($staterecs as $srec) {
            $states[$srec->userid] = $srec;
        }

        $rows = [];
        foreach ($users as $u) {
            $r = new \stdClass();
            $r->userid = $u->id;
            $r->firstname = $u->firstname;
            $r->lastname = $u->lastname;
            $r->email = $u->email;
            $r->idnumber = $u->idnumber ?? '';
            if (isset($states[$u->id])) {
                $s = $states[$u->id];
                $r->hasstate = true;
                $r->progressjson = $s->progressjson;
                $r->finalgrade = $s->finalgrade;
                $r->completed = (int) $s->completed;
                $r->timemodified = $s->timemodified;
                $r->timecompleted = $s->timecompleted;
                $prog = json_decode($s->progressjson, true);
                $r->score_draft = is_array($prog) && isset($prog['scoreDraft']) ? (int) $prog['scoreDraft'] : null;
            } else {
                $r->hasstate = false;
                $r->progressjson = '';
                $r->finalgrade = null;
                $r->completed = 0;
                $r->timemodified = null;
                $r->timecompleted = null;
                $r->score_draft = null;
            }
            $rows[] = $r;
        }

        \core_collator::asort_array_of_objects_by_property($rows, 'lastname', \core_collator::SORT_STRING);
        return $rows;
    }
}
