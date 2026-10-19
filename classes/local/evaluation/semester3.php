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
 * Semestre III — Prospección y Evaluación de Yacimientos Mineros (asignatura PNA).
 *
 * Campaña de sondajes sobre un pórfido cuprífero: compósitos, control QA/QC,
 * cubicación por secciones, ley de corte, categorización de recursos y
 * diseño de carga de un banco de tronadura (Perforación y Tronadura).
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class semester3 extends base {

    public function key(): string {
        return 'ev_s3_yacimientos';
    }

    public function semester(): int {
        return 3;
    }

    public function meta(): array {
        return [
            'subject' => 'Prospección y Evaluación de Yacimientos Mineros',
            'support' => ['Perforación y Tronadura', 'Sistema de Explotación Subterráneo'],
            'title' => 'Evaluación práctica III: de la campaña de sondajes al recurso y al primer banco',
            'summary' => 'Interpreta una campaña de sondajes diamantinos sobre un pórfido cuprífero en 3D: calcula ' .
                'compósitos, controla la calidad analítica (QA/QC), cubica el cuerpo por secciones, determina la ley ' .
                'de corte, categoriza bloques según distancia a los sondajes y diseña la carga explosiva del primer banco.',
            'scene' => 's3',
            'ra' => [
                'PEY-RA1' => 'Conocer los aspectos fundamentales para el descubrimiento de un depósito de mineral ' .
                    '(exploración, sondajes, muestreo y control de calidad).',
                'PEY-RA2' => 'Comprender cómo se transforma un depósito de mineral en un yacimiento minero ' .
                    '(ley media, cubicación, ley de corte, recursos y reservas).',
                'PYT-RA2' => 'Perforación y Tronadura: sistemas de tronadura, explosivos y cálculo de carga en ' .
                    'diagramas de perforación.',
            ],
            'competencies' => [
                'C1' => 'Dirigir procesos de perforación, tronadura, carguío y transporte según normativa vigente.',
                'C3' => 'Aplicar normas de prevención de riesgos, seguridad e higiene industrial.',
                'C4' => 'Integrar instrumentos de diseño y evaluación de proyectos con enfoque innovador.',
            ],
        ];
    }

    protected function build(rng $r): array {
        // Sondajes verticales sobre el cuerpo mineralizado.
        $holes = [];
        $layout = [[-90, -40], [-30, -60], [35, -35], [-70, 45], [10, 30], [80, 50]];
        foreach ($layout as $i => [$x, $z]) {
            $x += $r->int(-8, 8);
            $z += $r->int(-8, 8);
            $top = $r->float(40, 70, 0.5);
            $intervals = [];
            $depth = $top;
            $n = $r->int(4, 5);
            for ($k = 0; $k < $n; $k++) {
                $len = $r->float(1.5, 4.0, 0.5);
                $grade = $r->float(0.25, 1.35, 0.01);
                $intervals[] = ['from' => round($depth, 2), 'to' => round($depth + $len, 2), 'grade' => $grade];
                $depth += $len;
            }
            $holes[] = ['id' => sprintf('DDH-%02d', $i + 1), 'x' => (float) $x, 'z' => (float) $z,
                'depth' => round($depth + $r->float(20, 40, 1), 1), 'intervals' => $intervals];
        }
        $target = $holes[$r->int(0, count($holes) - 1)];
        $sl = 0.0;
        $slg = 0.0;
        foreach ($target['intervals'] as $iv) {
            $l = $iv['to'] - $iv['from'];
            $sl += $l;
            $slg += $l * $iv['grade'];
        }
        $composite = $slg / $sl;

        // QA/QC con material de referencia certificado.
        $crm = $r->float(0.70, 1.10, 0.01);
        $sigma = $r->float(0.02, 0.04, 0.005);
        $nout = $r->int(1, 3);
        $batches = [];
        for ($i = 0; $i < 8; $i++) {
            $batches[] = round($crm + $r->float(-1.6, 1.6, 0.1) * $sigma, 3);
        }
        $outidx = array_slice($r->shuffle(range(0, 7)), 0, $nout);
        foreach ($outidx as $i) {
            $batches[$i] = round($crm + ($r->int(0, 1) ? 1 : -1) * $r->float(2.4, 4.0, 0.1) * $sigma, 3);
        }
        $qaopts = [];
        $qaans = [];
        foreach ($batches as $i => $v) {
            $id = 'l' . ($i + 1);
            $qaopts[] = ['id' => $id, 'label' => 'Lote ' . ($i + 1) . ': ' . self::n($v, 3) . ' % Cu'];
            if (abs($v - $crm) > 2 * $sigma) {
                $qaans[] = $id;
            }
        }

        // Cubicación por secciones transversales.
        $spacing = (float) $r->pick([25, 40, 50]);
        $areas = [(float) $r->int(800, 1400), (float) $r->int(1200, 1900), (float) $r->int(900, 1500)];
        $density = $r->float(2.55, 2.75, 0.05);
        $volume = $spacing * ($areas[0] + $areas[1]) / 2 + $spacing * ($areas[1] + $areas[2]) / 2;
        $tonnage = $volume * $density;

        // Ley de corte crítica.
        $cm = $r->float(1.6, 2.6, 0.1);
        $cp = $r->float(6.0, 10.0, 0.5);
        $price = $r->float(3.2, 4.4, 0.05);
        $cr = $r->float(0.30, 0.50, 0.05);
        $rec = $r->float(0.82, 0.92, 0.01);
        $cutoff = ($cm + $cp) / (($price - $cr) * $rec * 2204.62) * 100;

        // Categorización por distancia horizontal al sondaje más cercano.
        $categories = ['medido' => [10, 42], 'indicado' => [58, 92], 'inferido' => [110, 150]];
        $wanted = $r->pick(array_keys($categories));
        // Buscar una ubicación cuya distancia mínima quede lejos de los umbrales (±8 m).
        for ($try = 0; $try < 40; $try++) {
            $d = $r->int($categories[$wanted][0], $categories[$wanted][1]);
            $ref = $holes[$r->int(0, count($holes) - 1)];
            $ang = deg2rad($r->int(0, 359));
            $bx = $ref['x'] + $d * cos($ang);
            $bz = $ref['z'] + $d * sin($ang);
            $nearest = INF;
            foreach ($holes as $hh) {
                $nearest = min($nearest, hypot($hh['x'] - $bx, $hh['z'] - $bz));
            }
            if (abs($nearest - 50) >= 8 && abs($nearest - 100) >= 8 && abs($bx) < 200 && abs($bz) < 200) {
                break;
            }
        }
        $cat = $nearest <= 50 ? 'medido' : ($nearest <= 100 ? 'indicado' : 'inferido');

        // Diseño de carga del banco de tronadura.
        $bh = (float) $r->int(10, 15);
        $diam = (float) $r->pick([127, 152, 165, 200]);
        $burden = round($diam / 1000 * $r->float(32, 38, 1), 1);
        $spac = round($burden * $r->float(1.15, 1.25, 0.05), 1);
        $sub = round(0.3 * $burden, 1);
        $stem = round(0.7 * $burden, 1);
        $rhoexp = $r->pick([0.80, 0.85, 0.95]);
        $lin = M_PI / 4 * ($diam / 1000) ** 2 * $rhoexp * 1000;
        $qhole = ($bh + $sub - $stem) * $lin;
        $pf = $qhole / ($burden * $spac * $bh);

        $sequence = [
            ['id' => 'aislar', 'label' => 'Aislar y señalizar el área de carguío (loros vigías y letreros)'],
            ['id' => 'medir', 'label' => 'Verificar profundidad y agua de cada pozo; soplar los pozos'],
            ['id' => 'primar', 'label' => 'Bajar el iniciador (booster con detonador) al fondo del pozo'],
            ['id' => 'columna', 'label' => 'Cargar la columna de explosivo hasta la cota de taco'],
            ['id' => 'taco', 'label' => 'Colocar el taco con detritus de perforación'],
            ['id' => 'amarre', 'label' => 'Amarre de la malla, revisión y evacuación antes del disparo'],
        ];

        $scene = [
            'origin' => ['E' => 412000 + $r->int(0, 900), 'N' => 7458000 + $r->int(0, 900), 'Z' => 3150 + $r->int(0, 150)],
            'holes' => $holes,
            'orebody' => ['rx' => 130.0, 'ry' => 55.0, 'rz' => 85.0, 'depth' => 95.0],
            'sections' => array_map(fn($i) => ['id' => 'S' . ($i + 1), 'x' => ($i - 1) * $spacing,
                'area' => $areas[$i]], [0, 1, 2]),
            'spacing' => $spacing,
            'block' => ['id' => 'B-' . $r->int(10, 99), 'x' => round($bx, 1), 'z' => round($bz, 1)],
            'pattern' => ['burden' => $burden, 'spacing' => $spac, 'diameter' => $diam, 'height' => $bh,
                'sub' => $sub, 'stem' => $stem, 'rows' => 4, 'cols' => 7],
            'qaqc' => ['crm' => $crm, 'sigma' => $sigma, 'values' => $batches],
        ];

        $tasks = [
            [
                'id' => 'comp',
                'type' => 'number',
                'title' => 'Compósito del intercepto mineralizado',
                'prompt' => 'Inspecciona los tramos ensayados del sondaje ' . $target['id'] . ' y calcula la ley del ' .
                    'compósito de todo el intercepto mineralizado (ponderada por longitud).',
                'answer' => $composite,
                'unit' => '% Cu',
                'decimals' => 3,
                'tolerance' => ['abs' => 0.01],
                'weight' => 15,
                'ra' => ['PEY-RA1', 'PEY-RA2'],
                'competencies' => ['C4'],
                'tool' => 'inspect',
                'focus' => $target['id'],
                'solution' => $target['id'] . ': Σ(l·ley) = ' . self::n($slg, 3) . ', Σl = ' . self::n($sl, 2) .
                    ' m → compósito = ' . self::n($composite, 3) . ' % Cu.',
            ],
            [
                'id' => 'qaqc',
                'type' => 'multi',
                'title' => 'Control de calidad analítica (QA/QC)',
                'prompt' => 'Cada lote del laboratorio incluyó el estándar certificado STD-Cu de ' . self::n($crm, 3) .
                    ' % Cu (σ = ' . self::n($sigma, 3) . '). Revisa la carta de control y marca los lotes que deben ' .
                    'reensayarse por quedar fuera de ±2σ.',
                'options' => $qaopts,
                'answer' => $qaans,
                'weight' => 15,
                'ra' => ['PEY-RA1'],
                'competencies' => ['C4'],
                'solution' => 'Límites: ' . self::n($crm - 2 * $sigma, 3) . ' – ' . self::n($crm + 2 * $sigma, 3) .
                    ' % Cu. Reensayar: ' . implode(', ', array_map(fn($id) => 'lote ' . substr($id, 1), $qaans)) . '.',
            ],
            [
                'id' => 'cub',
                'type' => 'number',
                'title' => 'Cubicación por secciones transversales',
                'prompt' => 'Las secciones S1, S2 y S3 están separadas ' . self::n($spacing, 0) . ' m. Inspecciona el área ' .
                    'mineralizada de cada una y estima el tonelaje con el método de áreas medias, densidad ' .
                    self::n($density, 2) . ' t/m³.',
                'answer' => $tonnage,
                'unit' => 't',
                'decimals' => 0,
                'tolerance' => ['rel' => 0.01],
                'weight' => 20,
                'ra' => ['PEY-RA2'],
                'competencies' => ['C4'],
                'tool' => 'inspect',
                'focus' => 'S2',
                'hint' => 'V = d·(A1 + A2)/2 + d·(A2 + A3)/2.',
                'solution' => 'V = ' . self::n($spacing, 0) . '·(' . self::n($areas[0], 0) . ' + ' . self::n($areas[1], 0) .
                    ')/2 + ' . self::n($spacing, 0) . '·(' . self::n($areas[1], 0) . ' + ' . self::n($areas[2], 0) . ')/2 = ' .
                    self::n($volume, 0) . ' m³ → T = ' . self::n($tonnage, 0) . ' t.',
            ],
            [
                'id' => 'corte',
                'type' => 'number',
                'title' => 'Ley de corte crítica',
                'prompt' => 'Costos: mina ' . self::n($cm, 2) . ' US$/t, planta ' . self::n($cp, 2) . ' US$/t. Precio del Cu ' .
                    self::n($price, 2) . ' US$/lb, costo de fundición y refino ' . self::n($cr, 2) . ' US$/lb, recuperación ' .
                    self::n($rec * 100, 0) . ' %. Calcula la ley de corte crítica: ' .
                    'Lc = (Cm + Cp) / [(P − CR)·R·2.204,62] × 100.',
                'answer' => $cutoff,
                'unit' => '% Cu',
                'decimals' => 3,
                'tolerance' => ['abs' => 0.005],
                'weight' => 15,
                'ra' => ['PEY-RA2'],
                'competencies' => ['C4'],
                'solution' => 'Lc = ' . self::n($cm + $cp, 2) . ' / [(' . self::n($price - $cr, 2) . ')·' . self::n($rec, 2) .
                    '·2.204,62] × 100 = ' . self::n($cutoff, 3) . ' % Cu.',
            ],
            [
                'id' => 'categ',
                'type' => 'choice',
                'title' => 'Categorización de recursos',
                'prompt' => 'Mide la distancia horizontal entre el bloque ' . $scene['block']['id'] . ' (pin en superficie) y ' .
                    'el collar del sondaje más cercano. Criterio de la campaña: ≤ 50 m medido; 50–100 m indicado; ' .
                    '> 100 m inferido. ¿Qué categoría corresponde y puede pasar a reserva?',
                'options' => [
                    ['id' => 'medido', 'label' => 'Recurso medido: puede convertirse en reserva probada'],
                    ['id' => 'indicado', 'label' => 'Recurso indicado: puede convertirse en reserva probable'],
                    ['id' => 'inferido', 'label' => 'Recurso inferido: no puede declararse como reserva'],
                ],
                'answer' => $cat,
                'weight' => 10,
                'ra' => ['PEY-RA2'],
                'competencies' => ['C4'],
                'tool' => 'measure',
                'focus' => 'block',
                'solution' => 'Distancia al sondaje más cercano ≈ ' . self::n($nearest, 0) . ' m → recurso ' . $cat .
                    '. Solo los recursos medidos e indicados pueden convertirse en reservas.',
            ],
            [
                'id' => 'fc',
                'type' => 'number',
                'title' => 'Factor de carga del primer banco',
                'prompt' => 'Inspecciona la malla de perforación del banco piloto (burden, espaciamiento, diámetro, altura, ' .
                    'pasadura y taco). Con explosivo de densidad ' . self::n($rhoexp, 2) . ' g/cm³ calcula el factor de ' .
                    'carga en kg/m³: q = π/4·d²·ρ; Q = q·(H + J − T); FC = Q / (B·S·H).',
                'answer' => $pf,
                'unit' => 'kg/m³',
                'decimals' => 3,
                'tolerance' => ['rel' => 0.03],
                'weight' => 15,
                'ra' => ['PYT-RA2'],
                'competencies' => ['C1'],
                'tool' => 'inspect',
                'focus' => 'pattern',
                'solution' => 'q = ' . self::n($lin, 2) . ' kg/m; columna = ' . self::n($bh + $sub - $stem, 1) . ' m; Q = ' .
                    self::n($qhole, 1) . ' kg/pozo; FC = ' . self::n($qhole, 1) . ' / (' . self::n($burden, 1) . '·' .
                    self::n($spac, 1) . '·' . self::n($bh, 0) . ') = ' . self::n($pf, 3) . ' kg/m³.',
            ],
            [
                'id' => 'secuencia',
                'type' => 'order',
                'title' => 'Secuencia segura de carguío de explosivos',
                'prompt' => 'Ordena las etapas del carguío del banco piloto conforme al procedimiento de tronadura y al DS 132.',
                'options' => $r->shuffle($sequence),
                'answer' => array_column($sequence, 'id'),
                'weight' => 10,
                'ra' => ['PYT-RA2'],
                'competencies' => ['C3', 'C1'],
                'solution' => implode(' → ', array_column($sequence, 'label')) . '.',
            ],
        ];

        return [
            'context' => 'Proyecto «Pórfido Llullaillaco»: campaña de 6 sondajes diamantinos (HQ) sobre una anomalía ' .
                'geofísica. Debes validar la información, estimar el recurso y preparar la tronadura del banco piloto. ' .
                'Usa «Corte del terreno» para ver el cuerpo mineralizado y los tramos de cada sondaje.',
            'scene' => $scene,
            'tasks' => $tasks,
        ];
    }
}
