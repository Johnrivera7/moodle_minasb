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
 * Registro de evaluaciones prácticas semestrales.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class registry {

    /** @var string[] Clases de evaluación, una por semestre. */
    private const CLASSES = [
        semester1::class,
        semester2::class,
        semester3::class,
        semester4::class,
        semester5::class,
    ];

    /** @var array<string, base>|null */
    private static ?array $cache = null;

    /**
     * @return array<string, base> evaluaciones indexadas por clave de catálogo
     */
    public static function all(): array {
        if (self::$cache === null) {
            self::$cache = [];
            foreach (self::CLASSES as $class) {
                $ev = new $class();
                self::$cache[$ev->key()] = $ev;
            }
        }
        return self::$cache;
    }

    /**
     * @param string $key
     * @return base|null
     */
    public static function get(string $key): ?base {
        return self::all()[$key] ?? null;
    }

    /**
     * Entradas para el catálogo de actividades (formulario y cabecera).
     *
     * @return array<string, array<string, mixed>>
     */
    public static function catalog_entries(): array {
        $out = [];
        foreach (self::all() as $key => $ev) {
            $meta = $ev->meta();
            $out[$key] = [
                'semester' => $ev->semester(),
                'subject_slug' => $key,
                'subject_name' => $meta['subject'],
                'title' => $meta['title'],
                'archetype' => 'eval3d',
                'evaluation' => true,
                'profile' => [],
                'competency_codes' => array_keys($meta['competencies']),
                'ra_codes' => array_keys($meta['ra']),
                'summary' => $meta['summary'],
            ];
        }
        return $out;
    }
}
