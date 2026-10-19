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
 * Semestre IV — Sistema de Explotación a Rajo Abierto (asignatura PNA).
 *
 * Rajo de cobre en operación: ángulos interrampa y global, ancho de rampa
 * con pretil, vida útil y ritmo de producción (Taylor), dimensionamiento de
 * flota, destino de bloques por ley de corte y caudal de ventilación de la
 * rampa de exploración subterránea.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class semester4 extends base {

    public function key(): string {
        return 'ev_s4_rajo';
    }

    public function semester(): int {
        return 4;
    }

    public function meta(): array {
        return [
            'subject' => 'Sistema de Explotación a Rajo Abierto',
            'support' => ['Ventilación de Minas', 'Diseño y Evaluación de Proyectos'],
            'title' => 'Evaluación práctica IV: diseño de fase, flota y destino de bloques en rajo de cobre',
            'summary' => 'Opera un rajo de cobre en 3D con pala, camiones de alto tonelaje y botadero: verifica el diseño ' .
                'de taludes y rampa, aplica la regla de Taylor, dimensiona la flota a partir del ciclo de transporte, ' .
                'decide el destino de los bloques de la fase y calcula el caudal de ventilación de la rampa subterránea.',
            'scene' => 's4',
            'ra' => [
                'RAJ-RA1' => 'Identifica las distintas fases que se desarrollan en un sistema de explotación de rajo abierto ' .
                    'y los yacimientos existentes en Chile.',
                'RAJ-RA2' => 'Aplica los procesos de la planificación minera que orientan la secuencia de explotación en ' .
                    'una mina a rajo abierto.',
                'RAJ-RA3' => 'Conoce los procesos operativos y de mantención, utilizando el equipamiento requerido.',
                'RAJ-RA4' => 'Diseña las distintas fases de explotación del sistema de rajo abierto para la generación de ' .
                    'un plan minero.',
                'VEN-RA3' => 'Ventilación de Minas: realiza cálculos de caudales de aire requeridos en labores subterráneas.',
            ],
            'competencies' => [
                'C1' => 'Dirigir procesos de perforación, tronadura, carguío y transporte según normativa vigente.',
                'C2' => 'Desarrollar programas de trabajo para el personal técnico a su cargo.',
                'C3' => 'Aplicar normas de prevención de riesgos, seguridad e higiene industrial.',
                'C4' => 'Integrar instrumentos de diseño y evaluación de proyectos.',
            ],
        ];
    }

    protected function build(rng $r): array {
        $h = 15.0;
        $alpha = (float) $r->int(65, 72);
        $berm = $r->float(8.0, 10.5, 0.5);
        $benches = $r->int(6, 8);
        $rampw = (float) $r->int(30, 36);
        $grade = $r->float(0.08, 0.10, 0.005);
        $face = $h / tan(deg2rad($alpha));
        $interramp = rad2deg(atan($h / ($face + $berm)));
        $overall = rad2deg(atan($benches * $h / ($benches * $face + ($benches - 1) * $berm + $rampw)));

        // Camión y rampa doble vía.
        $trucks = [
            ['model' => 'Camión 220 t', 'payload' => 220.0, 'width' => 7.4, 'tire' => 3.45],
            ['model' => 'Camión 227 t', 'payload' => 227.0, 'width' => 7.6, 'tire' => 3.59],
            ['model' => 'Camión 290 t', 'payload' => 290.0, 'width' => 8.3, 'tire' => 3.85],
        ];
        $truck = $r->pick($trucks);
        $ditch = $r->float(1.0, 2.0, 0.5);
        $bermbase = $truck['tire'] / tan(deg2rad(41));
        $roadwidth = 3.5 * $truck['width'] + $bermbase + $ditch;

        // Regla de Taylor.
        $reserves = (float) $r->int(90, 260);
        $life = 5.35 * $reserves ** 0.273;
        $rop = $reserves / $life;

        // Ciclo de transporte y flota.
        $cycle = [
            'carga' => $r->float(2.5, 3.5, 0.1),
            'cargado' => $r->float(10, 16, 0.5),
            'descarga' => $r->float(0.8, 1.2, 0.1),
            'vacio' => $r->float(6, 10, 0.5),
            'cola' => $r->float(1.5, 3.0, 0.5),
        ];
        $tc = array_sum($cycle);
        $maint = $r->float(1.0, 2.0, 0.5);
        $reserve = $r->float(0.5, 1.0, 0.1);
        $losses = $r->float(1.2, 2.2, 0.1);
        $effective = 12 - $maint - $reserve - $losses;
        $movement = (float) ($r->int(55, 110) * 1000);
        $truckrate = $truck['payload'] * 60 / $tc;
        $fleet = (int) ceil($movement / ($truckrate * 2 * $effective));

        // Destino de bloques.
        $cm = $r->float(1.8, 2.6, 0.1);
        $cp = $r->float(7.0, 10.0, 0.5);
        $price = $r->float(3.4, 4.4, 0.1);
        $cr = 0.40;
        $rec = $r->float(0.84, 0.90, 0.01);
        $cutoff = ($cm + $cp) / (($price - $cr) * $rec * 2204.62) * 100;
        $blocks = [];
        $toplant = [];
        for ($i = 1; $i <= 6; $i++) {
            do {
                $g = round($cutoff * $r->float(0.3, 2.4, 0.05), 2);
            } while (abs($g - $cutoff) < 0.03);
            $blocks[] = ['id' => 'B' . $i, 'grade' => $g, 'tonnes' => $r->int(80, 160) * 1000];
            if ($g >= $cutoff) {
                $toplant[] = 'B' . $i;
            }
        }
        if (!$toplant || count($toplant) === 6) {
            // Garantizar al menos un bloque de cada destino.
            $blocks[0]['grade'] = round($cutoff + 0.15, 2);
            $blocks[5]['grade'] = round(max(0.03, $cutoff - 0.08), 2);
            $toplant = [];
            foreach ($blocks as $b) {
                if ($b['grade'] >= $cutoff) {
                    $toplant[] = $b['id'];
                }
            }
        }

        // Ventilación de rampa subterránea (DS 132).
        $people = $r->int(6, 16);
        $equip = [
            ['name' => 'LHD 10 yd³', 'hp' => (float) $r->pick([275, 300, 340])],
            ['name' => 'Camión de bajo perfil', 'hp' => (float) $r->pick([400, 450, 500])],
            ['name' => 'Jumbo de perforación', 'hp' => (float) $r->pick([110, 120, 150])],
        ];
        $hp = array_sum(array_column($equip, 'hp'));
        $airflow = 3 * $people + 2.83 * $hp;

        $scene = [
            'origin' => ['E' => 498000 + $r->int(0, 900), 'N' => 7530000 + $r->int(0, 900), 'Z' => 2900 + $r->int(0, 200)],
            'pit' => [
                'halfLength' => 150.0, 'radius' => 240.0, 'benches' => $benches, 'benchHeight' => $h,
                'faceAngle' => $alpha, 'berm' => $berm, 'rampWidth' => $rampw, 'rampGrade' => $grade,
            ],
            'truck' => $truck + ['count' => min(6, $fleet)],
            'dispatch' => $cycle,
            'shift' => ['hours' => 12, 'maint' => $maint, 'reserve' => $reserve, 'losses' => $losses, 'shifts' => 2],
            'reserves' => $reserves,
            'blocks' => $blocks,
            'portal' => ['people' => $people, 'equipment' => $equip],
        ];

        $optblocks = array_map(fn($b) => ['id' => $b['id'], 'label' => 'Bloque ' . $b['id']], $blocks);

        $tasks = [
            [
                'id' => 'ira',
                'type' => 'number',
                'title' => 'Ángulo interrampa de la fase',
                'prompt' => 'Mide la altura de banco (H) y el ancho de berma (B) en la pared norte. Con ángulo de cara ' .
                    'α = ' . (int) $alpha . '°, calcula el ángulo interrampa θ = arctan[H / (H/tan α + B)].',
                'answer' => $interramp,
                'unit' => '°',
                'decimals' => 1,
                'tolerance' => ['abs' => 0.8],
                'weight' => 10,
                'ra' => ['RAJ-RA4'],
                'competencies' => ['C1'],
                'tool' => 'measure',
                'focus' => 'wall',
                'solution' => 'H = 15 m; B = ' . self::n($berm, 1) . ' m; H/tan α = ' . self::n($face, 2) . ' m → θ = ' .
                    self::n($interramp, 1) . '°.',
            ],
            [
                'id' => 'global',
                'type' => 'number',
                'title' => 'Ángulo global del talud',
                'prompt' => 'Cuenta los bancos de la pared (n) y mide el ancho de la rampa (Wr). En una sección que cruza la ' .
                    'rampa una vez, el ángulo global es θg = arctan[n·H / (n·H/tan α + (n − 1)·B + Wr)].',
                'answer' => $overall,
                'unit' => '°',
                'decimals' => 1,
                'tolerance' => ['abs' => 0.8],
                'weight' => 15,
                'ra' => ['RAJ-RA4', 'RAJ-RA1'],
                'competencies' => ['C1'],
                'tool' => 'measure',
                'focus' => 'ramp',
                'solution' => 'n = ' . $benches . '; Wr = ' . self::n($rampw, 0) . ' m → θg = arctan(' . self::n($benches * $h, 0) .
                    ' / ' . self::n($benches * $face + ($benches - 1) * $berm + $rampw, 1) . ') = ' . self::n($overall, 1) . '°.',
            ],
            [
                'id' => 'ancho',
                'type' => 'number',
                'title' => 'Ancho de rampa de doble vía con pretil',
                'prompt' => 'Inspecciona el camión para obtener su ancho (W) y el diámetro del neumático (D). El pretil tiene ' .
                    'altura D/2 y ángulo de reposo 41°, con base = 2·(D/2)/tan 41°. La cuneta mide ' . self::n($ditch, 1) .
                    ' m. Calcula el ancho de rampa: A = 3,5·W + base del pretil + cuneta.',
                'answer' => $roadwidth,
                'unit' => 'm',
                'decimals' => 2,
                'tolerance' => ['abs' => 0.3],
                'weight' => 10,
                'ra' => ['RAJ-RA3', 'RAJ-RA4'],
                'competencies' => ['C3', 'C1'],
                'tool' => 'inspect',
                'focus' => 'truck',
                'solution' => 'Base del pretil = ' . self::n($truck['tire'], 2) . '/tan 41° = ' . self::n($bermbase, 2) .
                    ' m; A = 3,5·' . self::n($truck['width'], 1) . ' + ' . self::n($bermbase, 2) . ' + ' . self::n($ditch, 1) .
                    ' = ' . self::n($roadwidth, 2) . ' m.',
            ],
            [
                'id' => 'taylor',
                'type' => 'number',
                'title' => 'Ritmo de producción (regla de Taylor)',
                'prompt' => 'El tablero de planificación informa reservas de ' . self::n($reserves, 0) . ' Mt. Con la regla de ' .
                    'Taylor para cobre, VOE = 5,35·R^0,273 (años, R en Mt), calcula el ritmo óptimo ROP = R / VOE en Mt/año.',
                'answer' => $rop,
                'unit' => 'Mt/año',
                'decimals' => 2,
                'tolerance' => ['rel' => 0.02],
                'weight' => 15,
                'ra' => ['RAJ-RA2'],
                'competencies' => ['C4'],
                'solution' => 'VOE = 5,35·' . self::n($reserves, 0) . '^0,273 = ' . self::n($life, 1) . ' años → ROP = ' .
                    self::n($rop, 2) . ' Mt/año.',
            ],
            [
                'id' => 'flota',
                'type' => 'number',
                'title' => 'Dimensionamiento de la flota de camiones',
                'prompt' => 'Inspecciona el tablero de despacho (tiempos del ciclo) y el camión (carga útil). El turno es de ' .
                    '12 h con ' . self::n($maint, 1) . ' h de mantención, ' . self::n($reserve, 1) . ' h de reserva y ' .
                    self::n($losses, 1) . ' h de pérdidas operacionales; 2 turnos por día. Calcula los camiones necesarios ' .
                    'para mover ' . self::n($movement, 0) . ' t/día (redondea al entero superior).',
                'answer' => $fleet,
                'unit' => 'camiones',
                'decimals' => 0,
                'tolerance' => ['abs' => 0.5],
                'weight' => 20,
                'ra' => ['RAJ-RA3', 'RAJ-RA2'],
                'competencies' => ['C1', 'C2'],
                'tool' => 'inspect',
                'focus' => 'dispatch',
                'hint' => 'Rendimiento = carga útil·60 / ciclo (t/h); horas efectivas/día = 2·(12 − mant. − reserva − pérdidas).',
                'solution' => 'Ciclo = ' . self::n($tc, 1) . ' min → ' . self::n($truckrate, 1) . ' t/h; horas efectivas = ' .
                    self::n(2 * $effective, 1) . ' h/día; N = ' . self::n($movement, 0) . ' / (' . self::n($truckrate, 1) . '·' .
                    self::n(2 * $effective, 1) . ') = ' . self::n($movement / ($truckrate * 2 * $effective), 2) . ' → ' . $fleet .
                    ' camiones.',
            ],
            [
                'id' => 'destino',
                'type' => 'multi',
                'title' => 'Destino de los bloques de la fase',
                'prompt' => 'Costos: mina ' . self::n($cm, 2) . ' US$/t, planta ' . self::n($cp, 2) . ' US$/t; Cu ' .
                    self::n($price, 2) . ' US$/lb, fundición y refino ' . self::n($cr, 2) . ' US$/lb, recuperación ' .
                    self::n($rec * 100, 0) . ' %. Determina la ley de corte, inspecciona los bloques B1–B6 del banco ' .
                    'en explotación y marca los que deben enviarse a planta.',
                'options' => $optblocks,
                'answer' => $toplant,
                'weight' => 20,
                'ra' => ['RAJ-RA2', 'RAJ-RA4'],
                'competencies' => ['C4'],
                'tool' => 'inspect',
                'focus' => 'blocks',
                'solution' => 'Ley de corte = ' . self::n($cutoff, 3) . ' % Cu. A planta: ' . implode(', ', $toplant) .
                    '; el resto a botadero.',
            ],
            [
                'id' => 'vent',
                'type' => 'number',
                'title' => 'Caudal de ventilación de la rampa subterránea',
                'prompt' => 'En el portal de la rampa de exploración inspecciona la dotación y los equipos diésel. Según el ' .
                    'DS 132, calcula el caudal mínimo: Q = 3 m³/min por persona + 2,83 m³/min por HP de equipos diésel.',
                'answer' => $airflow,
                'unit' => 'm³/min',
                'decimals' => 1,
                'tolerance' => ['rel' => 0.01],
                'weight' => 10,
                'ra' => ['VEN-RA3'],
                'competencies' => ['C3'],
                'tool' => 'inspect',
                'focus' => 'portal',
                'solution' => 'Q = 3·' . $people . ' + 2,83·' . self::n($hp, 0) . ' = ' . self::n($airflow, 1) . ' m³/min (' .
                    self::n($airflow / 60, 2) . ' m³/s).',
            ],
        ];

        return [
            'context' => 'Mina «Sierra Gorda Norte», fase 4 en explotación. Como ingeniero de planificación de corto plazo ' .
                'debes validar el diseño, dimensionar la flota del próximo trimestre y definir el destino del material ' .
                'del banco activo.',
            'scene' => $scene,
            'tasks' => $tasks,
        ];
    }
}
