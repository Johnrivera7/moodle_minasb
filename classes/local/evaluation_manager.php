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

namespace mod_minaslab\local;

use mod_minaslab\local\evaluation\base;
use mod_minaslab\local\evaluation\grader;
use mod_minaslab\local\evaluation\registry;
use mod_minaslab\local\evaluation\rng;

/**
 * Ciclo de vida de una evaluación práctica: caso por estudiante, respuestas,
 * intentos, penalización, guardado automático y calificación final.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class evaluation_manager {

    /** @var string Tabla de respuestas por tarea. */
    public const TABLE = 'minaslab_response';

    /** @var int Tamaño máximo del borrador autoguardado (bytes). */
    private const MAX_DRAFT = 65536;

    /**
     * ¿La instancia usa una evaluación práctica semestral?
     *
     * @param \stdClass $minaslab
     * @return bool
     */
    public static function is_evaluation(\stdClass $minaslab): bool {
        return registry::get((string) $minaslab->activity_key) !== null;
    }

    /**
     * Configuración de la instancia con valores por defecto.
     *
     * @param \stdClass $minaslab
     * @return array{maxtries:int, penalty:float, showsolution:int, passpercent:int}
     */
    public static function config(\stdClass $minaslab): array {
        $cfg = [];
        if (!empty($minaslab->config)) {
            $decoded = json_decode($minaslab->config, true);
            if (is_array($decoded)) {
                $cfg = $decoded;
            }
        }
        return [
            'maxtries' => max(1, min(5, (int) ($cfg['maxtries'] ?? 3))),
            'penalty' => max(0.0, min(0.5, (float) ($cfg['penalty'] ?? 0.2))),
            'showsolution' => (int) ($cfg['showsolution'] ?? 1),
            'passpercent' => max(40, min(80, (int) ($cfg['passpercent'] ?? 60))),
        ];
    }

    /**
     * Evaluación asociada a la instancia.
     *
     * @param \stdClass $minaslab
     * @return base
     */
    public static function evaluation(\stdClass $minaslab): base {
        $ev = registry::get((string) $minaslab->activity_key);
        if (!$ev) {
            throw new \moodle_exception('invalidactivity', 'mod_minaslab');
        }
        return $ev;
    }

    /**
     * Estado global del usuario (borrador, variante, nota final).
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @return array{row: ?\stdClass, progress: array}
     */
    private static function user_state(\stdClass $minaslab, int $userid): array {
        $row = progress_manager::get_state($minaslab, $userid);
        $progress = [];
        if ($row && !empty($row->progressjson)) {
            $progress = json_decode($row->progressjson, true) ?: [];
        }
        return ['row' => $row, 'progress' => $progress];
    }

    /**
     * Caso completo (incluye respuestas correctas) del usuario.
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @return array
     */
    public static function case_for(\stdClass $minaslab, int $userid): array {
        $state = self::user_state($minaslab, $userid);
        $seed = self::seed_from_state($minaslab, $userid, $state['progress']);
        return self::evaluation($minaslab)->generate($seed);
    }

    /**
     * Semilla del caso: la persistida (sobrevive a respaldo y restauración) o la derivada.
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @param array $progress
     * @return int
     */
    private static function seed_from_state(\stdClass $minaslab, int $userid, array $progress): int {
        if (isset($progress['seed']) && is_numeric($progress['seed'])) {
            return (int) $progress['seed'];
        }
        return rng::seed_for((int) $minaslab->id, $userid, (int) ($progress['variant'] ?? 0));
    }

    /**
     * Fija la semilla del caso en el estado del usuario la primera vez que abre la evaluación.
     *
     * @param \stdClass $minaslab
     * @param int $userid
     */
    public static function ensure_seed(\stdClass $minaslab, int $userid): void {
        $state = self::user_state($minaslab, $userid);
        if (isset($state['progress']['seed'])) {
            return;
        }
        $progress = $state['progress'];
        $progress['mode'] = 'eval';
        $progress['seed'] = self::seed_from_state($minaslab, $userid, $progress);
        progress_manager::save_state($minaslab, $userid, $progress, null, false);
    }

    /**
     * Respuestas guardadas indexadas por tarea.
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @return array<string, \stdClass>
     */
    public static function responses(\stdClass $minaslab, int $userid): array {
        global $DB;
        $rows = $DB->get_records(self::TABLE, ['minaslabid' => $minaslab->id, 'userid' => $userid]);
        $out = [];
        foreach ($rows as $r) {
            $out[$r->taskid] = $r;
        }
        return $out;
    }

    /**
     * Texto legible de la respuesta correcta de una tarea.
     *
     * @param array $task
     * @return string
     */
    public static function answer_label(array $task): string {
        $labels = [];
        foreach ($task['options'] as $o) {
            $labels[$o['id']] = $o['label'];
        }
        switch ($task['type']) {
            case 'number':
                $dec = (int) ($task['decimals'] ?? 2);
                return number_format((float) $task['answer'], $dec, ',', '.') . ($task['unit'] ? ' ' . $task['unit'] : '');
            case 'choice':
            case 'pick':
                return $labels[$task['answer']] ?? (string) $task['answer'];
            case 'multi':
                return implode('; ', array_map(fn($id) => $labels[$id] ?? $id, (array) $task['answer']));
            case 'order':
                return implode(' → ', array_map(fn($id) => $labels[$id] ?? $id, (array) $task['answer']));
        }
        return '';
    }

    /**
     * Texto legible de la respuesta del estudiante.
     *
     * @param array $task
     * @param mixed $response
     * @return string
     */
    public static function response_label(array $task, $response): string {
        if ($response === null || $response === '' || $response === []) {
            return '—';
        }
        $labels = [];
        foreach ($task['options'] as $o) {
            $labels[$o['id']] = $o['label'];
        }
        if ($task['type'] === 'number') {
            return (string) $response . ($task['unit'] ? ' ' . $task['unit'] : '');
        }
        $ids = (array) $response;
        $sep = $task['type'] === 'order' ? ' → ' : '; ';
        return implode($sep, array_map(fn($id) => $labels[$id] ?? (string) $id, $ids));
    }

    /**
     * Fracción ponderada obtenida (0–1).
     *
     * @param array $tasks
     * @param array $responses
     * @return float
     */
    public static function weighted_fraction(array $tasks, array $responses): float {
        $tw = 0.0;
        $acc = 0.0;
        foreach ($tasks as $t) {
            $w = (float) $t['weight'];
            $tw += $w;
            if (isset($responses[$t['id']])) {
                $acc += $w * (float) $responses[$t['id']]->score;
            }
        }
        return $tw > 0 ? $acc / $tw : 0.0;
    }

    /**
     * Nota en escala chilena 1,0–7,0 con exigencia configurable (por defecto 60 %).
     *
     * @param float $fraction 0–1
     * @param int $passpercent exigencia para nota 4,0
     * @return float
     */
    public static function chile_grade(float $fraction, int $passpercent = 60): float {
        $e = $passpercent / 100;
        $p = max(0.0, min(1.0, $fraction));
        $g = $p < $e ? 1 + 3 * $p / $e : 4 + 3 * ($p - $e) / (1 - $e);
        return round($g, 1);
    }

    /**
     * Logro por resultado de aprendizaje (0–1), ponderado por tarea.
     *
     * @param array $tasks
     * @param array $responses
     * @return array<string, float>
     */
    public static function ra_attainment(array $tasks, array $responses): array {
        $num = [];
        $den = [];
        foreach ($tasks as $t) {
            foreach ($t['ra'] as $ra) {
                $den[$ra] = ($den[$ra] ?? 0) + $t['weight'];
                $sc = isset($responses[$t['id']]) ? (float) $responses[$t['id']]->score : 0.0;
                $num[$ra] = ($num[$ra] ?? 0) + $t['weight'] * $sc;
            }
        }
        $out = [];
        foreach ($den as $ra => $d) {
            $out[$ra] = $d > 0 ? $num[$ra] / $d : 0.0;
        }
        return $out;
    }

    /**
     * Datos para el navegador: escenario y tareas sin respuestas (salvo tareas cerradas).
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @return array
     */
    public static function client_payload(\stdClass $minaslab, int $userid): array {
        self::ensure_seed($minaslab, $userid);
        $ev = self::evaluation($minaslab);
        $case = self::case_for($minaslab, $userid);
        $cfg = self::config($minaslab);
        $responses = self::responses($minaslab, $userid);
        $state = self::user_state($minaslab, $userid);
        $completed = $state['row'] && !empty($state['row']->completed);

        $tasks = [];
        foreach ($case['tasks'] as $t) {
            $resp = $responses[$t['id']] ?? null;
            $closed = $completed || ($resp && !empty($resp->closed));
            $item = [
                'id' => $t['id'],
                'type' => $t['type'],
                'title' => $t['title'],
                'prompt' => $t['prompt'],
                'weight' => (int) $t['weight'],
                'ra' => array_values($t['ra']),
                'competencies' => array_values($t['competencies']),
                'unit' => $t['unit'],
                'options' => array_values($t['options']),
                'tool' => $t['tool'],
                'focus' => $t['focus'],
                'hint' => $t['hint'],
                'state' => [
                    'tries' => $resp ? (int) $resp->tries : 0,
                    'status' => $resp ? (string) $resp->status : 'new',
                    'score' => $resp ? round((float) $resp->score, 4) : 0,
                    'closed' => (bool) $closed,
                    'response' => $resp ? json_decode($resp->response, true) : null,
                ],
            ];
            if ($closed && $cfg['showsolution']) {
                $item['state']['solution'] = $t['solution'];
                $item['state']['answerlabel'] = self::answer_label($t);
            }
            $tasks[] = $item;
        }

        $fraction = self::weighted_fraction($case['tasks'], $responses);
        $grademax = (float) $minaslab->grade;
        $meta = $ev->meta();

        return [
            'key' => $ev->key(),
            'semester' => $ev->semester(),
            'meta' => $meta,
            'context' => $case['context'],
            'scene' => $case['scene'],
            'tasks' => $tasks,
            'config' => $cfg,
            'draft' => self::draft_for_client($state['progress']['draft'] ?? []),
            'summary' => self::summary($minaslab, $case['tasks'], $responses, $state['row'], $cfg),
            'grademax' => $grademax,
            'fraction' => $fraction,
        ];
    }

    /**
     * Borrador con los mapas como objetos JSON (evita que un mapa vacío viaje como arreglo).
     *
     * @param mixed $draft
     * @return \stdClass
     */
    private static function draft_for_client($draft): \stdClass {
        $draft = is_array($draft) ? $draft : [];
        $out = (object) $draft;
        $out->inputs = (object) (is_array($draft['inputs'] ?? null) ? $draft['inputs'] : []);
        return $out;
    }

    /**
     * Resumen de calificación.
     *
     * @param \stdClass $minaslab
     * @param array $tasks
     * @param array $responses
     * @param \stdClass|null $row
     * @param array $cfg
     * @return array
     */
    public static function summary(\stdClass $minaslab, array $tasks, array $responses, ?\stdClass $row, array $cfg): array {
        $fraction = self::weighted_fraction($tasks, $responses);
        $answered = 0;
        foreach ($tasks as $t) {
            if (isset($responses[$t['id']]) && !empty($responses[$t['id']]->closed)) {
                $answered++;
            }
        }
        $grademax = (float) $minaslab->grade;
        return [
            'fraction' => round($fraction, 4),
            'percent' => round($fraction * 100, 1),
            'grade' => round($fraction * max(0, $grademax), 2),
            'grademax' => $grademax,
            'chile' => self::chile_grade($fraction, $cfg['passpercent']),
            'closedtasks' => $answered,
            'totaltasks' => count($tasks),
            'completed' => $row && !empty($row->completed),
            'finalgrade' => $row && $row->finalgrade !== null ? (float) $row->finalgrade : null,
            'ra' => array_map(fn($v) => round($v, 4), self::ra_attainment($tasks, $responses)),
        ];
    }

    /**
     * Corrige y registra la respuesta a una tarea.
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @param string $taskid
     * @param mixed $response
     * @return array resultado para el navegador
     */
    public static function submit(\stdClass $minaslab, int $userid, string $taskid, $response): array {
        global $DB;

        $state = self::user_state($minaslab, $userid);
        if ($state['row'] && !empty($state['row']->completed)) {
            throw new \moodle_exception('eval_alreadyfinished', 'mod_minaslab');
        }
        $case = self::case_for($minaslab, $userid);
        $task = null;
        foreach ($case['tasks'] as $t) {
            if ($t['id'] === $taskid) {
                $task = $t;
                break;
            }
        }
        if (!$task) {
            throw new \moodle_exception('eval_invalidtask', 'mod_minaslab');
        }
        $cfg = self::config($minaslab);
        $now = time();
        $existing = $DB->get_record(self::TABLE, [
            'minaslabid' => $minaslab->id, 'userid' => $userid, 'taskid' => $taskid,
        ]);
        if ($existing && !empty($existing->closed)) {
            throw new \moodle_exception('eval_taskclosed', 'mod_minaslab');
        }

        $result = grader::grade($task, $response);
        if (!$result['valid']) {
            return [
                'status' => 'invalid',
                'score' => $existing ? (float) $existing->score : 0.0,
                'tries' => $existing ? (int) $existing->tries : 0,
                'closed' => false,
            ];
        }

        $tries = ($existing ? (int) $existing->tries : 0) + 1;
        $awarded = $result['fraction'] * max(0.0, 1 - $cfg['penalty'] * ($tries - 1));
        $best = max($awarded, $existing ? (float) $existing->score : 0.0);
        $closed = $result['status'] === 'correct' || $tries >= $cfg['maxtries'];

        $rec = (object) [
            'minaslabid' => $minaslab->id,
            'userid' => $userid,
            'taskid' => $taskid,
            'response' => json_encode($response, JSON_UNESCAPED_UNICODE),
            'fraction' => round($result['fraction'], 5),
            'score' => round($best, 5),
            'tries' => $tries,
            'status' => $result['status'],
            'closed' => $closed ? 1 : 0,
            'timemodified' => $now,
        ];
        if ($existing) {
            $rec->id = $existing->id;
            $DB->update_record(self::TABLE, $rec);
        } else {
            $rec->timecreated = $now;
            $rec->id = $DB->insert_record(self::TABLE, $rec);
        }

        $responses = self::responses($minaslab, $userid);
        $out = [
            'status' => $result['status'],
            'score' => round($best, 4),
            'tries' => $tries,
            'closed' => $closed,
            'summary' => self::summary($minaslab, $case['tasks'], $responses, $state['row'], $cfg),
        ];
        if ($closed && $cfg['showsolution']) {
            $out['solution'] = $task['solution'];
            $out['answerlabel'] = self::answer_label($task);
        }

        \mod_minaslab\event\task_answered::create([
            'objectid' => $rec->id,
            'context' => \context_module::instance(get_coursemodule_from_instance('minaslab', $minaslab->id)->id),
            'relateduserid' => $userid,
            'other' => ['taskid' => $taskid, 'status' => $result['status'], 'tries' => $tries],
        ])->trigger();

        return $out;
    }

    /**
     * Autoguardado del avance (respuestas sin enviar, mediciones, cámara).
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @param string $draftjson
     * @return int marca de tiempo del guardado
     */
    public static function save_draft(\stdClass $minaslab, int $userid, string $draftjson): int {
        if (strlen($draftjson) > self::MAX_DRAFT) {
            throw new \moodle_exception('eval_drafttoolarge', 'mod_minaslab');
        }
        $draft = json_decode($draftjson, true);
        if (!is_array($draft)) {
            throw new \invalid_parameter_exception('draft');
        }
        $state = self::user_state($minaslab, $userid);
        $progress = $state['progress'];
        $progress['mode'] = 'eval';
        $progress['draft'] = $draft;
        $progress['savedat'] = time();
        progress_manager::save_state($minaslab, $userid, $progress, null, false);
        return $progress['savedat'];
    }

    /**
     * Cierra la evaluación y envía la nota al libro de calificaciones.
     *
     * @param \stdClass $minaslab
     * @param int $userid
     * @return array resumen final
     */
    public static function finish(\stdClass $minaslab, int $userid): array {
        global $DB;

        $state = self::user_state($minaslab, $userid);
        if ($state['row'] && !empty($state['row']->completed)) {
            throw new \moodle_exception('eval_alreadyfinished', 'mod_minaslab');
        }
        $case = self::case_for($minaslab, $userid);
        $cfg = self::config($minaslab);
        $responses = self::responses($minaslab, $userid);
        $fraction = self::weighted_fraction($case['tasks'], $responses);

        // Cerrar las tareas abiertas: lo no respondido queda en cero.
        $DB->set_field(self::TABLE, 'closed', 1, ['minaslabid' => $minaslab->id, 'userid' => $userid]);

        $progress = $state['progress'];
        $progress['mode'] = 'eval';
        $progress['finishedat'] = time();
        $progress['scoreDraft'] = round($fraction * 100, 2);
        $grademax = (float) $minaslab->grade;
        $score = $grademax > 0 ? $fraction * $grademax : null;
        $row = progress_manager::save_state($minaslab, $userid, $progress, $score, true);
        if ($grademax <= 0) {
            // Sin calificación: marcar igualmente como finalizada.
            $DB->update_record('minaslab_user_state', (object) [
                'id' => $row->id, 'completed' => 1, 'timecompleted' => time(),
            ]);
            $row = progress_manager::get_state($minaslab, $userid);
        }

        $cm = get_coursemodule_from_instance('minaslab', $minaslab->id, 0, false, MUST_EXIST);
        \mod_minaslab\event\evaluation_finished::create([
            'objectid' => $minaslab->id,
            'context' => \context_module::instance($cm->id),
            'relateduserid' => $userid,
            'other' => ['percent' => round($fraction * 100, 2)],
        ])->trigger();

        return self::summary($minaslab, $case['tasks'], self::responses($minaslab, $userid), $row, $cfg);
    }

    /**
     * Reinicia la evaluación de un estudiante con un caso nuevo (acción docente).
     *
     * @param \stdClass $minaslab
     * @param int $userid
     */
    public static function reset_user(\stdClass $minaslab, int $userid): void {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/mod/minaslab/lib.php');

        $state = self::user_state($minaslab, $userid);
        $variant = (int) ($state['progress']['variant'] ?? 0) + 1;
        $DB->delete_records(self::TABLE, ['minaslabid' => $minaslab->id, 'userid' => $userid]);
        if ($state['row']) {
            $DB->update_record('minaslab_user_state', (object) [
                'id' => $state['row']->id,
                'progressjson' => json_encode(['mode' => 'eval', 'variant' => $variant,
                    'seed' => rng::seed_for((int) $minaslab->id, $userid, $variant)]),
                'finalgrade' => null,
                'completed' => 0,
                'timecompleted' => null,
                'timemodified' => time(),
            ]);
        }
        minaslab_reset_user_grade($minaslab, $userid);
    }
}
