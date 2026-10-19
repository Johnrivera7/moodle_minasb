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
 * Semestre II — Geología Estructural y de Minas (asignatura PNA).
 *
 * Mapeo estructural de un talud de banco: brújula virtual sobre familias de
 * diaclasas, notación, manteo aparente, análisis cinemático, factor de
 * seguridad de falla plana, logueo geotécnico de testigo (RQD, Q de Barton)
 * y replanteo topográfico de un pozo de tronadura.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class semester2 extends base {

    public function key(): string {
        return 'ev_s2_geologia';
    }

    public function semester(): int {
        return 2;
    }

    public function meta(): array {
        return [
            'subject' => 'Geología Estructural y de Minas',
            'support' => ['Topografía de Minas', 'Probabilidad y Estadística'],
            'title' => 'Evaluación práctica II: mapeo estructural y estabilidad de un talud de banco',
            'summary' => 'Mapea con brújula virtual tres familias de discontinuidades en la pared de un banco, ' .
                'convierte notaciones, calcula el manteo aparente, realiza el análisis cinemático de Markland, ' .
                'el factor de seguridad de falla plana, el logueo geotécnico de un testigo (RQD y Q de Barton) ' .
                'y el replanteo de un pozo de tronadura.',
            'scene' => 's2',
            'ra' => [
                'GEM-RA1' => 'Reconocer los elementos planares y lineales, tipos de notaciones, las estructuras y la ' .
                    'geomecánica del macizo rocoso para su posterior explotación.',
                'GEM-RA2' => 'Interpretar información obtenida a través de mapas y exploraciones geológicas para el ' .
                    'análisis estructural de un yacimiento minero.',
                'GEM-RA3' => 'Obtener información en puntos de extracción y pozos de tronadura identificando las ' .
                    'características geológicas de la roca para la planificación de la explotación.',
                'TPM-OBJ' => 'Topografía de Minas: coordenadas UTM y replanteo de pozos de perforación de bancos.',
            ],
            'competencies' => [
                'C1' => 'Dirigir procesos asociados a la operación de un yacimiento minero en el marco de la normativa vigente.',
                'C2' => 'Desarrollar programas de trabajo para el personal técnico a su cargo.',
                'C3' => 'Aplicar normas de prevención de riesgos, seguridad e higiene industrial.',
            ],
        ];
    }

    protected function build(rng $r): array {
        $h = (float) $r->int(12, 15);
        $face = (float) $r->int(65, 75);
        $facedd = 180.0;
        $phi = (float) $r->int(28, 35);

        // J1: siempre cinemáticamente posible (falla plana).
        $j1 = ['dd' => (float) $r->int(166, 194), 'dip' => (float) $r->int((int) $phi + 6, (int) $face - 10)];
        // J2: caso aleatorio para el análisis de Markland.
        $case = $r->pick(['plana', 'tendido', 'empinado', 'rumbo']);
        switch ($case) {
            case 'plana':
                $j2 = ['dd' => (float) $r->int(165, 195), 'dip' => (float) $r->int((int) $phi + 5, (int) $face - 6)];
                break;
            case 'tendido':
                $j2 = ['dd' => (float) $r->int(168, 192), 'dip' => (float) $r->int(10, (int) $phi - 4)];
                break;
            case 'empinado':
                $j2 = ['dd' => (float) $r->int(168, 192), 'dip' => (float) $r->int((int) $face + 4, 86)];
                break;
            default:
                $j2 = ['dd' => (float) $r->pick([$r->int(115, 150), $r->int(210, 245)]),
                    'dip' => (float) $r->int((int) $phi + 5, (int) $face - 6)];
        }
        // J3: familia subvertical oblicua (rumbo).
        $j3 = ['dd' => (float) $r->int(100, 340), 'dip' => (float) $r->int(55, 85)];
        $strike3 = fmod($j3['dd'] - 90 + 360, 360);

        // Manteo aparente de J1 en una sección.
        $offset = (float) $r->int(20, 55) * ($r->int(0, 1) ? 1 : -1);
        $section = fmod($j1['dd'] + $offset + 360, 360);
        $apparent = rad2deg(atan(tan(deg2rad($j1['dip'])) * abs(cos(deg2rad($j1['dd'] - $section)))));

        // Falla plana (por metro de ancho, talud seco, sin grieta de tracción).
        $gamma = (float) $r->pick([25, 26, 27]);
        $c = (float) $r->int(5, 25);
        $psip = deg2rad($j1['dip']);
        $psif = deg2rad($face);
        $w = 0.5 * $gamma * $h * $h * (1 / tan($psip) - 1 / tan($psif));
        $a = $h / sin($psip);
        $fs = ($c * $a + $w * cos($psip) * tan(deg2rad($phi))) / ($w * sin($psip));

        // Testigo DDH: corrida de 3,0 m.
        $run = 3.0;
        $pieces = [];
        $remaining = 300;
        while ($remaining > 0) {
            $len = $r->int(2, 40);
            if ($r->int(0, 4) === 0) {
                $len = $r->int(2, 9);
            }
            $len = min($len, $remaining);
            $pieces[] = $len;
            $remaining -= $len;
        }
        $sound = array_sum(array_filter($pieces, fn($p) => $p >= 10));
        $rqd = $sound / ($run * 100) * 100;

        $jn = (float) $r->pick([4, 6, 9, 12]);
        $jr = (float) $r->pick([1.0, 1.5, 2.0, 3.0]);
        $ja = (float) $r->pick([0.75, 1.0, 2.0, 3.0]);
        $jw = (float) $r->pick([1.0, 0.66]);
        $srf = (float) $r->pick([1.0, 2.5]);
        $q = (max($rqd, 10) / $jn) * ($jr / $ja) * ($jw / $srf);

        // Replanteo de pozo.
        $station = ['E' => 345000 + $r->int(100, 900) + 0.0, 'N' => 6345000 + $r->int(100, 900) + 0.0];
        $az = (float) $r->int(95, 170);
        $dist = $r->float(30, 70, 0.5);
        $holen = $station['N'] + $dist * cos(deg2rad($az));

        $markland = [
            ['id' => 'plana', 'label' => 'Falla plana cinemáticamente posible'],
            ['id' => 'tendido', 'label' => 'No hay deslizamiento: el manteo de J2 es menor que el ángulo de fricción φ'],
            ['id' => 'empinado', 'label' => 'No hay deslizamiento plano: J2 no aflora en la cara (manteo mayor que el talud)'],
            ['id' => 'rumbo', 'label' => 'No hay falla plana: el rumbo de J2 difiere más de ±20° del rumbo del talud'],
        ];

        $scene = [
            'origin' => ['E' => $station['E'] - 60, 'N' => $station['N'] + 40, 'Z' => 2980 + $r->int(0, 120)],
            'pit' => [
                'halfLength' => 90.0, 'radius' => 120.0, 'benches' => 3, 'benchHeight' => $h,
                'faceAngle' => $face, 'berm' => 9.0, 'rampWidth' => 0, 'rampGrade' => 0,
            ],
            'face' => ['dd' => $facedd, 'dip' => $face],
            'joints' => [
                ['id' => 'J1', 'dd' => $j1['dd'], 'dip' => $j1['dip'], 'color' => '#8e4a24'],
                ['id' => 'J2', 'dd' => $j2['dd'], 'dip' => $j2['dip'], 'color' => '#b08a3e'],
                ['id' => 'J3', 'dd' => $j3['dd'], 'dip' => $j3['dip'], 'color' => '#55634c'],
            ],
            'section' => $section,
            'core' => ['run' => $run, 'pieces' => $pieces, 'from' => $r->float(20, 80, 0.5)],
            'station' => $station,
            'hole' => ['az' => $az, 'dist' => $dist],
        ];

        $tasks = [
            [
                'id' => 'rumbo',
                'type' => 'number',
                'title' => 'Notación: rumbo de la familia J3',
                'prompt' => 'Con la Brújula mide la familia J3 en la pared (dirección de manteo / manteo). ' .
                    'Expresa su rumbo como azimut según la regla de la mano derecha (rumbo = dirección de manteo − 90°).',
                'answer' => $strike3,
                'unit' => '°',
                'decimals' => 0,
                'tolerance' => ['abs' => 2],
                'weight' => 15,
                'ra' => ['GEM-RA1'],
                'competencies' => ['C1'],
                'tool' => 'compass',
                'focus' => 'J3',
                'hint' => 'Haz clic sobre un plano J3 con la herramienta Brújula para leer su orientación.',
                'solution' => 'J3 = ' . sprintf('%03d', (int) $j3['dd']) . '/' . (int) $j3['dip'] . ' → rumbo RHR = ' .
                    sprintf('%03d', (int) $strike3) . '°.',
            ],
            [
                'id' => 'aparente',
                'type' => 'number',
                'title' => 'Manteo aparente de J1 en la sección de perfil',
                'prompt' => 'El perfil geotécnico tiene azimut ' . sprintf('%03d', (int) $section) . '°. Mide J1 y calcula ' .
                    'su manteo aparente en ese perfil: tan α = tan δ · |cos(dirección de manteo − azimut del perfil)|.',
                'answer' => $apparent,
                'unit' => '°',
                'decimals' => 1,
                'tolerance' => ['abs' => 1.0],
                'weight' => 15,
                'ra' => ['GEM-RA1', 'GEM-RA2'],
                'competencies' => ['C1'],
                'tool' => 'compass',
                'focus' => 'J1',
                'solution' => 'J1 = ' . sprintf('%03d', (int) $j1['dd']) . '/' . (int) $j1['dip'] . '; diferencia = ' .
                    self::n(abs($offset), 0) . '°; α = arctan(tan ' . (int) $j1['dip'] . '° · cos ' . self::n(abs($offset), 0) .
                    '°) = ' . self::n($apparent, 1) . '°.',
            ],
            [
                'id' => 'markland',
                'type' => 'choice',
                'title' => 'Análisis cinemático (Markland) de J2',
                'prompt' => 'El talud tiene orientación ' . sprintf('%03d', (int) $facedd) . '/' . (int) $face .
                    ' y el ángulo de fricción de las discontinuidades es φ = ' . (int) $phi . '°. Mide J2 y ' .
                    'determina si es cinemáticamente posible una falla plana.',
                'options' => $markland,
                'answer' => $case,
                'weight' => 15,
                'ra' => ['GEM-RA1', 'GEM-RA2'],
                'competencies' => ['C3'],
                'tool' => 'compass',
                'focus' => 'J2',
                'hint' => 'Condiciones: |dir. manteo plano − dir. manteo talud| ≤ 20° y φ < manteo del plano < manteo del talud.',
                'solution' => 'J2 = ' . sprintf('%03d', (int) $j2['dd']) . '/' . (int) $j2['dip'] . '. ' .
                    $markland[array_search($case, array_column($markland, 'id'))]['label'] . '.',
            ],
            [
                'id' => 'fs',
                'type' => 'number',
                'title' => 'Factor de seguridad de falla plana sobre J1',
                'prompt' => 'Considera deslizamiento plano sobre J1 en un banco de altura H (mídela), talud seco y sin ' .
                    'grieta de tracción, por metro de ancho: γ = ' . self::n($gamma, 0) . ' kN/m³, c = ' . self::n($c, 0) .
                    ' kPa, φ = ' . (int) $phi . '°. W = ½·γ·H²·(cot ψp − cot ψf); A = H / sen ψp; ' .
                    'FS = (c·A + W·cos ψp·tan φ) / (W·sen ψp).',
                'answer' => $fs,
                'unit' => '',
                'decimals' => 2,
                'tolerance' => ['rel' => 0.04],
                'weight' => 20,
                'ra' => ['GEM-RA1'],
                'competencies' => ['C3', 'C1'],
                'tool' => 'measure',
                'focus' => 'wall',
                'solution' => 'H = ' . self::n($h, 1) . ' m, ψp = ' . (int) $j1['dip'] . '°, ψf = ' . (int) $face . '°. W = ' .
                    self::n($w, 1) . ' kN/m; A = ' . self::n($a, 2) . ' m; FS = ' . self::n($fs, 2) .
                    ($fs < 1.3 ? ' → inferior a 1,3: requiere medidas (abatir talud, drenaje, pernos).' : ' → estable.'),
            ],
            [
                'id' => 'rqd',
                'type' => 'number',
                'title' => 'Logueo geotécnico: RQD del testigo',
                'prompt' => 'En la caja porta-testigos del sondaje DDH-02 inspecciona la corrida de 3,0 m y calcula el ' .
                    'RQD (suma de trozos ≥ 10 cm / largo de la corrida × 100).',
                'answer' => $rqd,
                'unit' => '%',
                'decimals' => 1,
                'tolerance' => ['abs' => 1.0],
                'weight' => 15,
                'ra' => ['GEM-RA3', 'GEM-RA1'],
                'competencies' => ['C1'],
                'tool' => 'inspect',
                'focus' => 'core',
                'solution' => 'Trozos ≥ 10 cm suman ' . $sound . ' cm de 300 cm → RQD = ' . self::n($rqd, 1) . ' %.',
            ],
            [
                'id' => 'q',
                'type' => 'number',
                'title' => 'Índice Q de Barton',
                'prompt' => 'Con el RQD del testigo y los parámetros del mapeo (Jn = ' . self::n($jn, 0) . ', Jr = ' .
                    self::n($jr, 1) . ', Ja = ' . self::n($ja, 2) . ', Jw = ' . self::n($jw, 2) . ', SRF = ' . self::n($srf, 1) .
                    ') calcula Q = (RQD/Jn)·(Jr/Ja)·(Jw/SRF). Si RQD < 10 usa 10.',
                'answer' => $q,
                'unit' => '',
                'decimals' => 2,
                'tolerance' => ['rel' => 0.05],
                'weight' => 10,
                'ra' => ['GEM-RA1'],
                'competencies' => ['C1'],
                'solution' => 'Q = (' . self::n(max($rqd, 10), 1) . '/' . self::n($jn, 0) . ')·(' . self::n($jr, 1) . '/' .
                    self::n($ja, 2) . ')·(' . self::n($jw, 2) . '/' . self::n($srf, 1) . ') = ' . self::n($q, 2) . '.',
            ],
            [
                'id' => 'replanteo',
                'type' => 'number',
                'title' => 'Replanteo de un pozo de tronadura',
                'prompt' => 'Inspecciona la estación topográfica ET-1 para obtener sus coordenadas. El pozo P-17 está a ' .
                    'azimut ' . self::n($az, 0) . '° y distancia horizontal ' . self::n($dist, 1) . ' m desde ET-1. ' .
                    'Calcula la coordenada Norte del pozo (N = N₀ + DH·cos Az).',
                'answer' => $holen,
                'unit' => 'm',
                'decimals' => 2,
                'tolerance' => ['abs' => 0.05],
                'weight' => 10,
                'ra' => ['TPM-OBJ', 'GEM-RA3'],
                'competencies' => ['C2'],
                'tool' => 'inspect',
                'focus' => 'station',
                'solution' => 'N = ' . self::n($station['N'], 2) . ' + ' . self::n($dist, 1) . '·cos ' . self::n($az, 0) . '° = ' .
                    self::n($holen, 2) . ' m.',
            ],
        ];

        return [
            'context' => 'Rajo «Quebrada Blanca Sur», pared norte de la fase 3. Geotecnia solicitó mapear la pared antes de ' .
                'profundizar el banco. Los planos de discontinuidad de cada familia están teñidos por óxidos para ' .
                'facilitar su identificación.',
            'scene' => $scene,
            'tasks' => $tasks,
        ];
    }
}
