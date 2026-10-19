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
 * Carga Three.js (build ES modules r160) mediante un script de tipo módulo,
 * sin pasar por RequireJS ni por la transpilación AMD.
 *
 * @module     mod_minaslab/eval_three
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    'use strict';

    let pending = null;

    /**
     * @param {string} url URL de three.module.min.js
     * @returns {Promise<Object>} espacio de nombres de Three.js
     */
    const load = function(url) {
        if (window.MinasLabTHREE) {
            return Promise.resolve(window.MinasLabTHREE);
        }
        if (pending) {
            return pending;
        }
        pending = new Promise(function(resolve, reject) {
            const evt = 'minaslab-three-' + Date.now();
            const onReady = function() {
                window.removeEventListener(evt, onReady);
                if (window.MinasLabTHREE) {
                    resolve(window.MinasLabTHREE);
                } else {
                    reject(new Error('Three.js no disponible'));
                }
            };
            window.addEventListener(evt, onReady);
            const s = document.createElement('script');
            s.type = 'module';
            s.textContent = 'import * as T from ' + JSON.stringify(url) + ';' +
                'window.MinasLabTHREE = T; window.dispatchEvent(new Event(' + JSON.stringify(evt) + '));';
            s.onerror = function() {
                reject(new Error('No se pudo cargar Three.js'));
            };
            document.head.appendChild(s);
            window.setTimeout(function() {
                if (!window.MinasLabTHREE) {
                    reject(new Error('Tiempo de espera agotado al cargar Three.js'));
                }
            }, 30000);
        });
        return pending;
    };

    return {load: load};
});
