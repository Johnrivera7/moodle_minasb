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
 * Evaluación práctica semestral: escenario 3D + tareas calificadas en servidor.
 *
 * Cada subclase define, a partir de un generador determinista, los datos
 * del escenario (que viajan al navegador) y las tareas con su respuesta
 * correcta (que nunca se envían al navegador antes de cerrar la tarea).
 *
 * Estructura de una tarea:
 *  - id (string), type (number|choice|multi|order|pick), title, prompt
 *  - weight (int, ponderación), ra (string[]), competencies (string[])
 *  - number: answer (float), unit, tolerance ['rel' => 0.02] o ['abs' => 0.5]
 *  - choice/pick: options [['id','label']], answer (id)
 *  - multi: options, answer (id[])
 *  - order: options (ítems a ordenar), answer (id[] en orden correcto)
 *  - tool (measure|compass|inspect|pick|none), focus (id de objeto 3D)
 *  - hint, solution (texto de retroalimentación con desarrollo numérico)
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
abstract class base {

    /**
     * Clave de catálogo (p. ej. ev_s1_operaciones).
     *
     * @return string
     */
    abstract public function key(): string;

    /**
     * Semestre de la carrera (1–5).
     *
     * @return int
     */
    abstract public function semester(): int;

    /**
     * Metadatos curriculares: asignatura, asignaturas de apoyo, título, resumen,
     * resultados de aprendizaje y competencias del perfil de egreso.
     *
     * @return array{subject:string, support:string[], title:string, summary:string,
     *               ra:array<string,string>, competencies:array<string,string>, scene:string}
     */
    abstract public function meta(): array;

    /**
     * Construye el caso del estudiante.
     *
     * @param rng $r generador determinista
     * @return array{context:string, scene:array, tasks:array}
     */
    abstract protected function build(rng $r): array;

    /**
     * Caso completo (con respuestas) para una semilla.
     *
     * @param int $seed
     * @return array
     */
    final public function generate(int $seed): array {
        $case = $this->build(new rng($seed));
        $case['seed'] = $seed;
        foreach ($case['tasks'] as $i => $task) {
            $case['tasks'][$i] += [
                'weight' => 1,
                'ra' => [],
                'competencies' => [],
                'tool' => 'none',
                'focus' => '',
                'hint' => '',
                'solution' => '',
                'unit' => '',
                'options' => [],
            ];
        }
        return $case;
    }

    /**
     * Formato numérico chileno (coma decimal, punto de miles).
     *
     * @param float $v
     * @param int $dec
     * @return string
     */
    protected static function n(float $v, int $dec = 2): string {
        return number_format($v, $dec, ',', '.');
    }
}
