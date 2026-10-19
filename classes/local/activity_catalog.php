<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_minaslab\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Catálogo de prácticas evaluadas (una o más por semestre) + utilidades de formulario.
 */
final class activity_catalog {

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function entries(): array {
        return \mod_minaslab\local\evaluation\registry::catalog_entries();
    }

    /**
     * ¿La clave corresponde a una evaluación práctica calificada en servidor?
     */
    public static function is_evaluation(string $key): bool {
        return \mod_minaslab\local\evaluation\registry::get($key) !== null;
    }

    public static function is_valid(string $key): bool {
        return array_key_exists($key, self::entries());
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function get(string $key): ?array {
        $all = self::entries();
        return $all[$key] ?? null;
    }

    /**
     * Opciones agrupadas por semestre para MoodleQuickForm selectgroups.
     *
     * @return array<string, array<string, string>>
     */
    public static function grouped_for_form(): array {
        $entries = self::entries();
        $groups = [];
        foreach ($entries as $key => $meta) {
            $sem = (int) ($meta['semester'] ?? 1);
            $glabel = get_string('semester_group', 'mod_minaslab', $sem);
            if (!isset($groups[$glabel])) {
                $groups[$glabel] = [];
            }
            $sub = $meta['subject_name'] ?? '';
            $title = $meta['title'] ?? $key;
            $groups[$glabel][$key] = $sub . ' — ' . $title;
        }
        return $groups;
    }

    public static function default_key(): string {
        return 'ev_s1_operaciones';
    }
}
