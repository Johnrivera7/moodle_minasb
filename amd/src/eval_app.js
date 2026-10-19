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
 * Aplicación de evaluación práctica semestral: escena 3D, instrumentos,
 * tareas calificadas en servidor, libreta de campo y guardado automático.
 *
 * @module     mod_minaslab/eval_app
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([
    'core/ajax',
    'core/notification',
    'mod_minaslab/eval_three',
    'mod_minaslab/eval_kit',
    'mod_minaslab/eval_scenes',
    'mod_minaslab/eval_fx'
], function(Ajax, Notification, Loader, kit, scenes, effects) {
    'use strict';

    const ICONS = {
        explore: '<path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
        measure: '<path d="M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/>',
        compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
        iso: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
        plan: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>',
        section: '<path d="M3 18h18M5 18l4-7 3 3 4-8 3 12"/>',
        wall: '<path d="M3 20h18M6 20V9l6-5 6 5v11M9 20v-6h6v6"/>',
        survey: '<path d="M3 7c4 3 14 3 18 0M3 12c4 3 14 3 18 0M3 17c4 3 14 3 18 0"/>',
        underground: '<path d="M3 9h18M6 9v10M12 9v12M18 9v8M3 5h18"/>',
        clear: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
        night: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
        wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
        fog: '<path d="M4 9h16M2 13h20M5 17h14M8 5h8"/>',
        fs: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
    };
    const icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true" class="mlx-ico">' + ICONS[name] + '</svg>';

    const esc = function(s) {
        return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
    };
    const fmt = (v, d) => Number(v).toLocaleString('es-CL', {minimumFractionDigits: d, maximumFractionDigits: d});

    /**
     * @param {Object} cfg {cmid, threeUrl}
     */
    const init = function(cfg) {
        const root = document.getElementById('mlx-app');
        if (!root) {
            return;
        }
        let ui = {};
        try {
            ui = JSON.parse(document.getElementById('mlx-ui').textContent || '{}');
        } catch (e) {
            ui = {};
        }
        const t = (k, a) => {
            let s = ui[k] || k;
            if (a !== undefined) {
                s = s.replace('{$a}', a);
                if (typeof a === 'object') {
                    Object.keys(a).forEach(key => {
                        s = s.replace('{$a->' + key + '}', a[key]);
                    });
                }
            }
            return s;
        };
        const canAttempt = root.dataset.canattempt === '1';
        const app = new App(root, cfg, t, canAttempt);
        app.start();
    };

    /**
     * Controlador principal.
     *
     * @param {HTMLElement} root
     * @param {Object} cfg
     * @param {Function} t
     * @param {boolean} canAttempt
     */
    function App(root, cfg, t, canAttempt) {
        this.root = root;
        this.cfg = cfg;
        this.t = t;
        this.canAttempt = canAttempt;
        this.data = null;
        this.draft = {v: 1, inputs: {}, measures: [], compass: [], notes: '', active: null, view: null};
        this.tool = 'explore';
        this.world = null;
        this.saveTimer = null;
        this.dirty = false;
        this.measureA = null;
        this.measureObjs = [];
        this.busy = false;
    }

    App.prototype.call = function(methodname, args) {
        return Ajax.call([{methodname: methodname, args: args}])[0];
    };

    App.prototype.start = function() {
        const self = this;
        this.call('mod_minaslab_get_evaluation', {cmid: this.cfg.cmid}).then(function(r) {
            self.data = JSON.parse(r.payload);
            const d = self.data.draft;
            if (d && typeof d === 'object' && !Array.isArray(d)) {
                Object.assign(self.draft, d);
            }
            // Un objeto vacío serializado por PHP llega como arreglo: normalizar a objeto.
            const inp = self.draft.inputs;
            self.draft.inputs = inp && typeof inp === 'object' && !Array.isArray(inp) ? inp : {};
            self.draft.measures = Array.isArray(self.draft.measures) ? self.draft.measures : [];
            self.draft.compass = Array.isArray(self.draft.compass) ? self.draft.compass : [];
            self.layout();
            self.renderSide();
            return Loader.load(self.cfg.threeUrl);
        }).then(function(THREE) {
            self.buildWorld(THREE);
            return null;
        }).catch(function(err) {
            if (!self.data) {
                Notification.exception(err);
                return;
            }
            const vp = self.root.querySelector('.mlx-viewport');
            if (vp) {
                vp.innerHTML = '<div class="mlx-error">' + esc(self.t('webgl_error')) + '<br><small>' +
                    esc(err && err.message ? err.message : '') + '</small></div>';
            }
            window.console.error(err);
        });
        window.addEventListener('beforeunload', () => this.flushDraft(true));
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flushDraft(true);
            }
        });
    };

    // ---------------------------------------------------------------------
    // Estructura.
    // ---------------------------------------------------------------------

    App.prototype.layout = function() {
        const t = this.t;
        this.root.innerHTML =
            '<div class="mlx-shell">' +
            '<div class="mlx-stage" id="mlx-stage">' +
            '<div class="mlx-viewport"><div class="mlx-boot"><div class="mlx-boot__spinner"></div><p>' +
            esc(t('scene_loading')) + '</p></div></div>' +
            '<div class="mlx-toolbar" role="toolbar" aria-label="' + esc(t('tools')) + '"></div>' +
            '<div class="mlx-hud"><div class="mlx-north" title="Norte"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/>' +
            '<path d="M20 5l6 15h-12z" class="n"/><path d="M20 35l-6-15h12z" class="s"/><text x="20" y="15">N</text></svg></div>' +
            '<div class="mlx-coords" aria-live="off"><span>E —</span><span>N —</span><span>Z —</span></div></div>' +
            '<div class="mlx-toolhint"></div>' +
            '<div class="mlx-readout" aria-live="polite" hidden></div>' +
            '<div class="mlx-card" role="dialog" aria-modal="false" hidden></div>' +
            '</div>' +
            '<aside class="mlx-side">' +
            '<div class="mlx-score"></div>' +
            '<details class="mlx-case" open><summary>' + esc(t('case')) + '</summary><p>' + esc(this.data.context) +
            '</p></details>' +
            '<nav class="mlx-tasks" aria-label="' + esc(t('tasks')) + '"></nav>' +
            '<section class="mlx-task" aria-live="polite"></section>' +
            '<details class="mlx-notebook"><summary>' + esc(t('notebook')) + ' <span class="mlx-count"></span></summary>' +
            '<div class="mlx-notebook__list"></div>' +
            '<label class="mlx-notebook__lbl" for="mlx-notes">' + esc(t('notes')) + '</label>' +
            '<textarea id="mlx-notes" rows="4" placeholder="' + esc(t('notesplaceholder')) + '"></textarea></details>' +
            '<div class="mlx-finish"></div>' +
            '<p class="mlx-save" aria-live="polite"></p>' +
            '</aside></div>';
        this.$ = sel => this.root.querySelector(sel);
        const notes = this.$('#mlx-notes');
        notes.value = this.draft.notes || '';
        notes.disabled = this.completed();
        notes.addEventListener('input', () => {
            this.draft.notes = notes.value.slice(0, 4000);
            this.markDirty();
        });
    };

    App.prototype.completed = function() {
        return !!(this.data && this.data.summary && this.data.summary.completed);
    };

    App.prototype.taskById = function(id) {
        return this.data.tasks.find(x => x.id === id) || null;
    };

    // ---------------------------------------------------------------------
    // Escena 3D.
    // ---------------------------------------------------------------------

    App.prototype.buildWorld = function(THREE) {
        const self = this;
        const vp = this.$('.mlx-viewport');
        vp.innerHTML = '';
        const sceneId = this.data.meta.scene;
        const world = kit.createWorld(vp, THREE, {extent: scenes.extentFor(sceneId, this.data.scene),
            // Sol de verano en el norte de Chile; en II, luz de mañana sobre la pared mapeada.
            sunAz: sceneId === 's2' ? 118 : 300, sunEl: sceneId === 's2' ? 34 : 38});
        this.world = world;
        this.THREE = THREE;
        world.fx = effects.create(world);
        this.sceneApi = scenes.build(world, sceneId, this.data.scene);
        this.layers = {survey: true};
        this.buildToolbar();
        const v = this.draft.view;
        if (v && v.target && isFinite(v.dist)) {
            world.setView(v, true);
        } else {
            world.setView(world.focus[this.sceneApi.start || 'iso'], true);
        }
        this.redrawMeasures();
        this.redrawCompass();

        world.on('inspect', ev => {
            const info = ev.info || ev;
            if (this.tool === 'compass' && info.kind === 'plane' && ev.pos) {
                this.addCompassReading(ev.pos, {dd: info.plane.dd, dip: info.plane.dip}, info.title);
                return;
            }
            this.showInfo(info, null);
        });
        world.on('click', e => this.onSceneClick(e));
        let hoverPending = null;
        world.on('hover', e => {
            hoverPending = e;
        });
        const coords = this.$('.mlx-coords');
        const north = this.$('.mlx-north svg');
        let lastSave = 0;
        world.on('frame', function(st) {
            north.style.transform = 'rotate(' + st.az + 'rad)';
            if (hoverPending) {
                const h = world.raycast(hoverPending.x, hoverPending.y, world.grounds);
                hoverPending = null;
                if (h) {
                    const c = self.toCoords(h.point);
                    coords.innerHTML = '<span>E ' + fmt(c.E, 1) + '</span><span>N ' + fmt(c.N, 1) + '</span><span>Z ' +
                        fmt(c.Z, 1) + '</span>';
                }
            }
            // La vista de cámara también forma parte del avance guardado.
            const now = performance.now();
            if (now - lastSave > 4000) {
                lastSave = now;
                const nv = world.getView();
                const ov = self.draft.view;
                if (!ov || Math.abs(ov.dist - nv.dist) > 1 || Math.abs(ov.az - nv.az) > 0.02 ||
                        Math.abs(ov.el - nv.el) > 0.02 || Math.abs(ov.target.x - nv.target.x) > 1 ||
                        Math.abs(ov.target.z - nv.target.z) > 1) {
                    self.draft.view = nv;
                    self.markDirty(true);
                }
            }
        });
        if (this.draft.active) {
            const task = this.taskById(this.draft.active);
            if (task && task.tool && task.tool !== 'none' && this.sceneApi.tools.indexOf(task.tool) >= 0) {
                this.setTool(task.tool);
            }
        }
    };

    App.prototype.toCoords = function(p) {
        const o = this.data.scene.origin || {E: 0, N: 0, Z: 0};
        return {E: o.E + p.x, N: o.N - p.z, Z: o.Z + p.y};
    };

    App.prototype.buildToolbar = function() {
        const t = this.t;
        const bar = this.$('.mlx-toolbar');
        const tools = this.sceneApi.tools;
        let html = '<div class="mlx-tb-group">';
        tools.forEach(function(tl) {
            html += '<button type="button" class="mlx-tb" data-tool="' + tl + '" aria-pressed="false" title="' +
                esc(t('tool_' + tl)) + '">' + icon(tl) + '<span>' + esc(t('tool_' + tl)) + '</span></button>';
        });
        html += '</div><div class="mlx-tb-group">';
        ['iso', 'plan', 'section'].forEach(function(v) {
            html += '<button type="button" class="mlx-tb mlx-tb--icon" data-view="' + v + '" title="' + esc(t('view_' + v)) +
                '">' + icon(v) + '<span class="sr-only">' + esc(t('view_' + v)) + '</span></button>';
        });
        html += '</div><div class="mlx-tb-group">';
        if (this.world.surveyGroup) {
            html += '<button type="button" class="mlx-tb mlx-tb--icon" data-layer="survey" aria-pressed="true" title="' +
                esc(t('layer_survey')) + '">' + icon('survey') + '<span class="sr-only">' + esc(t('layer_survey')) +
                '</span></button>';
        }
        (this.sceneApi.layers || []).forEach(function(l) {
            html += '<button type="button" class="mlx-tb" data-layer="' + l.id + '" aria-pressed="' + (l.on ? 'true' : 'false') +
                '" title="' + esc(t('layer_' + l.id)) + '">' + icon(l.id) + '<span>' + esc(t('layer_' + l.id)) +
                '</span></button>';
        });
        html += '</div><div class="mlx-tb-group">';
        ['night', 'wind', 'fog'].forEach(function(env) {
            html += '<button type="button" class="mlx-tb mlx-tb--icon" data-env="' + env + '" aria-pressed="false" title="' +
                esc(t('env_' + env)) + '">' + icon(env) + '<span class="sr-only">' + esc(t('env_' + env)) + '</span></button>';
        });
        html += '</div><div class="mlx-tb-group">';
        html += '<button type="button" class="mlx-tb mlx-tb--icon" data-act="clear" title="' + esc(t('clear_measures')) + '">' +
            icon('clear') + '<span class="sr-only">' + esc(t('clear_measures')) + '</span></button>' +
            '<button type="button" class="mlx-tb mlx-tb--icon" data-act="fs" title="' + esc(t('fullscreen')) + '">' +
            icon('fs') + '<span class="sr-only">' + esc(t('fullscreen')) + '</span></button></div>';
        bar.innerHTML = html;
        bar.addEventListener('click', e => {
            const b = e.target.closest('button');
            if (!b) {
                return;
            }
            if (b.dataset.tool) {
                this.setTool(b.dataset.tool);
            } else if (b.dataset.view) {
                this.world.focusOn(b.dataset.view);
            } else if (b.dataset.env) {
                const on = b.getAttribute('aria-pressed') !== 'true';
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
                if (this.world.fx) {
                    this.world.fx.set(b.dataset.env, on);
                }
            } else if (b.dataset.layer) {
                const on = b.getAttribute('aria-pressed') !== 'true';
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
                this.setLayer(b.dataset.layer, on);
            } else if (b.dataset.act === 'clear') {
                this.clearMeasures();
            } else if (b.dataset.act === 'fs') {
                const stage = this.root.querySelector('.mlx-shell');
                if (!document.fullscreenElement) {
                    stage.requestFullscreen().catch(() => null);
                } else {
                    document.exitFullscreen();
                }
            }
        });
        this.setTool(this.tool);
    };

    App.prototype.setLayer = function(id, on) {
        if (id === 'survey' && this.world.surveyGroup) {
            this.world.surveyGroup.visible = on;
            return;
        }
        (this.sceneApi.layers || []).forEach(function(l) {
            if (l.id === id) {
                l.set(on);
            }
        });
    };

    App.prototype.setTool = function(tool) {
        if (this.sceneApi && this.sceneApi.tools.indexOf(tool) < 0) {
            tool = 'explore';
        }
        this.tool = tool;
        this.measureA = null;
        this.root.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === tool ?
            'true' : 'false'));
        const hint = this.$('.mlx-toolhint');
        if (hint) {
            hint.textContent = this.t('hint_' + tool);
        }
        const stage = this.$('.mlx-stage');
        stage.dataset.tool = tool;
    };

    App.prototype.onSceneClick = function(e) {
        const w = this.world;
        if (this.tool === 'measure') {
            const hit = w.raycast(e.x, e.y, w.grounds.concat(w.pickables));
            if (!hit) {
                return;
            }
            let p = hit.point.clone();
            let snapped = false;
            const s1 = kit.snapToSurvey(w, p, 2.2);
            let best = s1 ? s1.distanceTo(p) : Infinity;
            if (s1) {
                p = s1;
                snapped = true;
            }
            (w.snapPoints || []).forEach(function(sp) {
                const d = sp.distanceTo(hit.point);
                if (d < 2.8 && d < best) {
                    best = d;
                    p = sp.clone();
                    snapped = true;
                }
            });
            this.addMeasurePoint(p, snapped);
            return;
        }
        const hit = w.raycast(e.x, e.y, w.pickables.concat(w.grounds));
        if (!hit) {
            this.hideInfo();
            return;
        }
        const info = w.findInfo(hit.object);
        if (this.tool === 'compass') {
            let reading = null;
            let label;
            if (info && info.kind === 'plane') {
                reading = {dd: info.plane.dd, dip: info.plane.dip};
                label = info.title;
            } else if (w.grounds.indexOf(hit.object) >= 0 && hit.face) {
                const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
                const dip = Math.acos(kit.clamp(n.y, -1, 1)) * 180 / Math.PI;
                let dd = Math.atan2(n.x, -n.z) * 180 / Math.PI;
                dd = (dd + 360) % 360;
                reading = {dd: Math.round(dd), dip: Math.round(dip)};
                label = this.t('compass_surface');
            }
            if (reading) {
                this.addCompassReading(hit.point, reading, label);
            }
            return;
        }
        if (info) {
            this.showInfo(info, hit.point);
        } else {
            this.hideInfo();
        }
    };

    // ---------------------------------------------------------------------
    // Medición.
    // ---------------------------------------------------------------------

    App.prototype.addMeasurePoint = function(p, snapped) {
        const THREE = this.THREE;
        const w = this.world;
        if (!this.measureA) {
            this.measureA = {p: p, snapped: snapped};
            const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), new THREE.MeshBasicMaterial({color: 0xff1744,
                depthTest: false}));
            m.position.copy(p);
            m.renderOrder = 10;
            w.scene.add(m);
            this.measureTmp = m;
            this.showReadout('<strong>' + esc(this.t('measure_first')) + '</strong>' + (snapped ? ' · ' +
                esc(this.t('snapped')) : ''));
            return;
        }
        const a = this.measureA.p;
        const b = p;
        if (this.measureTmp) {
            w.scene.remove(this.measureTmp);
            this.measureTmp = null;
        }
        this.measureA = null;
        const m = {
            a: {x: +a.x.toFixed(3), y: +a.y.toFixed(3), z: +a.z.toFixed(3)},
            b: {x: +b.x.toFixed(3), y: +b.y.toFixed(3), z: +b.z.toFixed(3)}
        };
        this.draft.measures.push(m);
        if (this.draft.measures.length > 24) {
            this.draft.measures.shift();
        }
        this.redrawMeasures();
        this.showReadout(this.measureHtml(m, true));
        this.markDirty();
    };

    App.prototype.measureValues = function(m) {
        const dx = m.b.x - m.a.x;
        const dy = m.b.y - m.a.y;
        const dz = m.b.z - m.a.z;
        const dh = Math.hypot(dx, dz);
        let az = Math.atan2(dx, -dz) * 180 / Math.PI;
        az = (az + 360) % 360;
        return {d: Math.hypot(dh, dy), dh: dh, dz: dy, az: az, slope: dh > 0 ? dy / dh * 100 : 0};
    };

    App.prototype.measureHtml = function(m, full) {
        const v = this.measureValues(m);
        const t = this.t;
        return '<dl class="mlx-dl">' +
            '<div><dt>' + esc(t('measure_d')) + '</dt><dd>' + fmt(v.d, 2) + ' m</dd></div>' +
            '<div><dt>' + esc(t('measure_dh')) + '</dt><dd>' + fmt(v.dh, 2) + ' m</dd></div>' +
            '<div><dt>' + esc(t('measure_dz')) + '</dt><dd>' + fmt(v.dz, 2) + ' m</dd></div>' +
            (full ? '<div><dt>' + esc(t('measure_az')) + '</dt><dd>' + fmt(v.az, 1) + '°</dd></div>' +
                '<div><dt>' + esc(t('measure_slope')) + '</dt><dd>' + fmt(v.slope, 2) + ' %</dd></div>' : '') +
            '</dl>';
    };

    App.prototype.redrawMeasures = function() {
        if (!this.world) {
            this.renderNotebook();
            return;
        }
        const THREE = this.THREE;
        const w = this.world;
        this.measureObjs.forEach(o => {
            if (o.isLabel) {
                o.el.remove();
                const i = w.labels.indexOf(o);
                if (i >= 0) {
                    w.labels.splice(i, 1);
                }
            } else {
                w.scene.remove(o);
            }
        });
        this.measureObjs = [];
        const mat = new THREE.LineBasicMaterial({color: 0xff1744, depthTest: false, transparent: true});
        const dot = new THREE.MeshBasicMaterial({color: 0xff1744, depthTest: false});
        this.draft.measures.forEach((m, i) => {
            const a = new THREE.Vector3(m.a.x, m.a.y, m.a.z);
            const b = new THREE.Vector3(m.b.x, m.b.y, m.b.z);
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mat);
            line.renderOrder = 10;
            w.scene.add(line);
            this.measureObjs.push(line);
            // Componentes: horizontal y vertical.
            const c = new THREE.Vector3(b.x, a.y, b.z);
            const comp = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, c, b]),
                new THREE.LineDashedMaterial({color: 0xffffff, dashSize: 0.8, gapSize: 0.5, depthTest: false}));
            comp.computeLineDistances();
            comp.renderOrder = 9;
            w.scene.add(comp);
            this.measureObjs.push(comp);
            [a, b].forEach(p => {
                const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), dot);
                s.position.copy(p);
                s.renderOrder = 10;
                w.scene.add(s);
                this.measureObjs.push(s);
            });
            const v = this.measureValues(m);
            const lab = w.addLabel(a.clone().lerp(b, 0.5), '<span class="mlx-mtag">M' + (i + 1) + ' · ' + fmt(v.d, 2) +
                ' m</span>', 'mlx-label--measure');
            lab.isLabel = true;
            this.measureObjs.push(lab);
        });
        this.renderNotebook();
    };

    App.prototype.clearMeasures = function() {
        this.draft.measures = [];
        this.draft.compass = [];
        this.redrawMeasures();
        this.redrawCompass();
        this.hideReadout();
        this.markDirty();
    };

    App.prototype.addCompassReading = function(point, r, label) {
        this.draft.compass.push({p: {x: +point.x.toFixed(2), y: +point.y.toFixed(2), z: +point.z.toFixed(2)},
            dd: r.dd, dip: r.dip, label: String(label || '').slice(0, 80)});
        if (this.draft.compass.length > 24) {
            this.draft.compass.shift();
        }
        this.redrawCompass();
        this.showReadout('<strong>' + esc(label) + '</strong><dl class="mlx-dl"><div><dt>' + esc(this.t('compass_dd')) +
            '</dt><dd>' + String(Math.round(r.dd)).padStart(3, '0') + '°</dd></div><div><dt>' + esc(this.t('compass_dip')) +
            '</dt><dd>' + Math.round(r.dip) + '°</dd></div></dl>');
        this.markDirty();
    };

    App.prototype.redrawCompass = function() {
        if (!this.world) {
            return;
        }
        const THREE = this.THREE;
        const w = this.world;
        (this.compassObjs || []).forEach(o => w.scene.remove(o));
        this.compassObjs = [];
        this.draft.compass.forEach(c => {
            const basis = scenes.planeBasis(THREE, c.dd, c.dip);
            const g = new THREE.Group();
            const disc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({color: 0xffffff,
                transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false}));
            g.add(disc);
            const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 12), new THREE.MeshBasicMaterial({color: 0xd50000,
                depthTest: false}));
            arrow.rotation.x = -Math.PI / 2;
            arrow.position.z = -0.4;
            g.add(arrow);
            const m = new THREE.Matrix4().makeBasis(basis.strike, basis.down.clone().negate(), basis.normal);
            g.applyMatrix4(m);
            g.position.set(c.p.x, c.p.y, c.p.z).addScaledVector(basis.normal, 0.25);
            g.renderOrder = 11;
            g.traverse(o => {
                o.renderOrder = 11;
            });
            w.scene.add(g);
            this.compassObjs.push(g);
        });
        this.renderNotebook();
    };

    App.prototype.renderNotebook = function() {
        const list = this.$('.mlx-notebook__list');
        if (!list) {
            return;
        }
        const t = this.t;
        const items = [];
        this.draft.measures.forEach((m, i) => {
            const v = this.measureValues(m);
            items.push('<li><span class="mlx-nb-k">M' + (i + 1) + '</span> ' + esc(t('measure_d')) + ' ' + fmt(v.d, 2) +
                ' m · ' + esc(t('measure_dh')) + ' ' + fmt(v.dh, 2) + ' m · ΔZ ' + fmt(v.dz, 2) + ' m · Az ' + fmt(v.az, 0) +
                '°</li>');
        });
        this.draft.compass.forEach((c, i) => {
            items.push('<li><span class="mlx-nb-k mlx-nb-k--c">B' + (i + 1) + '</span> ' + esc(c.label) + ': ' +
                String(Math.round(c.dd)).padStart(3, '0') + '/' + Math.round(c.dip) + '</li>');
        });
        list.innerHTML = items.length ? '<ul>' + items.join('') + '</ul>' : '<p class="mlx-muted">' +
            esc(t('nomeasures')) + '</p>';
        this.$('.mlx-count').textContent = items.length ? '(' + items.length + ')' : '';
    };

    App.prototype.showReadout = function(html) {
        const r = this.$('.mlx-readout');
        r.innerHTML = html;
        r.hidden = false;
    };
    App.prototype.hideReadout = function() {
        this.$('.mlx-readout').hidden = true;
    };

    // ---------------------------------------------------------------------
    // Fichas de inspección.
    // ---------------------------------------------------------------------

    App.prototype.showInfo = function(info) {
        const t = this.t;
        const card = this.$('.mlx-card');
        let html = '<button type="button" class="mlx-card__x" aria-label="' + esc(t('info_close')) + '">×</button>' +
            '<h4>' + esc(info.title) + '</h4>';
        if (info.text) {
            html += '<p>' + esc(info.text) + '</p>';
        }
        if (info.rows) {
            html += '<table class="mlx-kv">' + info.rows.map(r => '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) +
                '</td></tr>').join('') + '</table>';
        }
        if (info.table) {
            html += '<table class="mlx-grid"><thead><tr>' + info.table.head.map(h => '<th>' + esc(h) + '</th>').join('') +
                '</tr></thead><tbody>' + info.table.rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') +
                '</tr>').join('') + '</tbody></table>';
        }
        if (info.kind === 'core' && info.core) {
            html += this.coreSvg(info.core);
        }
        if (info.kind === 'plane' && this.tool !== 'compass' && this.sceneApi.tools.indexOf('compass') >= 0) {
            html += '<button type="button" class="btn btn-sm btn-secondary" data-card="compass">' + esc(t('tool_compass')) +
                '</button>';
        }
        const task = this.taskById(this.draft.active);
        if (info.pickId && task && !task.state.closed && !this.completed() && ['pick', 'choice', 'multi'].indexOf(task.type) >= 0 &&
                task.options.some(o => o.id === info.pickId)) {
            const cur = this.draft.inputs[task.id];
            const sel = task.type === 'multi' ? (Array.isArray(cur) && cur.indexOf(info.pickId) >= 0) : cur === info.pickId;
            html += '<button type="button" class="btn btn-sm ' + (sel ? 'btn-success' : 'btn-primary') + '" data-card="pick">' +
                esc(sel ? (task.type === 'multi' ? t('unmark_answer') : t('selected')) : t('mark_answer')) + '</button>';
        }
        card.innerHTML = html;
        card.hidden = false;
        card.querySelector('.mlx-card__x').addEventListener('click', () => this.hideInfo());
        const pb = card.querySelector('[data-card="pick"]');
        if (pb) {
            pb.addEventListener('click', () => {
                const cur = this.draft.inputs[task.id];
                if (task.type === 'multi') {
                    const arr = Array.isArray(cur) ? cur.slice() : [];
                    const i = arr.indexOf(info.pickId);
                    if (i >= 0) {
                        arr.splice(i, 1);
                    } else {
                        arr.push(info.pickId);
                    }
                    this.draft.inputs[task.id] = arr;
                } else {
                    this.draft.inputs[task.id] = info.pickId;
                }
                this.markDirty();
                this.renderTask();
                this.showInfo(info);
            });
        }
        const cb = card.querySelector('[data-card="compass"]');
        if (cb) {
            cb.addEventListener('click', () => {
                this.setTool('compass');
                this.hideInfo();
            });
        }
    };

    App.prototype.hideInfo = function() {
        this.$('.mlx-card').hidden = true;
    };

    App.prototype.coreSvg = function(core) {
        const W = 300;
        const rowLen = 100;
        let x = 0;
        let row = 0;
        let parts = '';
        core.pieces.forEach(function(len) {
            let rem = len;
            while (rem > 0) {
                const room = rowLen - x;
                const take = Math.min(rem, room);
                const px = 10 + x / rowLen * (W - 20);
                const pw = take / rowLen * (W - 20);
                parts += '<rect x="' + px.toFixed(1) + '" y="' + (14 + row * 34) + '" width="' + Math.max(1, pw - 1.2).toFixed(1) +
                    '" height="16" rx="3" class="' + (len >= 10 ? 'ok' : 'frag') + '"/>';
                if (take === rem && len >= 6) {
                    parts += '<text x="' + (px + pw / 2).toFixed(1) + '" y="' + (42 + row * 34) + '">' + len + '</text>';
                }
                rem -= take;
                x += take;
                if (x >= rowLen) {
                    x = 0;
                    row++;
                }
            }
        });
        return '<svg class="mlx-core" viewBox="0 0 ' + W + ' ' + (14 + 3 * 34) + '" role="img" aria-label="' +
            esc(this.t('core_aria')) + '">' + parts + '</svg><p class="mlx-muted">' + esc(this.t('core_legend')) + '</p>';
    };

    // ---------------------------------------------------------------------
    // Panel lateral: puntaje, tareas, tarea activa.
    // ---------------------------------------------------------------------

    App.prototype.renderSide = function() {
        this.renderScore();
        this.renderTaskList();
        if (!this.draft.active || !this.taskById(this.draft.active)) {
            const open = this.data.tasks.find(x => !x.state.closed);
            this.draft.active = (open || this.data.tasks[0]).id;
        }
        this.renderTask();
        this.renderNotebook();
        this.renderFinish();
    };

    App.prototype.renderScore = function() {
        const s = this.data.summary;
        const t = this.t;
        const pct = s.percent;
        const circ = 2 * Math.PI * 26;
        const box = this.$('.mlx-score');
        box.innerHTML =
            '<div class="mlx-ring" role="img" aria-label="' + esc(t('achievement')) + ' ' + fmt(pct, 1) + ' %">' +
            '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" class="bg"/><circle cx="32" cy="32" r="26" class="fg" ' +
            'stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + (circ * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
            '<span>' + fmt(pct, 0) + '<small>%</small></span></div>' +
            '<div class="mlx-score__txt">' +
            '<div class="mlx-score__row"><span>' + esc(t(s.completed ? 'grade_cl_final' : 'grade_cl')) + '</span><strong class="' +
            (s.chile >= 4 ? 'is-pass' : 'is-fail') + '">' + fmt(s.chile, 1) + '</strong></div>' +
            '<div class="mlx-score__row"><span>' + esc(t('progress')) + '</span><strong>' + s.closedtasks + ' / ' + s.totaltasks +
            '</strong></div>' +
            (s.grademax > 0 ? '<div class="mlx-score__row"><span>' + esc(t('gradebook')) + '</span><strong>' +
                fmt(s.completed && s.finalgrade !== null ? s.finalgrade : s.grade, 1) + ' / ' + fmt(s.grademax, 0) +
                '</strong></div>'
                : '') +
            '</div>';
    };

    App.prototype.statusIcon = function(task) {
        const st = task.state;
        if (st.closed) {
            if (st.status === 'correct') {
                return '<span class="mlx-st mlx-st--ok" title="' + esc(this.t('correct')) + '">✓</span>';
            }
            if (st.score > 0) {
                return '<span class="mlx-st mlx-st--part" title="' + esc(this.t('partial')) + '">½</span>';
            }
            return '<span class="mlx-st mlx-st--bad" title="' + esc(this.t('incorrect')) + '">✕</span>';
        }
        if (st.tries > 0) {
            return '<span class="mlx-st mlx-st--try" title="' + esc(this.t('inprogress')) + '">' + st.tries + '</span>';
        }
        const has = this.draft.inputs[task.id] !== undefined && this.draft.inputs[task.id] !== '' &&
            !(Array.isArray(this.draft.inputs[task.id]) && !this.draft.inputs[task.id].length);
        return '<span class="mlx-st ' + (has ? 'mlx-st--draft' : '') + '" title="' + esc(this.t(has ? 'drafted' : 'pending')) +
            '"></span>';
    };

    App.prototype.renderTaskList = function() {
        const nav = this.$('.mlx-tasks');
        nav.innerHTML = '<ol>' + this.data.tasks.map((task, i) => '<li><button type="button" data-task="' + esc(task.id) +
            '" class="' + (task.id === this.draft.active ? 'is-active' : '') + '" aria-current="' +
            (task.id === this.draft.active ? 'step' : 'false') + '">' + this.statusIcon(task) +
            '<span class="mlx-tasks__n">' + (i + 1) + '</span><span class="mlx-tasks__t">' + esc(task.title) +
            '</span><span class="mlx-tasks__w">' + task.weight + ' %</span></button></li>').join('') + '</ol>';
        nav.querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', () => {
            this.draft.active = b.dataset.task;
            this.markDirty(true);
            this.renderTaskList();
            this.renderTask();
            const task = this.taskById(b.dataset.task);
            if (task.tool && task.tool !== 'none' && this.sceneApi) {
                this.setTool(task.tool);
            }
        }));
    };

    App.prototype.renderTask = function() {
        const t = this.t;
        const task = this.taskById(this.draft.active);
        const box = this.$('.mlx-task');
        if (!task) {
            box.innerHTML = '';
            return;
        }
        const st = task.state;
        const locked = st.closed || this.completed() || !this.canAttempt;
        const maxt = this.data.config.maxtries;
        const idx = this.data.tasks.indexOf(task) + 1;
        let html = '<header class="mlx-task__head"><span class="mlx-task__n">' + esc(t('task')) + ' ' + idx + '/' +
            this.data.tasks.length + '</span><span class="mlx-task__w">' + esc(t('weight')) + ' ' + task.weight +
            ' %</span></header>' +
            '<h4 class="mlx-task__title">' + esc(task.title) + '</h4>' +
            '<div class="mlx-chips">' + task.ra.map(r => '<span class="mlx-code" title="' +
                esc(this.data.meta.ra[r] || '') + '">' + esc(r) + '</span>').join('') +
            task.competencies.map(c => '<span class="mlx-code mlx-code--c" title="' + esc(this.data.meta.competencies[c] || '') +
                '">' + esc(c) + '</span>').join('') + '</div>' +
            '<p class="mlx-task__prompt">' + esc(task.prompt) + '</p>';
        if (task.id === 'qaqc' && this.data.scene.qaqc) {
            html += this.qaqcChart(this.data.scene.qaqc);
        }
        html += '<div class="mlx-input">' + this.inputHtml(task, locked) + '</div>';
        html += '<div class="mlx-task__actions">';
        if (task.focus && this.world && this.world.focus[task.focus]) {
            html += '<button type="button" class="btn btn-outline-secondary btn-sm" data-act="focus">' + esc(t('gotoscene')) +
                '</button>';
        }
        if (task.hint && !locked) {
            html += '<button type="button" class="btn btn-outline-secondary btn-sm" data-act="hint">' + esc(t('showhint')) +
                '</button>';
        }
        if (!locked) {
            html += '<button type="button" class="btn btn-primary" data-act="submit">' + esc(t('submit')) + '</button>' +
                '<span class="mlx-tries">' + esc(t('triesleft', {left: maxt - st.tries, max: maxt})) + '</span>';
        }
        html += '</div><div class="mlx-hintbox" hidden>' + esc(task.hint) + '</div>';
        html += '<div class="mlx-feedback">' + this.feedbackHtml(task) + '</div>';
        box.innerHTML = html;
        this.bindInput(task, locked);
        const fb = box.querySelector('[data-act="focus"]');
        if (fb) {
            fb.addEventListener('click', () => {
                this.world.focusOn(task.focus);
                const layer = (this.world.focusLayers || {})[task.focus];
                const lb = layer ? this.root.querySelector('[data-layer="' + layer + '"]') : null;
                if (lb && lb.getAttribute('aria-pressed') !== 'true') {
                    lb.setAttribute('aria-pressed', 'true');
                    this.setLayer(layer, true);
                }
                if (task.tool && task.tool !== 'none') {
                    this.setTool(task.tool);
                }
            });
        }
        const hb = box.querySelector('[data-act="hint"]');
        if (hb) {
            hb.addEventListener('click', () => {
                box.querySelector('.mlx-hintbox').hidden = false;
                hb.disabled = true;
            });
        }
        const sb = box.querySelector('[data-act="submit"]');
        if (sb) {
            sb.addEventListener('click', () => this.submit(task, sb));
        }
    };

    App.prototype.inputHtml = function(task, locked) {
        const t = this.t;
        const dis = locked ? ' disabled' : '';
        const val = locked && task.state.response !== null && task.state.response !== undefined ? task.state.response :
            this.draft.inputs[task.id];
        const name = 'mlx-in-' + task.id;
        switch (task.type) {
            case 'number':
                return '<label class="mlx-num"><span class="sr-only">' + esc(t('youranswer')) + '</span>' +
                    '<input type="text" inputmode="decimal" autocomplete="off" class="form-control" id="' + name + '" value="' +
                    esc(val === undefined || val === null ? '' : val) + '" placeholder="' + esc(t('number_placeholder')) + '"' +
                    dis + '>' + (task.unit ? '<span class="mlx-unit">' + esc(task.unit) + '</span>' : '') + '</label>';
            case 'choice':
            case 'pick':
                return (task.type === 'pick' && !locked ? '<p class="mlx-muted">' + esc(t('select_in_scene')) + '</p>' : '') +
                    '<fieldset class="mlx-opts"><legend class="sr-only">' + esc(t('youranswer')) + '</legend>' +
                    task.options.map(o => '<label class="mlx-opt"><input type="radio" name="' + name + '" value="' +
                    esc(o.id) + '"' +
                    (val === o.id ? ' checked' : '') + dis + '><span>' + esc(o.label) + '</span></label>').join('') + '</fieldset>';
            case 'multi': {
                const arr = Array.isArray(val) ? val : [];
                return '<fieldset class="mlx-opts"><legend class="sr-only">' + esc(t('youranswer')) + '</legend>' +
                    task.options.map(o => '<label class="mlx-opt"><input type="checkbox" name="' + name + '" value="' +
                    esc(o.id) + '"' +
                    (arr.indexOf(o.id) >= 0 ? ' checked' : '') + dis + '><span>' + esc(o.label) + '</span></label>').join('') +
                    '</fieldset>';
            }
            case 'order': {
                let ids = Array.isArray(val) && val.length === task.options.length ? val : task.options.map(o => o.id);
                const lab = {};
                task.options.forEach(o => {
                    lab[o.id] = o.label;
                });
                ids = ids.filter(id => lab[id] !== undefined);
                return (locked ? '' : '<p class="mlx-muted">' + esc(t('order_hint')) + '</p>') +
                    '<ol class="mlx-order" data-name="' + name + '">' + ids.map((id, i) => '<li draggable="' + (!locked) +
                    '" data-id="' + esc(id) + '"><span class="mlx-order__n">' + (i + 1) + '</span><span class="mlx-order__t">' +
                    esc(lab[id]) + '</span>' + (locked ? '' : '<span class="mlx-order__b"><button type="button" data-mv="-1" ' +
                    'aria-label="' + esc(t('moveup')) + '">▲</button><button type="button" data-mv="1" aria-label="' +
                    esc(t('movedown')) + '">▼</button></span>') + '</li>').join('') + '</ol>';
            }
        }
        return '';
    };

    App.prototype.bindInput = function(task, locked) {
        if (locked) {
            return;
        }
        const box = this.$('.mlx-input');
        const save = v => {
            this.draft.inputs[task.id] = v;
            this.markDirty();
            this.renderTaskList();
        };
        if (task.type === 'number') {
            const inp = box.querySelector('input');
            inp.addEventListener('input', () => save(inp.value.slice(0, 32)));
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    this.submit(task, this.$('[data-act="submit"]'));
                }
            });
        } else if (task.type === 'choice' || task.type === 'pick') {
            box.querySelectorAll('input').forEach(i => i.addEventListener('change', () => save(i.value)));
        } else if (task.type === 'multi') {
            box.querySelectorAll('input').forEach(i => i.addEventListener('change', () => {
                save(Array.from(box.querySelectorAll('input:checked')).map(x => x.value));
            }));
        } else if (task.type === 'order') {
            const ol = box.querySelector('.mlx-order');
            const read = () => Array.from(ol.children).map(li => li.dataset.id);
            const renumber = () => Array.from(ol.children).forEach((li, i) => {
                li.querySelector('.mlx-order__n').textContent = String(i + 1);
            });
            ol.addEventListener('click', e => {
                const b = e.target.closest('[data-mv]');
                if (!b) {
                    return;
                }
                const li = b.closest('li');
                const dir = parseInt(b.dataset.mv, 10);
                if (dir < 0 && li.previousElementSibling) {
                    ol.insertBefore(li, li.previousElementSibling);
                } else if (dir > 0 && li.nextElementSibling) {
                    ol.insertBefore(li.nextElementSibling, li);
                }
                renumber();
                save(read());
                b.focus();
            });
            let dragEl = null;
            ol.addEventListener('dragstart', e => {
                dragEl = e.target.closest('li');
                dragEl.classList.add('is-drag');
                e.dataTransfer.effectAllowed = 'move';
            });
            ol.addEventListener('dragover', e => {
                e.preventDefault();
                const over = e.target.closest('li');
                if (!over || over === dragEl) {
                    return;
                }
                const r = over.getBoundingClientRect();
                ol.insertBefore(dragEl, e.clientY < r.top + r.height / 2 ? over : over.nextSibling);
            });
            ol.addEventListener('dragend', () => {
                if (dragEl) {
                    dragEl.classList.remove('is-drag');
                }
                dragEl = null;
                renumber();
                save(read());
            });
            if (this.draft.inputs[task.id] === undefined) {
                // El orden inicial también es una respuesta posible: se guarda al primer cambio.
                this.draft.inputs[task.id] = read();
            }
        }
    };

    App.prototype.feedbackHtml = function(task) {
        const t = this.t;
        const st = task.state;
        let html = '';
        if (st.tries > 0 || st.closed) {
            const cls = st.status === 'correct' ? 'ok' : (st.status === 'partial' ? 'part' : 'bad');
            const label = st.status === 'correct' ? t('correct') : (st.status === 'partial' ? t('partial') :
                (st.status === 'new' ? t('notanswered') : t('incorrect')));
            html += '<div class="mlx-fb mlx-fb--' + cls + '"><strong>' + esc(label) + '</strong> · ' + esc(t('scoretask')) + ' ' +
                fmt(st.score * 100, 0) + ' %' + (st.closed ? ' · ' + esc(t('closed')) : '') + '</div>';
        }
        if (st.closed && st.answerlabel) {
            html += '<div class="mlx-solution"><p><strong>' + esc(t('correctanswer')) + ':</strong> ' + esc(st.answerlabel) +
                '</p>' + (st.solution ? '<p class="mlx-solution__dev">' + esc(st.solution) + '</p>' : '') + '</div>';
        }
        return html;
    };

    App.prototype.qaqcChart = function(q) {
        const W = 320;
        const H = 150;
        const lo = q.crm - 4.2 * q.sigma;
        const hi = q.crm + 4.2 * q.sigma;
        const y = v => (H - 20) - (v - lo) / (hi - lo) * (H - 34);
        const x = i => 36 + i * ((W - 50) / (q.values.length - 1));
        let s = '<svg class="mlx-qaqc" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(this.t('qaqc_aria')) + '">';
        [[2, 'lim2'], [-2, 'lim2'], [3, 'lim3'], [-3, 'lim3'], [0, 'mean']].forEach(function(l) {
            const yy = y(q.crm + l[0] * q.sigma).toFixed(1);
            s += '<line x1="34" x2="' + (W - 8) + '" y1="' + yy + '" y2="' + yy + '" class="' + l[1] + '"/>';
            s += '<text x="30" y="' + (+yy + 3) + '" class="ax">' + (l[0] === 0 ? 'μ' : (l[0] > 0 ? '+' : '−') + Math.abs(l[0]) +
                'σ') + '</text>';
        });
        const pts = q.values.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ');
        s += '<polyline points="' + pts + '" class="series"/>';
        q.values.forEach(function(v, i) {
            s += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="4" class="pt"/>';
            s += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 4) + '" class="ax">L' + (i + 1) + '</text>';
        });
        return s + '</svg>';
    };

    App.prototype.renderFinish = function() {
        const t = this.t;
        const box = this.$('.mlx-finish');
        const s = this.data.summary;
        if (s.completed) {
            box.innerHTML = this.finalHtml();
            return;
        }
        if (!this.canAttempt) {
            box.innerHTML = '';
            return;
        }
        box.innerHTML = '<button type="button" class="btn btn-success btn-lg mlx-finish__btn">' + esc(t('finish')) + '</button>' +
            '<p class="mlx-muted">' + esc(t('finish_help')) + '</p>';
        box.querySelector('button').addEventListener('click', () => this.finish());
    };

    App.prototype.finalHtml = function() {
        const t = this.t;
        const s = this.data.summary;
        const ra = s.ra || {};
        return '<section class="mlx-final"><h4>' + esc(t('final_title')) + '</h4>' +
            '<p class="mlx-final__grade ' + (s.chile >= 4 ? 'is-pass' : 'is-fail') + '">' + fmt(s.chile, 1) + '</p>' +
            '<p class="mlx-muted">' + esc(t('final_detail', {pct: fmt(s.percent, 1), pass: this.data.config.passpercent})) +
            '</p><h5>' + esc(t('ra_attainment')) + '</h5><ul class="mlx-bars">' + Object.keys(ra).map(k =>
                '<li><span class="mlx-code" title="' + esc(this.data.meta.ra[k] || '') + '">' + esc(k) + '</span>' +
                '<span class="mlx-bar"><span style="width:' + (ra[k] * 100).toFixed(0) + '%"></span></span><span>' +
                fmt(ra[k] * 100, 0) + ' %</span></li>').join('') + '</ul></section>';
    };

    // ---------------------------------------------------------------------
    // Servidor: respuestas, guardado y cierre.
    // ---------------------------------------------------------------------

    App.prototype.responseFor = function(task) {
        const v = this.draft.inputs[task.id];
        if (task.type === 'number') {
            return typeof v === 'string' ? v.trim() : '';
        }
        if (task.type === 'multi' || task.type === 'order') {
            return Array.isArray(v) ? v : [];
        }
        return typeof v === 'string' ? v : '';
    };

    App.prototype.submit = function(task, btn) {
        if (this.busy) {
            return;
        }
        const t = this.t;
        const resp = this.responseFor(task);
        if (resp === '' || (Array.isArray(resp) && !resp.length)) {
            Notification.addNotification({message: t('answer_required'), type: 'warning'});
            return;
        }
        this.busy = true;
        if (btn) {
            btn.disabled = true;
        }
        this.flushDraft();
        this.call('mod_minaslab_submit_answer', {cmid: this.cfg.cmid, taskid: task.id, response: JSON.stringify(resp)})
            .then(r => {
                const res = JSON.parse(r.result);
                this.busy = false;
                if (res.status === 'invalid') {
                    Notification.addNotification({message: t('invalid'), type: 'warning'});
                    if (btn) {
                        btn.disabled = false;
                    }
                    return;
                }
                task.state.tries = res.tries;
                task.state.status = res.status;
                task.state.score = res.score;
                task.state.closed = res.closed;
                task.state.response = resp;
                if (res.closed) {
                    task.state.solution = res.solution;
                    task.state.answerlabel = res.answerlabel;
                }
                if (res.summary) {
                    this.data.summary = res.summary;
                }
                this.renderScore();
                this.renderTaskList();
                this.renderTask();
                this.renderFinish();
                return;
            }).catch(err => {
                this.busy = false;
                if (btn) {
                    btn.disabled = false;
                }
                Notification.exception(err);
            });
    };

    App.prototype.finish = function() {
        const t = this.t;
        const open = this.data.tasks.filter(x => !x.state.closed).length;
        const msg = open ? t('finish_unanswered', open) : t('finish_confirm');
        Notification.saveCancelPromise(t('finish_confirm_title'), msg, t('finish')).then(() => {
            this.flushDraft();
            return this.call('mod_minaslab_finish_evaluation', {cmid: this.cfg.cmid});
        }).then(r => {
            if (!r) {
                return null;
            }
            // Recargar el estado completo: soluciones visibles y entradas bloqueadas.
            return this.call('mod_minaslab_get_evaluation', {cmid: this.cfg.cmid});
        }).then(r => {
            if (!r) {
                return;
            }
            this.data = JSON.parse(r.payload);
            this.$('#mlx-notes').disabled = true;
            this.renderSide();
            this.$('.mlx-finish').scrollIntoView({behavior: 'smooth', block: 'center'});
        }).catch(err => {
            if (err && err.message !== undefined || err instanceof Error) {
                Notification.exception(err);
            }
        });
    };

    App.prototype.markDirty = function(quiet) {
        this.dirty = true;
        if (!quiet) {
            this.setSaveState('pending');
        }
        window.clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => this.flushDraft(), quiet ? 6000 : 1500);
    };

    App.prototype.draftJson = function() {
        const d = this.draft;
        return JSON.stringify({v: 1, inputs: d.inputs, measures: d.measures, compass: d.compass, notes: d.notes,
            active: d.active, view: d.view});
    };

    App.prototype.flushDraft = function(beacon) {
        if (!this.dirty || !this.canAttempt || this.completed() || !this.data) {
            return;
        }
        window.clearTimeout(this.saveTimer);
        this.dirty = false;
        const json = this.draftJson();
        if (beacon && window.M && window.M.cfg) {
            // Guardado al cerrar la pestaña: petición que sobrevive a la descarga de la página.
            const url = window.M.cfg.wwwroot + '/lib/ajax/service.php?sesskey=' + encodeURIComponent(window.M.cfg.sesskey) +
                '&info=mod_minaslab_save_draft';
            try {
                window.fetch(url, {method: 'POST', keepalive: true, credentials: 'same-origin',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify([{index: 0, methodname: 'mod_minaslab_save_draft',
                        args: {cmid: this.cfg.cmid, draft: json}}])});
            } catch (e) {
                // Sin acción: el próximo guardado normal recuperará el estado.
            }
            return;
        }
        this.setSaveState('saving');
        this.call('mod_minaslab_save_draft', {cmid: this.cfg.cmid, draft: json}).then(r => {
            this.setSaveState('saved', r.savedat);
            return null;
        }).catch(() => {
            this.dirty = true;
            this.setSaveState('error');
        });
    };

    App.prototype.setSaveState = function(state, ts) {
        const el = this.$('.mlx-save');
        if (!el) {
            return;
        }
        el.dataset.state = state;
        if (state === 'saved') {
            const d = ts ? new Date(ts * 1000) : new Date();
            el.textContent = this.t('saved', d.toLocaleTimeString('es-CL'));
        } else {
            el.textContent = this.t(state === 'saving' ? 'saving' : (state === 'error' ? 'savefailed' : 'unsaved'));
        }
    };

    return {init: init};
});
