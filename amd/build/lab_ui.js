// MinasLab — marco visual profesional (chrome) por actividad.
define([], function() {
    'use strict';

    function esc(s) {
        if (!s) {
            return '';
        }
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Hash estable para variar tema visual entre las 84 prácticas.
     */
    function hashActivityKey(key) {
        var h = 5381;
        var i;
        for (i = 0; i < key.length; i++) {
            h = ((h << 5) + h) + key.charCodeAt(i);
            h = h | 0;
        }
        return Math.abs(h);
    }

    /**
     * Colores de acento derivados de la clave (luces 3D, bordes).
     */
    function themeFromKey(activityKey) {
        var h = hashActivityKey(activityKey || 'default');
        var hue1 = (h % 360) / 360;
        var hue2 = ((h * 7) % 360) / 360;
        return {
            hash: h,
            accentA: 'hsl(' + Math.round(hue1 * 360) + ',70%,55%)',
            accentB: 'hsl(' + Math.round(hue2 * 360) + ',65%,48%)',
            warm: 0xf4a23a,
            cool: 0x3dd6c6,
            huePrimary: Math.round(hue1 * 360)
        };
    }

    /**
     * Envuelve el área de simulación con cabecera institucional y metadatos.
     */
    function buildSimulationShell(container, activity, activityKey) {
        var theme = themeFromKey(activityKey);
        container.classList.add('ml-pro');
        container.style.setProperty('--ml-accent-a', theme.accentA);
        container.style.setProperty('--ml-accent-b', theme.accentB);

        var shell = document.createElement('div');
        shell.className = 'ml-pro__shell';
        shell.innerHTML =
            '<header class="ml-pro__chrome">' +
            '<div class="ml-pro__brand">' +
            '<span class="ml-pro__logo" aria-hidden="true"></span>' +
            '<div class="ml-pro__brand-text">' +
            '<span class="ml-pro__kicker">Laboratorio virtual · Ingeniería en Minas</span>' +
            '<span class="ml-pro__subject">' + esc(activity.subject_name) + '</span>' +
            '</div></div>' +
            '<div class="ml-pro__meta">' +
            '<span class="ml-pro__badge">' + esc(activityKey || '') + '</span>' +
            '<span class="ml-pro__badge ml-pro__badge--dim">' + esc(activity.archetype || '') + '</span>' +
            '</div></header>' +
            '<div class="ml-pro__body">' +
            '<div class="ml-pro__viewport" id="ml-pro-viewport"></div>' +
            '<aside class="ml-pro__aside" id="ml-pro-aside"></aside>' +
            '</div>' +
            '<div class="ml-pro__scanline" aria-hidden="true"></div>';

        container.appendChild(shell);

        return {
            viewport: shell.querySelector('#ml-pro-viewport'),
            aside: shell.querySelector('#ml-pro-aside'),
            theme: theme
        };
    }

    return {
        esc: esc,
        hashActivityKey: hashActivityKey,
        themeFromKey: themeFromKey,
        buildSimulationShell: buildSimulationShell
    };
});
