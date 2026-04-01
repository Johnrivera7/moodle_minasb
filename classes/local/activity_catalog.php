<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_minaslab\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Catálogo curricular: 84 actividades (3 por asignatura) + utilidades de formulario.
 */
final class activity_catalog {

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function entries(): array {
        return activity_catalog_data::entries();
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
            $groups[$glabel][$key] = $sub . ': ' . $title;
        }
        return $groups;
    }

    public static function default_key(): string {
        return 's1_algebra_a';
    }
}
