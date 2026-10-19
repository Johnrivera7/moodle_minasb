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
 * Semestre V — Proyecto Minero (asignatura PNA).
 *
 * Evaluación integral de un proyecto a rajo con planta concentradora:
 * dimensionamiento, ingresos, VAN, TIR, sensibilidad al precio, drenaje del
 * rajo (Servicios Mineros), localización del depósito de relaves y ciclo de
 * vida del proyecto con cierre (Ley 20.551).
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class semester5 extends base {

    public function key(): string {
        return 'ev_s5_proyecto';
    }

    public function semester(): int {
        return 5;
    }

    public function meta(): array {
        return [
            'subject' => 'Proyecto Minero',
            'support' => ['Servicios Mineros', 'Diseño y Evaluación de Proyectos', 'Dirección y Gestión de Empresas'],
            'title' => 'Evaluación práctica V: evaluación integral de un proyecto minero a rajo abierto',
            'summary' => 'Evalúa en un emplazamiento 3D un proyecto de cobre con rajo, planta concentradora, botadero y ' .
                'alternativas de tranque de relaves: dimensiona la producción, estima ingresos, calcula VAN y TIR, ' .
                'analiza la sensibilidad al precio, diseña el bombeo del rajo y selecciona el sitio de relaves.',
            'scene' => 's5',
            'ra' => [
                'PM-RA1' => 'Determinar los principales antecedentes requeridos para evaluar la factibilidad técnica, ' .
                    'económica e impacto ambiental de un proyecto minero.',
                'PM-RA2' => 'Definir los aspectos técnicos y económicos relevantes, estimando la rentabilidad del proyecto.',
                'PM-RA3' => 'Diseñar un proyecto minero considerando sus distintas fases de desarrollo.',
                'DEP-RA7' => 'Diseño y Evaluación de Proyectos: aplicar una evaluación económica y financiera.',
                'SM-RA1' => 'Servicios Mineros: manejo de aguas y sistemas de bombeo en minería.',
            ],
            'competencies' => [
                'C2' => 'Desarrollar programas de trabajo para el personal técnico a su cargo.',
                'C4' => 'Integrar instrumentos de diseño y evaluación de proyectos con enfoque innovador.',
                'C5' => 'Utilizar herramientas de comunicación efectiva y resolución de problemas.',
                'C6' => 'Desarrollar habilidades ciudadanas con compromiso con el desarrollo humano sostenible.',
            ],
        ];
    }

    /**
     * Valor actual neto de un flujo constante.
     *
     * @param float $capex
     * @param float $cf
     * @param int $n
     * @param float $i
     * @return float
     */
    private static function npv(float $capex, float $cf, int $n, float $i): float {
        return -$capex + $cf * (1 - (1 + $i) ** -$n) / $i;
    }

    /**
     * Tasa interna de retorno por bisección.
     *
     * @param float $capex
     * @param float $cf
     * @param int $n
     * @return float
     */
    private static function irr(float $capex, float $cf, int $n): float {
        $lo = 0.0001;
        $hi = 1.0;
        for ($k = 0; $k < 200; $k++) {
            $mid = ($lo + $hi) / 2;
            if (self::npv($capex, $cf, $n, $mid) > 0) {
                $lo = $mid;
            } else {
                $hi = $mid;
            }
        }
        return ($lo + $hi) / 2;
    }

    protected function build(rng $r): array {
        // Dimensionamiento.
        $reserves = (float) $r->int(25, 60);
        $grade = $r->float(0.45, 0.85, 0.01);
        $life = 5.35 * $reserves ** 0.273;

        // Ingresos con ROP adoptado.
        $rop = round($reserves / $life, 1);
        $rec = $r->float(0.84, 0.90, 0.01);
        $price = $r->float(3.5, 4.4, 0.05);
        $cr = 0.40;
        $income = $rop * 1e6 * $grade / 100 * $rec * 2204.62 * ($price - $cr) / 1e6;

        // Flujo de caja.
        $capex = (float) ($r->int(28, 60) * 10);
        $n = (int) $r->int(12, 18);
        $ebitda = $r->float(0.14, 0.26, 0.01) * $capex;
        $tax = 0.27;
        $rate = $r->pick([0.08, 0.09, 0.10]);
        $dep = $capex / $n;
        $cf = ($ebitda - $dep) * (1 - $tax) + $dep;
        $npv = self::npv($capex, $cf, $n, $rate);
        $irr = self::irr($capex, $cf, $n) * 100;

        // Sensibilidad: precio −15 % (los ingresos de referencia caen 15 %).
        $refincome = round($ebitda * $r->float(1.6, 2.2, 0.1), 1);
        $ebitdas = $ebitda - 0.15 * $refincome;
        $cfs = ($ebitdas - $dep) * (1 - $tax) + $dep;
        $npvs = self::npv($capex, $cfs, $n, $rate);
        if ($npv > 0 && $npvs > 0) {
            $sens = 'robusto';
        } else if ($npv > 0) {
            $sens = 'sensible';
        } else {
            $sens = 'norentable';
        }

        // Drenaje del rajo.
        $benches = $r->int(6, 8);
        $bh = 12.0;
        $depth = $benches * $bh;
        $flow = $r->float(25, 70, 1);
        $losses = $r->float(5, 15, 0.5);
        $eta = $r->float(0.65, 0.78, 0.01);
        $power = 1000 * 9.81 * ($flow / 1000) * ($depth + $losses) / $eta / 1000;

        // Sitio de relaves: un solo sitio cumple los tres criterios.
        $ids = $r->shuffle(['A', 'B', 'C']);
        $good = $ids[0];
        $fails = $r->shuffle(['cota', 'rio', 'campamento']);
        $sites = [];
        foreach ($ids as $k => $id) {
            $site = ['id' => $id, 'below' => $r->int(35, 90), 'river' => $r->int(700, 1500), 'downstream' => true];
            if ($k > 0) {
                $f = $fails[$k - 1];
                if ($f === 'cota') {
                    $site['below'] = -$r->int(20, 60);
                } else if ($f === 'rio') {
                    $site['river'] = $r->int(120, 350);
                } else {
                    $site['downstream'] = false;
                }
            }
            $sites[] = $site;
        }
        usort($sites, fn($a, $b) => strcmp($a['id'], $b['id']));

        $lifecycle = [
            ['id' => 'prosp', 'label' => 'Prospección y exploración'],
            ['id' => 'eval', 'label' => 'Ingeniería: perfil, prefactibilidad y factibilidad'],
            ['id' => 'permisos', 'label' => 'Evaluación ambiental (SEIA) y permisos sectoriales'],
            ['id' => 'constr', 'label' => 'Construcción y puesta en marcha'],
            ['id' => 'oper', 'label' => 'Operación (producción)'],
            ['id' => 'cierre', 'label' => 'Cierre y post-cierre (Ley 20.551)'],
        ];

        $sensopts = [
            ['id' => 'robusto', 'label' => 'El VAN sigue siendo positivo: el proyecto es robusto frente a una caída de 15 % del precio'],
            ['id' => 'sensible', 'label' => 'El VAN pasa a negativo: el proyecto es sensible al precio y requiere mitigar riesgos'],
            ['id' => 'norentable', 'label' => 'El proyecto ya no es rentable en el caso base (VAN < 0) y no debe aprobarse'],
        ];

        $scene = [
            'origin' => ['E' => 356000 + $r->int(0, 900), 'N' => 6920000 + $r->int(0, 900), 'Z' => 1650 + $r->int(0, 200)],
            'pit' => [
                'halfLength' => 80.0, 'radius' => 150.0, 'benches' => $benches, 'benchHeight' => $bh,
                'faceAngle' => 70.0, 'berm' => 8.0, 'rampWidth' => 24.0, 'rampGrade' => 0.09,
            ],
            'pump' => ['flow' => $flow, 'losses' => $losses, 'eta' => $eta],
            'sites' => $sites,
            'reserves' => $reserves,
            'grade' => $grade,
        ];

        $tasks = [
            [
                'id' => 'voe',
                'type' => 'number',
                'title' => 'Vida útil del proyecto (Taylor)',
                'prompt' => 'Inspecciona el rajo para conocer las reservas declaradas y calcula la vida útil óptima con la ' .
                    'regla de Taylor: VOE = 5,35·R^0,273 (años, R en Mt).',
                'answer' => $life,
                'unit' => 'años',
                'decimals' => 1,
                'tolerance' => ['rel' => 0.02],
                'weight' => 15,
                'ra' => ['PM-RA1', 'PM-RA3'],
                'competencies' => ['C4'],
                'tool' => 'inspect',
                'focus' => 'pit',
                'solution' => 'VOE = 5,35·' . self::n($reserves, 0) . '^0,273 = ' . self::n($life, 1) . ' años.',
            ],
            [
                'id' => 'ingreso',
                'type' => 'number',
                'title' => 'Ingreso anual por venta de cobre',
                'prompt' => 'El directorio adoptó un ritmo de ' . self::n($rop, 1) . ' Mt/año a la ley media de las reservas. ' .
                    'Con recuperación ' . self::n($rec * 100, 0) . ' %, precio ' . self::n($price, 2) . ' US$/lb y costo de ' .
                    'fundición y refino ' . self::n($cr, 2) . ' US$/lb, calcula el ingreso neto anual en MUS$ ' .
                    '(1 t = 2.204,62 lb).',
                'answer' => $income,
                'unit' => 'MUS$/año',
                'decimals' => 1,
                'tolerance' => ['rel' => 0.02],
                'weight' => 15,
                'ra' => ['PM-RA2'],
                'competencies' => ['C4'],
                'tool' => 'inspect',
                'focus' => 'pit',
                'solution' => 'Cu fino = ' . self::n($rop, 1) . '·10⁶·' . self::n($grade / 100, 4) . '·' . self::n($rec, 2) . ' = ' .
                    self::n($rop * 1e6 * $grade / 100 * $rec, 0) . ' t/año; ingreso = ' . self::n($income, 1) . ' MUS$/año.',
            ],
            [
                'id' => 'van',
                'type' => 'number',
                'title' => 'Valor actual neto (VAN)',
                'prompt' => 'Inversión inicial ' . self::n($capex, 0) . ' MUS$ (año 0), EBITDA constante ' . self::n($ebitda, 1) .
                    ' MUS$/año durante ' . $n . ' años, depreciación lineal en ' . $n . ' años, impuesto 27 % y tasa de ' .
                    'descuento ' . self::n($rate * 100, 0) . ' %. FC = (EBITDA − D)·(1 − t) + D. Calcula el VAN en MUS$.',
                'answer' => $npv,
                'unit' => 'MUS$',
                'decimals' => 1,
                'tolerance' => ['abs' => max(1.0, 0.015 * $capex)],
                'weight' => 20,
                'ra' => ['PM-RA2', 'DEP-RA7'],
                'competencies' => ['C4'],
                'solution' => 'D = ' . self::n($dep, 2) . '; FC = ' . self::n($cf, 2) . ' MUS$/año; VAN = −' . self::n($capex, 0) .
                    ' + ' . self::n($cf, 2) . '·[1 − (1+' . self::n($rate, 2) . ')^−' . $n . ']/' . self::n($rate, 2) . ' = ' .
                    self::n($npv, 1) . ' MUS$.',
            ],
            [
                'id' => 'tir',
                'type' => 'number',
                'title' => 'Tasa interna de retorno (TIR)',
                'prompt' => 'Con el mismo flujo de caja, calcula la TIR del proyecto en porcentaje.',
                'answer' => $irr,
                'unit' => '%',
                'decimals' => 2,
                'tolerance' => ['abs' => 0.3],
                'weight' => 10,
                'ra' => ['DEP-RA7', 'PM-RA2'],
                'competencies' => ['C4'],
                'solution' => 'La TIR que anula el VAN es ' . self::n($irr, 2) . ' % (' .
                    ($irr > $rate * 100 ? 'mayor' : 'menor') . ' que la tasa de descuento).',
            ],
            [
                'id' => 'sens',
                'type' => 'choice',
                'title' => 'Sensibilidad al precio del cobre',
                'prompt' => 'Los ingresos del caso base son ' . self::n($refincome, 1) . ' MUS$/año. Si el precio cae 15 %, el ' .
                    'EBITDA disminuye en el 15 % de esos ingresos. Recalcula el VAN y elige la conclusión correcta.',
                'options' => $sensopts,
                'answer' => $sens,
                'weight' => 10,
                'ra' => ['PM-RA2', 'PM-RA1'],
                'competencies' => ['C4', 'C5'],
                'solution' => 'EBITDA sensibilizado = ' . self::n($ebitdas, 1) . ' MUS$/año; VAN = ' . self::n($npvs, 1) . ' MUS$.',
            ],
            [
                'id' => 'bomba',
                'type' => 'number',
                'title' => 'Drenaje del rajo: potencia de bombeo',
                'prompt' => 'Mide la profundidad del rajo (desde el fondo hasta la piscina de descarga en el borde). La bomba ' .
                    'del sumidero debe elevar ' . self::n($flow, 0) . ' L/s con pérdidas de carga de ' . self::n($losses, 1) .
                    ' m y eficiencia ' . self::n($eta * 100, 0) . ' %. Calcula la potencia al eje: P = ρ·g·Q·H / η (kW).',
                'answer' => $power,
                'unit' => 'kW',
                'decimals' => 1,
                'tolerance' => ['rel' => 0.03],
                'weight' => 15,
                'ra' => ['SM-RA1'],
                'competencies' => ['C2'],
                'tool' => 'measure',
                'focus' => 'sump',
                'solution' => 'H = ' . self::n($depth, 0) . ' + ' . self::n($losses, 1) . ' = ' . self::n($depth + $losses, 1) .
                    ' m; P = 1000·9,81·' . self::n($flow / 1000, 3) . '·' . self::n($depth + $losses, 1) . ' / ' .
                    self::n($eta, 2) . ' = ' . self::n($power, 1) . ' kW.',
            ],
            [
                'id' => 'tranque',
                'type' => 'pick',
                'title' => 'Selección del sitio del depósito de relaves',
                'prompt' => 'Inspecciona los sitios A, B y C. El sitio debe: (1) quedar bajo la cota de descarga de la planta ' .
                    '(transporte por gravedad); (2) estar a más de 500 m del río; (3) ubicarse aguas abajo del campamento ' .
                    'y de poblados. Selecciona el sitio en la escena o en la lista.',
                'options' => [
                    ['id' => 'A', 'label' => 'Sitio A'],
                    ['id' => 'B', 'label' => 'Sitio B'],
                    ['id' => 'C', 'label' => 'Sitio C'],
                ],
                'answer' => $good,
                'weight' => 10,
                'ra' => ['PM-RA1', 'PM-RA3'],
                'competencies' => ['C6', 'C4'],
                'tool' => 'pick',
                'focus' => 'sites',
                'solution' => 'Solo el sitio ' . $good . ' cumple los tres criterios de localización.',
            ],
            [
                'id' => 'ciclo',
                'type' => 'order',
                'title' => 'Ciclo de vida del proyecto minero',
                'prompt' => 'Ordena las etapas del ciclo de vida del proyecto.',
                'options' => $r->shuffle($lifecycle),
                'answer' => array_column($lifecycle, 'id'),
                'weight' => 5,
                'ra' => ['PM-RA3'],
                'competencies' => ['C6'],
                'solution' => implode(' → ', array_column($lifecycle, 'label')) . '.',
            ],
        ];

        return [
            'context' => 'Proyecto «Cobre Los Andes»: estudio de factibilidad de un rajo con planta concentradora de ' .
                'sulfuros. El comité de inversiones necesita tu evaluación técnica y económica para la decisión de ' .
                'avanzar a la etapa de ingeniería de detalle.',
            'scene' => $scene,
            'tasks' => $tasks,
        ];
    }
}
