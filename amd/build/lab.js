// MinasLab — motor curricular: 84 prácticas en catálogo PHP → motores por arquetipo (shell + escenas 3D/2D).
define(['jquery', 'mod_minaslab/lab_ui', 'mod_minaslab/scenes3d', 'mod_minaslab/lab_practices'], function($, labui, scenes3d, labpractices) {
    'use strict';

    var THREE = null;

    /**
     * El UMD de three r150+ exige una primera línea `console.warn(...),` para que el bundle
     * sea una expresión válida. Si el archivo en el servidor está recortado (solo desde /**),
     * el navegador lanza SyntaxError y no existe window.THREE. Aquí se repara el texto antes de ejecutarlo.
     */
    function fixThreeBundleText(code) {
        if (!code || typeof code !== 'string') {
            return code;
        }
        if (code.charCodeAt(0) === 0xFEFF) {
            code = code.slice(1);
        }
        var ts = code.trimStart();
        if (ts.indexOf('console.warn') !== 0) {
            code = 'console.warn(\'three.js (MinasLab bundle)\'),\n' + code;
        }
        return code;
    }

    function ensureThree(cfg, done) {
        var wwwroot = cfg && cfg.wwwroot ? cfg.wwwroot : '';
        var assetV = cfg && cfg.assetVersion != null ? String(cfg.assetVersion) : '1';
        if (window.THREE) {
            THREE = window.THREE;
            return done();
        }
        var baseUrl = wwwroot + '/mod/minaslab/js/three.min.js';
        var url = baseUrl + '?v=' + encodeURIComponent(assetV);
        var prevDefine = typeof window.define === 'function' ? window.define : undefined;

        function restoreDefine() {
            if (prevDefine) {
                window.define = prevDefine;
            }
        }

        function stripAmdDefineForRun() {
            if (prevDefine) {
                try {
                    delete window.define;
                } catch (e) {
                    window.define = undefined;
                }
            }
        }

        function finishLoad() {
            THREE = window.THREE;
            if (!THREE && typeof window.console !== 'undefined' && window.console.error) {
                window.console.error(
                    'MinasLab: tras cargar three.js, window.THREE sigue vacío. ' +
                    'Comprueba mod/minaslab/js/three.min.js y la consola por errores de sintaxis.'
                );
            }
            done();
        }

        function injectScriptFromCode(code) {
            code = fixThreeBundleText(code);
            var blob = new Blob([code], {type: 'application/javascript'});
            var blobUrl = URL.createObjectURL(blob);
            var s = document.createElement('script');
            s.src = blobUrl;
            s.async = false;
            s.onload = function() {
                URL.revokeObjectURL(blobUrl);
                restoreDefine();
                finishLoad();
            };
            s.onerror = function() {
                URL.revokeObjectURL(blobUrl);
                restoreDefine();
                loadScriptTagDirect();
            };
            stripAmdDefineForRun();
            document.head.appendChild(s);
        }

        function loadScriptTagDirect() {
            var s = document.createElement('script');
            s.src = url;
            s.async = false;
            s.onload = function() {
                restoreDefine();
                finishLoad();
            };
            s.onerror = function() {
                restoreDefine();
                if (typeof window.console !== 'undefined' && window.console.error) {
                    window.console.error('MinasLab: no se pudo cargar three.min.js (404 o red).');
                }
                done();
            };
            stripAmdDefineForRun();
            document.head.appendChild(s);
        }

        if (typeof window.fetch === 'function') {
            window.fetch(url, {credentials: 'same-origin', cache: 'no-store'})
                .then(function(r) {
                    if (!r.ok) {
                        throw new Error('HTTP ' + r.status);
                    }
                    return r.text();
                })
                .then(function(text) {
                    injectScriptFromCode(text);
                })
                .catch(function() {
                    loadScriptTagDirect();
                });
        } else {
            loadScriptTagDirect();
        }
    }

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

    function panelHtml(title, body, extraClass, activity, t) {
        var profBlock = '';
        if (activity && activity.profile && activity.profile.length && t && t.profileLabel) {
            var badges = activity.profile.map(function(p) {
                return 'C' + parseInt(p, 10);
            }).join(', ');
            profBlock = '<p class="ml-panel__profile"><span class="ml-panel__profile-lbl">' + esc(t.profileLabel) +
                '</span> <span class="ml-panel__profile-badges">' + esc(badges) + '</span></p>';
        }
        var dataFocus = '';
        if (t && t.practiceDataFocus) {
            dataFocus = '<p class="ml-panel__data-focus">' + esc(t.practiceDataFocus) + '</p>';
        }
        return '<div class="ml-panel ' + (extraClass || '') + '">' +
            '<h4 class="ml-panel__t">' + esc(title) + '</h4>' +
            profBlock +
            dataFocus +
            '<p class="ml-panel__b">' + esc(body) + '</p>' +
            '</div>';
    }

    /** Problema numérico estable por clave de catálogo (cada una de las 84 prácticas es distinta). */
    function problemFromKey(activityKey) {
        var h = labui.hashActivityKey(activityKey || 's1_algebra_a');
        var a = 2 + (h % 14);
        var b = 1 + ((h >> 4) % 11);
        return {a: a, b: b, ans: a + b};
    }

    function setPracticeProgress(percent) {
        window.setTimeout(function() {
            var r = document.querySelector('#minaslab-stage .ml-progress-foot__range');
            var p = document.querySelector('#minaslab-stage .ml-progress-foot__pct');
            var v = Math.min(100, Math.max(0, Math.round(percent)));
            if (r) {
                r.value = String(v);
                r.setAttribute('aria-valuetext', v + '%');
            }
            if (p) {
                p.textContent = String(v);
            }
        }, 0);
    }

    function openShell(container, activity, cfg) {
        container.innerHTML = '';
        return labui.buildSimulationShell(container, activity, cfg.activityKey || '', cfg.strings || {});
    }

    function appendSceneLegend(viewport, activity, t) {
        var prev = viewport.querySelector('.ml-3d-legend');
        if (prev) {
            prev.remove();
        }
        var leg = document.createElement('div');
        leg.className = 'ml-3d-legend';
        leg.setAttribute('role', 'note');
        if (activity.subject_slug === 'algebra') {
            leg.textContent = t.sceneLegendAlgebra || '';
        } else {
            leg.textContent = t.sceneLegendTunnel || '';
        }
        viewport.appendChild(leg);
    }

    function appendPitLegend(viewport, t, bermRefM, pitScene) {
        var prev = viewport.querySelector('.ml-3d-legend');
        if (prev) {
            prev.remove();
        }
        var leg = document.createElement('div');
        leg.className = 'ml-3d-legend';
        leg.setAttribute('role', 'note');
        var base = (pitScene === 'cycle' && t.sceneLegendPitCycle) ? t.sceneLegendPitCycle : (t.sceneLegendPit || '');
        if (bermRefM != null && t.sceneLegendPitBerm) {
            leg.textContent = base + ' ' + t.sceneLegendPitBerm.replace('##', String(bermRefM));
        } else {
            leg.textContent = base;
        }
        viewport.appendChild(leg);
    }

    function mountTunnel3d(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        var theme = labui.themeFromKey(cfg.activityKey);
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-tunnel"></div>' +
            '<p class="ml-note">' + esc(t.drag3d) + '</p>' +
            '<p class="ml-note ml-note--warn">' + esc(t.conceptual) + '</p>';

        if (!THREE) {
            shell.viewport.innerHTML = '<div class="ml-fallback">' + esc(t.conceptual) + '</div>';
            return;
        }
        scenes3d.mountTunnel(shell.viewport, activity, theme, THREE);
        appendSceneLegend(shell.viewport, activity, t);

        var host = shell.aside.querySelector('#ml-guided-tunnel');
        if (host) {
            labpractices.mountGuidedTunnel(host, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function mountPit3d(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        var theme = labui.themeFromKey(cfg.activityKey);
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-pit"></div>' +
            '<p class="ml-note">' + esc(t.drag3d) + '</p>' +
            '<p class="ml-note ml-note--warn">' + esc(t.conceptual) + '</p>';

        if (!THREE) {
            shell.viewport.innerHTML = '<div class="ml-fallback">WebGL no disponible</div>';
            return;
        }
        theme.pitTools = {
            presetIso: t.pitPresetIso,
            presetPlan: t.pitPresetPlan,
            presetSection: t.pitPresetSection,
            measureToggle: t.pitMeasureToggle,
            clearMeasure: t.pitClearMeasure,
            layerContours: t.pitLayerContours,
            layerEquip: t.pitLayerEquip,
            measureHint: t.pitMeasureHint,
            distLabel: t.pitDistLabel
        };
        if (activity && activity.pit_scene === 'cycle') {
            theme.pitTools.pitCycleTourLabel = t.pitCycleTourLabel;
            theme.pitTools.pitCycleStagePerf = t.pitCycleStagePerf;
            theme.pitTools.pitCycleStageLoad = t.pitCycleStageLoad;
            theme.pitTools.pitCycleStageHaul = t.pitCycleStageHaul;
            theme.pitTools.pitCycleStageDump = t.pitCycleStageDump;
        }
        var pitScene = (activity && activity.pit_scene === 'cycle') ? 'cycle' : 'design';
        if (pitScene === 'cycle') {
            scenes3d.mountPitCycle(shell.viewport, activity, theme, THREE);
        } else {
            scenes3d.mountPit(shell.viewport, activity, theme, THREE);
        }
        var bermM = pitScene === 'cycle' ? null : labpractices.getPitBermRefMeters(cfg.activityKey);
        appendPitLegend(shell.viewport, t, bermM, pitScene);

        var hostP = shell.aside.querySelector('#ml-guided-pit');
        if (hostP) {
            labpractices.mountGuidedPit(hostP, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function mountMathMine(container, activity, t, cfg) {
        var p = problemFromKey(cfg.activityKey);
        var a = p.a;
        var b = p.b;
        var shell = openShell(container, activity, cfg);
        shell.viewport.classList.add('ml-pro__viewport--split');
        shell.viewport.innerHTML =
            '<div class="ml-math">' +
            '<div class="ml-math__viz ml-math__viz--pro">' +
            '<div class="ml-math__grid"></div>' +
            '<div class="ml-math__grid-glow"></div>' +
            '<p class="ml-math__cap">Taller · ' + esc(activity.subject_name) + '</p>' +
            '</div></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-quiz" id="ml-math-quiz"></div>' +
            '<p class="ml-note ml-note--warn">' + esc(t.conceptual) + '</p>';

        var grid = shell.viewport.querySelector('.ml-math__grid');
        var n = Math.min(a + b, 36);
        var i;
        for (i = 0; i < n; i++) {
            var d = document.createElement('div');
            d.className = 'ml-truck';
            d.style.animationDelay = (i * 0.05) + 's';
            grid.appendChild(d);
        }

        labpractices.mountGuidedMathMine(shell.aside, activity, cfg, {
            esc: esc,
            strings: t,
            setPracticeProgress: setPracticeProgress,
            setRootScore: setRootScore,
            activityKey: cfg.activityKey,
            activity: activity
        });
    }

    function mountFlowProcess(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        var steps = [
            {id: 1, label: 'Chancado'},
            {id: 2, label: 'Molienda'},
            {id: 3, label: 'Acondicionamiento'},
            {id: 4, label: 'Flotación'},
            {id: 5, label: 'Espesamiento'},
            {id: 6, label: 'Concentrado'}
        ];
        var pipeHtml = steps.map(function(s) {
            return '<button type="button" class="ml-flow__chunk ml-flow__chunk--s' + s.id + '" data-step="' + s.id + '">' +
                '<span class="ml-flow__lbl">' + esc(s.label) + '</span></button>';
        }).join('');
        shell.viewport.innerHTML =
            '<div class="ml-flow ml-flow--pro ml-flow--interactive">' +
            '<p class="ml-flow__instr">' + esc(t.flowInstruction || '') + '</p>' +
            '<div class="ml-flow__pipe" role="group" aria-label="Etapas del proceso">' + pipeHtml + '</div>' +
            '<div class="ml-flow__track" aria-hidden="true"><span class="ml-flow__track-fill"></span></div>' +
            '<p class="ml-flow__seq"><span class="ml-flow__seq-lbl">' + esc(t.flowSequence || '') + '</span> ' +
            '<span class="ml-flow__seq-dots"></span></p>' +
            '<button type="button" class="ml-btn ml-btn--sec ml-flow__reset" id="ml-flow-reset">' + esc(t.flowReset || '') + '</button>' +
            '<p class="ml-feedback" id="ml-flow-fb" role="status"></p></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<ol class="ml-flow__steps">' +
            '<li>Chancado primario / secundario</li>' +
            '<li>Molienda hasta liberación del mineral</li>' +
            '<li>Acondicionamiento de la pulpa (pH, reactivos)</li>' +
            '<li>Flotación selectiva</li>' +
            '<li>Espesamiento y filtrado</li>' +
            '<li>Concentrado final y manejo de relaves</li>' +
            '</ol>' +
            '<p class="ml-flow__competency">' + esc(t.flowCompetencyHint || '') + '</p>' +
            '<p class="ml-note ml-note--warn">' + esc(t.conceptual) + '</p>';

        var nextExpected = 1;
        var seq = [];
        var chunks = shell.viewport.querySelectorAll('.ml-flow__chunk');
        var trackFill = shell.viewport.querySelector('.ml-flow__track-fill');
        var fb = shell.viewport.querySelector('#ml-flow-fb');
        var dots = shell.viewport.querySelector('.ml-flow__seq-dots');

        function updateDots() {
            dots.textContent = seq.length ? seq.join(' → ') : '—';
        }

        function resetFlow() {
            nextExpected = 1;
            seq = [];
            chunks.forEach(function(c) {
                c.classList.remove('ml-flow__chunk--done', 'ml-flow__chunk--err');
                c.disabled = false;
            });
            trackFill.style.width = '0%';
            fb.textContent = '';
            fb.className = 'ml-feedback';
            updateDots();
        }

        chunks.forEach(function(ch) {
            ch.addEventListener('click', function() {
                var step = parseInt(ch.getAttribute('data-step'), 10);
                if (ch.classList.contains('ml-flow__chunk--done')) {
                    return;
                }
                if (step === nextExpected) {
                    ch.classList.add('ml-flow__chunk--done');
                    seq.push(step);
                    nextExpected++;
                    trackFill.style.width = ((seq.length / 6) * 100) + '%';
                    updateDots();
                    if (seq.length === 6) {
                        fb.textContent = t.feedbackOk;
                        fb.className = 'ml-feedback ml-feedback--ok';
                        chunks.forEach(function(c) {
                            c.disabled = true;
                        });
                        setRootScore(100);
                    }
                } else {
                    ch.classList.add('ml-flow__chunk--err');
                    window.setTimeout(function() {
                        ch.classList.remove('ml-flow__chunk--err');
                    }, 450);
                    fb.textContent = t.feedbackRetry;
                    fb.className = 'ml-feedback ml-feedback--bad';
                }
            });
        });
        shell.viewport.querySelector('#ml-flow-reset').addEventListener('click', resetFlow);
        updateDots();
    }

    function mountSafetyModule(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        shell.viewport.innerHTML =
            '<div class="ml-safe ml-safe--pro">' +
            '<div class="ml-safe__visual" aria-hidden="true">' +
            '<div class="ml-safe__helmet"></div><div class="ml-safe__beam"></div></div></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-safe"></div>';

        var hs = shell.aside.querySelector('#ml-guided-safe');
        if (hs) {
            labpractices.mountGuidedSafety(hs, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function mountSurveyField(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        shell.viewport.innerHTML =
            '<div class="ml-survey ml-survey--pro">' +
            '<svg class="ml-survey__svg" viewBox="0 0 400 220">' +
            '<defs><linearGradient id="mlsg" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#1a2332"/><stop offset="100%" stop-color="#0a0e14"/></linearGradient></defs>' +
            '<rect width="400" height="220" fill="url(#mlsg)"/>' +
            '<path class="ml-survey__path" d="M40 180 L200 40 L360 160" stroke="rgba(61,214,198,0.35)" stroke-width="2" fill="none"/>' +
            '<circle cx="200" cy="40" r="7" fill="#3dd6c6" class="ml-survey__pulse"/>' +
            '<text x="212" y="44" fill="#8b98ab" font-size="11">P</text>' +
            '</svg></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-survey"></div>' +
            '<p class="ml-survey__lab">Replanteo (visual): acimut (°)</p>' +
            '<input type="range" min="0" max="90" value="45" class="ml-survey__r"/>' +
            '<p class="ml-survey__out">Azimut: <span class="ml-survey__val">45</span>°</p>';
        var r = shell.aside.querySelector('.ml-survey__r');
        var v = shell.aside.querySelector('.ml-survey__val');
        r.addEventListener('input', function() {
            v.textContent = r.value;
        });
        var hsv = shell.aside.querySelector('#ml-guided-survey');
        if (hsv) {
            labpractices.mountGuidedSurvey(hsv, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function mountVentShaft(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        var theme = labui.themeFromKey(cfg.activityKey);
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-vent"></div>' +
            '<label class="ml-ventlab">Caudal Q en escena (relativo %) ' +
            '<input type="range" min="10" max="100" value="55" id="ml-vent-r"/></label>' +
            '<p class="ml-note ml-note--warn">' + esc(t.conceptual) + '</p>';

        if (!THREE) {
            shell.viewport.innerHTML = '<div class="ml-fallback">Three.js no cargó</div>';
            return;
        }
        scenes3d.mountVent(shell.viewport, activity, theme, THREE);

        var hv = shell.aside.querySelector('#ml-guided-vent');
        if (hv) {
            labpractices.mountGuidedVent(hv, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function mountOfficeSim(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        shell.viewport.innerHTML = '<div class="ml-office__viz"></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-office">' +
            '<div class="ml-office__card">' +
            '<h4>' + esc(t.officeSensitivityTitle || '') + '</h4>' +
            '<p class="ml-office__sub">' + esc(t.officeSensitivityBlurb || '') + '</p>' +
            '<div class="ml-office__inputs">' +
            '<label>Inversión inicial (MUSD)<input type="number" value="120" id="ml-inv" min="0" step="1"/></label>' +
            '<label>Tasa descuento anual %<input type="number" value="10" id="ml-rate" min="0" max="40" step="0.5"/></label>' +
            '<label>Horizonte (años)<input type="number" value="8" id="ml-years" min="3" max="20" step="1"/></label>' +
            '</div>' +
            '<p class="ml-office__npv" id="ml-office-npv" aria-live="polite"></p>' +
            '<p class="ml-office__hint">Modelo didáctico: flujo anual constante ≈ 11 % de la inversión (solo exploración de sensibilidad).</p>' +
            '</div></div>' +
            '<div class="ml-guided-host" id="ml-guided-office"></div>';

        function officeNpv() {
            var inv = parseFloat(shell.aside.querySelector('#ml-inv').value) || 0;
            var rate = (parseFloat(shell.aside.querySelector('#ml-rate').value) || 10) / 100;
            var years = parseInt(shell.aside.querySelector('#ml-years').value, 10) || 8;
            var cf = inv * 0.11;
            var npv = -inv;
            var y;
            for (y = 1; y <= years; y++) {
                npv += cf / Math.pow(1 + rate, y);
            }
            var el = shell.aside.querySelector('#ml-office-npv');
            el.innerHTML = '<strong>VPN indicativa:</strong> ' + npv.toFixed(2) +
                ' MUSD &nbsp;·&nbsp; <span class="ml-office__irr-hint">A mayor tasa, menor VPN.</span>';
        }
        ['#ml-inv', '#ml-rate', '#ml-years'].forEach(function(sel) {
            shell.aside.querySelector(sel).addEventListener('input', officeNpv);
        });
        officeNpv();
        var ho = shell.aside.querySelector('#ml-guided-office');
        if (ho) {
            labpractices.mountGuidedOffice(ho, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function mountEnglishMine(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        shell.viewport.innerHTML =
            '<div class="ml-en ml-en--pro">' +
            '<div class="ml-en__hud">' +
            '<span class="ml-en__tag">PIT RADIO · CH</span>' +
            '<span class="ml-en__time">06:45</span>' +
            '</div>' +
            '<div class="ml-en__body">' +
            '<p class="ml-en__prompt">' + esc(t.englishHudPrompt || '') + '</p>' +
            '</div></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-en"></div>';
        var he = shell.aside.querySelector('#ml-guided-en');
        if (he) {
            labpractices.mountGuidedEnglish(he, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function mountDrillSite(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        shell.viewport.innerHTML =
            '<canvas class="ml-drill__cv" id="ml-drill-cv" width="560" height="280"></canvas>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-drill"></div>' +
            '<p class="ml-note ml-note--warn">' + esc(t.conceptual) + '</p>';
        var hd = shell.aside.querySelector('#ml-guided-drill');
        if (hd) {
            labpractices.mountGuidedDrill(hd, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
        var cv = shell.viewport.querySelector('#ml-drill-cv');
        var ctx = cv.getContext('2d');
        var x = 0;
        var run = true;
        var rafId = 0;

        function draw() {
            if (!run || !cv.isConnected) {
                return;
            }
            var grd = ctx.createLinearGradient(0, 0, 0, 280);
            grd.addColorStop(0, '#121a24');
            grd.addColorStop(1, '#070a0e');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 560, 280);
            ctx.strokeStyle = 'rgba(244,162,58,0.35)';
            var i;
            for (i = 0; i < 10; i++) {
                ctx.beginPath();
                ctx.moveTo(30 + i * 52 + (x % 52), 220);
                ctx.lineTo(42 + i * 52 + (x % 52), 50);
                ctx.stroke();
            }
            x += 1.1;
            ctx.fillStyle = '#3dd6c6';
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(61,214,198,0.5)';
            ctx.fillRect(250, 110, 48, 90);
            ctx.shadowBlur = 0;
            rafId = requestAnimationFrame(draw);
        }
        rafId = requestAnimationFrame(draw);
    }

    function thesisShuffleOrder(key) {
        var perms = [
            [2, 4, 1, 3],
            [3, 1, 4, 2],
            [4, 2, 3, 1],
            [2, 1, 4, 3]
        ];
        var h = labui.hashActivityKey(key || '');
        return perms[Math.abs(h) % perms.length];
    }

    function mountThesisLab(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        shell.viewport.innerHTML =
            '<div class="ml-thesis ml-thesis--pro">' +
            '<ul class="ml-thesis__list" id="ml-thesis-ul">' +
            '<li draggable="true" data-n="1">Pregunta de investigación</li>' +
            '<li draggable="true" data-n="2">Marco teórico</li>' +
            '<li draggable="true" data-n="3">Metodología</li>' +
            '<li draggable="true" data-n="4">Resultados esperados</li>' +
            '</ul></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<p class="ml-thesis__hint">' + esc(t.thesisHint || '') + '</p>' +
            '<button type="button" class="ml-btn" id="ml-thesis-check">' + esc(t.thesisCheck || '') + '</button>' +
            '<p class="ml-feedback" id="ml-thesis-fb" role="status"></p>';

        var ul = shell.viewport.querySelector('#ml-thesis-ul');
        var order = thesisShuffleOrder(cfg.activityKey);
        var map = {};
        ul.querySelectorAll('li').forEach(function(li) {
            map[li.getAttribute('data-n')] = li;
        });
        order.forEach(function(n) {
            ul.appendChild(map[String(n)]);
        });

        var dragEl = null;
        ul.querySelectorAll('li').forEach(function(li) {
            li.addEventListener('dragstart', function(e) {
                dragEl = li;
                li.classList.add('ml-thesis__drag');
                e.dataTransfer.setData('text/plain', li.getAttribute('data-n'));
                e.dataTransfer.effectAllowed = 'move';
            });
            li.addEventListener('dragend', function() {
                li.classList.remove('ml-thesis__drag');
                dragEl = null;
            });
            li.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!dragEl || dragEl === li) {
                    return;
                }
                var rect = li.getBoundingClientRect();
                var mid = rect.top + rect.height / 2;
                if (e.clientY < mid) {
                    ul.insertBefore(dragEl, li);
                } else {
                    ul.insertBefore(dragEl, li.nextSibling);
                }
            });
        });

        shell.aside.querySelector('#ml-thesis-check').addEventListener('click', function() {
            var items = ul.querySelectorAll('li');
            var ok = true;
            items.forEach(function(li, idx) {
                if (parseInt(li.getAttribute('data-n'), 10) !== idx + 1) {
                    ok = false;
                }
            });
            var fb = shell.aside.querySelector('#ml-thesis-fb');
            fb.textContent = ok ? t.feedbackOk : t.feedbackRetry;
            fb.className = 'ml-feedback ' + (ok ? 'ml-feedback--ok' : 'ml-feedback--bad');
            if (ok) {
                setRootScore(100);
            }
        });
    }

    function mountInnovationBoard(container, activity, t, cfg) {
        var shell = openShell(container, activity, cfg);
        shell.viewport.innerHTML =
            '<div class="ml-innov ml-innov--pro">' +
            '<div class="ml-innov__stickies">' +
            '<div class="ml-innov__s">I+D en sensor de polvo</div>' +
            '<div class="ml-innov__s ml-innov__s--2">Economía circular de relaves</div>' +
            '<div class="ml-innov__s ml-innov__s--3">Automatización de perforación</div>' +
            '</div></div>';
        shell.aside.innerHTML =
            panelHtml(activity.title, activity.summary, '', activity, t) +
            '<div class="ml-guided-host" id="ml-guided-innov"></div>';
        var hi = shell.aside.querySelector('#ml-guided-innov');
        if (hi) {
            labpractices.mountGuidedInnovation(hi, activity, cfg, {
                esc: esc,
                strings: t,
                setPracticeProgress: setPracticeProgress,
                setRootScore: setRootScore,
                activityKey: cfg.activityKey,
                activity: activity
            });
        }
    }

    function setRootScore(val) {
        var app = document.getElementById('minaslab-root');
        if (app) {
            app.dataset.mlScore = String(val);
        }
        window.setTimeout(function() {
            var r = document.querySelector('.ml-progress-foot__range');
            var p = document.querySelector('.ml-progress-foot__pct');
            if (r && val >= 100) {
                r.value = '100';
                if (p) {
                    p.textContent = '100';
                }
            }
        }, 50);
    }

    function injectProgressFooter(stageRoot, cfg) {
        var t = cfg.strings || {};
        var gm = typeof cfg.grademax === 'number' ? cfg.grademax : parseFloat(cfg.grademax) || 0;
        var footer = document.createElement('div');
        footer.className = 'ml-progress-foot';
        footer.innerHTML =
            '<div class="ml-progress-foot__inner">' +
            '<label class="ml-progress-foot__lab">' + esc(t.progressLabel) +
            ' <span class="ml-progress-foot__pct">0</span>%</label>' +
            '<input type="range" min="0" max="100" value="0" class="ml-progress-foot__range" aria-valuetext="0%"/>' +
            '<div class="ml-progress-foot__actions">' +
            '<button type="button" class="ml-btn ml-btn--sec" id="ml-pr-save">' + esc(t.progressSave) + '</button>' +
            '<button type="button" class="ml-btn" id="ml-pr-final">' + esc(t.progressFinal) + '</button>' +
            '</div>' +
            '<p class="ml-progress-foot__status" id="ml-pr-status" role="status"></p>' +
            '</div>';

        stageRoot.appendChild(footer);

        var range = footer.querySelector('.ml-progress-foot__range');
        var pct = footer.querySelector('.ml-progress-foot__pct');
        var status = footer.querySelector('#ml-pr-status');
        var btnSave = footer.querySelector('#ml-pr-save');
        var btnFinal = footer.querySelector('#ml-pr-final');

        if (gm <= 0) {
            btnFinal.disabled = true;
            status.textContent = t.progressNoGrade || '';
        }

        function api(action, extra) {
            var fd = new FormData();
            fd.append('sesskey', cfg.sesskey);
            fd.append('cmid', String(cfg.cmid));
            fd.append('action', action);
            if (extra) {
                Object.keys(extra).forEach(function(k) {
                    fd.append(k, extra[k]);
                });
            }
            return fetch(cfg.wwwroot + '/mod/minaslab/ajax.php', {
                method: 'POST',
                body: fd,
                credentials: 'same-origin'
            }).then(function(r) {
                return r.json();
            });
        }

        function readSliderScore() {
            var s = parseInt(range.value, 10);
            if (gm > 0) {
                return (s / 100) * gm;
            }
            return null;
        }

        function syncPct() {
            pct.textContent = range.value;
            range.setAttribute('aria-valuetext', range.value + '%');
        }

        range.addEventListener('input', syncPct);

        api('get_state').then(function(data) {
            if (data.progress && data.progress.scoreDraft !== undefined) {
                range.value = String(Math.min(100, Math.max(0, data.progress.scoreDraft)));
            }
            if (data.completed) {
                status.textContent = t.progressDone || '';
                btnFinal.disabled = true;
                range.disabled = true;
            }
            syncPct();
        }).catch(function() {
            status.textContent = '';
        });

        btnSave.addEventListener('click', function() {
            var prog = {
                archetype: cfg.activity.archetype,
                scoreDraft: parseInt(range.value, 10),
                steps: ['saved']
            };
            api('save_state', {
                progress: JSON.stringify(prog),
                finalize: '0'
            }).then(function() {
                status.textContent = '✓';
            });
        });

        btnFinal.addEventListener('click', function() {
            if (gm <= 0) {
                return;
            }
            var prog = {
                archetype: cfg.activity.archetype,
                scoreDraft: parseInt(range.value, 10),
                steps: ['final']
            };
            var score = readSliderScore();
            api('save_state', {
                progress: JSON.stringify(prog),
                finalize: '1',
                score: String(score)
            }).then(function(res) {
                if (res.ok) {
                    status.textContent = t.progressDone || '';
                    btnFinal.disabled = true;
                    range.disabled = true;
                }
            });
        });
    }

    function route(container, activity, t, cfg) {
        var type = activity.archetype || 'math_mine';
        var map = {
            tunnel_3d: mountTunnel3d,
            pit_3d: mountPit3d,
            math_mine: mountMathMine,
            flow_process: mountFlowProcess,
            safety_module: mountSafetyModule,
            survey_field: mountSurveyField,
            vent_shaft: mountVentShaft,
            office_sim: mountOfficeSim,
            english_mine: mountEnglishMine,
            drill_site: mountDrillSite,
            thesis_lab: mountThesisLab,
            innovation_board: mountInnovationBoard
        };
        var fn = map[type] || mountMathMine;
        fn(container, activity, t, cfg);
    }

    function init(cfg) {
        var root = document.getElementById('minaslab-stage');
        if (!root || !cfg) {
            return;
        }
        var bootEl = document.getElementById('minaslab-bootstrap-json');
        if (bootEl && bootEl.textContent) {
            try {
                var extra = JSON.parse(bootEl.textContent);
                cfg = Object.assign({}, cfg, extra);
            } catch (e) {
                // Si falla el JSON, seguir solo con cfg mínimo.
            }
        }
        if (!cfg.activity) {
            return;
        }
        root.innerHTML = '';

        var t = cfg.strings || {};
        var act = cfg.activity;
        act.title = act.title || '';
        act.summary = act.summary || '';
        act.subject_name = act.subject_name || '';
        act.archetype = act.archetype || 'math_mine';

        function afterRoute() {
            route(root, act, t, cfg);
            injectProgressFooter(root, cfg);
        }

        var need3d = ['tunnel_3d', 'pit_3d', 'vent_shaft'].indexOf(act.archetype) >= 0;
        if (need3d) {
            ensureThree(cfg, afterRoute);
        } else {
            afterRoute();
        }
    }

    return {init: init};
});
