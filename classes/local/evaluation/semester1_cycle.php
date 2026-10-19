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
 * Semestre I — Bases de las Operaciones Mineras: ciclo minero a rajo abierto.
 *
 * Reemplaza la práctica formativa «ciclo perforación–carguío–transporte y
 * botadero» (misma clave de catálogo) por una práctica calificada: secuencia
 * del ciclo, tiempo de viaje, pases de carguío, productividad del camión,
 * dimensionamiento de flota, factor de acoplamiento y destino de las cargas.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class semester1_cycle extends base {

    public function key(): string {
        return 's1_bases_ops_b';
    }

    public function semester(): int {
        return 1;
    }

    public function meta(): array {
        return [
            'subject' => 'Bases de las Operaciones Mineras',
            'support' => ['Topografía e Interpretación de Planos'],
            'title' => 'Rajo abierto: ciclo perforación–carguío–transporte y botadero',
            'summary' => 'Observa en 3D el ciclo productivo completo de un rajo: perforación, tronadura, carguío con ' .
                'cargador frontal, transporte por la rampa y descarga en chancado o botadero. Calcula pases de ' .
                'carguío, tiempo de viaje, productividad, flota necesaria y factor de acoplamiento, y decide el ' .
                'destino de cada carga.',
            'scene' => 's1c',
            'ra' => [
                'BOM-RA1' => 'Conoce y comprende las obras principales de minería subterránea y rajo abierto; ' .
                    'conoce, diseña y analiza las obras necesarias para la minería.',
                'BOM-RA2' => 'Conoce y comprende las condiciones para el diseño de las obras necesarias para la ' .
                    'minería, obras complementarias y servicios generales.',
            ],
            'competencies' => [
                'C1' => 'Dirigir procesos asociados a la operación de un yacimiento minero: perforación, tronadura, ' .
                    'carguío y transporte, en el marco de la normativa vigente.',
                'C2' => 'Desarrollar programas de trabajo para el personal técnico a su cargo.',
            ],
        ];
    }

    protected function build(rng $r): array {
        // Equipos.
        $payload = (float) $r->pick([91, 100, 136]);
        $bucket = (float) $r->pick([9.5, 11.5, 13.0, 16.0]);
        $fill = $r->float(0.85, 0.95, 0.01);
        $loose = $r->float(1.70, 1.95, 0.05);
        $perpass = $bucket * $fill * $loose;
        $passes = (int) ceil($payload / $perpass);

        // Tiempos de ciclo observados por despacho.
        $tpass = $r->float(0.50, 0.70, 0.05);
        $tload = round($passes * $tpass + 0.5, 1);
        $dist = $r->float(1.8, 3.4, 0.1);
        $vloaded = (float) $r->int(14, 20);
        $tloaded = $dist / $vloaded * 60;
        $tempty = round($dist / $r->int(28, 34) * 60, 1);
        $tdump = $r->float(1.0, 1.6, 0.1);
        $twait = $r->float(1.0, 3.0, 0.5);
        $tcycle = round($tload + $tloaded + $tdump + $tempty + $twait, 1);

        // Productividad, flota y acoplamiento.
        $effmin = (float) $r->int(45, 52);
        $prod = $payload * $effmin / $tcycle;
        $target = (float) ($r->int(9, 20) * 100);
        $fleet = (int) ceil($target / $prod);
        $inop = $r->int(4, 8);
        $match = $inop * $tload / $tcycle;

        // Destino de las cargas según ley de corte.
        $cutoff = $r->float(0.25, 0.40, 0.01);
        $loads = [];
        $tocrusher = [];
        for ($i = 1; $i <= 6; $i++) {
            do {
                $g = round($cutoff * $r->float(0.3, 2.6, 0.05), 2);
            } while (abs($g - $cutoff) < 0.03);
            $loads[] = ['id' => 'T' . $i, 'truck' => 'C-' . (10 + $i), 'grade' => $g];
            if ($g >= $cutoff) {
                $tocrusher[] = 'T' . $i;
            }
        }
        if (!$tocrusher || count($tocrusher) === 6) {
            $loads[0]['grade'] = round($cutoff + 0.12, 2);
            $loads[5]['grade'] = round(max(0.05, $cutoff - 0.1), 2);
            $tocrusher = array_column(array_filter($loads, fn($l) => $l['grade'] >= $cutoff), 'id');
        }

        $cycle = [
            ['id' => 'perf', 'label' => 'Perforación de pozos'],
            ['id' => 'tron', 'label' => 'Tronadura'],
            ['id' => 'carg', 'label' => 'Carguío'],
            ['id' => 'trans', 'label' => 'Transporte cargado por la rampa'],
            ['id' => 'desc', 'label' => 'Descarga en chancado o botadero'],
            ['id' => 'ret', 'label' => 'Retorno vacío al frente de carguío'],
        ];

        $scene = [
            'origin' => ['E' => 343000 + $r->int(0, 900), 'N' => 6353000 + $r->int(0, 900), 'Z' => 2700 + $r->int(0, 150)],
            'pit' => [
                'halfLength' => 80.0, 'radius' => 125.0, 'benches' => 5, 'benchHeight' => 10.0,
                'faceAngle' => 70.0, 'berm' => 8.0, 'rampWidth' => 20.0, 'rampGrade' => 0.09,
            ],
            'truck' => ['payload' => $payload, 'count' => 3],
            'loader' => ['bucket' => $bucket, 'fill' => $fill, 'loose' => $loose],
            'dispatch' => [
                'carga' => $tload, 'distancia' => $dist, 'velcargado' => $vloaded, 'descarga' => $tdump,
                'vacio' => $tempty, 'esperas' => $twait, 'enoperacion' => $inop,
            ],
            'loads' => $loads,
            'cutoff' => $cutoff,
        ];

        $tasks = [
            [
                'id' => 'ciclo',
                'type' => 'order',
                'title' => 'Secuencia del ciclo minero',
                'prompt' => 'Recorre la faena (los marcadores muestran cada etapa) y ordena las operaciones del ciclo ' .
                    'productivo a rajo abierto.',
                'options' => $r->shuffle($cycle),
                'answer' => array_column($cycle, 'id'),
                'weight' => 10,
                'ra' => ['BOM-RA1'],
                'competencies' => ['C1'],
                'solution' => implode(' → ', array_column($cycle, 'label')) . '.',
            ],
            [
                'id' => 'pases',
                'type' => 'number',
                'title' => 'Pases de carguío por camión',
                'prompt' => 'Inspecciona el cargador frontal (capacidad del balde, factor de llenado y densidad del ' .
                    'material esponjado) y el camión (carga útil). Calcula el número de pases para llenar un camión: ' .
                    'n = ⌈carga útil / (balde · llenado · densidad suelta)⌉.',
                'answer' => $passes,
                'unit' => 'pases',
                'decimals' => 0,
                'tolerance' => ['abs' => 0.5],
                'weight' => 15,
                'ra' => ['BOM-RA1'],
                'competencies' => ['C1'],
                'tool' => 'inspect',
                'focus' => 'loader',
                'solution' => 'Por pase: ' . self::n($bucket, 1) . ' · ' . self::n($fill, 2) . ' · ' . self::n($loose, 2) .
                    ' = ' . self::n($perpass, 2) . ' t; ' . self::n($payload, 0) . ' / ' . self::n($perpass, 2) . ' = ' .
                    self::n($payload / $perpass, 2) . ' → ' . $passes . ' pases.',
            ],
            [
                'id' => 'viaje',
                'type' => 'number',
                'title' => 'Tiempo de viaje cargado',
                'prompt' => 'En el tablero de despacho revisa la distancia de transporte desde el frente hasta el ' .
                    'chancador y la velocidad media cargado por la rampa. Calcula el tiempo de viaje cargado en minutos.',
                'answer' => $tloaded,
                'unit' => 'min',
                'decimals' => 2,
                'tolerance' => ['rel' => 0.02],
                'weight' => 15,
                'ra' => ['BOM-RA2'],
                'competencies' => ['C1'],
                'tool' => 'inspect',
                'focus' => 'dispatch',
                'solution' => 't = ' . self::n($dist, 1) . ' km / ' . self::n($vloaded, 0) . ' km/h · 60 = ' .
                    self::n($tloaded, 2) . ' min.',
            ],
            [
                'id' => 'prod',
                'type' => 'number',
                'title' => 'Productividad horaria del camión',
                'prompt' => 'El ciclo total medido por despacho es de ' . self::n($tcycle, 1) . ' min y cada hora tiene ' .
                    self::n($effmin, 0) . ' minutos efectivos de operación. Calcula la productividad de un camión en t/h: ' .
                    'P = carga útil · (minutos efectivos / ciclo).',
                'answer' => $prod,
                'unit' => 't/h',
                'decimals' => 1,
                'tolerance' => ['rel' => 0.02],
                'weight' => 15,
                'ra' => ['BOM-RA1'],
                'competencies' => ['C1', 'C2'],
                'tool' => 'inspect',
                'focus' => 'truck',
                'solution' => 'P = ' . self::n($payload, 0) . ' · ' . self::n($effmin, 0) . ' / ' . self::n($tcycle, 1) . ' = ' .
                    self::n($prod, 1) . ' t/h.',
            ],
            [
                'id' => 'flota',
                'type' => 'number',
                'title' => 'Flota necesaria para el plan del turno',
                'prompt' => 'El plan de producción exige mover ' . self::n($target, 0) . ' t/h desde el frente. Con la ' .
                    'productividad calculada, determina el número mínimo de camiones (redondea al entero superior).',
                'answer' => $fleet,
                'unit' => 'camiones',
                'decimals' => 0,
                'tolerance' => ['abs' => 0.5],
                'weight' => 15,
                'ra' => ['BOM-RA1'],
                'competencies' => ['C2'],
                'solution' => 'N = ' . self::n($target, 0) . ' / ' . self::n($prod, 1) . ' = ' . self::n($target / $prod, 2) .
                    ' → ' . $fleet . ' camiones.',
            ],
            [
                'id' => 'match',
                'type' => 'number',
                'title' => 'Factor de acoplamiento cargador–camiones',
                'prompt' => 'Con los camiones en operación informados por despacho, el tiempo de carga y el ciclo total ' .
                    '(' . self::n($tcycle, 1) . ' min), calcula el factor de acoplamiento con un cargador: ' .
                    'FA = N · tiempo de carga / ciclo. (FA < 1: el cargador espera camiones; FA > 1: hay colas).',
                'answer' => $match,
                'unit' => '',
                'decimals' => 2,
                'tolerance' => ['abs' => 0.03],
                'weight' => 15,
                'ra' => ['BOM-RA1', 'BOM-RA2'],
                'competencies' => ['C1', 'C2'],
                'tool' => 'inspect',
                'focus' => 'dispatch',
                'solution' => 'FA = ' . $inop . ' · ' . self::n($tload, 1) . ' / ' . self::n($tcycle, 1) . ' = ' .
                    self::n($match, 2) . ($match < 1 ? ' → el cargador queda esperando camiones.' :
                    ' → se forman colas de camiones en el frente.'),
            ],
            [
                'id' => 'destino',
                'type' => 'multi',
                'title' => 'Destino de las cargas',
                'prompt' => 'Los camiones en fila (T1–T6) llevan material con la ley indicada por el control de mineral. ' .
                    'La ley de corte es ' . self::n($cutoff, 2) . ' % Cu. Inspecciona cada carga y marca las que deben ' .
                    'ir al chancador; el resto va al botadero.',
                'options' => array_map(fn($l) => ['id' => $l['id'], 'label' => $l['id'] . ' (camión ' . $l['truck'] . ')'],
                    $loads),
                'answer' => $tocrusher,
                'weight' => 15,
                'ra' => ['BOM-RA1'],
                'competencies' => ['C1'],
                'tool' => 'inspect',
                'focus' => 'queue',
                'solution' => 'Al chancador: ' . implode(', ', $tocrusher) . ' (ley ≥ ' . self::n($cutoff, 2) .
                    ' % Cu); el resto al botadero.',
            ],
        ];

        return [
            'context' => 'Rajo escuela «Cerro Aconcagua», turno A. El jefe de turno te pide verificar el ciclo de ' .
                'carguío y transporte entre el frente del fondo del rajo, el chancador primario y el botadero, y ' .
                'proponer la flota para cumplir el plan.',
            'scene' => $scene,
            'tasks' => $tasks,
        ];
    }
}
