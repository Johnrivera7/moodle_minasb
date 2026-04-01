// MinasLab — prácticas guiadas por actividad (ejecutar, no solo observar): pasos, progreso, calificación.
define([], function() {
    'use strict';

    function hashActivityKey(key) {
        var h = 5381;
        var i;
        key = key || '';
        for (i = 0; i < key.length; i++) {
            h = ((h << 5) + h) + key.charCodeAt(i);
            h = h | 0;
        }
        return Math.abs(h);
    }

    /** Ancho de berma didáctico (m) alineado con el paso slider del tajo (misma semilla que la actividad). */
    function getPitBermRefMeters(key) {
        return 8 + (hashActivityKey(key || '') % 7);
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

    function shuffleOrder(n, seed) {
        var a = [];
        var i;
        for (i = 0; i < n; i++) {
            a.push(i);
        }
        var s = seed % 9973;
        for (i = n - 1; i > 0; i--) {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            var j = s % (i + 1);
            var t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    /**
     * Renderiza pasos secuenciales: checklist, orden, numérico, opción múltiple.
     */
    function renderGuidedPractice(container, steps, helpers) {
        var t = helpers.strings || {};
        var done = 0;
        var n = Math.max(1, steps.length);
        var root = document.createElement('div');
        root.className = 'ml-guided';
        root.innerHTML =
            '<p class="ml-guided__kicker">' + esc(t.practiceKicker || '') + '</p>' +
            '<div class="ml-guided__progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="0">' +
            '<span class="ml-guided__fill" style="width:0%"></span></div>' +
            '<div class="ml-guided__body"></div>' +
            '<p class="ml-feedback ml-guided__fb" role="status"></p>';
        container.appendChild(root);
        var body = root.querySelector('.ml-guided__body');
        var fill = root.querySelector('.ml-guided__fill');
        var fb = root.querySelector('.ml-guided__fb');
        var prog = root.querySelector('.ml-guided__progress');
        var kickerEl = root.querySelector('.ml-guided__kicker');
        if (kickerEl && helpers.activity && helpers.activity.profile && helpers.activity.profile.length) {
            var tag = document.createElement('span');
            tag.className = 'ml-guided__profile-tag';
            tag.textContent = ' · Perfil: ' + helpers.activity.profile.map(function(x) {
                return 'C' + parseInt(x, 10);
            }).join(', ');
            kickerEl.appendChild(tag);
        }

        function syncBar() {
            var frac = done / n;
            fill.style.width = (frac * 100) + '%';
            prog.setAttribute('aria-valuenow', String(done));
            helpers.setPracticeProgress(Math.round(frac * 100));
        }

        function completeAll() {
            fb.textContent = t.feedbackOk || '';
            fb.className = 'ml-feedback ml-feedback--ok ml-guided__fb';
            helpers.setPracticeProgress(100);
            helpers.setRootScore(100);
        }

        function nextStep() {
            done++;
            syncBar();
            if (done >= n) {
                completeAll();
                return;
            }
            renderOne();
        }

        function bad(msg) {
            fb.textContent = msg || t.feedbackRetry || '';
            fb.className = 'ml-feedback ml-feedback--bad ml-guided__fb';
        }

        function clearFb() {
            fb.textContent = '';
            fb.className = 'ml-feedback ml-guided__fb';
        }

        function renderOne() {
            clearFb();
            body.innerHTML = '';
            var step = steps[done];
            if (!step) {
                return;
            }
            var h4 = document.createElement('h4');
            h4.className = 'ml-guided__step-title';
            h4.textContent = step.title || '';
            body.appendChild(h4);

            if (step.type === 'checklist') {
                var ul = document.createElement('div');
                ul.className = 'ml-guided__checks';
                step.items.forEach(function(it) {
                    var lab = document.createElement('label');
                    lab.className = 'ml-guided__check';
                    var inp = document.createElement('input');
                    inp.type = 'checkbox';
                    inp.setAttribute('data-ok', it.ok ? '1' : '0');
                    lab.appendChild(inp);
                    lab.appendChild(document.createTextNode(' ' + it.label));
                    ul.appendChild(lab);
                });
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ml-btn';
                btn.textContent = t.check || 'Verificar';
                btn.addEventListener('click', function() {
                    var ok = true;
                    ul.querySelectorAll('input[type="checkbox"]').forEach(function(inp) {
                        var want = inp.getAttribute('data-ok') === '1';
                        if (inp.checked !== want) {
                            ok = false;
                        }
                    });
                    if (ok) {
                        nextStep();
                    } else {
                        bad();
                    }
                });
                body.appendChild(ul);
                body.appendChild(btn);
            } else if (step.type === 'order') {
                if (step.introLangKey && t[step.introLangKey]) {
                    var introP = document.createElement('p');
                    introP.className = 'ml-guided__text';
                    introP.innerHTML = t[step.introLangKey];
                    body.appendChild(introP);
                }
                var seq = step.correctSeq || [0, 1, 2, 3];
                var labels = step.labels || [];
                var shuf = shuffleOrder(labels.length, hashActivityKey(helpers.activityKey || 'x'));
                var wrap = document.createElement('div');
                wrap.className = 'ml-guided__order';
                var expected = 0;
                shuf.forEach(function(idx) {
                    var b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'ml-btn ml-btn--sec ml-guided__ord-btn';
                    b.textContent = labels[idx];
                    b.setAttribute('data-idx', String(idx));
                    b.addEventListener('click', function() {
                        var di = parseInt(b.getAttribute('data-idx'), 10);
                        if (di === seq[expected]) {
                            b.classList.add('ml-guided__ord-btn--ok');
                            b.disabled = true;
                            expected++;
                            if (expected >= seq.length) {
                                nextStep();
                            }
                        } else {
                            b.classList.add('ml-guided__ord-btn--bad');
                            window.setTimeout(function() {
                                b.classList.remove('ml-guided__ord-btn--bad');
                            }, 400);
                            bad();
                        }
                    });
                    wrap.appendChild(b);
                });
                var hint = document.createElement('p');
                hint.className = 'ml-guided__hint';
                hint.textContent = t.practiceOrderHint || '';
                body.appendChild(wrap);
                body.appendChild(hint);
            } else if (step.type === 'numeric') {
                var p = document.createElement('p');
                p.className = 'ml-guided__text';
                p.innerHTML = step.text || '';
                var inp = document.createElement('input');
                inp.type = 'number';
                inp.className = 'ml-quiz__in';
                inp.setAttribute('aria-label', 'Respuesta');
                var btn2 = document.createElement('button');
                btn2.type = 'button';
                btn2.className = 'ml-btn';
                btn2.textContent = t.check || 'Verificar';
                btn2.addEventListener('click', function() {
                    var v = parseFloat(inp.value);
                    if (Math.abs(v - step.answer) < (step.tolerance != null ? step.tolerance : 0.51)) {
                        nextStep();
                    } else {
                        bad();
                    }
                });
                body.appendChild(p);
                body.appendChild(inp);
                body.appendChild(btn2);
            } else if (step.type === 'mc') {
                var pq = document.createElement('p');
                pq.className = 'ml-guided__text';
                pq.textContent = step.q || '';
                body.appendChild(pq);
                var opts = step.options || [];
                var og = document.createElement('div');
                og.className = 'ml-guided__mc';
                opts.forEach(function(opt, oi) {
                    var lab = document.createElement('label');
                    lab.className = 'ml-guided__mc-opt';
                    var r = document.createElement('input');
                    r.type = 'radio';
                    r.name = 'ml-mc';
                    r.value = String(oi);
                    lab.appendChild(r);
                    lab.appendChild(document.createTextNode(' ' + opt));
                    og.appendChild(lab);
                });
                var btn3 = document.createElement('button');
                btn3.type = 'button';
                btn3.className = 'ml-btn';
                btn3.textContent = t.check || 'Verificar';
                btn3.addEventListener('click', function() {
                    var sel = og.querySelector('input[name="ml-mc"]:checked');
                    if (!sel) {
                        bad();
                        return;
                    }
                    if (parseInt(sel.value, 10) === step.correct) {
                        nextStep();
                    } else {
                        bad();
                    }
                });
                body.appendChild(og);
                body.appendChild(btn3);
            } else if (step.type === 'slider') {
                var sp = document.createElement('p');
                sp.className = 'ml-guided__text';
                sp.innerHTML = step.text || '';
                body.appendChild(sp);
                var sliderWrap = document.createElement('div');
                sliderWrap.className = 'ml-guided__slider';
                var rng = document.createElement('input');
                rng.type = 'range';
                rng.min = String(step.min != null ? step.min : 0);
                rng.max = String(step.max != null ? step.max : 100);
                rng.step = String(step.step != null ? step.step : 1);
                rng.value = String(step.start != null ? step.start : step.min);
                rng.setAttribute('aria-valuemin', rng.min);
                rng.setAttribute('aria-valuemax', rng.max);
                var valOut = document.createElement('span');
                valOut.className = 'ml-guided__slider-val';
                function syncSliderOut() {
                    var u = step.unit || '';
                    var suf = step.suffix || '';
                    valOut.textContent = (u ? u + ': ' : '') + rng.value + (suf ? ' ' + suf : '');
                }
                syncSliderOut();
                rng.addEventListener('input', syncSliderOut);
                sliderWrap.appendChild(rng);
                sliderWrap.appendChild(valOut);
                body.appendChild(sliderWrap);
                var btnSl = document.createElement('button');
                btnSl.type = 'button';
                btnSl.className = 'ml-btn';
                btnSl.textContent = t.check || 'Verificar';
                btnSl.addEventListener('click', function() {
                    var v = parseFloat(rng.value);
                    var tol = step.tolerance != null ? step.tolerance : 0.51;
                    if (Math.abs(v - step.target) <= tol) {
                        nextStep();
                    } else {
                        bad(step.hintWrong);
                    }
                });
                body.appendChild(btnSl);
            }
        }

        syncBar();
        renderOne();
    }

    function det2FromKey(key) {
        var h = hashActivityKey(key);
        var a = 2 + (h % 5);
        var b = 1 + ((h >> 3) % 4);
        var c = -1 + ((h >> 5) % 5);
        var d = 2 + ((h >> 7) % 4);
        return {a: a, b: b, c: c, d: d, det: a * d - b * c};
    }

    function buildTunnelSteps(activity, cfg) {
        var key = cfg.activityKey || '';
        var h = hashActivityKey(key);
        if (key === 's1_algebra_a') {
            var m = det2FromKey(key);
            return [
                {
                    type: 'numeric',
                    title: 'Paso 1 · Matriz 2×2 en el frente (vincula con la escena 3D)',
                    text: 'Los cuatro barrenos resaltados corresponden a los coeficientes <strong>[[' + m.a + ',' + m.b + '],[' +
                        m.c + ',' + m.d + ']]</strong>. Calcula el determinante (ad − bc).',
                    answer: m.det,
                    tolerance: 0.01
                },
                {
                    type: 'order',
                    title: 'Paso 2 · Secuencia real de voladura (orden de faena)',
                    labels: ['Perforar según malla', 'Cargar explosivo', 'Conectar malla de tierra', 'Disparo autorizado'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Modelo matemático vs campo',
                    q: '¿Qué representa el determinante distinto de cero en un sistema 2×2 de planificación?',
                    options: [
                        'Que el sistema tiene solución única (útil para ajustar cargas sin contradicción)',
                        'Que la voladura no necesita permiso',
                        'Que el túnel no requiere ventilación'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's1_bases_ops_a') {
            return [
                {
                    type: 'checklist',
                    title: 'Paso 1 · Condiciones antes de avanzar (DS 132 / faena)',
                    items: [
                        {label: 'Iluminación adecuada en el tramo', ok: true},
                        {label: 'Señalética visible y legible', ok: true},
                        {label: 'Ignorar el plan de ventilación si “se ve claro”', ok: false}
                    ]
                },
                {
                    type: 'order',
                    title: 'Paso 2 · Orden lógico de inspección',
                    labels: ['Evaluar ventilación y polvo', 'Verificar señales y rutas', 'Confirmar permiso/ATS', 'Avanzar al frente'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Criterio de seguridad',
                    q: '¿Cuál es un factor de riesgo típico en galería?',
                    options: [
                        'Caída de roca, inadequate sostenimiento o mala señalética',
                        'Únicamente el color del mineral',
                        'La hora del almuerzo del supervisor'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's2_geo_est_a') {
            return [
                {
                    type: 'order',
                    title: 'Paso 1 · Trabajo de campo en macizo',
                    labels: ['Reconocer estructuras en el techo/pared', 'Medir rumbo/inclinación', 'Registrar en plano/boleta', 'Interpretar continuidad'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'numeric',
                    title: 'Paso 2 · Lectura rápida',
                    text: 'Si registras ' + (3 + (h % 4)) + ' estructuras y ' + (2 + (h % 3)) +
                        ' fallas en el mismo tramo, ¿cuántos elementos distintos llevas en el registro?',
                    answer: (3 + (h % 4)) + (2 + (h % 3)),
                    tolerance: 0.01
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Concepto',
                    q: 'Un pliegue y una falla en el mismo tramo implican…',
                    options: [
                        'Registrar geometría y posible zona de debilidad',
                        'Que el mineral siempre es de alta ley',
                        'Que no hace falta mapear'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's2_res_mat_b') {
            var L = 4 + (h % 4);
            var w = 2 + (h % 3);
            return [
                {
                    type: 'numeric',
                    title: 'Paso 1 · Pasarela (orden de magnitud)',
                    text: 'Una viga simplificada de ' + L + ' m de luz lleva una carga uniforme w = ' + w +
                        ' kN/m (ejercicio didáctico). ¿Reacción vertical en un apoyo simplemente apoyada (kN)?',
                    answer: (L * w) / 2,
                    tolerance: 0.51
                },
                {
                    type: 'mc',
                    title: 'Paso 2 · Criterio',
                    q: 'En galería, ¿qué refuerza la lectura de esfuerzos en sostenimiento?',
                    options: [
                        'Conocer cargas y geometría de apoyos',
                        'Solo el color de la pintura',
                        'Evitar cualquier cálculo'
                    ],
                    correct: 0
                },
                {
                    type: 'order',
                    title: 'Paso 3 · Secuencia de verificación',
                    labels: ['Identificar cargas', 'Modelo o esquema estático', 'Revisar dimensionado / FS', 'Registrar en inspección'],
                    correctSeq: [0, 1, 2, 3]
                }
            ];
        }
        if (key === 's3_mec_rocas_a' || key === 's3_mec_rocas_b') {
            return [
                {
                    type: 'checklist',
                    title: 'Paso 1 · Antes de estimar esfuerzos en arco/pilar',
                    items: [
                        {label: 'Geometría del excavación acotada', ok: true},
                        {label: 'Propiedades de la roca consideradas', ok: true},
                        {label: 'Asumir siempre roca perfecta sin fisuras', ok: false}
                    ]
                },
                {
                    type: 'order',
                    title: 'Paso 2 · Lógica de sostenimiento',
                    labels: ['Caracterizar macizo', 'Elegir sistema de soporte', 'Instalar y monitorear', 'Ajustar según deformaciones'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Rocas y túnel',
                    q: 'Un arco de excavación falla principalmente por…',
                    options: [
                        'Compresión/tensión concentrada y bloques inestables',
                        'Solo temperatura ambiente',
                        'Color del casco del operador'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's3_exp_sub_a') {
            return [
                {
                    type: 'order',
                    title: 'Paso 1 · Secuencia típica de extracción (conceptual)',
                    labels: ['Preparar nivel y accesos', 'Extraer mineral por panel/hundimiento', 'Relleno o soporte del vacío', 'Control de estabilidad'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'mc',
                    title: 'Paso 2 · Método',
                    q: 'El relleno hidráulico busca principalmente…',
                    options: [
                        'Controlar el vacío y reducir riesgo de colapso',
                        'Aumentar la humedad del café',
                        'Eliminar la ventilación'
                    ],
                    correct: 0
                },
                {
                    type: 'numeric',
                    title: 'Paso 3 · Capacidad simple',
                    text: 'Si un frente mueve ' + (20 + (h % 15)) + ' t por turno en ' + (2 + (h % 2)) +
                        ' turnos, ¿toneladas en el día?',
                    answer: (20 + (h % 15)) * (2 + (h % 2)),
                    tolerance: 0.01
                }
            ];
        }
        if (key === 's3_exp_sub_b') {
            return [
                {
                    type: 'mc',
                    title: 'Paso 1 · Comparar métodos',
                    q: '¿Cuándo suele preferirse “cámara y pilar”?',
                    options: [
                        'Mineral más débil/techo que requiere dejar pilares',
                        'Siempre en vetas masivas profundas sin análisis',
                        'Nunca en minería metálica'
                    ],
                    correct: 0
                },
                {
                    type: 'order',
                    title: 'Paso 2 · Diseño',
                    labels: ['Dimensionar pilares', 'Definir panel de extracción', 'Planificar retiros', 'Monitorear estabilidad'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'checklist',
                    title: 'Paso 3 · Criterios',
                    items: [
                        {label: 'Evaluar esfuerzos en pilar', ok: true},
                        {label: 'Considerar fallas geológicas', ok: true},
                        {label: 'Ignorar sismología local', ok: false}
                    ]
                }
            ];
        }
        if (key === 's5_serv_min_a') {
            return [
                {
                    type: 'order',
                    title: 'Paso 1 · Red de agua en mina',
                    labels: ['Captación / sumidero', 'Estación de bombeo', 'Impulsión en conductos', 'Vertimiento controlado'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'numeric',
                    title: 'Paso 2 · Caudal (ejercicio)',
                    text: 'Si bombeas ' + (100 + (h % 50)) + ' m³/h durante ' + (4 + (h % 4)) +
                        ' h, ¿volumen bombeado (m³)?',
                    answer: (100 + (h % 50)) * (4 + (h % 4)),
                    tolerance: 0.01
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Riesgo',
                    q: '¿Por qué documentar estaciones de bombeo?',
                    options: [
                        'Mantenimiento, energía y seguridad ante inundación',
                        'Solo por estética del informe',
                        'No es necesario en faena'
                    ],
                    correct: 0
                }
            ];
        }
        return [
            {
                type: 'checklist',
                title: 'Paso 1 · Ingreso a escenario subterráneo',
                items: [
                    {label: 'Casco y lámpara considerados en el recorrido', ok: true},
                    {label: 'Ruta y salida identificadas', ok: true},
                    {label: 'Avanzar apagando señales de emergencia', ok: false}
                ]
            },
            {
                type: 'order',
                title: 'Paso 2 · Orden de trabajo seguro',
                labels: ['Observar', 'Identificar riesgo', 'Aplicar control', 'Registrar'],
                correctSeq: [0, 1, 2, 3]
            },
            {
                type: 'numeric',
                title: 'Paso 3 · Conteo',
                text: 'Cuenta mentalmente: si hay ' + (4 + (h % 5)) + ' durmientes visibles por lado en un tramo simétrico, ¿total de durmientes?',
                answer: (4 + (h % 5)) * 2,
                tolerance: 0.01
            }
        ];
    }

    function buildPitSteps(activity, cfg) {
        var key = cfg.activityKey || '';
        var h = hashActivityKey(key);
        if (key === 's1_bases_ops_b') {
            return [
                {
                    type: 'order',
                    title: 'Paso 1 · Ciclo de mina a cielo abierto',
                    introLangKey: 'practiceCycleOrderIntro',
                    labels: ['Perforación', 'Carguío (explosivos)', 'Carga y transporte', 'Acopio / botadero'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'numeric',
                    title: 'Paso 2 · Producción (orden de magnitud)',
                    text: 'Si un camión lleva ' + (180 + (h % 40)) + ' t útiles por viaje y haces ' + (3 + (h % 4)) +
                        ' viajes en el turno, ¿toneladas movidas en el turno?',
                    answer: (180 + (h % 40)) * (3 + (h % 4)),
                    tolerance: 0.51
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Seguridad en rajo',
                    q: '¿Qué controla mejor el riesgo de caída de roca en borde?',
                    options: [
                        'Berma, drenaje y distancia al borde',
                        'Solo pintar de amarillo sin medidas',
                        'Aumentar la velocidad en curva'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's1_bases_ops_c') {
            return [
                {
                    type: 'checklist',
                    title: 'Paso 1 · Cierre de faena (conceptual)',
                    items: [
                        {label: 'Inventario de pasivos ambientales', ok: true},
                        {label: 'Plan de revegetación / estabilidad', ok: true},
                        {label: 'Abandonar sin informar a autoridad', ok: false}
                    ]
                },
                {
                    type: 'order',
                    title: 'Paso 2 · Secuencia de cierre',
                    labels: ['Diagnóstico', 'Diseño de medidas', 'Ejecución', 'Monitoreo post-cierre'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Perfil de egreso',
                    q: 'El cierre de mina busca principalmente…',
                    options: [
                        'Reducir riesgos ambientales y sociales a largo plazo',
                        'Solo retirar maquinaria sin estudio',
                        'Evitar cualquier monitoreo'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's2_geo_est_b' || key === 's2_geo_est_c') {
            return [
                {
                    type: 'mc',
                    title: 'Paso 1 · Talud y estructuras',
                    q: '¿Qué controla la estabilidad de un talud además de la roca?',
                    options: [
                        'Orientación de discontinuidades vs talud',
                        'Solo el color del suelo',
                        'El tamaño del logo de la empresa'
                    ],
                    correct: 0
                },
                {
                    type: 'numeric',
                    title: 'Paso 2 · Estimación',
                    text: 'Si mides ' + (2 + (h % 3)) + ' familias de discontinuidades y ' + (3 + (h % 4)) +
                        ' litologías en el mismo sector, ¿cuántos grupos distintos anotas?',
                    answer: (2 + (h % 3)) + (3 + (h % 4)),
                    tolerance: 0.01
                },
                {
                    type: 'order',
                    title: 'Paso 3 · Flujo de trabajo',
                    labels: ['Levantamiento estructural', 'Modelo 3D / secciones', 'Análisis de kinematismo', 'Recomendación de intervención'],
                    correctSeq: [0, 1, 2, 3]
                }
            ];
        }
        if (key === 's3_prosp_yac_a') {
            var mass = 100000 + (h % 50000);
            var gCu = 0.7 + (h % 12) / 10;
            var metalTon = Math.round(mass * gCu / 100);
            return [
                {
                    type: 'numeric',
                    title: 'Paso 1 · Bloque ficticio',
                    text: 'Un bloque de ' + mass + ' t con ley ' + gCu.toFixed(1) +
                        ' % Cu contiene ¿cuántas toneladas de cobre fino? (masa × ley / 100). Entero.',
                    answer: metalTon,
                    tolerance: 0.51
                },
                {
                    type: 'mc',
                    title: 'Paso 2 · Recursos',
                    q: '¿Qué diferencia recurso inferido de indicado?',
                    options: [
                        'Nivel de confianza en datos y muestreo',
                        'Solo el color del mapa',
                        'Nada, son sinónimos exactos'
                    ],
                    correct: 0
                },
                {
                    type: 'order',
                    title: 'Paso 3 · Flujo de estimación',
                    labels: ['Datos de sondaje', 'Modelo de bloques', 'Clasificación de recursos', 'Revisión independiente'],
                    correctSeq: [0, 1, 2, 3]
                }
            ];
        }
        if (key === 's4_exp_rajo_a') {
            var bermRef = getPitBermRefMeters(key);
            return [
                {
                    type: 'slider',
                    title: 'Paso 1 · Lectura frente al modelo 3D',
                    text: 'Ajusta el valor al <strong>ancho de berma de referencia (m)</strong> indicado bajo la vista 3D. ' +
                        'Usa la barra de herramientas del 3D (vistas ISO/planta/perfil, capas, medición) para contextualizar; luego comprobar.',
                    min: 5,
                    max: 18,
                    step: 0.5,
                    start: 11,
                    target: bermRef,
                    tolerance: 0.51,
                    unit: 'Valor',
                    suffix: 'm'
                },
                {
                    type: 'mc',
                    title: 'Paso 2 · Geometría del tajo',
                    q: 'La berma en un tajo sirve principalmente para…',
                    options: [
                        'Contener derrubios y dar plataforma segura',
                        'Aumentar la velocidad del viento',
                        'Eliminar el uso de rampa'
                    ],
                    correct: 0
                },
                {
                    type: 'order',
                    title: 'Paso 3 · Diseño',
                    labels: ['Definir geometría de banco', 'Ancho de rampa y pendiente', 'Drenaje', 'Revisión de estabilidad'],
                    correctSeq: [0, 1, 2, 3]
                }
            ];
        }
        if (key === 's4_exp_rajo_b') {
            return [
                {
                    type: 'order',
                    title: 'Paso 1 · Fases de explotación',
                    labels: ['Fase inicial (desbroce/acceso)', 'Fase intermedia', 'Profundización', 'Botadero interno/externo planificado'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'checklist',
                    title: 'Paso 2 · Planificación',
                    items: [
                        {label: 'Coordinar acceso de equipos por rampa', ok: true},
                        {label: 'Considerar estabilidad global del tajo', ok: true},
                        {label: 'Ignorar capacidad del botadero', ok: false}
                    ]
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Riesgo',
                    q: 'Un botadero interno mal ubicado puede…',
                    options: [
                        'Afectar estabilidad y drenaje',
                        'Mejorar siempre la ley del mineral',
                        'No tener efecto geotécnico'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's4_exp_rajo_c') {
            return [
                {
                    type: 'mc',
                    title: 'Paso 1 · Talud',
                    q: 'La monitorización de talud incluye típicamente…',
                    options: [
                        'Prismas, radars y piezómetros según caso',
                        'Solo mirar con binoculares una vez',
                        'Medir solo temperatura ambiente'
                    ],
                    correct: 0
                },
                {
                    type: 'numeric',
                    title: 'Paso 2 · Factor de seguridad (didáctico)',
                    text: 'Si resistencia disponible es ' + (1200 + (h % 200)) + ' kPa y actuante ' +
                        (400 + (h % 100)) + ' kPa, ¿FS aproximado (resistencia/actuante)?',
                    answer: Math.round((1200 + (h % 200)) / (400 + (h % 100)) * 10) / 10,
                    tolerance: 0.21
                },
                {
                    type: 'order',
                    title: 'Paso 3 · Gestión',
                    labels: ['Identificar modo de falla', 'Instrumentar', 'Umbral de alerta', 'Plan de mitigación'],
                    correctSeq: [0, 1, 2, 3]
                }
            ];
        }
        if (key === 's5_proy_min_a') {
            return [
                {
                    type: 'order',
                    title: 'Paso 1 · Vista integrada yacimiento–mina–planta',
                    labels: ['Yacimiento y método', 'Infraestructura mina', 'Procesos y logística', 'Cierre y post-cierre'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'checklist',
                    title: 'Paso 2 · Sostenibilidad',
                    items: [
                        {label: 'Considerar agua y energía', ok: true},
                        {label: 'Stakeholders y permisos', ok: true},
                        {label: 'Ignorar relaves', ok: false}
                    ]
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Proyecto minero',
                    q: 'Una integración 3D del proyecto ayuda a…',
                    options: [
                        'Comunicar y detectar interferencias entre disciplinas',
                        'Reemplazar normativa legal',
                        'Eliminar estudios de factibilidad'
                    ],
                    correct: 0
                }
            ];
        }
        return [
            {
                type: 'order',
                title: 'Paso 1 · Ciclo minero superficial',
                labels: ['Perforar', 'Cargar explosivo', 'Acarrear mineral', 'Depositar estéril'],
                correctSeq: [0, 1, 2, 3]
            },
            {
                type: 'numeric',
                title: 'Paso 2 · Cálculo rápido',
                text: '¿Cuántos viajes de ' + (50 + (h % 20)) + ' t se necesitan para mover ' +
                    (50 + (h % 20)) * (2 + (h % 5)) + ' t?',
                answer: 2 + (h % 5),
                tolerance: 0.01
            },
            {
                type: 'mc',
                title: 'Paso 3 · Seguridad',
                q: 'Distancia de seguridad en voladura en rajo depende de…',
                options: [
                    'Carga, geometría y condiciones meteorológicas (protocolo)',
                    'Solo del color del casco',
                    'Nunca de la norma'
                ],
                correct: 0
            }
        ];
    }

    function buildMathMineSteps(cfg) {
        var key = cfg.activityKey || '';
        var h = hashActivityKey(key);
        var a = 2 + (h % 14);
        var b = 1 + ((h >> 4) % 11);
        if (key === 's1_algebra_b') {
            var ang = [30, 45, 60][h % 3];
            return [
                {
                    type: 'order',
                    title: 'Paso 1 · Geometría del barreno',
                    labels: ['Definir plano de banco', 'Medir ángulo con horizontal', 'Proyectar sobre el plano', 'Documentar en croquis'],
                    correctSeq: [0, 1, 2, 3]
                },
                {
                    type: 'numeric',
                    title: 'Paso 2 · Trigonometría',
                    text: 'Un barreno forma ' + ang + '° con la horizontal. Si la proyección horizontal debe ser 10 m, ' +
                        '¿longitud aproximada del barreno L si cos(' + ang + '°)=horizontal/L? (L = 10 / cos en grados, redondea a entero m).',
                    answer: Math.round(10 / Math.cos(ang * Math.PI / 180)),
                    tolerance: 1.1
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Error común',
                    q: 'Si confundes seno y coseno del ángulo con el banco, ¿qué ocurre?',
                    options: [
                        'Errores de longitud y burden en el diseño',
                        'Mejora automática de la malla',
                        'No afecta el resultado'
                    ],
                    correct: 0
                }
            ];
        }
        if (key === 's1_algebra_c') {
            var re = 3 + (h % 4);
            var im = 1 + (h % 3);
            return [
                {
                    type: 'numeric',
                    title: 'Paso 1 · Números complejos (fasor)',
                    text: 'Suma (' + re + '+' + im + 'i) + (' + (re - 1) + '+' + (im + 1) + 'i). ¿Parte real del resultado?',
                    answer: re + (re - 1),
                    tolerance: 0.01
                },
                {
                    type: 'numeric',
                    title: 'Paso 2 · Parte imaginaria',
                    text: 'Misma suma: ¿parte imaginaria?',
                    answer: im + (im + 1),
                    tolerance: 0.01
                },
                {
                    type: 'mc',
                    title: 'Paso 3 · Motor / ventilador',
                    q: 'En análisis de arranque, los fasores permiten…',
                    options: [
                        'Sumar tensiones y corrientes en fase/amplitud',
                        'Eliminar la necesidad de normas',
                        'Medir peso del rotor sin datos'
                    ],
                    correct: 0
                }
            ];
        }
        return [
            {
                type: 'numeric',
                title: 'Paso 1 · Datos de turno (base de práctica, no producción real)',
                text: 'En un turno hay <strong>' + a + '</strong> viajes y luego <strong>' + b +
                    '</strong> adicionales. ¿Total de viajes?',
                answer: a + b,
                tolerance: 0.01
            },
            {
                type: 'mc',
                title: 'Paso 2 · De medición a decisión',
                q: '¿Para qué sirve un conteo consistente de viajes o toneladas en un bloque de datos?',
                options: [
                    'Estimar producción y detectar desviaciones respecto al plan',
                    'Solo llenar un formulario sin uso',
                    'Evitar el uso de camiones'
                ],
                correct: 0
            },
            {
                type: 'checklist',
                title: 'Paso 3 · Trazabilidad (sondeos / planta / faena)',
                items: [
                    {label: 'Registrar datos con hora, turno y origen del dato', ok: true},
                    {label: 'Validar con supervisor si hay anomalía', ok: true},
                    {label: 'Inventar números si falta un dato', ok: false}
                ]
            }
        ];
    }

    function buildVentSteps(activity, cfg) {
        var h = hashActivityKey(cfg.activityKey || '');
        var qtot = 80 + (h % 60);
        return [
            {
                type: 'order',
                title: 'Paso 1 · Red de ventilación (conceptual)',
                labels: ['Captación de aire fresco', 'Ventilador principal', 'Distribución a frentes', 'Retorno y control de fugas'],
                correctSeq: [0, 1, 2, 3]
            },
            {
                type: 'numeric',
                title: 'Paso 2 · Reparto de caudal',
                text: 'Si el ventilador entrega ' + qtot +
                    ' m³/s y hay dos ramales simétricos en paralelo con pérdidas similares, ¿m³/s por ramal (aprox.)?',
                answer: qtot / 2,
                tolerance: 0.51
            },
            {
                type: 'mc',
                title: 'Paso 3 · Polvo y gases',
                q: 'En el frente, ¿qué conjunto reduce mejor exposición a polvo y gases?',
                options: [
                    'Ventilación adecuada, rociado / extracción local y EPI según evaluación',
                    'Solo trabajar de espaldas al viento sin más medidas',
                    'Apagar el ventilador para ahorrar energía'
                ],
                correct: 0
            }
        ];
    }

    function buildSurveySteps(activity, cfg) {
        var h = hashActivityKey(cfg.activityKey || '');
        var dh = 5 + (h % 12);
        var dd = 20 + (h % 75);
        var pend = Math.round(dh / dd * 1000) / 10;
        return [
            {
                type: 'order',
                title: 'Paso 1 · Cadena de medición en campo',
                labels: ['Benchmark o punto conocido', 'Lectura de ángulos / distancias', 'Cálculo o compensación', 'Registro en cuaderno de campo'],
                correctSeq: [0, 1, 2, 3]
            },
            {
                type: 'numeric',
                title: 'Paso 2 · Pendiente entre puntos',
                text: 'Con Δh = ' + dh + ' m y distancia horizontal D = ' + dd +
                    ' m, ¿pendiente aproximada (%) = (Δh/D)×100? (un decimal)',
                answer: pend,
                tolerance: 0.25
            },
            {
                type: 'mc',
                title: 'Paso 3 · Trazabilidad (sondeos / polilíneas)',
                q: '¿Qué fortalece la calidad de un levantamiento vinculado a malla de sondeos?',
                options: [
                    'Códigos de tramo, fecha, operador y método en cada lectura',
                    'Solo dibujar sin cotas',
                    'Eliminar puntos sin dejar constancia'
                ],
                correct: 0
            }
        ];
    }

    function buildDrillSteps(activity, cfg) {
        var h = hashActivityKey(cfg.activityKey || '');
        var nb = 6 + (h % 10);
        var dm = 2.4 + (h % 8) / 10;
        return [
            {
                type: 'order',
                title: 'Paso 1 · Frente de perforación y tronadura',
                labels: ['Inspeccionar malla y burden', 'Perforar barrenos', 'Medir profundidad / limpieza', 'Cargar, cablear y disparo controlado'],
                correctSeq: [0, 1, 2, 3]
            },
            {
                type: 'numeric',
                title: 'Paso 2 · Metraje de sondeo (ejercicio)',
                text: 'Si se perforan ' + nb + ' barrenos de ' + dm.toFixed(1) +
                    ' m cada uno (idealizado), ¿metros perforados totales? (un decimal)',
                answer: Math.round(nb * dm * 10) / 10,
                tolerance: 0.11
            },
            {
                type: 'mc',
                title: 'Paso 3 · Malla y macizo',
                q: 'Burden y espaciamiento se relacionan principalmente con…',
                options: [
                    'Propiedades del macizo, diseño de malla y tipo de explosivo',
                    'Solo el color del casco',
                    'La hora del turno únicamente'
                ],
                correct: 0
            }
        ];
    }

    function buildOfficeSteps(activity, cfg) {
        return [
            {
                type: 'mc',
                title: 'Paso 1 · Decisión con bloques económicos',
                q: 'Una VPN negativa a tasa de descuento de mercado sugiere que…',
                options: [
                    'El proyecto puede no remunerar el costo de oportunidad del capital',
                    'Hay que ejecutar siempre la faena',
                    'La ley del mineral no importa'
                ],
                correct: 0
            },
            {
                type: 'mc',
                title: 'Paso 2 · Cut-off y precio del metal',
                q: 'Si el precio del metal sube, el cut-off suele…',
                options: [
                    'Bajar (puede volverse rentable explotar menor ley)',
                    'Subir siempre',
                    'No cambiar nunca'
                ],
                correct: 0
            },
            {
                type: 'order',
                title: 'Paso 3 · Secuencia de estudio de proyecto',
                labels: ['Recursos y modelos de bloques', 'Ingeniería de mina y planta', 'Ambiental y social', 'Economía y riesgos'],
                correctSeq: [0, 1, 2, 3]
            }
        ];
    }

    function buildSafetySteps(activity, cfg) {
        var h = hashActivityKey(cfg.activityKey || '');
        return [
            {
                type: 'checklist',
                title: 'Paso 1 · Controles críticos en faena',
                items: [
                    {label: 'EPI según evaluación de riesgo del trabajo', ok: true},
                    {label: 'Comunicación y permiso de trabajo vigente', ok: true},
                    {label: 'Omitir el aislamiento de energías si hay prisa', ok: false}
                ]
            },
            {
                type: 'order',
                title: 'Paso 2 · Orden ante emergencia',
                labels: ['Alarma y aviso', 'Evaluar y evacuar si corresponde', 'Acudir a punto de encuentro', 'Reporte y registro'],
                correctSeq: [0, 1, 2, 3]
            },
            {
                type: 'mc',
                title: 'Paso 3 · Riesgo en rajo / talud',
                q: '¿Qué factor NO reduce el riesgo por sí solo?',
                options: [
                    'Ignorar el diseño de bermas y drenaje',
                    'Monitoreo geotécnico y respeto de distancias',
                    'Comunicación de caídas de roca'
                ],
                correct: 0
            }
        ];
    }

    function buildEnglishSteps(activity, cfg) {
        var h = hashActivityKey(cfg.activityKey || '');
        var sets = [
            {
                q: '"Hard hat" en faena se traduce como…',
                options: ['Casco de seguridad', 'Caseta dura', 'Sombrero blando'],
                correct: 0
            },
            {
                q: '"Pump specifications" se refiere a…',
                options: ['Especificaciones de la bomba', 'Especificaciones de café', 'Mapa de mina'],
                correct: 0
            },
            {
                q: '"Stand clear of the blast area" significa…',
                options: ['Manténgase alejado del área de tronadura', 'Acerque al área', 'Apague la radio'],
                correct: 0
            }
        ];
        var s0 = sets[h % sets.length];
        return [
            {
                type: 'mc',
                title: 'Paso 1 · Vocabulario técnico (C5)',
                q: s0.q,
                options: s0.options,
                correct: s0.correct
            },
            {
                type: 'mc',
                title: 'Paso 2 · Lectura de manual',
                q: '"Valve" en mantenimiento de bomba es…',
                options: ['Válvula', 'Volumen', 'Ventilador'],
                correct: 0
            },
            {
                type: 'order',
                title: 'Paso 3 · Comunicación breve en radio',
                labels: ['Identificarse', 'Ubicación / frente', 'Solicitud o aviso', 'Cierre / copiado'],
                correctSeq: [0, 1, 2, 3]
            }
        ];
    }

    function buildInnovationSteps(activity, cfg) {
        return [
            {
                type: 'order',
                title: 'Paso 1 · Pipeline I+D minero',
                labels: ['Diagnóstico / problema', 'Ideación y prototipo', 'Prueba en campo o piloto', 'Escalamiento y normativa'],
                correctSeq: [0, 1, 2, 3]
            },
            {
                type: 'checklist',
                title: 'Paso 2 · Sostenibilidad e innovación',
                items: [
                    {label: 'Considerar impacto en comunidad y medio ambiente', ok: true},
                    {label: 'Evaluar riesgo operacional', ok: true},
                    {label: 'Implementar sin medir resultados', ok: false}
                ]
            },
            {
                type: 'mc',
                title: 'Paso 3 · Relaves y economía circular',
                q: 'Una línea de I+D en relaves busca típicamente…',
                options: [
                    'Reducir pasivos y valorizar materiales cuando es viable',
                    'Aumentar el volumen de relave sin control',
                    'Eliminar normativa'
                ],
                correct: 0
            }
        ];
    }

    function mountGuidedSurvey(container, activity, cfg, helpers) {
        renderGuidedPractice(container, buildSurveySteps(activity, cfg), helpers);
    }

    function mountGuidedDrill(container, activity, cfg, helpers) {
        renderGuidedPractice(container, buildDrillSteps(activity, cfg), helpers);
    }

    function mountGuidedOffice(container, activity, cfg, helpers) {
        renderGuidedPractice(container, buildOfficeSteps(activity, cfg), helpers);
    }

    function mountGuidedSafety(container, activity, cfg, helpers) {
        renderGuidedPractice(container, buildSafetySteps(activity, cfg), helpers);
    }

    function mountGuidedEnglish(container, activity, cfg, helpers) {
        renderGuidedPractice(container, buildEnglishSteps(activity, cfg), helpers);
    }

    function mountGuidedInnovation(container, activity, cfg, helpers) {
        renderGuidedPractice(container, buildInnovationSteps(activity, cfg), helpers);
    }

    function mountGuidedTunnel(container, activity, cfg, helpers) {
        var steps = buildTunnelSteps(activity, cfg);
        renderGuidedPractice(container, steps, helpers);
    }

    function mountGuidedPit(container, activity, cfg, helpers) {
        var steps = buildPitSteps(activity, cfg);
        renderGuidedPractice(container, steps, helpers);
    }

    function mountGuidedVent(container, activity, cfg, helpers) {
        renderGuidedPractice(container, buildVentSteps(activity, cfg), helpers);
    }

    function mountGuidedMathMine(aside, activity, cfg, helpers) {
        var steps = buildMathMineSteps(cfg);
        var quiz = aside.querySelector('.ml-quiz');
        if (quiz) {
            quiz.innerHTML = '';
        }
        var mount = document.createElement('div');
        mount.className = 'ml-guided-wrap';
        if (quiz) {
            quiz.appendChild(mount);
        } else {
            aside.appendChild(mount);
        }
        helpers.activityKey = cfg.activityKey;
        renderGuidedPractice(mount, steps, helpers);
    }

    return {
        mountGuidedTunnel: mountGuidedTunnel,
        mountGuidedPit: mountGuidedPit,
        mountGuidedVent: mountGuidedVent,
        mountGuidedMathMine: mountGuidedMathMine,
        mountGuidedSurvey: mountGuidedSurvey,
        mountGuidedDrill: mountGuidedDrill,
        mountGuidedOffice: mountGuidedOffice,
        mountGuidedSafety: mountGuidedSafety,
        mountGuidedEnglish: mountGuidedEnglish,
        mountGuidedInnovation: mountGuidedInnovation,
        hashActivityKey: hashActivityKey,
        getPitBermRefMeters: getPitBermRefMeters,
        buildMathMineSteps: buildMathMineSteps
    };
});
