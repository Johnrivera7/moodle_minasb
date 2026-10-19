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
 * Escenas 3D de las evaluaciones prácticas semestrales (I a V).
 *
 * Cada escena se construye con los datos del caso del estudiante entregados por
 * el servidor, registra objetos inspeccionables, planos para la brújula,
 * puntos de ajuste para la medición y vistas de cámara con nombre.
 *
 * @module     mod_minaslab/eval_scenes
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['mod_minaslab/eval_kit', 'mod_minaslab/eval_models'], function(kit, models) {
    'use strict';

    const fmt = function(v, d) {
        return Number(v).toLocaleString('es-CL', {minimumFractionDigits: d || 0, maximumFractionDigits: d || 0});
    };
    const pin = (txt, cls) => '<span class="mlx-pin ' + (cls || '') + '">' + txt + '</span>';
    const tag = txt => '<span class="mlx-tag">' + txt + '</span>';

    /**
     * Rampa de colores para leyes (azul → verde → amarillo → rojo).
     *
     * @param {Object} THREE
     * @param {number} g
     * @param {number} min
     * @param {number} max
     */
    const gradeColor = function(THREE, g, min, max) {
        const t = kit.clamp((g - min) / (max - min), 0, 1);
        const c = new THREE.Color();
        c.setHSL(0.66 - 0.66 * t, 0.85, 0.5);
        return c;
    };

    /**
     * Rajo + terreno + líneas topográficas + pretil + rocas.
     *
     * @param {Object} world
     * @param {Object} data
     * @param {Object} opt
     */
    const pitWorld = function(world, data, opt) {
        opt = opt || {};
        const THREE = world.THREE;
        const M = kit.materials(THREE);
        const pit = kit.makePit(data.pit, {x: 0, z: 0});
        const pad = opt.margin || 70;
        const b = pit.bounds;
        const patch = opt.patch || {minX: b.minX - pad, maxX: b.maxX + pad, minZ: b.minZ - pad, maxZ: b.maxZ + pad};
        const area = (patch.maxX - patch.minX) * (patch.maxZ - patch.minZ);
        const cell = Math.max(opt.minCell || 0.7, Math.sqrt(area / (opt.maxVerts || 240000)));
        const terrain = kit.buildTerrain(world, {
            seed: opt.seed || 11, pit: pit, patch: patch, cell: cell, relief: opt.relief, pads: opt.pads,
            slope: opt.slope, colors: opt.colors, collar: 0, farHole: opt.farHole
        });
        kit.addSurveyLines(world, pit, terrain);
        if (world.fx) {
            world.fx.area = {minX: b.minX - 60, maxX: b.maxX + 60, minZ: b.minZ - 60, maxZ: b.maxZ + 60,
                heightAt: terrain.heightAt};
        }
        if (pit.path.length) {
            const half = data.pit.rampWidth / 2;
            const pts = [];
            for (let i = 0; i < pit.path.length; i += 2) {
                const p = pit.path[i];
                const rp = pit.ringPoint(p.q, p.r - (half - 1.0));
                pts.push({x: rp.x, y: p.y - 0.1, z: rp.z});
            }
            const bm = kit.bermAlong(THREE, pts, opt.bermHeight || 1.6,
                new THREE.MeshStandardMaterial({color: 0x9b8a76, roughness: 1}));
            world.scene.add(bm);
        }
        const fl = pit.floorRadius;
        kit.scatterRocks(world, opt.rocks || 900, {minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ},
            terrain.heightAt, 5, function(x, z) {
                const k = terrain.sample(x, z).kind;
                return k === 'berm' || (k === 'floor' && pit.local(x, z).s < pit.R - fl + 12);
            });
        return {pit: pit, terrain: terrain, M: M};
    };

    const place = function(world, obj, x, z, terrain, rotY, dy) {
        obj.position.set(x, terrain.heightAt(x, z) + (dy || 0), z);
        obj.rotation.y = rotY || 0;
        world.scene.add(obj);
        return obj;
    };

    /**
     * Vehículo que recorre la rampa de ida y vuelta, con esperas en los extremos.
     *
     * @param {Object} world
     * @param {Object} pit
     * @param {Object} grp modelo (frente +x)
     * @param {number} phase fase inicial 0–1
     * @param {Object} opt {up, down (m/s), waitTop, waitBottom, onTop(f), onBottom(f), onMove(goingUp)}
     */
    const rampVehicle = function(world, pit, grp, phase, opt) {
        const n = pit.path.length;
        const lane = pit.params.rampWidth / 4;
        let t = phase * 2 * n;
        let wait = 0;
        let waitKind = null;
        world.updaters.push(function(dt) {
            if (n < 3) {
                return;
            }
            if (wait > 0) {
                wait -= dt;
                const total = waitKind === 'top' ? opt.waitTop : opt.waitBottom;
                const f = 1 - Math.max(0, wait) / total;
                if (waitKind === 'top' && opt.onTop) {
                    opt.onTop(f);
                } else if (waitKind === 'bottom' && opt.onBottom) {
                    opt.onBottom(f);
                }
                return;
            }
            const before = t;
            const goingUp = t >= n;
            t = t + dt * (goingUp ? opt.up : opt.down);
            // Llegada al fondo (fin de bajada) y a la cresta (fin de subida).
            if (before < n && t >= n && opt.waitBottom) {
                t = n;
                wait = opt.waitBottom;
                waitKind = 'bottom';
            } else if (t >= 2 * n) {
                t = 0;
                if (opt.waitTop) {
                    wait = opt.waitTop;
                    waitKind = 'top';
                }
            }
            const up = t >= n;
            const l = up ? 2 * n - t : t;
            const i = kit.clamp(Math.floor(l), 1, n - 2);
            const p = pit.path[i];
            const off = up ? lane : -lane;
            const nb = pit.path[up ? i - 1 : i + 1];
            const a = pit.ringPoint(p.q, p.r + off);
            const c = pit.ringPoint(nb.q, nb.r + off);
            kit.placeAlong(grp, {x: a.x, y: p.y, z: a.z}, {x: c.x, y: nb.y, z: c.z});
            if (opt.onMove) {
                opt.onMove(up);
            }
        });
    };

    /**
     * Registra polvo y focos de un vehículo en los efectos del mundo.
     *
     * @param {Object} world
     * @param {Object} grp
     * @param {Object} d {rear, width, size, front, lightY}
     */
    const vehicleFx = function(world, grp, d) {
        if (!world.fx) {
            return;
        }
        world.fx.addDustEmitter(grp, {rear: d.rear, width: d.width, size: d.size});
        world.fx.addNightLight(grp, {pos: [d.front, d.lightY, 0], dir: [30, -6, 0], kind: 'vehicle', range: d.range});
    };

    /**
     * Camión que recorre la rampa: baja vacío, espera el carguío en el fondo, sube
     * cargado y levanta la tolva al descargar en la cresta.
     *
     * @param {Object} world
     * @param {Object} pit
     * @param {number} payload
     * @param {number} phase
     * @param {Object} info ficha de inspección
     * @returns {Object}
     */
    const rampTruck = function(world, pit, payload, phase, info) {
        const THREE = world.THREE;
        const truckNo = 'C-' + (140 + Math.round(phase * 40));
        const grp = kit.haulTruck(THREE, null, payload, false, truckNo);
        world.scene.add(grp);
        if (info) {
            world.addPickable(grp, info);
        }
        const load = models.part(grp, 'load');
        rampVehicle(world, pit, grp, phase, {
            up: 4.2, down: 7.5, waitTop: 13, waitBottom: 9,
            onTop: function(f) {
                // Volteo: sube 0–35 %, mantiene 35–60 % (la carga cae), baja 60–100 %.
                const a = f < 0.35 ? f / 0.35 : (f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4);
                models.setDump(THREE, grp, 0.82 * a * a * (3 - 2 * a));
                if (load) {
                    load.visible = f < 0.45;
                }
                if (world.fx && f > 0.35 && f < 0.6 && Math.random() < 0.6) {
                    const p = grp.localToWorld(new THREE.Vector3(-9, 1, (Math.random() - 0.5) * 6));
                    world.fx.dust.emit(p.x, p.y, p.z, -2, 1.5, 0, 6, 4);
                }
            },
            onBottom: function(f) {
                if (load) {
                    load.visible = f > 0.6;
                }
            },
            onMove: function(up) {
                if (load) {
                    load.visible = up;
                }
            }
        });
        vehicleFx(world, grp, {rear: -6, width: 6.5, size: 3.6, front: 6.2, lightY: 2.0});
        return grp;
    };

    /**
     * Camión aljibe regando la rampa (velocidad baja de riego).
     *
     * @param {Object} world
     * @param {Object} pit
     * @param {number} phase
     * @returns {Object}
     */
    const rampWater = function(world, pit, phase) {
        const THREE = world.THREE;
        const grp = models.waterTruck(THREE, 'AL-0' + (2 + Math.round(phase * 5)));
        world.scene.add(grp);
        world.addPickable(grp, {id: 'water', title: 'Camión aljibe — riego de caminos',
            rows: [['Capacidad del estanque', '90.000 L'], ['Tasa de riego', '1,2 L/m²'],
                ['Objetivo', 'Control de polvo en suspensión (calidad del aire)']]});
        rampVehicle(world, pit, grp, phase, {up: 3.2, down: 3.6});
        if (world.fx) {
            world.fx.addSprayer(grp, grp.userData.spray);
        }
        vehicleFx(world, grp, {rear: -6, width: 6, size: 2.6, front: 6.2, lightY: 2.0});
        return grp;
    };

    /**
     * Ida y vuelta en línea recta (motoniveladora, bulldozer empujando).
     *
     * @param {Object} world
     * @param {Object} obj
     * @param {Object} a {x, z}
     * @param {Object} b {x, z}
     * @param {Object} terrain
     * @param {Object} opt {speed, reverse: retrocede sin girar, onStep(f, forward)}
     */
    const shuttle = function(world, obj, a, b, terrain, opt) {
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        let s = 0;
        let dir = 1;
        const yaw = Math.atan2(-(b.z - a.z), b.x - a.x);
        world.updaters.push(function(dt) {
            s += dir * dt * (opt.speed || 2) * (dir < 0 && opt.reverse ? 1.6 : 1);
            if (s > len) {
                s = len;
                dir = -1;
            } else if (s < 0) {
                s = 0;
                dir = 1;
            }
            const f = s / len;
            const x = a.x + (b.x - a.x) * f;
            const z = a.z + (b.z - a.z) * f;
            obj.position.set(x, terrain.heightAt(x, z), z);
            obj.rotation.set(0, opt.reverse || dir > 0 ? yaw : yaw + Math.PI, 0);
            if (opt.onStep) {
                opt.onStep(f, dir > 0);
            }
        });
    };

    /**
     * Ciclo de carguío del cargador frontal en «V»: entra a la pila, carga,
     * retrocede girando, avanza al camión con los brazos arriba, vacía y vuelve.
     *
     * @param {Object} world
     * @param {Object} loader
     * @param {Object} pile punto de la pila {x, z}
     * @param {Object} truck punto junto al camión {x, z}
     * @param {Object} back punto de retroceso {x, z}
     * @param {Object} terrain
     */
    const loaderCycle = function(world, loader, pile, truck, back, terrain) {
        const T = 30;
        const ease = x => x * x * (3 - 2 * x);
        const lerpP = (p, q, f) => ({x: p.x + (q.x - p.x) * f, z: p.z + (q.z - p.z) * f});
        world.updaters.push(function(dt, time) {
            const p = (time % T) / T;
            let pos;
            let face;
            let lift = 0;
            let tilt = 0.1;
            let loaded = false;
            if (p < 0.22) {
                pos = lerpP(back, pile, ease(p / 0.22));
                face = pile;
            } else if (p < 0.32) {
                pos = pile;
                face = pile;
                tilt = 0.1 + 0.45 * ease((p - 0.22) / 0.1);
                loaded = p > 0.27;
            } else if (p < 0.5) {
                pos = lerpP(pile, back, ease((p - 0.32) / 0.18));
                face = pile;
                tilt = 0.55;
                lift = 0.15;
                loaded = true;
            } else if (p < 0.68) {
                const f = ease((p - 0.5) / 0.18);
                pos = lerpP(back, truck, f);
                face = truck;
                lift = 0.15 + 0.7 * f;
                tilt = 0.55;
                loaded = true;
            } else if (p < 0.8) {
                const f = ease((p - 0.68) / 0.12);
                pos = truck;
                face = truck;
                lift = 0.85;
                tilt = 0.55 - 1.35 * f;
                loaded = f < 0.5;
            } else {
                const f = ease((p - 0.8) / 0.2);
                pos = lerpP(truck, back, f);
                face = truck;
                lift = 0.85 * (1 - f);
                tilt = -0.8 + 0.9 * f;
            }
            loader.position.set(pos.x, terrain.heightAt(pos.x, pos.z), pos.z);
            // Siempre mira hacia el destino de la fase (retrocede sin girar).
            const tx = face.x - pos.x;
            const tz = face.z - pos.z;
            if (Math.hypot(tx, tz) > 0.5) {
                loader.rotation.y = Math.atan2(-tz, tx);
            }
            models.setLoaderPose(loader, lift, tilt, loaded);
        });
    };

    /**
     * Torre de iluminación con su luz nocturna.
     *
     * @param {Object} world
     * @param {Object} terrain
     * @param {number} x
     * @param {number} z
     * @param {number} yaw orientación de los focos (rad)
     * @returns {Object}
     */
    const tower = function(world, terrain, x, z, yaw) {
        const THREE = world.THREE;
        const t = place(world, models.lightTower(THREE), x, z, terrain, yaw);
        if (world.fx) {
            const l = t.userData.lamp;
            world.fx.addNightLight(t, {pos: [l[0] + 0.3, l[1], l[2]], dir: [20, -9, 0], kind: 'tower'});
        }
        return t;
    };

    /**
     * Portal de galería con collar de hormigón contra la cara de un banco.
     * La boca mira hacia −dir (dir = vector unitario hacia la roca).
     *
     * @param {Object} world
     * @param {Object} M
     * @param {Object} pos
     * @param {number} dirAngle
     * @param {string[]} lines
     */
    const portal = function(world, M, pos, dirAngle, lines) {
        const THREE = world.THREE;
        const g = new THREE.Group();
        const sc = kit.detailTextures(THREE, 61);
        const shot = new THREE.MeshStandardMaterial({color: 0x8f8a82, roughness: 0.95, map: sc.map, normalMap: sc.normal,
            normalScale: new THREE.Vector2(1.4, 1.4)});
        // Collar de shotcrete en forma de bóveda con la boca oscura de la galería.
        const archShape = new THREE.Shape();
        archShape.moveTo(-3.6, 0);
        archShape.lineTo(3.6, 0);
        archShape.lineTo(3.6, 3.6);
        archShape.absarc(0, 3.6, 3.6, 0, Math.PI, false);
        archShape.lineTo(-3.6, 0);
        const hole = new THREE.Path();
        hole.moveTo(-2.3, 0);
        hole.lineTo(2.3, 0);
        hole.lineTo(2.3, 2.6);
        hole.absarc(0, 2.6, 2.3, 0, Math.PI, false);
        hole.lineTo(-2.3, 0);
        archShape.holes.push(hole);
        const collarGeo = new THREE.ExtrudeGeometry(archShape, {depth: 3.0, bevelEnabled: true, bevelSize: 0.15,
            bevelThickness: 0.15, bevelSegments: 2, curveSegments: 18});
        collarGeo.rotateY(Math.PI / 2);
        const collar = new THREE.Mesh(collarGeo, shot);
        collar.castShadow = true;
        collar.receiveShadow = true;
        collar.position.set(-0.6, 0, 0);
        g.add(collar);
        const mouth = kit.box(THREE, 6, 4.8, 4.5, M.dark);
        mouth.position.set(3.2, 2.3, 0);
        g.add(mouth);
        // Marcos de acero (cerchas) visibles en la boca.
        [0.4, 1.6].forEach(function(xx) {
            const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 8, 24, Math.PI), M.darkSteel);
            arch.position.set(xx, 2.6, 0);
            arch.rotation.y = Math.PI / 2;
            g.add(arch);
            [-2.2, 2.2].forEach(function(zz) {
                const post = kit.box(THREE, 0.22, 2.6, 0.22, M.darkSteel);
                post.position.set(xx, 1.3, zz);
                g.add(post);
            });
        });
        if (lines) {
            const tex = kit.signTexture(THREE, lines, {bg: '#ffd400', fg: '#111', w: 768, h: 256});
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), new THREE.MeshStandardMaterial({map: tex}));
            sign.position.set(-0.8, 8.0, 0);
            sign.rotation.y = -Math.PI / 2;
            g.add(sign);
        }
        g.position.set(pos.x, pos.y, pos.z);
        g.rotation.y = dirAngle;
        world.scene.add(g);
        return g;
    };

    // =====================================================================
    // Semestre I — faena escuela.
    // =====================================================================
    const sceneS1 = function(world, data) {
        const THREE = world.THREE;
        const base = pitWorld(world, data, {seed: 21, relief: 14, rocks: 700});
        const pit = base.pit;
        const terrain = base.terrain;
        const M = base.M;
        const H = pit.H;
        const floorY = -pit.depth;

        // Bloque de tronadura (próximo banco) con estacas y collares de pozos.
        const blk = data.block;
        const bx = blk.x;
        const bz = blk.z;
        const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(c => new THREE.Vector3(
            bx + c[0] * blk.length / 2, floorY, bz + c[1] * blk.width / 2));
        const outlinePts = corners.map(v => v.clone().setY(floorY + 0.08));
        const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(outlinePts),
            new THREE.LineBasicMaterial({color: 0xff3d00}));
        world.scene.add(outline);
        corners.forEach(function(c, i) {
            const st = kit.stake(THREE, M);
            st.position.copy(c);
            world.scene.add(st);
            world.snapPoints = world.snapPoints || [];
            world.snapPoints.push(c.clone());
            world.addLabel({x: c.x, y: c.y + 2.2, z: c.z}, tag('E' + (i + 1)), 'mlx-label--small');
        });
        const collarGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.35, 10);
        const collars = new THREE.InstancedMesh(collarGeo, new THREE.MeshStandardMaterial({color: 0x6b5b4b, roughness: 1}), 400);
        let ci = 0;
        const mtx = new THREE.Matrix4();
        for (let x = -blk.length / 2 + 3; x < blk.length / 2 - 2 && ci < 400; x += 6) {
            for (let z = -blk.width / 2 + 3; z < blk.width / 2 - 2 && ci < 400; z += 5) {
                mtx.makeTranslation(bx + x, floorY + 0.15, bz + z);
                collars.setMatrixAt(ci++, mtx);
            }
        }
        collars.count = ci;
        collars.receiveShadow = true;
        world.scene.add(collars);
        const drill = place(world, kit.drillRig(THREE, M), bx + blk.length / 2 - 6, bz - blk.width / 2 + 5, terrain, 0.3);
        const wk = place(world, kit.worker(THREE, M, null), bx + blk.length / 2 - 14, bz - blk.width / 2 + 9, terrain, 0.5);
        world.addFocus('block', {x: bx, y: floorY, z: bz}, Math.max(blk.length, blk.width) * 1.7, 0.55, 1.0);

        // Pala, camión estacionado y camión en la rampa.
        const shovel = place(world, kit.wheelLoader(THREE), bx + blk.length / 2 + 24, bz + 24, terrain, Math.PI * 0.8);
        const truckInfo = {
            id: 'truck', title: 'Camión de extracción',
            rows: [['Capacidad nominal', fmt(data.truck.payload) + ' t'], ['Tipo', 'Camión mecánico de alto tonelaje'],
                ['Estado', 'En carguío']]
        };
        const truck = kit.haulTruck(THREE, M, data.truck.payload, false);
        place(world, truck, bx + blk.length / 2 + 14, bz + 36, terrain, Math.PI * 0.85);
        world.addPickable(truck, truckInfo);
        world.addFocus('truck', truck.position, 38, 0.9, 0.45);
        rampTruck(world, pit, data.truck.payload, 0.2, truckInfo);

        // Hitos topográficos A y B en la rampa.
        const mk = data.pit.rampMarkers;
        const hitos = mk.map(function(l, i) {
            const p = pit.rampAt(l);
            const st = kit.stake(THREE, M, 0x00b0ff);
            st.position.set(p.x, p.y, p.z);
            world.scene.add(st);
            const v = new THREE.Vector3(p.x, p.y, p.z);
            world.snapPoints.push(v);
            world.addLabel({x: p.x, y: p.y + 2.6, z: p.z}, pin(i === 0 ? 'A' : 'B', 'mlx-pin--survey'));
            return v;
        });
        const mid = hitos[0].clone().lerp(hitos[1], 0.5);
        world.addFocus('ramp', mid, 120, 0.25, 0.45);

        // Portal de galería y muestreo por canal en la pared oriente.
        const sToe = (pit.n - 1) * pit.period + pit.face;
        const rToe = pit.R - sToe;
        const qTip = 2 * pit.L + Math.PI / 2 * rToe;
        const tip = pit.benchLinePoint(qTip, sToe) || pit.ringPoint(qTip, rToe);
        portal(world, M, {x: tip.x - 0.4, y: floorY, z: tip.z}, 0,
            ['GALERÍA EXPLORATORIA', 'INGRESO SOLO CON AUTORIZACIÓN']);
        world.addFocus('portal', {x: tip.x, y: floorY + 3, z: tip.z}, 30, -Math.PI / 2, 0.2);

        const hgt = 1.4;
        const sCh = (pit.n - 1) * pit.period + pit.face * (1 - hgt / H);
        const rCh = pit.R - sCh;
        // Punto sobre la cara real del banco, desplazado 0,3 m hacia el interior del rajo.
        const onFace = function(qq) {
            const pt = pit.benchLinePoint(qq, sCh) || pit.ringPoint(qq, rCh);
            const ax = kit.clamp(pt.x, -pit.L, pit.L);
            const dx = ax - pt.x;
            const dz = -pt.z;
            const dl = Math.hypot(dx, dz) || 1;
            return {x: pt.x + dx / dl * 0.3, z: pt.z + dz / dl * 0.3};
        };
        let q = 2 * pit.L + Math.PI / 2 * rCh + 7;
        const segs = data.channel.segments;
        const chMid = [];
        segs.forEach(function(sg) {
            const a = onFace(q);
            const c = onFace(q + sg.length);
            const len = Math.hypot(c.x - a.x, c.z - a.z);
            const mesh = kit.box(THREE, len - 0.06, 0.22, 0.12, new THREE.MeshStandardMaterial({
                color: gradeColor(THREE, sg.grade, 0.3, 2.5), roughness: 0.7}));
            mesh.position.set((a.x + c.x) / 2, floorY + hgt, (a.z + c.z) / 2);
            mesh.rotation.y = Math.atan2(-(c.z - a.z), c.x - a.x);
            world.scene.add(mesh);
            const info = {id: 'channel-' + sg.id, title: 'Muestreo por canal — tramo ' + sg.id,
                rows: [['Longitud', fmt(sg.length, 1) + ' m'], ['Ley Cu', fmt(sg.grade, 2) + ' %'],
                    ['Muestra', 'Canal horizontal, 10 cm × 3 cm']]};
            world.addPickable(mesh, info);
            world.addLabel({x: mesh.position.x - 0.5, y: floorY + hgt + 0.7, z: mesh.position.z}, tag(sg.id),
                'mlx-label--small', info);
            chMid.push(mesh.position.clone());
            q += sg.length;
        });
        const chc = chMid[Math.floor(chMid.length / 2)];
        world.addFocus('channel', chc, 16, -Math.PI / 2 + 0.25, 0.12);

        // Puntos de inspección.
        const rampPt = pit.rampAt(Math.floor(pit.path.length * 0.33));
        const rIn = pit.ringPoint(rampPt.q, rampPt.r - data.pit.rampWidth / 2 + 1);
        const crest = pit.wallPoint(pit.n - 1, bx - 5, 0);
        const entry = pit.rampAt(4);
        const placeOf = {
            pretil: {x: rIn.x, y: rampPt.y + 1.6, z: rIn.z},
            tiro: {x: bx - blk.length / 4, y: floorY + 0.4, z: bz},
            portal: {x: tip.x - 1, y: floorY + 6.4, z: tip.z},
            talud: {x: crest.x, y: crest.y + 0.3, z: crest.z},
            senal: {x: entry.x, y: entry.y + 0.5, z: entry.z - 6},
            epp: {x: wk.position.x, y: wk.position.y + 2.0, z: wk.position.z}
        };
        data.inspection.forEach(function(pt) {
            const p = placeOf[pt.place];
            const info = {id: pt.id, title: 'Punto de inspección ' + pt.n + ' — ' + pt.label, text: pt.observation,
                pickId: pt.id};
            world.addLabel({x: p.x, y: p.y + 1.2, z: p.z}, pin(String(pt.n), 'mlx-pin--insp'), '', info);
        });

        // Equipos de apoyo: motoniveladora, aljibe, torres de iluminación, LHD y jumbo en el portal.
        const grader = place(world, models.motorGrader(THREE), -50, 34, terrain, 0);
        shuttle(world, grader, {x: -62, z: 34}, {x: -5, z: 34}, terrain, {speed: 2.2});
        vehicleFx(world, grader, {rear: -5, width: 2.8, size: 2.2, front: 4.5, lightY: 2.0});
        rampWater(world, pit, 0.62);
        tower(world, terrain, bx - blk.length / 2 - 10, bz - 20, -0.4);
        tower(world, terrain, bx + blk.length / 2 + 8, bz - 26, Math.PI + 0.5);
        const lhdM = place(world, models.lhd(THREE), tip.x - 20, tip.z + 9, terrain, 0.1);
        const jumboM = place(world, models.jumbo(THREE), tip.x - 22, tip.z - 9, terrain, -0.1);
        world.addPickable(lhdM, {id: 'lhd', title: 'Cargador LHD (scoop) de bajo perfil',
            rows: [['Capacidad del balde', '7 m³ (14 t)'], ['Uso', 'Carguío en galerías subterráneas']]});
        world.addPickable(jumboM, {id: 'jumbo', title: 'Jumbo de perforación de dos brazos',
            rows: [['Brazos', '2 con viga de avance'], ['Uso', 'Perforación de frentes de desarrollo']]});
        models.setLoaderPose(shovel, 0, 0.1, false);
        place(world, models.pickup(THREE, 'CAM-14', 'hx'), entry.x + 26, entry.z - 30, terrain, 0.9);

        // Señalética general de la faena.
        const sg = kit.signPost(THREE, M, ['FAENA ESCUELA', 'USO OBLIGATORIO DE EPP'], {bg: '#0d47a1', fg: '#fff',
            border: '#fff', width: 4, height: 2});
        place(world, sg, entry.x + 18, entry.z - 22, terrain, 0.3);

        const wp = pit.wallPoint(1, 0, 0.5);
        world.addFocus('wall', {x: 0, y: wp.y - H * 0.5, z: wp.z + pit.period * 0.5}, 75, 0.0, 0.22);
        world.addFocus('iso', {x: 0, y: -pit.depth * 0.6, z: 0}, (pit.L + pit.R) * 2.3, 0.65, 0.62);
        world.addFocus('plan', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.8, 0.0, 1.5);
        world.addFocus('section', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.4, 0.0, 0.12);
        return {tools: ['explore', 'measure'], start: 'iso', drill: drill};
    };

    // =====================================================================
    // Semestre II — talud estructural.
    // =====================================================================

    /**
     * Vectores de un plano geológico (dirección de manteo/manteo) en coordenadas del mundo.
     *
     * @param {Object} THREE
     * @param {number} dd
     * @param {number} dip
     */
    const planeBasis = function(THREE, dd, dip) {
        const r = Math.PI / 180;
        const down = new THREE.Vector3(Math.sin(dd * r) * Math.cos(dip * r), -Math.sin(dip * r),
            -Math.cos(dd * r) * Math.cos(dip * r));
        const strike = new THREE.Vector3(Math.sin((dd - 90) * r), 0, -Math.cos((dd - 90) * r));
        const normal = new THREE.Vector3().crossVectors(down, strike).normalize();
        if (normal.y < 0) {
            normal.negate();
        }
        return {down: down, strike: strike, normal: normal};
    };

    const sceneS2 = function(world, data) {
        const THREE = world.THREE;
        const base = pitWorld(world, data, {seed: 33, relief: 10, rocks: 500, margin: 60, maxVerts: 260000,
            minCell: 0.6, colors: {soil: 0xb79f80, soil2: 0x987a5c}});
        const pit = base.pit;
        const terrain = base.terrain;
        const M = base.M;
        const fa = data.pit.faceAngle * Math.PI / 180;
        const outward = new THREE.Vector3(0, Math.cos(fa), Math.sin(fa));
        const rnd = kit.mulberry(data.joints.length * 977 + Math.round(data.section));

        // Familias de discontinuidades: parches planos recortados contra la cara.
        data.joints.forEach(function(j, ji) {
            const basis = planeBasis(THREE, j.dd, j.dip);
            const m = new THREE.Matrix4().makeBasis(basis.strike, basis.normal, basis.down);
            const jt = kit.detailTextures(THREE, 70 + ji);
            jt.map.repeat.set(0.6, 0.6);
            const mat = new THREE.MeshStandardMaterial({color: new THREE.Color(j.color), roughness: 0.85, metalness: 0.0,
                map: jt.map, normalMap: jt.normal, side: THREE.DoubleSide});
            const geo = new THREE.BoxGeometry(7, 0.05, 4.2);
            const info = {id: j.id, title: 'Discontinuidad — familia ' + j.id, kind: 'plane', plane: {dd: j.dd, dip: j.dip},
                text: 'Superficie de diaclasa con pátina de óxidos. Usa la Brújula para medir su orientación.'};
            for (let i = 0; i < 6; i++) {
                const k = i % pit.n;
                const x = -70 + (i / 5) * 140 + (rnd() - 0.5) * 12 + ji * 6;
                const wp = pit.wallPoint(k, x, 0.35 + rnd() * 0.3);
                const pl = new THREE.Plane();
                const p0 = new THREE.Vector3(wp.x, wp.y, wp.z).addScaledVector(outward, 0.75);
                pl.setFromNormalAndCoplanarPoint(outward.clone().negate(), p0);
                const mm = mat.clone();
                mm.clippingPlanes = [pl];
                const mesh = new THREE.Mesh(geo, mm);
                mesh.applyMatrix4(m);
                mesh.position.set(wp.x, wp.y, wp.z);
                mesh.castShadow = false;
                world.scene.add(mesh);
                world.addPickable(mesh, info);
                world.planes.push(mesh);
                if (i === 2) {
                    world.addLabel({x: wp.x, y: wp.y + 2.4, z: wp.z + 1}, tag(j.id), 'mlx-label--joint', info);
                    world.addFocus(j.id, {x: wp.x, y: wp.y, z: wp.z}, 22, 0.15, 0.25);
                }
            }
        });

        // Estación topográfica, caja porta-testigos y pozo a replantear.
        const st = data.station;
        const stPos = {x: -30, z: -(pit.R + 14)};
        const ts = place(world, kit.totalStation(THREE, M), stPos.x, stPos.z, terrain);
        const stInfo = {id: 'station', title: 'Estación topográfica ET-1',
            rows: [['Este', fmt(st.E, 2) + ' m'], ['Norte', fmt(st.N, 2) + ' m'],
                ['Cota', fmt(data.origin.Z + terrain.heightAt(stPos.x, stPos.z), 2) + ' m'], ['Datum', 'WGS84 / UTM 19S']]};
        world.addPickable(ts, stInfo);
        world.addLabel({x: stPos.x, y: ts.position.y + 2.8, z: stPos.z}, tag('ET-1'), '', stInfo);
        world.addFocus('station', ts.position, 22, 0.6, 0.45);
        const az = data.hole.az * Math.PI / 180;
        const hx = stPos.x + Math.sin(az) * data.hole.dist;
        const hz = stPos.z - Math.cos(az) * data.hole.dist;
        const hp = place(world, kit.stake(THREE, M, 0xffeb3b), hx, hz, terrain);
        world.addLabel({x: hx, y: hp.position.y + 2, z: hz}, tag('P-17'), 'mlx-label--small');

        const tray = new THREE.Group();
        const trayBox = kit.box(THREE, 1.1, 0.12, 0.5, M.wood);
        trayBox.position.y = 0.95;
        tray.add(trayBox);
        const table = kit.box(THREE, 1.4, 0.9, 0.8, M.steel);
        table.position.y = 0.45;
        tray.add(table);
        let off = -0.5;
        const pieces = data.core.pieces;
        pieces.forEach(function(len, i) {
            const row = Math.floor(off + 0.5);
            const cm = len / 100 / 3;
            const c = kit.cyl(THREE, 0.025, 0.025, Math.max(0.01, cm - 0.004), M.core, 10);
            c.rotation.z = Math.PI / 2;
            c.position.set(-0.5 + ((off + 0.5) % 1) + cm / 2, 1.04, -0.15 + row * 0.15);
            tray.add(c);
            off += cm;
            if (i > 400) {
                return;
            }
        });
        place(world, tray, stPos.x + 8, stPos.z - 3, terrain, 0.2);
        const coreInfo = {id: 'core', kind: 'core', title: 'Caja porta-testigos DDH-02',
            core: data.core, text: 'Corrida de ' + fmt(data.core.run, 1) + ' m desde ' + fmt(data.core.from, 1) +
                ' m. Longitudes de trozos en cm, en orden de profundidad.'};
        world.addPickable(tray, coreInfo);
        world.addLabel({x: tray.position.x, y: tray.position.y + 1.8, z: tray.position.z}, tag('DDH-02'), '', coreInfo);
        world.addFocus('core', tray.position, 6, 0.4, 0.75);

        // Perfil geotécnico de referencia (línea en planta con su azimut).
        const sa = data.section * Math.PI / 180;
        const s0 = new THREE.Vector3(stPos.x + 20, 0, stPos.z + 2);
        const pts = [];
        for (let d = -40; d <= 40; d += 2) {
            const x = s0.x + Math.sin(sa) * d;
            const z = s0.z - Math.cos(sa) * d;
            pts.push(new THREE.Vector3(x, terrain.heightAt(x, z) + 0.15, z));
        }
        world.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineDashedMaterial({color: 0xffffff, dashSize: 2, gapSize: 1.2})).computeLineDistances());
        world.addLabel(pts[pts.length - 1], tag('Perfil ' + String(Math.round(data.section)).padStart(3, '0') + '°'),
            'mlx-label--small');

        const drill = place(world, kit.drillRig(THREE, M), 40, pit.bermPoint(pit.n - 1, 40).z + 30, terrain, 0.2);
        drill.scale.setScalar(0.9);
        place(world, kit.pickup(THREE, M, 'GEO-02', 'lx'), stPos.x + 18, stPos.z - 8, terrain, 0.4);

        const wp = pit.wallPoint(1, 0, 0.5);
        world.addFocus('wall', {x: 0, y: wp.y, z: wp.z + 6}, 70, 0.0, 0.2);
        world.addFocus('iso', {x: 0, y: -pit.depth * 0.6, z: -pit.R * 0.5}, 230, 0.35, 0.45);
        world.addFocus('plan', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.6, 0.0, 1.5);
        world.addFocus('section', {x: 0, y: -pit.depth * 0.5, z: 0}, 260, Math.PI / 2, 0.08);
        return {tools: ['explore', 'measure', 'compass'], start: 'wall'};
    };

    // =====================================================================
    // Semestre III — sondajes y banco piloto.
    // =====================================================================
    const sceneS3 = function(world, data) {
        const THREE = world.THREE;
        const M = kit.materials(THREE);
        const pat = data.pattern;
        const benchPad = {x: 230, z: 40, w: 70, d: 50, y: 0};
        const holePads = data.holes.map(h => ({x: h.x, z: h.z, r: 7, y: 0, blend: 25}));
        const nz = kit.makeNoise(5);
        const padY = (x, z) => nz.fbm(x * 0.0035 + 3.1, z * 0.0035 - 1.7, 5) * 26;
        holePads.forEach(p => {
            p.y = padY(p.x, p.z);
        });
        benchPad.y = padY(benchPad.x, benchPad.z);
        const terrain = kit.buildTerrain(world, {
            seed: 5, relief: 26, patch: {minX: -320, maxX: 340, minZ: -260, maxZ: 260}, cell: 2.2,
            pads: holePads.concat([benchPad]), colors: {soil: 0xbfa27c, soil2: 0xa1805a}
        });
        world.terrain = terrain;
        kit.scatterRocks(world, 1400, {minX: -300, maxX: 320, minZ: -240, maxZ: 240}, terrain.heightAt, 17,
            (x, z) => Math.hypot(x - benchPad.x, z - benchPad.z) > 50);

        // Cuerpo mineralizado (envolvente de baja ley y núcleo).
        const ob = data.orebody;
        const shell = function(sx, color, opacity) {
            const geo = new THREE.SphereGeometry(1, 64, 40);
            const p = geo.attributes.position;
            for (let i = 0; i < p.count; i++) {
                const x = p.getX(i);
                const y = p.getY(i);
                const z = p.getZ(i);
                const f = 1 + nz.noise(x * 2.1 + sx, z * 2.1 + y) * 0.12;
                p.setXYZ(i, x * f, y * f, z * f);
            }
            geo.computeVertexNormals();
            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color: color, transparent: true, opacity: opacity,
                roughness: 0.4, depthWrite: false, side: THREE.DoubleSide}));
            mesh.scale.set(ob.rx * sx, ob.ry * sx, ob.rz * sx);
            mesh.position.set(0, -ob.depth, 0);
            mesh.renderOrder = 2;
            world.scene.add(mesh);
            return mesh;
        };
        const undergroundLabels = [];
        const env = shell(1.0, 0xf2c94c, 0.16);
        const core = shell(0.55, 0xe4572e, 0.28);
        const underground = [env, core];

        // Sondajes con tramos ensayados.
        data.holes.forEach(function(h) {
            const y0 = terrain.heightAt(h.x, h.z);
            const casing = kit.cyl(THREE, 0.5, 0.5, 1.2, M.white, 12);
            casing.position.set(h.x, y0 + 0.6, h.z);
            world.scene.add(casing);
            const padSlab = kit.box(THREE, 6, 0.3, 6, M.concrete);
            padSlab.position.set(h.x, y0 + 0.1, h.z);
            world.scene.add(padSlab);
            const trace = kit.cyl(THREE, 0.45, 0.45, h.depth, new THREE.MeshStandardMaterial({color: 0x9e9e9e,
                transparent: true, opacity: 0.85}), 10);
            trace.position.set(h.x, y0 - h.depth / 2, h.z);
            world.scene.add(trace);
            underground.push(trace);
            h.intervals.forEach(function(iv, k) {
                const len = iv.to - iv.from;
                const seg = kit.cyl(THREE, 1.1, 1.1, len, new THREE.MeshStandardMaterial({
                    color: gradeColor(THREE, iv.grade, 0.2, 1.4), roughness: 0.5, emissive: 0x111111}), 14);
                seg.position.set(h.x, y0 - (iv.from + iv.to) / 2, h.z);
                world.scene.add(seg);
                underground.push(seg);
                world.addPickable(seg, {id: h.id + '-' + k, title: h.id + ' · tramo ' + (k + 1),
                    rows: [['Desde', fmt(iv.from, 2) + ' m'], ['Hasta', fmt(iv.to, 2) + ' m'],
                        ['Longitud', fmt(len, 2) + ' m'], ['Ley Cu', fmt(iv.grade, 2) + ' %']]});
            });
            const hinfo = {id: h.id, title: 'Sondaje ' + h.id, rows: [['Tipo', 'Diamantina HQ, vertical'],
                ['Profundidad', fmt(h.depth, 1) + ' m'], ['Tramos ensayados', String(h.intervals.length)]],
                text: 'Activa «Ver subsuelo» e inspecciona cada tramo coloreado para leer su ley.',
                table: {head: ['Tramo', 'Desde', 'Hasta', 'Ley % Cu'], rows: h.intervals.map((iv, k) => [String(k + 1),
                    fmt(iv.from, 2), fmt(iv.to, 2), fmt(iv.grade, 2)])}};
            world.addPickable(casing, hinfo);
            world.addLabel({x: h.x, y: y0 + 4, z: h.z}, tag(h.id), '', hinfo);
            world.addFocus(h.id, {x: h.x, y: y0 - 22, z: h.z}, 110, 0.5, 0.55);
            world.focusLayers[h.id] = 'underground';
            world.snapPoints = world.snapPoints || [];
            world.snapPoints.push(new THREE.Vector3(h.x, y0, h.z));
        });
        // Perforadora diamantina en un sondaje.
        const dh = data.holes[2];
        const ddRig = kit.diamondDrill(THREE);
        place(world, ddRig, dh.x + 1, dh.z, terrain, 0.3);

        // Secciones transversales.
        data.sections.forEach(function(s) {
            const w = ob.rz * 2.4;
            const hgt = ob.ry * 2.6;
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), new THREE.MeshBasicMaterial({color: 0x3fa9f5,
                transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false}));
            plane.rotation.y = Math.PI / 2;
            plane.position.set(s.x, -ob.depth, 0);
            world.scene.add(plane);
            underground.push(plane);
            const rz = Math.sqrt(s.area * 1.55 / Math.PI);
            const ry = s.area / (Math.PI * rz);
            const pts = [];
            for (let a = 0; a <= 64; a++) {
                const t = a / 64 * Math.PI * 2;
                const f = 1 + nz.noise(Math.cos(t) * 2 + s.x, Math.sin(t) * 2) * 0.1;
                pts.push(new THREE.Vector2(Math.cos(t) * rz * f, Math.sin(t) * ry * f));
            }
            const poly = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), new THREE.MeshBasicMaterial({
                color: 0xff5252, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false}));
            poly.rotation.y = Math.PI / 2;
            poly.position.set(s.x + 0.2, -ob.depth + 8, 0);
            world.scene.add(poly);
            underground.push(poly);
            const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, hgt)),
                new THREE.LineBasicMaterial({color: 0x7fc8ff}));
            frame.rotation.y = Math.PI / 2;
            frame.position.copy(plane.position);
            world.scene.add(frame);
            underground.push(frame);
            const info = {id: s.id, title: 'Sección transversal ' + s.id, rows: [['Abscisa', fmt(s.x, 0) + ' m'],
                ['Área mineralizada', fmt(s.area, 0) + ' m²'], ['Separación entre secciones', fmt(data.spacing, 0) + ' m']]};
            world.addPickable(plane, info);
            world.addPickable(poly, info);
            const lab = world.addLabel({x: s.x, y: -ob.depth + hgt / 2 + 2, z: 0}, tag(s.id + ' · ' + fmt(s.area, 0) + ' m²'),
                'mlx-label--section', info);
            lab.visible = false;
            undergroundLabels.push(lab);
            world.addFocus(s.id, {x: s.x, y: -ob.depth, z: 0}, 260, Math.PI / 2 - 0.35, 0.2);
            world.focusLayers[s.id] = 'underground';
        });

        // Bloque a categorizar (proyección en superficie).
        const bk = data.block;
        const by = terrain.heightAt(bk.x, bk.z);
        const bpin = kit.stake(THREE, M, 0xff1744);
        bpin.position.set(bk.x, by, bk.z);
        world.scene.add(bpin);
        world.snapPoints.push(new THREE.Vector3(bk.x, by, bk.z));
        world.addLabel({x: bk.x, y: by + 2.6, z: bk.z}, pin(bk.id, 'mlx-pin--block'));
        const bcube = kit.box(THREE, 15, 15, 15, new THREE.MeshStandardMaterial({color: 0xff1744, transparent: true,
            opacity: 0.35}));
        bcube.position.set(bk.x, -ob.depth + 10, bk.z);
        world.scene.add(bcube);
        underground.push(bcube);
        world.addFocus('block', {x: bk.x, y: by, z: bk.z}, 200, 0.2, 1.2);

        // Banco piloto con malla de perforación.
        const bp = benchPad;
        const pinfo = {id: 'pattern', title: 'Malla de perforación — banco piloto',
            rows: [['Burden (B)', fmt(pat.burden, 1) + ' m'], ['Espaciamiento (S)', fmt(pat.spacing, 1) + ' m'],
                ['Diámetro (d)', fmt(pat.diameter, 0) + ' mm'], ['Altura de banco (H)', fmt(pat.height, 0) + ' m'],
                ['Pasadura (J)', fmt(pat.sub, 1) + ' m'], ['Taco (T)', fmt(pat.stem, 1) + ' m'],
                ['Malla', pat.rows + ' filas × ' + pat.cols + ' pozos']]};
        const gx0 = bp.x - (pat.cols - 1) * pat.spacing / 2;
        const gz0 = bp.z - (pat.rows - 1) * pat.burden / 2;
        for (let r = 0; r < pat.rows; r++) {
            for (let c = 0; c < pat.cols; c++) {
                const x = gx0 + c * pat.spacing;
                const z = gz0 + r * pat.burden;
                const col = kit.cyl(THREE, pat.diameter / 1000 * 3, pat.diameter / 1000 * 4, 0.5,
                    new THREE.MeshStandardMaterial({color: 0x5d4c3c, roughness: 1}), 10);
                col.position.set(x, bp.y + 0.2, z);
                world.scene.add(col);
                world.addPickable(col, pinfo);
                const cone = kit.cyl(THREE, 0.05, 0.6, 0.6, new THREE.MeshStandardMaterial({color: 0x7a6a5a}), 8);
                cone.position.set(x + 0.9, bp.y + 0.3, z);
                world.scene.add(cone);
            }
        }
        const board = kit.signPost(THREE, M, ['BANCO PILOTO', 'ZONA DE TRONADURA'], {bg: '#d50000', fg: '#fff',
            border: '#fff', width: 3.2, height: 1.4});
        place(world, board, bp.x - bp.w / 2 + 2, bp.z - bp.d / 2 - 2, terrain, 0);
        world.addPickable(board, pinfo);
        world.addLabel({x: bp.x, y: bp.y + 5, z: bp.z}, tag('Banco piloto'), '', pinfo);
        world.addFocus('pattern', {x: bp.x, y: bp.y, z: bp.z}, 70, 0.35, 0.9);
        place(world, kit.pickup(THREE, M, 'TRO-04', 'tx'), bp.x + bp.w / 2 + 6, bp.z, terrain, 1.2);
        place(world, kit.drillRig(THREE, M), bp.x - 10, bp.z + bp.d / 2 - 6, terrain, 0.1);

        // Galpón de testigos y camionetas.
        const shed = new THREE.Group();
        const walls = kit.box(THREE, 18, 5, 10, M.white);
        walls.position.y = 2.5;
        shed.add(walls);
        const roof = kit.box(THREE, 19, 0.4, 11, M.roof);
        roof.position.y = 5.2;
        shed.add(roof);
        place(world, shed, -200, 150, terrain, 0.2);
        place(world, kit.pickup(THREE, M, 'GEO-09', 'hx'), -185, 140, terrain, 2.1);

        underground.forEach(o => {
            o.visible = false;
        });
        world.toggleUnderground = function(on) {
            underground.forEach(o => {
                o.visible = on;
            });
            undergroundLabels.forEach(l => {
                l.visible = on;
            });
            world.grounds.forEach(function(g) {
                g.material.transparent = on;
                g.material.opacity = on ? 0.28 : 1;
                g.material.depthWrite = !on;
                g.material.needsUpdate = true;
            });
            if (terrain.far) {
                terrain.far.material.transparent = on;
                terrain.far.material.opacity = on ? 0.4 : 1;
                terrain.far.material.depthWrite = !on;
                terrain.far.material.needsUpdate = true;
            }
        };
        underground.forEach(o => {
            o.renderOrder = 3;
        });
        world.addFocus('iso', {x: 30, y: -20, z: 10}, 420, 0.5, 0.6);
        world.addFocus('plan', {x: 0, y: 0, z: 0}, 750, 0.0, 1.5);
        world.addFocus('section', {x: 0, y: -ob.depth, z: 0}, 520, 0.0, 0.05);
        return {tools: ['explore', 'measure'], start: 'iso', layers: [{id: 'underground', on: false,
            set: world.toggleUnderground}]};
    };

    // =====================================================================
    // Semestre IV — rajo de cobre en operación.
    // =====================================================================
    const sceneS4 = function(world, data) {
        const THREE = world.THREE;
        const base = pitWorld(world, data, {seed: 44, relief: 22, rocks: 1500, margin: 90, maxVerts: 280000,
            minCell: 1.0, bermHeight: data.truck.tire / 2});
        const pit = base.pit;
        const terrain = base.terrain;
        const M = base.M;
        const floorY = -pit.depth;
        const fr = pit.floorRadius;

        const truckInfo = {id: 'truck', title: data.truck.model + ' (camión de extracción)',
            rows: [['Carga útil', fmt(data.truck.payload) + ' t'], ['Ancho operacional (W)', fmt(data.truck.width, 1) + ' m'],
                ['Diámetro de neumático (D)', fmt(data.truck.tire, 2) + ' m'], ['Velocidad máx. en rampa', '30 km/h']]};
        for (let i = 0; i < data.truck.count; i++) {
            rampTruck(world, pit, data.truck.payload, i / data.truck.count, truckInfo);
        }
        // Pala en el fondo y camión en carguío.
        const sx = -pit.L * 0.4;
        const shovel = place(world, kit.ropeShovel(THREE, M), sx, -fr * 0.35, terrain, -Math.PI / 2);
        const lt = kit.haulTruck(THREE, M, data.truck.payload, false);
        place(world, lt, sx + 18, -fr * 0.35 + 18, terrain, Math.PI / 2);
        world.addPickable(lt, truckInfo);
        world.addFocus('truck', lt.position, 45, 0.7, 0.4);
        // Ciclo de la pala: excava en el frente y gira hacia el camión en carguío.
        shovel.updateMatrixWorld(true);
        const tl = shovel.worldToLocal(lt.position.clone());
        const swing = Math.atan2(-tl.z, tl.x);
        world.updaters.push((dt, time) => models.animateShovel(THREE, shovel, time, swing));
        if (world.fx) {
            world.fx.addNightLight(shovel, {pos: [4, 11, 0], dir: [25, -10, 0], kind: 'tower', range: 120});
        }
        rampWater(world, pit, 0.5);
        const gr = place(world, models.motorGrader(THREE), 0, fr * 0.55, terrain, 0);
        shuttle(world, gr, {x: -pit.L * 0.6, z: fr * 0.55}, {x: pit.L * 0.6, z: fr * 0.55}, terrain, {speed: 2.4});
        vehicleFx(world, gr, {rear: -5, width: 2.8, size: 2.2, front: 4.5, lightY: 2.0});
        tower(world, terrain, sx - 30, -fr * 0.5, -0.3);
        tower(world, terrain, pit.L * 0.3, -fr * 0.45, Math.PI + 0.4);
        tower(world, terrain, -pit.L * 0.15, fr * 0.65, -Math.PI / 2);

        // Bloques del banco activo.
        const bw = 26;
        data.blocks.forEach(function(b, i) {
            const x = -pit.L * 0.15 + (i % 3) * (bw + 4) - bw;
            const z = (Math.floor(i / 3) - 0.5) * (bw + 4) + fr * 0.15;
            const y = floorY + 0.1;
            const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - bw / 2, y, z - bw / 2), new THREE.Vector3(x + bw / 2, y, z - bw / 2),
                new THREE.Vector3(x + bw / 2, y, z + bw / 2), new THREE.Vector3(x - bw / 2, y, z + bw / 2)]),
            new THREE.LineBasicMaterial({color: 0xffffff}));
            world.scene.add(outline);
            const slab = kit.box(THREE, bw - 1, 0.25, bw - 1, new THREE.MeshStandardMaterial({color: 0x7a6555,
                transparent: true, opacity: 0.55, roughness: 1}));
            slab.position.set(x, y, z);
            world.scene.add(slab);
            const info = {id: b.id, pickId: b.id, title: 'Bloque ' + b.id + ' — banco activo',
                rows: [['Ley Cu (modelo de bloques)', fmt(b.grade, 2) + ' %'], ['Tonelaje', fmt(b.tonnes) + ' t'],
                    ['Dimensiones', bw + ' × ' + bw + ' × ' + fmt(pit.H, 0) + ' m']]};
            world.addPickable(slab, info);
            world.addLabel({x: x, y: y + 2, z: z}, pin(b.id, 'mlx-pin--block'), '', info);
        });
        world.addFocus('blocks', {x: -pit.L * 0.15, y: floorY, z: fr * 0.15}, 140, 0.4, 0.95);

        // Sala de despacho en el borde del rajo.
        const dpos = {x: -pit.L - 20, z: -pit.R - 45};
        const trailer = place(world, kit.siteOffice(THREE, 'DESPACHO MINA'), dpos.x, dpos.z, terrain, 0.2);
        const dc = data.dispatch;
        const dinfo = {id: 'dispatch', title: 'Despacho mina — ciclo promedio del turno',
            rows: [['Carga (aculatamiento + carguío)', fmt(dc.carga, 1) + ' min'], ['Viaje cargado', fmt(dc.cargado, 1) + ' min'],
                ['Descarga', fmt(dc.descarga, 1) + ' min'], ['Viaje vacío', fmt(dc.vacio, 1) + ' min'],
                ['Esperas y maniobras', fmt(dc.cola, 1) + ' min'], ['Carga útil promedio', fmt(data.truck.payload) + ' t']]};
        world.addPickable(trailer, dinfo);
        world.addLabel({x: dpos.x, y: trailer.position.y + 10, z: dpos.z}, tag('Despacho'), '', dinfo);
        world.addFocus('dispatch', trailer.position, 45, 0.9, 0.35);
        place(world, kit.pickup(THREE, null, 'SUP-01', 'tx'), dpos.x + 9, dpos.z + 8, terrain, 0.25);
        place(world, kit.pickup(THREE, null, 'CAM-12', 'hx'), dpos.x + 15, dpos.z + 7, terrain, 0.2);

        // Portal de la rampa de exploración subterránea (pared poniente).
        const sToe = (pit.n - 1) * pit.period + pit.face;
        const rToe = pit.R - sToe;
        const qW = 4 * pit.L + Math.PI * rToe + Math.PI / 2 * rToe + 15;
        const pw = pit.benchLinePoint(qW, sToe) || pit.ringPoint(qW, rToe);
        const pg = portal(world, M, {x: pw.x + 0.4, y: floorY, z: pw.z}, Math.PI, ['RAMPA DE EXPLORACIÓN',
            'VENTILACIÓN AUXILIAR 100 %']);
        pg.scale.setScalar(1.3);
        const pinfo2 = {id: 'portal', title: 'Rampa de exploración subterránea',
            rows: [['Dotación máxima por turno', data.portal.people + ' personas']].concat(
                data.portal.equipment.map(e => [e.name, fmt(e.hp) + ' HP (diésel)']))};
        world.addPickable(pg, pinfo2);
        world.addLabel({x: pw.x, y: floorY + 10, z: pw.z}, tag('Rampa subterránea'), '', pinfo2);
        world.addFocus('portal', {x: pw.x, y: floorY + 4, z: pw.z}, 40, Math.PI / 2 - 0.3, 0.2);
        const lhd4 = place(world, models.lhd(THREE), pw.x + 22, pw.z + 8, terrain, Math.PI + 0.1);
        const jum4 = place(world, models.jumbo(THREE), pw.x + 24, pw.z - 9, terrain, Math.PI - 0.1);
        world.addPickable(lhd4, {id: 'lhd', title: 'Cargador LHD (scoop) de bajo perfil',
            rows: [['Potencia', '275 HP (diésel)'], ['Capacidad', '14 t']]});
        world.addPickable(jum4, {id: 'jumbo', title: 'Jumbo de perforación de dos brazos',
            rows: [['Potencia', '120 HP (diésel)'], ['Uso', 'Desarrollo de la rampa de exploración']]});
        const duct = kit.cyl(THREE, 0.7, 0.7, 30, new THREE.MeshStandardMaterial({color: 0xffc400, roughness: 0.7}), 16);
        duct.rotation.z = Math.PI / 2;
        duct.position.set(pw.x + 16, floorY + 5.6, pw.z + 2.6);
        world.scene.add(duct);

        // Botadero y chancador fuera del rajo.
        const dump = new THREE.Mesh(new THREE.CylinderGeometry(160, 230, 45, 48, 1), new THREE.MeshStandardMaterial({
            color: 0x9b8169, roughness: 1, map: kit.detailTextures(THREE, 4).map}));
        dump.position.set(pit.L + pit.R + 330, terrain.heightAt(pit.L + pit.R + 330, -80) + 20, -80);
        dump.castShadow = true;
        dump.receiveShadow = true;
        world.scene.add(dump);
        world.addLabel({x: dump.position.x, y: dump.position.y + 30, z: dump.position.z}, tag('Botadero de lastre'));
        const dz4 = place(world, models.bulldozer(THREE), dump.position.x - 250, -80, terrain, 0);
        shuttle(world, dz4, {x: dump.position.x - 258, z: -80}, {x: dump.position.x - 236, z: -80}, terrain,
            {speed: 1.6, reverse: true});
        vehicleFx(world, dz4, {rear: -3, width: 3, size: 2.8, front: 4.6, lightY: 4.2});
        const crusher = kit.box(THREE, 24, 18, 18, M.concrete);
        crusher.position.set(-pit.L - pit.R - 120, terrain.heightAt(-pit.L - pit.R - 120, 60) + 9, 60);
        world.scene.add(crusher);
        world.addLabel({x: crusher.position.x, y: crusher.position.y + 14, z: crusher.position.z}, tag('Chancado primario'));

        const wp = pit.wallPoint(1, 0, 0.5);
        world.addFocus('wall', {x: 0, y: wp.y - pit.H * 0.5, z: wp.z + pit.period}, 95, 0.0, 0.2);
        const rp = pit.rampAt(Math.floor(pit.path.length * 0.15));
        world.addFocus('ramp', {x: rp.x, y: rp.y, z: rp.z}, 85, 0.3, 0.6);
        world.addFocus('iso', {x: 0, y: -pit.depth * 0.6, z: 0}, (pit.L + pit.R) * 2.2, 0.7, 0.6);
        world.addFocus('plan', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.7, 0.0, 1.5);
        world.addFocus('section', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.2, 0.0, 0.1);
        return {tools: ['explore', 'measure'], start: 'iso'};
    };

    // =====================================================================
    // Semestre V — emplazamiento del proyecto.
    // =====================================================================
    const sceneS5 = function(world, data) {
        const THREE = world.THREE;
        const M = kit.materials(THREE);
        const plant = {x: -520, z: 260, y: 30};
        const pads = [{x: plant.x, z: plant.z, w: 260, d: 160, y: plant.y, blend: 80}];
        const sitePos = {A: {x: -260, z: 650}, B: {x: 120, z: 720}, C: {x: -760, z: 640}};
        data.sites.forEach(function(s) {
            const p = sitePos[s.id];
            if (!s.downstream) {
                p.z = -520;
                p.x = s.id === 'A' ? -180 : (s.id === 'B' ? 260 : -640);
            }
            p.z = s.downstream ? Math.max(350, 900 - Math.min(s.river, 1500) * 0.4) : p.z;
            p.y = plant.y - s.below;
            pads.push({x: p.x, z: p.z, r: 70, y: p.y, blend: 320});
        });
        const camp = {x: 520, z: 120, y: 18};
        pads.push({x: camp.x, z: camp.z, w: 160, d: 110, y: camp.y, blend: 70});
        const extPatch = {minX: -1100, maxX: 900, minZ: -800, maxZ: 1150};
        const base = pitWorld(world, data, {seed: 55, relief: 30, rocks: 700, margin: 80, maxVerts: 240000,
            minCell: 1.0, pads: pads, farHole: extPatch});
        const pit = base.pit;
        const terrain = base.terrain;
        const floorY = -pit.depth;
        // Terreno extendido (planta, sitios y campamento) sobre el terreno lejano.
        const b0 = pit.bounds;
        const riverZ = x => 1000 + Math.sin(x * 0.004) * 60;
        const carve = function(x, z, y) {
            const d = Math.abs(z - riverZ(x));
            return y - 9 * (1 - kit.smooth(14, 70, d));
        };
        const ext = kit.buildTerrain(world, {seed: 55, relief: 30, pit: pit, pads: pads, patch: extPatch, cell: 5,
            modify: carve,
            noFar: true, collar: 0, hole: {minX: b0.minX - 75, maxX: b0.maxX + 75, minZ: b0.minZ - 75, maxZ: b0.maxZ + 75}});
        ext.mesh.position.y = -0.6;
        const hAt = function(x, z) {
            const b = pit.bounds;
            if (x > b.minX - 70 && x < b.maxX + 70 && z > b.minZ - 70 && z < b.maxZ + 70) {
                return terrain.heightAt(x, z);
            }
            return ext.heightAt(x, z) - 0.6;
        };
        const tr = {heightAt: hAt};

        // Información del rajo.
        const pitInfo = {id: 'pit', title: 'Rajo «Cobre Los Andes»',
            rows: [['Reservas probadas + probables', fmt(data.reserves) + ' Mt'], ['Ley media', fmt(data.grade, 2) + ' % Cu'],
                ['Bancos', pit.n + ' × ' + fmt(pit.H, 0) + ' m'], ['Método', 'Rajo abierto, camión-pala']]};
        const board = kit.signPost(THREE, M, ['PROYECTO COBRE LOS ANDES', 'RESERVAS ' + fmt(data.reserves) + ' Mt @ ' +
            fmt(data.grade, 2) + ' % Cu'], {bg: '#004d40', fg: '#fff', border: '#fff', width: 7, height: 2.2, pole: 2.5});
        place(world, board, -pit.L - 10, -pit.R - 25, tr, 0.1);
        world.addPickable(board, pitInfo);
        world.addLabel({x: -pit.L - 10, y: 8, z: -pit.R - 25}, tag('Rajo'), '', pitInfo);
        world.addFocus('pit', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.2, 0.6, 0.6);

        // Sumidero en el fondo, cañería y piscina de descarga en el borde.
        const fr = pit.floorRadius;
        const sump = kit.water(world, new THREE.CircleGeometry(12, 40).rotateX(-Math.PI / 2));
        sump.position.set(pit.L * 0.3, floorY + 0.25, fr * 0.2);
        world.snapPoints = world.snapPoints || [];
        world.snapPoints.push(new THREE.Vector3(sump.position.x, floorY, sump.position.z));
        const pumpInfo = {id: 'sump', title: 'Sumidero y bomba de drenaje',
            rows: [['Caudal de diseño', fmt(data.pump.flow) + ' L/s'], ['Pérdidas de carga', fmt(data.pump.losses, 1) + ' m'],
                ['Eficiencia bomba-motor', fmt(data.pump.eta * 100) + ' %']],
            text: 'Mide el desnivel entre el sumidero y la piscina de descarga en el borde del rajo.'};
        const pump = kit.box(THREE, 3, 2, 2, M.blue);
        pump.position.set(sump.position.x - 15, floorY + 1, sump.position.z);
        world.scene.add(pump);
        world.addPickable(pump, pumpInfo);
        world.addLabel({x: pump.position.x, y: floorY + 4, z: pump.position.z}, tag('Sumidero'), '', pumpInfo);
        const pondPos = {x: pit.L * 0.3, z: -pit.R - 30};
        const pond = kit.water(world, new THREE.PlaneGeometry(30, 20).rotateX(-Math.PI / 2));
        pond.position.set(pondPos.x, hAt(pondPos.x, pondPos.z) + 0.3, pondPos.z);
        world.snapPoints.push(new THREE.Vector3(pondPos.x, pond.position.y - 0.3, pondPos.z));
        world.addLabel({x: pondPos.x, y: pond.position.y + 4, z: pondPos.z}, tag('Piscina de descarga'), '', pumpInfo);
        const pipePts = [new THREE.Vector3(pump.position.x, floorY + 1, pump.position.z)];
        for (let i = pit.path.length - 1; i >= 0; i -= 20) {
            const p = pit.path[i];
            const o = pit.ringPoint(p.q, p.r + pit.params.rampWidth / 2 - 1.2);
            pipePts.push(new THREE.Vector3(o.x, p.y + 0.6, o.z));
        }
        pipePts.push(new THREE.Vector3(pondPos.x, pond.position.y + 0.6, pondPos.z));
        const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pipePts), 400, 0.35, 8),
            new THREE.MeshStandardMaterial({color: 0x263238, roughness: 0.6}));
        pipe.castShadow = true;
        world.scene.add(pipe);
        world.addFocus('sump', {x: pit.L * 0.3, y: floorY * 0.5, z: 0}, (pit.R) * 2.2, Math.PI / 2, 0.25);
        rampTruck(world, pit, 150, 0.1, {id: 'truck', title: 'Camión de extracción', rows: [['Carga útil', '150 t']]});
        place(world, kit.ropeShovel(THREE, M), -pit.L * 0.3, -fr * 0.3, tr, 0).scale.setScalar(0.7);

        // Planta concentradora.
        const pg = new THREE.Group();
        const conc = kit.box(THREE, 90, 28, 45, M.white);
        conc.position.set(0, 14, 0);
        pg.add(conc);
        const croof = kit.box(THREE, 92, 2, 47, M.roof);
        croof.position.set(0, 29, 0);
        pg.add(croof);
        for (let i = 0; i < 2; i++) {
            const mill = kit.cyl(THREE, 6, 6, 12, M.darkSteel, 24);
            mill.rotation.z = Math.PI / 2;
            mill.position.set(-25 + i * 20, 8, 30);
            pg.add(mill);
        }
        for (let i = 0; i < 2; i++) {
            const th = kit.cyl(THREE, 22, 22, 6, M.concrete, 40);
            th.position.set(70, 3, -40 + i * 55);
            pg.add(th);
            const tw = new THREE.Mesh(new THREE.CircleGeometry(21, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({
                color: 0x5d6b5e, roughness: 0.15, metalness: 0.1}));
            tw.position.set(70, 6.05, -40 + i * 55);
            pg.add(tw);
        }
        const stock = new THREE.Mesh(new THREE.ConeGeometry(30, 22, 40), new THREE.MeshStandardMaterial({color: 0x6f5e50,
            roughness: 1}));
        stock.position.set(-80, 11, -40);
        stock.castShadow = true;
        pg.add(stock);
        for (let i = 0; i < 8; i++) {
            const cell = kit.box(THREE, 6, 5, 6, M.blue);
            cell.position.set(-30 + i * 8, 2.5, -40);
            pg.add(cell);
        }
        place(world, pg, plant.x, plant.z, tr, 0.15);
        const plantInfo = {id: 'plant', title: 'Planta concentradora', rows: [['Proceso', 'Chancado, molienda SAG, flotación'],
            ['Cota de descarga de relaves', fmt(data.origin.Z + plant.y, 0) + ' m s. n. m.']]};
        world.addPickable(pg, plantInfo);
        world.addLabel({x: plant.x, y: plant.y + 40, z: plant.z}, tag('Planta concentradora'), '', plantInfo);
        // Correa desde el rajo.
        const beltPts = [new THREE.Vector3(-pit.L - 40, 4, -40), new THREE.Vector3(plant.x - 80, plant.y + 22, plant.z - 40)];
        const belt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beltPts), 10, 1.6, 6),
            new THREE.MeshStandardMaterial({color: 0x9e9e9e, roughness: 0.5, metalness: 0.5}));
        belt.castShadow = true;
        world.scene.add(belt);

        // Río.
        const riverPts = [];
        for (let x = -1095; x <= 895; x += 10) {
            const z = riverZ(x);
            riverPts.push(new THREE.Vector3(x, hAt(x, z) + 2.6, z));
        }
        const rv = [];
        const ri = [];
        riverPts.forEach(function(p, i) {
            const a = riverPts[Math.max(0, i - 1)];
            const b = riverPts[Math.min(riverPts.length - 1, i + 1)];
            const tx = b.x - a.x;
            const tz = b.z - a.z;
            const tl = Math.hypot(tx, tz) || 1;
            const w = 11 + Math.sin(i * 0.3) * 2;
            rv.push(p.x + tz / tl * w, p.y, p.z - tx / tl * w, p.x - tz / tl * w, p.y, p.z + tx / tl * w);
            if (i > 0) {
                const o = (i - 1) * 2;
                ri.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
            }
        });
        const rgeo = new THREE.BufferGeometry();
        rgeo.setAttribute('position', new THREE.Float32BufferAttribute(rv, 3));
        rgeo.setIndex(ri);
        rgeo.computeVertexNormals();
        kit.water(world, rgeo);
        world.addLabel({x: 0, y: hAt(0, 1000) + 10, z: 1000}, tag('Río'));

        // Sitios candidatos para el depósito de relaves.
        data.sites.forEach(function(s) {
            const p = sitePos[s.id];
            const y = hAt(p.x, p.z);
            const ring = [];
            for (let a = 0; a <= 48; a++) {
                const t = a / 48 * Math.PI * 2;
                ring.push(new THREE.Vector3(p.x + Math.cos(t) * 95, hAt(p.x + Math.cos(t) * 95, p.z + Math.sin(t) * 95) + 0.6,
                    p.z + Math.sin(t) * 95));
            }
            world.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),
                new THREE.LineDashedMaterial({color: 0xffab00, dashSize: 8, gapSize: 5})).computeLineDistances());
            const post = kit.signPost(THREE, M, ['SITIO ' + s.id], {bg: '#ffab00', fg: '#111', width: 5, height: 2.4,
                pole: 3});
            place(world, post, p.x, p.z, tr, 0);
            const info = {id: 'site-' + s.id, pickId: s.id, title: 'Sitio candidato ' + s.id + ' — depósito de relaves',
                rows: [['Cota respecto de la descarga de planta', (s.below > 0 ? fmt(s.below) + ' m bajo' :
                    fmt(-s.below) + ' m sobre') + ' la descarga'], ['Distancia al río', fmt(s.river) + ' m'],
                ['Posición en la cuenca', s.downstream ? 'Aguas abajo del campamento' : 'Aguas arriba del campamento']]};
            world.addPickable(post, info);
            world.addLabel({x: p.x, y: y + 12, z: p.z}, pin(s.id, 'mlx-pin--site'), '', info);
        });
        world.addFocus('sites', {x: -300, y: 0, z: 500}, 1300, 0.15, 0.7);

        // Campamento.
        const cg = new THREE.Group();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                const mod = kit.box(THREE, 30, 3.2, 8, i % 2 ? M.white : new THREE.MeshStandardMaterial({color: 0xe0d6c3}));
                mod.position.set(-50 + i * 34, 1.6, -30 + j * 22);
                cg.add(mod);
            }
        }
        place(world, cg, camp.x, camp.z, tr, 0.1);
        world.addLabel({x: camp.x, y: camp.y + 12, z: camp.z}, tag('Campamento'));
        // Botadero.
        const dump = new THREE.Mesh(new THREE.CylinderGeometry(150, 220, 40, 48), new THREE.MeshStandardMaterial({
            color: 0x9b8169, roughness: 1}));
        dump.position.set(560, hAt(560, -380) + 18, -380);
        dump.castShadow = true;
        dump.receiveShadow = true;
        world.scene.add(dump);
        world.addLabel({x: 560, y: dump.position.y + 26, z: -380}, tag('Botadero'));
        const dz5 = place(world, models.bulldozer(THREE), 390, -380, tr, 0);
        shuttle(world, dz5, {x: 382, z: -380}, {x: 402, z: -380}, tr, {speed: 1.6, reverse: true});
        vehicleFx(world, dz5, {rear: -3, width: 3, size: 2.8, front: 4.6, lightY: 4.2});
        rampWater(world, pit, 0.6);
        place(world, models.pickup(THREE, 'CAM-05', 'lx'), -pit.L - 20, -pit.R - 32, tr, 0.6);

        world.addFocus('iso', {x: -150, y: 0, z: 300}, 1700, 0.55, 0.55);
        world.addFocus('plan', {x: -150, y: 0, z: 250}, 2200, 0.0, 1.5);
        world.addFocus('section', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.2, 0.0, 0.1);
        return {tools: ['explore', 'measure'], start: 'iso'};
    };

    // =====================================================================
    // Semestre I — ciclo minero (perforación, tronadura, carguío, transporte y descarga).
    // =====================================================================
    const sceneS1c = function(world, data) {
        const THREE = world.THREE;
        const base = pitWorld(world, data, {seed: 23, relief: 16, rocks: 700, margin: 120});
        const pit = base.pit;
        const terrain = base.terrain;
        const floorY = -pit.depth;
        const stage = function(p, txt, info) {
            world.addLabel({x: p.x, y: p.y, z: p.z}, '<span class="mlx-pin mlx-pin--stage">' + txt + '</span>', '', info);
        };

        // Perforación: malla de pozos sobre el próximo banco y perforadora.
        const bx = -45;
        const outline = [[-18, -14], [18, -14], [18, 14], [-18, 14]].map(c => new THREE.Vector3(bx + c[0], floorY + 0.1,
            c[1]));
        world.scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(outline),
            new THREE.LineBasicMaterial({color: 0xff3d00})));
        const collarGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.35, 10);
        const collarMat = new THREE.MeshStandardMaterial({color: 0x6b5b4b, roughness: 1});
        for (let x = -15; x <= 15; x += 5) {
            for (let z = -11; z <= 11; z += 4.5) {
                const c = new THREE.Mesh(collarGeo, collarMat);
                c.position.set(bx + x, floorY + 0.15, z);
                world.scene.add(c);
            }
        }
        const drill = place(world, kit.drillRig(THREE), bx + 8, -6, terrain, 0.4);
        world.addPickable(drill, {id: 'drill', title: 'Perforadora de pozos de tronadura',
            rows: [['Diámetro de perforación', '165 mm'], ['Malla', '5,0 × 5,5 m'], ['Profundidad', '11 m (banco + pasadura)']]});
        stage({x: bx, y: floorY + 24, z: 0}, 'Perforación');

        // Tronadura: pila de material tronado en el frente de carguío.
        const pile = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        const pp = pile.attributes.position;
        const nz = kit.makeNoise(31);
        for (let i = 0; i < pp.count; i++) {
            const x = pp.getX(i);
            const y = pp.getY(i);
            const z = pp.getZ(i);
            const f = 1 + nz.noise(x * 3 + 2, z * 3) * 0.12 + nz.noise(x * 9, z * 9 + 4) * 0.05;
            pp.setXYZ(i, x * f, y * f, z * f);
        }
        pile.computeVertexNormals();
        const pt = kit.detailTextures(THREE, 41);
        const pileMesh = new THREE.Mesh(pile, new THREE.MeshStandardMaterial({color: 0x8c7462, roughness: 1, map: pt.map,
            normalMap: pt.normal, normalScale: new THREE.Vector2(1.6, 1.6)}));
        pileMesh.scale.set(20, 6.5, 16);
        pileMesh.position.set(58, floorY - 0.3, 0);
        pileMesh.castShadow = true;
        pileMesh.receiveShadow = true;
        world.scene.add(pileMesh);
        kit.scatterRocks(world, 160, {minX: 34, maxX: 80, minZ: -20, maxZ: 20}, terrain.heightAt, 9,
            (x, z) => Math.hypot((x - 58) / 24, z / 19) > 0.85 && Math.hypot((x - 58) / 30, z / 24) < 1.05);
        stage({x: 58, y: floorY + 12, z: 0}, 'Tronadura');

        // Carguío: cargador frontal y camión bajo carga.
        const ld = data.loader;
        const loader = place(world, kit.wheelLoader(THREE), 36, -2, terrain, 0);
        const loaderInfo = {id: 'loader', title: 'Cargador frontal (equipo de carguío)',
            rows: [['Capacidad del balde', fmt(ld.bucket, 1) + ' m³'], ['Factor de llenado', fmt(ld.fill, 2)],
                ['Densidad del material esponjado', fmt(ld.loose, 2) + ' t/m³']]};
        world.addPickable(loader, loaderInfo);
        world.addFocus('loader', loader.position, 32, -0.75, 0.32);
        const truckInfo = {id: 'truck', title: 'Camión de extracción',
            rows: [['Carga útil nominal', fmt(data.truck.payload) + ' t'], ['Tipo', 'Camión mecánico de alto tonelaje']]};
        const lt = place(world, kit.haulTruck(THREE, null, data.truck.payload, false, 'C-10'), 30, 16, terrain,
            -Math.PI / 2 + 0.25);
        world.addPickable(lt, truckInfo);
        world.addFocus('truck', lt.position, 34, 1.1, 0.35);
        loaderCycle(world, loader, {x: 45, z: 0}, {x: 30, z: 7.5}, {x: 22, z: -3}, terrain);
        vehicleFx(world, loader, {rear: -5, width: 3, size: 2.4, front: 3, lightY: 5.6});
        stage({x: 32, y: floorY + 13, z: 6}, 'Carguío', loaderInfo);

        // Fila de camiones con su carga (T1–T6) para decidir el destino.
        const proto = kit.haulTruck(THREE, null, data.truck.payload, true, 'C-11');
        data.loads.forEach(function(l, i) {
            const tr = proto.clone();
            place(world, tr, -8 + i * 15, -34, terrain, 0);
            const info = {id: 'load-' + l.id, pickId: l.id, title: 'Carga ' + l.id + ' — camión ' + l.truck,
                rows: [['Ley de Cu (control de mineral)', fmt(l.grade, 2) + ' %'], ['Origen', 'Frente F-3, banco 2.635']]};
            world.addPickable(tr, info);
            world.addLabel({x: tr.position.x, y: tr.position.y + 9, z: tr.position.z}, pin(l.id, 'mlx-pin--block'), '', info);
        });
        world.addFocus('queue', {x: 30, y: floorY, z: -34}, 120, 0.35, 0.65);

        // Transporte: camiones recorriendo la rampa.
        for (let i = 0; i < data.truck.count; i++) {
            rampTruck(world, pit, data.truck.payload, i / data.truck.count, truckInfo);
        }
        const mid = pit.rampAt(Math.floor(pit.path.length * 0.45));
        stage({x: mid.x, y: mid.y + 12, z: mid.z}, 'Transporte');
        rampWater(world, pit, 0.55);
        const gr = place(world, models.motorGrader(THREE), -70, 28, terrain, 0);
        shuttle(world, gr, {x: -80, z: 30}, {x: -20, z: 30}, terrain, {speed: 2.2});
        vehicleFx(world, gr, {rear: -5, width: 2.8, size: 2.2, front: 4.5, lightY: 2.0});
        tower(world, terrain, -20, 22, -2.2);
        tower(world, terrain, 70, -20, 2.4);

        // Descarga: chancador primario en el borde (inicio de la rampa) y botadero.
        const start = pit.rampAt(0);
        const cx = start.x - 30;
        const cz = start.z - 40;
        const crusher = place(world, kit.crusherStation(THREE), cx, cz, terrain, Math.PI * 0.12);
        const be = crusher.userData.beltEnd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), crusher.rotation.y);
        const sx = cx + be.x - 10;
        const sz = cz + be.z;
        const stockpile = new THREE.Mesh(new THREE.ConeGeometry(26, 20, 48), new THREE.MeshStandardMaterial({
            color: 0x6f5e50, roughness: 1, map: pt.map}));
        stockpile.position.set(sx, terrain.heightAt(sx, sz) + 10, sz);
        stockpile.castShadow = true;
        world.scene.add(stockpile);
        stage({x: cx, y: crusher.position.y + 20, z: cz}, 'Chancado primario');
        const dump = new THREE.Mesh(new THREE.CylinderGeometry(70, 105, 22, 48), new THREE.MeshStandardMaterial({
            color: 0x9b8169, roughness: 1, map: pt.map}));
        const dx = pit.L + pit.R + 120;
        dump.position.set(dx, terrain.heightAt(dx, 40) + 10, 40);
        dump.castShadow = true;
        dump.receiveShadow = true;
        world.scene.add(dump);
        stage({x: dx, y: dump.position.y + 18, z: 40}, 'Botadero');
        const dz = place(world, models.bulldozer(THREE), dx - 110, 40, terrain, 0);
        shuttle(world, dz, {x: dx - 118, z: 40}, {x: dx - 100, z: 40}, terrain, {speed: 1.6, reverse: true});
        vehicleFx(world, dz, {rear: -3, width: 3, size: 2.8, front: 4.6, lightY: 4.2});

        // Despacho mina.
        const dpos = {x: start.x + 40, z: start.z - 30};
        const trailer = place(world, kit.siteOffice(THREE, 'DESPACHO MINA'), dpos.x, dpos.z, terrain, 0.2);
        place(world, kit.pickup(THREE, null, 'SUP-03', 'lx'), dpos.x - 10, dpos.z + 7, terrain, 0.3);
        place(world, kit.pickup(THREE, null, 'CAM-21', 'tx'), dpos.x - 4, dpos.z + 9, terrain, 0.35);
        const dc = data.dispatch;
        const dinfo = {id: 'dispatch', title: 'Despacho mina — ciclo promedio del turno',
            rows: [['Tiempo de carga', fmt(dc.carga, 1) + ' min'], ['Distancia frente → chancador', fmt(dc.distancia, 1) + ' km'],
                ['Velocidad media cargado', fmt(dc.velcargado) + ' km/h'], ['Descarga', fmt(dc.descarga, 1) + ' min'],
                ['Viaje vacío', fmt(dc.vacio, 1) + ' min'], ['Esperas y maniobras', fmt(dc.esperas, 1) + ' min'],
                ['Camiones en operación', String(dc.enoperacion)]]};
        world.addPickable(trailer, dinfo);
        world.addLabel({x: dpos.x, y: trailer.position.y + 11, z: dpos.z}, tag('Despacho'), '', dinfo);
        world.addFocus('dispatch', trailer.position, 28, 0.3, 0.3);
        place(world, kit.worker(THREE, null, true), dpos.x - 4, dpos.z + 3, terrain, 1.2);

        const wp = pit.wallPoint(1, 0, 0.5);
        world.addFocus('wall', {x: 0, y: wp.y - pit.H * 0.5, z: wp.z + pit.period}, 80, 0.0, 0.22);
        world.addFocus('iso', {x: 0, y: -pit.depth * 0.5, z: -20}, (pit.L + pit.R) * 2.4, 0.6, 0.62);
        world.addFocus('plan', {x: 0, y: -pit.depth * 0.5, z: -20}, (pit.L + pit.R) * 3.0, 0.0, 1.5);
        world.addFocus('section', {x: 0, y: -pit.depth * 0.5, z: 0}, (pit.L + pit.R) * 2.4, 0.0, 0.12);
        return {tools: ['explore', 'measure'], start: 'iso', drill: drill};
    };

    const builders = {s1: sceneS1, s1c: sceneS1c, s2: sceneS2, s3: sceneS3, s4: sceneS4, s5: sceneS5};

    /**
     * Construye la escena del caso.
     *
     * @param {Object} world
     * @param {string} id s1…s5
     * @param {Object} data datos de escena del servidor
     * @returns {Object}
     */
    const build = function(world, id, data) {
        world.snapPoints = world.snapPoints || [];
        world.focusLayers = {};
        const fn = builders[id];
        if (!fn) {
            throw new Error('Escena desconocida: ' + id);
        }
        return fn(world, data);
    };

    /**
     * Extensión de la escena (para sombras y niebla).
     *
     * @param {string} id
     * @param {Object} data
     */
    const extentFor = function(id, data) {
        if (data.pit) {
            if (id === 's5') {
                return 1100;
            }
            return (data.pit.halfLength + data.pit.radius) * 1.15;
        }
        return 420;
    };

    return {build: build, extentFor: extentFor, planeBasis: planeBasis};
});
