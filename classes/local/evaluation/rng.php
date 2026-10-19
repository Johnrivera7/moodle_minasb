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
 * Generador pseudoaleatorio determinista (xorshift32).
 *
 * Cada estudiante recibe datos propios a partir de una semilla estable
 * (instancia + usuario), de modo que el caso se mantiene entre sesiones
 * y el servidor puede recalcular la respuesta correcta sin almacenarla.
 *
 * @package    mod_minaslab
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class rng {

    /** @var int Estado interno de 32 bits. */
    private int $state;

    /**
     * @param int $seed semilla (cualquier entero; 0 se reemplaza por una constante)
     */
    public function __construct(int $seed) {
        $seed = $seed & 0xFFFFFFFF;
        $this->state = $seed === 0 ? 0x9E3779B9 : $seed;
        // Descartar los primeros valores para dispersar semillas cercanas.
        for ($i = 0; $i < 8; $i++) {
            $this->next();
        }
    }

    /**
     * Semilla estable para una instancia y un usuario.
     *
     * @param int $instanceid id de minaslab
     * @param int $userid id de usuario
     * @param int $variant número de reinicio otorgado por el docente
     * @return int
     */
    public static function seed_for(int $instanceid, int $userid, int $variant = 0): int {
        return crc32('minaslab:' . $instanceid . ':' . $userid . ':' . $variant);
    }

    /**
     * Siguiente entero sin signo de 32 bits.
     *
     * @return int
     */
    public function next(): int {
        $x = $this->state;
        $x ^= ($x << 13) & 0xFFFFFFFF;
        $x ^= ($x >> 17);
        $x ^= ($x << 5) & 0xFFFFFFFF;
        $this->state = $x & 0xFFFFFFFF;
        return $this->state;
    }

    /**
     * Flotante uniforme en [0, 1).
     *
     * @return float
     */
    public function unit(): float {
        return $this->next() / 4294967296.0;
    }

    /**
     * Entero uniforme en [min, max].
     *
     * @param int $min
     * @param int $max
     * @return int
     */
    public function int(int $min, int $max): int {
        return $min + (int) floor($this->unit() * ($max - $min + 1));
    }

    /**
     * Flotante en [min, max] redondeado a un paso.
     *
     * @param float $min
     * @param float $max
     * @param float $step paso de discretización (p. ej. 0.5)
     * @return float
     */
    public function float(float $min, float $max, float $step = 0.01): float {
        $n = (int) floor(($max - $min) / $step);
        $v = $min + $this->int(0, max(0, $n)) * $step;
        $decimals = max(0, (int) ceil(-log10($step)));
        return round($v, $decimals);
    }

    /**
     * Elemento aleatorio de una lista.
     *
     * @param array $items
     * @return mixed
     */
    public function pick(array $items) {
        $items = array_values($items);
        return $items[$this->int(0, count($items) - 1)];
    }

    /**
     * Copia barajada de una lista (Fisher-Yates).
     *
     * @param array $items
     * @return array
     */
    public function shuffle(array $items): array {
        $items = array_values($items);
        for ($i = count($items) - 1; $i > 0; $i--) {
            $j = $this->int(0, $i);
            [$items[$i], $items[$j]] = [$items[$j], $items[$i]];
        }
        return $items;
    }
}
