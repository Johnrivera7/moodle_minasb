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

namespace mod_minaslab\local\evaluation;

/**
 * Corrección de respuestas por tipo de tarea (siempre en servidor).
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class grader {

    /**
     * Normaliza un número escrito por el estudiante: admite coma decimal y separador de miles.
     *
     * @param string $raw
     * @return float|null
     */
    public static function parse_number(string $raw): ?float {
        $s = trim(str_replace([' ', "\u{00A0}"], '', $raw));
        if ($s === '') {
            return null;
        }
        if (str_contains($s, ',') && str_contains($s, '.')) {
            // 12.345,6 (es-CL) o 12,345.6 (en): el último separador es el decimal.
            if (strrpos($s, ',') > strrpos($s, '.')) {
                $s = str_replace('.', '', $s);
                $s = str_replace(',', '.', $s);
            } else {
                $s = str_replace(',', '', $s);
            }
        } else {
            $s = str_replace(',', '.', $s);
        }
        if (!is_numeric($s)) {
            return null;
        }
        return (float) $s;
    }

    /**
     * Corrige una respuesta.
     *
     * @param array $task definición completa de la tarea
     * @param mixed $response string (number/choice/pick) o string[] (multi/order)
     * @return array{fraction: float, valid: bool, status: string}
     *         status: correct | partial | incorrect | invalid
     */
    public static function grade(array $task, $response): array {
        switch ($task['type']) {
            case 'number':
                return self::grade_number($task, is_array($response) ? '' : (string) $response);
            case 'choice':
            case 'pick':
                $ids = array_column($task['options'], 'id');
                $r = is_array($response) ? '' : (string) $response;
                if (!in_array($r, $ids, true)) {
                    return self::result(0.0, false);
                }
                return self::result($r === (string) $task['answer'] ? 1.0 : 0.0, true);
            case 'multi':
                return self::grade_multi($task, (array) $response);
            case 'order':
                return self::grade_order($task, (array) $response);
        }
        return self::result(0.0, false);
    }

    /**
     * @param array $task
     * @param string $raw
     * @return array
     */
    private static function grade_number(array $task, string $raw): array {
        $v = self::parse_number($raw);
        if ($v === null) {
            return self::result(0.0, false);
        }
        $expected = (float) $task['answer'];
        $tol = $task['tolerance'] ?? ['rel' => 0.02];
        $allowed = isset($tol['abs']) ? (float) $tol['abs'] : abs($expected) * (float) ($tol['rel'] ?? 0.02);
        $allowed = max($allowed, 1e-9);
        $err = abs($v - $expected);
        if ($err <= $allowed) {
            return self::result(1.0, true);
        }
        // Orden de magnitud correcto pero fuera de tolerancia: crédito parcial.
        if ($err <= 2.5 * $allowed) {
            return self::result(0.5, true);
        }
        return self::result(0.0, true);
    }

    /**
     * Selección múltiple: aciertos menos errores, sobre el total de correctas.
     *
     * @param array $task
     * @param array $response
     * @return array
     */
    private static function grade_multi(array $task, array $response): array {
        $ids = array_column($task['options'], 'id');
        $response = array_values(array_unique(array_filter(array_map('strval', $response),
            fn($x) => in_array($x, $ids, true))));
        if (!$response) {
            return self::result(0.0, false);
        }
        $correct = array_map('strval', (array) $task['answer']);
        $hits = count(array_intersect($response, $correct));
        $wrong = count(array_diff($response, $correct));
        $fraction = max(0.0, ($hits - $wrong) / max(1, count($correct)));
        return self::result(round($fraction, 4), true);
    }

    /**
     * Ordenamiento: proporción de pares en orden relativo correcto (tau de Kendall normalizado).
     *
     * @param array $task
     * @param array $response
     * @return array
     */
    private static function grade_order(array $task, array $response): array {
        $correct = array_map('strval', (array) $task['answer']);
        $response = array_map('strval', $response);
        $a = $response;
        $b = $correct;
        sort($a);
        sort($b);
        if ($a !== $b) {
            return self::result(0.0, false);
        }
        $pos = array_flip($response);
        $n = count($correct);
        $pairs = 0;
        $good = 0;
        for ($i = 0; $i < $n; $i++) {
            for ($j = $i + 1; $j < $n; $j++) {
                $pairs++;
                if ($pos[$correct[$i]] < $pos[$correct[$j]]) {
                    $good++;
                }
            }
        }
        $fraction = $pairs ? $good / $pairs : 0.0;
        // Solo el orden exacto obtiene puntaje completo; el resto, parcial reducido.
        if ($fraction < 1.0) {
            $fraction = round($fraction * 0.6, 4);
        }
        return self::result($fraction, true);
    }

    /**
     * @param float $fraction
     * @param bool $valid
     * @return array
     */
    private static function result(float $fraction, bool $valid): array {
        $status = !$valid ? 'invalid' : ($fraction >= 0.999 ? 'correct' : ($fraction > 0 ? 'partial' : 'incorrect'));
        return ['fraction' => $fraction, 'valid' => $valid, 'status' => $status];
    }
}
