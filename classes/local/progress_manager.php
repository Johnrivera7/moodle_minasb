<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_minaslab\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Persistencia de progreso y actualización del libro de calificaciones.
 */
final class progress_manager {

    /**
     * Guarda estado JSON y opcionalmente la nota en el libro de calificaciones.
     *
     * @param \stdClass $minaslab registro minaslab
     * @param int $userid
     * @param array $progress datos de progreso (validados)
     * @param float|null $score nota en escala 0–grademax o null si no finaliza
     * @param bool $finalize si true y score definido, marca completado y envía nota
     */
    public static function save_state(
        \stdClass $minaslab,
        int $userid,
        array $progress,
        ?float $score,
        bool $finalize
    ): \stdClass {
        global $DB;

        $now = time();
        $record = $DB->get_record('minaslab_user_state', [
            'minaslabid' => $minaslab->id,
            'userid' => $userid,
        ]);

        if ($record && !empty($record->completed) && !$finalize) {
            $data = (object) [
                'id' => $record->id,
                'progressjson' => json_encode($progress, JSON_UNESCAPED_UNICODE),
                'timemodified' => $now,
            ];
            $DB->update_record('minaslab_user_state', $data);
            return $DB->get_record('minaslab_user_state', ['id' => $record->id], MUST_EXIST);
        }

        $data = new \stdClass();
        $data->minaslabid = $minaslab->id;
        $data->userid = $userid;
        $data->progressjson = json_encode($progress, JSON_UNESCAPED_UNICODE);
        $data->timemodified = $now;

        if ($finalize && $score !== null && (float) $minaslab->grade > 0) {
            $data->finalgrade = round(min((float) $minaslab->grade, max(0, $score)), 5);
            $data->completed = 1;
            $data->timecompleted = $now;
        } else {
            if ($record) {
                $data->finalgrade = $record->finalgrade;
                $data->completed = $record->completed;
                $data->timecompleted = $record->timecompleted;
            } else {
                $data->finalgrade = null;
                $data->completed = 0;
                $data->timecompleted = null;
            }
        }

        if ($record) {
            $data->id = $record->id;
            $DB->update_record('minaslab_user_state', $data);
            $newid = $record->id;
        } else {
            $data->timecreated = $now;
            if (!property_exists($data, 'finalgrade') || $data->finalgrade === null) {
                $data->finalgrade = null;
            }
            if (!property_exists($data, 'completed')) {
                $data->completed = 0;
            }
            if (!property_exists($data, 'timecompleted')) {
                $data->timecompleted = null;
            }
            $newid = $DB->insert_record('minaslab_user_state', $data);
        }

        if ($finalize && $score !== null && (float) $minaslab->grade > 0) {
            minaslab_update_user_grade($minaslab, $userid, (float) $data->finalgrade);
        }

        return $DB->get_record('minaslab_user_state', ['id' => $newid], MUST_EXIST);
    }

    /**
     * @return \stdClass|null
     */
    public static function get_state(\stdClass $minaslab, int $userid): ?\stdClass {
        global $DB;

        return $DB->get_record('minaslab_user_state', [
            'minaslabid' => $minaslab->id,
            'userid' => $userid,
        ]) ?: null;
    }

    public static function delete_by_instance(int $minaslabid): void {
        global $DB;
        $DB->delete_records('minaslab_user_state', ['minaslabid' => $minaslabid]);
    }
}
