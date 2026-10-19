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

/**
 * Funciones externas de MinasLab (evaluaciones prácticas).
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'mod_minaslab_get_evaluation' => [
        'classname' => 'mod_minaslab\external\get_evaluation',
        'description' => 'Caso del estudiante: escenario 3D, tareas y avance guardado.',
        'type' => 'read',
        'ajax' => true,
        'capabilities' => 'mod/minaslab:view',
    ],
    'mod_minaslab_submit_answer' => [
        'classname' => 'mod_minaslab\external\submit_answer',
        'description' => 'Corrige y registra la respuesta a una tarea.',
        'type' => 'write',
        'ajax' => true,
        'capabilities' => 'mod/minaslab:submit',
    ],
    'mod_minaslab_save_draft' => [
        'classname' => 'mod_minaslab\external\save_draft',
        'description' => 'Guardado automático del avance del estudiante.',
        'type' => 'write',
        'ajax' => true,
        'capabilities' => 'mod/minaslab:submit',
    ],
    'mod_minaslab_finish_evaluation' => [
        'classname' => 'mod_minaslab\external\finish_evaluation',
        'description' => 'Finaliza la evaluación y publica la calificación.',
        'type' => 'write',
        'ajax' => true,
        'capabilities' => 'mod/minaslab:submit',
    ],
];
