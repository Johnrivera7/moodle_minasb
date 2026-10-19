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
 * Semestre I — Bases de las Operaciones Mineras (asignatura PNA).
 *
 * Faena escuela a rajo abierto con portal de galería: inspección DS 132,
 * geometría de bancos, cubicación de un bloque de tronadura, transporte,
 * pendiente de rampa (Topografía) y muestreo por canal.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class semester1 extends base {

    public function key(): string {
        return 'ev_s1_operaciones';
    }

    public function semester(): int {
        return 1;
    }

    public function meta(): array {
        return [
            'subject' => 'Bases de las Operaciones Mineras',
            'support' => ['Topografía e Interpretación de Planos', 'Prevención de Riesgos'],
            'title' => 'Evaluación práctica I: inspección y cubicación en faena escuela a rajo abierto',
            'summary' => 'Recorre una faena a rajo abierto con portal de galería: identifica condiciones ' .
                'subestándar según DS 132, mide la geometría de bancos y rampa con instrumentos virtuales, ' .
                'cubica un bloque de tronadura, dimensiona viajes de transporte y calcula la ley de un muestreo por canal.',
            'scene' => 's1',
            'ra' => [
                'BOM-RA1' => 'Conoce y comprende las obras principales de minería subterránea y rajo abierto; ' .
                    'conoce, diseña y analiza las obras necesarias para la minería.',
                'BOM-RA2' => 'Conoce y comprende las condiciones geológicas para el diseño de las obras necesarias ' .
                    'para la minería, obras complementarias y servicios generales.',
                'BOM-RA3' => 'Conoce y comprende los principios de las técnicas de muestreo y recolección de muestras.',
                'PR-RA2' => 'Prevención de Riesgos: conoce el marco legal aplicable a seguridad y salud laboral ' .
                    '(DS 132, DS 594, Ley 16.744).',
                'TOP-OBJ' => 'Topografía e Interpretación de Planos: pendientes y gradientes, áreas y volúmenes; ' .
                    'control de bancos y rampas.',
            ],
            'competencies' => [
                'C1' => 'Dirigir procesos asociados a la operación de un yacimiento minero: perforación, tronadura, ' .
                    'carguío y transporte, en el marco de la normativa vigente.',
                'C2' => 'Desarrollar programas de trabajo para el personal técnico a su cargo.',
                'C3' => 'Aplicar normas de prevención de riesgos, seguridad e higiene industrial.',
            ],
        ];
    }

    /** @var array<string, array{0:string,1:string,2:string}> lugar => [etiqueta, condición subestándar, condición conforme] */
    private const INSPECTION = [
        'pretil' => [
            'Borde de rampa',
            'Pretil de seguridad de 0,6 m de altura en el borde expuesto de la rampa; los camiones que circulan ' .
                'tienen neumáticos de 2,7 m de diámetro.',
            'Pretil continuo de 1,5 m de altura (mayor o igual a la mitad del diámetro del neumático de 2,7 m) ' .
                'en todo el borde expuesto de la rampa.',
        ],
        'tiro' => [
            'Bloque tronado',
            'Después de la tronadura se observa un pozo con cordón detonante y booster sin detonar; ' .
                'el área no está aislada y el cargador frontal ya inició el carguío.',
            'Revisión post-tronadura registrada por el disparador autorizado: sin tiros quedados y área ' .
                'liberada en el libro de tronadura.',
        ],
        'portal' => [
            'Portal de galería',
            'Portal de galería sin fortificación en los primeros 5 m; roca fracturada en la corona y ' .
                'personal ingresando.',
            'Portal fortificado con marcos de acero, malla y shotcrete en los primeros 10 m, con registro ' .
                'de inspección geomecánica.',
        ],
        'talud' => [
            'Cresta del banco',
            'Bloques sueltos colgados en la cresta del banco sobre el área de trabajo de la perforadora; ' .
                'no se ha realizado acuñadura.',
            'Talud saneado (acuñadura mecanizada) con registro de inspección geotécnica del turno.',
        ],
        'senal' => [
            'Ingreso a rampa',
            'Ingreso a la rampa sin señalética de velocidad máxima, sentido de circulación ni prioridad de ' .
                'equipos de alto tonelaje.',
            'Señalética de velocidad máxima, sentido de circulación y prioridad de equipos de alto tonelaje ' .
                'instalada al ingreso de la rampa.',
        ],
        'epp' => [
            'Frente de perforación',
            'Trabajador a pie a 10 m de la perforadora en operación, sin chaleco reflectante ni contacto ' .
                'radial con el operador.',
            'Trabajador con EPP completo (casco, lentes, protección auditiva, chaleco reflectante) y ' .
                'contacto radial con el operador antes de acercarse.',
        ],
    ];

    protected function build(rng $r): array {
        // Geometría del rajo escuela.
        $h = (float) $r->int(8, 12);
        $alpha = (float) $r->int(65, 75);
        $berm = $r->float(6.0, 10.0, 0.5);
        $benches = 5;
        $face = $h / tan(deg2rad($alpha));
        $period = $face + $berm;
        $rampgrade = $r->float(0.08, 0.10, 0.005);
        $pit = [
            'halfLength' => 70.0,
            'radius' => 115.0,
            'benches' => $benches,
            'benchHeight' => $h,
            'faceAngle' => $alpha,
            'berm' => $berm,
            'rampWidth' => 18.0,
            'rampGrade' => $rampgrade,
            'rampMarkers' => [25.0, 115.0],
        ];
        $interramp = rad2deg(atan($h / $period));
        $rampslope = $rampgrade / sqrt(1 + ($rampgrade * $period / $h) ** 2) * 100;

        // Bloque de tronadura en el fondo del rajo.
        $blockl = (float) $r->int(40, 70);
        $blocka = (float) $r->int(20, 34);
        $density = $r->float(2.5, 2.8, 0.05);
        $tonnes = $blockl * $blocka * $h * $density;

        // Transporte (dato independiente para no arrastrar errores de medición).
        $payload = (float) $r->pick([91, 100, 136]);
        $shot = (float) ($r->int(30, 90) * 1000);
        $trips = (int) ceil($shot / $payload);

        // Muestreo por canal en la pared junto al portal.
        $segments = [];
        $sumlen = 0.0;
        $sumlg = 0.0;
        $nseg = $r->int(3, 4);
        for ($i = 0; $i < $nseg; $i++) {
            $len = $r->float(0.6, 1.6, 0.1);
            $grade = $r->float(0.40, 2.40, 0.05);
            $segments[] = ['id' => 'M' . ($i + 1), 'length' => $len, 'grade' => $grade];
            $sumlen += $len;
            $sumlg += $len * $grade;
        }
        $channel = $sumlg / $sumlen;

        // Inspección: 3 o 4 condiciones subestándar entre 6 puntos.
        $places = array_keys(self::INSPECTION);
        $hazardcount = $r->int(3, 4);
        $hazards = array_slice($r->shuffle($places), 0, $hazardcount);
        $points = [];
        $options = [];
        foreach ($places as $i => $place) {
            [$label, $bad, $ok] = self::INSPECTION[$place];
            $id = 'p' . ($i + 1);
            $isbad = in_array($place, $hazards, true);
            $points[] = ['id' => $id, 'place' => $place, 'n' => $i + 1, 'label' => $label,
                'observation' => $isbad ? $bad : $ok];
            $options[] = ['id' => $id, 'label' => 'Punto ' . ($i + 1) . ' — ' . $label];
        }
        $hazardids = [];
        foreach ($points as $p) {
            if (in_array($p['place'], $hazards, true)) {
                $hazardids[] = $p['id'];
            }
        }

        $cycle = [
            ['id' => 'perf', 'label' => 'Perforación'],
            ['id' => 'tron', 'label' => 'Tronadura'],
            ['id' => 'carg', 'label' => 'Carguío'],
            ['id' => 'trans', 'label' => 'Transporte'],
            ['id' => 'chan', 'label' => 'Chancado primario / botadero'],
        ];

        $scene = [
            'origin' => ['E' => 342000 + $r->int(0, 900), 'N' => 6352000 + $r->int(0, 900), 'Z' => 2650 + $r->int(0, 150)],
            'pit' => $pit,
            'block' => ['length' => $blockl, 'width' => $blocka, 'x' => -10.0, 'z' => 0.0],
            'density' => $density,
            'truck' => ['payload' => $payload],
            'channel' => ['segments' => $segments],
            'inspection' => $points,
        ];

        $tasks = [
            [
                'id' => 'insp',
                'type' => 'multi',
                'title' => 'Inspección de seguridad (DS 132)',
                'prompt' => 'Recorre los 6 puntos de inspección numerados en la faena (herramienta Inspeccionar) ' .
                    'y lee cada observación. Marca todas las condiciones subestándar que obligan a detener ' .
                    'o corregir la tarea según el DS 132 y el control de riesgos del turno.',
                'options' => $options,
                'answer' => $hazardids,
                'weight' => 20,
                'ra' => ['PR-RA2', 'BOM-RA1'],
                'competencies' => ['C3'],
                'tool' => 'inspect',
                'hint' => 'Pregúntate en cada punto: ¿existe un peligro no controlado para personas o equipos?',
                'solution' => 'Condiciones subestándar: ' . implode(', ', array_map(
                    fn($p) => 'punto ' . $p['n'] . ' (' . $p['label'] . ')',
                    array_filter($points, fn($p) => in_array($p['place'], $hazards, true))
                )) . '. Ante un tiro quedado se detiene la operación, se aísla el área y se avisa al supervisor; ' .
                    'no se ingresa a labores sin fortificar ni se trabaja bajo rocas sueltas sin acuñadura.',
            ],
            [
                'id' => 'ira',
                'type' => 'number',
                'title' => 'Geometría de bancos: ángulo interrampa',
                'prompt' => 'Con la herramienta Medir obtén la altura de banco (H) y el ancho de berma (B) en ' .
                    'la pared norte del rajo. El ángulo de cara de diseño es α = ' . self::n($alpha, 0) . '°. ' .
                    'Calcula el ángulo interrampa: θ = arctan[ H / (H / tan α + B) ].',
                'answer' => $interramp,
                'unit' => '°',
                'decimals' => 1,
                'tolerance' => ['abs' => 0.8],
                'weight' => 15,
                'ra' => ['BOM-RA1', 'BOM-RA2'],
                'competencies' => ['C1'],
                'tool' => 'measure',
                'focus' => 'wall',
                'hint' => 'Mide la diferencia de cota entre dos bermas consecutivas (H) y el ancho horizontal de una berma (B).',
                'solution' => 'H = ' . self::n($h, 1) . ' m; B = ' . self::n($berm, 1) . ' m; H/tan α = ' .
                    self::n($face, 2) . ' m. θ = arctan(' . self::n($h, 1) . ' / ' . self::n($period, 2) .
                    ') = ' . self::n($interramp, 1) . '°.',
            ],
            [
                'id' => 'ton',
                'type' => 'number',
                'title' => 'Cubicación del bloque de tronadura',
                'prompt' => 'El bloque demarcado con estacas en el fondo del rajo corresponde al próximo banco ' .
                    '(altura H igual a la medida anteriormente). Mide su largo y ancho y calcula el tonelaje in situ ' .
                    'con densidad ρ = ' . self::n($density, 2) . ' t/m³.',
                'answer' => $tonnes,
                'unit' => 't',
                'decimals' => 0,
                'tolerance' => ['rel' => 0.04],
                'weight' => 20,
                'ra' => ['BOM-RA1', 'TOP-OBJ'],
                'competencies' => ['C1'],
                'tool' => 'measure',
                'focus' => 'block',
                'hint' => 'Tonelaje = largo × ancho × H × ρ. Mide entre las estacas de esquina.',
                'solution' => 'V = ' . self::n($blockl, 0) . ' × ' . self::n($blocka, 0) . ' × ' . self::n($h, 1) .
                    ' = ' . self::n($blockl * $blocka * $h, 0) . ' m³; T = V × ' . self::n($density, 2) . ' = ' .
                    self::n($tonnes, 0) . ' t.',
            ],
            [
                'id' => 'trips',
                'type' => 'number',
                'title' => 'Transporte: viajes de camión',
                'prompt' => 'La tronadura del turno entregará ' . self::n($shot, 0) . ' t de material. Inspecciona ' .
                    'el camión de extracción para conocer su capacidad nominal y calcula el número mínimo de ' .
                    'viajes para retirar todo el material (redondea al entero superior).',
                'answer' => $trips,
                'unit' => 'viajes',
                'decimals' => 0,
                'tolerance' => ['abs' => 0.5],
                'weight' => 10,
                'ra' => ['BOM-RA1'],
                'competencies' => ['C1', 'C2'],
                'tool' => 'inspect',
                'focus' => 'truck',
                'hint' => 'Viajes = ⌈ tonelaje / capacidad del camión ⌉.',
                'solution' => self::n($shot, 0) . ' / ' . self::n($payload, 0) . ' = ' . self::n($shot / $payload, 2) .
                    ' → ' . $trips . ' viajes.',
            ],
            [
                'id' => 'ramp',
                'type' => 'number',
                'title' => 'Topografía: pendiente de la rampa',
                'prompt' => 'Entre los hitos topográficos A y B de la rampa mide el desnivel (ΔZ) y la distancia ' .
                    'horizontal (DH). Calcula la pendiente de la rampa en porcentaje: i = ΔZ / DH × 100.',
                'answer' => $rampslope,
                'unit' => '%',
                'decimals' => 2,
                'tolerance' => ['abs' => 0.4],
                'weight' => 15,
                'ra' => ['TOP-OBJ', 'BOM-RA2'],
                'competencies' => ['C1'],
                'tool' => 'measure',
                'focus' => 'ramp',
                'hint' => 'La herramienta Medir entrega distancia inclinada, horizontal (DH) y desnivel (ΔZ).',
                'solution' => 'La rampa fue diseñada con pendiente de ' . self::n($rampgrade * 100, 1) .
                    ' % a lo largo de su eje; entre A y B se obtiene i ≈ ' . self::n($rampslope, 2) . ' %.',
            ],
            [
                'id' => 'canal',
                'type' => 'number',
                'title' => 'Muestreo por canal: ley ponderada',
                'prompt' => 'Junto al portal de la galería hay un muestreo por canal con ' . $nseg . ' tramos (M1…M' .
                    $nseg . '). Inspecciona cada tramo y calcula la ley media de Cu ponderada por longitud.',
                'answer' => $channel,
                'unit' => '% Cu',
                'decimals' => 3,
                'tolerance' => ['abs' => 0.01],
                'weight' => 10,
                'ra' => ['BOM-RA3'],
                'competencies' => ['C1'],
                'tool' => 'inspect',
                'focus' => 'channel',
                'hint' => 'Ley media = Σ(longitud × ley) / Σ longitud.',
                'solution' => 'Σ(l·ley) = ' . self::n($sumlg, 3) . '; Σl = ' . self::n($sumlen, 1) . ' m → ley = ' .
                    self::n($channel, 3) . ' % Cu.',
            ],
            [
                'id' => 'ciclo',
                'type' => 'order',
                'title' => 'Ciclo de operaciones unitarias',
                'prompt' => 'Ordena las operaciones unitarias del ciclo productivo a rajo abierto observado en la faena.',
                'options' => $r->shuffle($cycle),
                'answer' => array_column($cycle, 'id'),
                'weight' => 10,
                'ra' => ['BOM-RA1'],
                'competencies' => ['C1'],
                'hint' => 'Arrastra los elementos o usa las flechas para reordenarlos.',
                'solution' => 'Perforación → Tronadura → Carguío → Transporte → Chancado primario (mineral) o botadero (estéril).',
            ],
        ];

        return [
            'context' => 'Faena escuela «Cerro Aconcagua»: rajo de ' . $benches . ' bancos con portal de galería ' .
                'exploratoria en la pared oriente. Como supervisor de turno debes inspeccionar la faena y ' .
                'preparar los datos de planificación del día. Coordenadas: E = Este, N = Norte, Z = Cota (m s. n. m.).',
            'scene' => $scene,
            'tasks' => $tasks,
        ];
    }
}
