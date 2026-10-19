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
 * Efectos de faena: polvo dinámico de los camiones, riego del aljibe con huella
 * húmeda, viento con polvo en suspensión, neblina costera (camanchaca) y turno
 * de noche con focos de los equipos y torres de iluminación.
 *
 * @module     mod_minaslab/eval_fx
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    'use strict';

    const VS = [
        'attribute float aAge;',
        'attribute float aSize;',
        'varying float vAge;',
        'void main() {',
        '  vAge = aAge;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = aSize * (520.0 / max(1.0, -mv.z));',
        '  gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n');
    const FS = [
        'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'varying float vAge;',
        'void main() {',
        '  if (vAge <= 0.0 || vAge >= 1.0) discard;',
        '  vec2 c = gl_PointCoord - 0.5;',
        '  float r = length(c) * 2.0;',
        '  float a = smoothstep(1.0, 0.15, r) * smoothstep(0.0, 0.12, vAge) * pow(1.0 - vAge, 1.4);',
        '  gl_FragColor = vec4(uColor, a * uOpacity);',
        '}'
    ].join('\n');

    /**
     * Sistema de partículas con un conjunto fijo (pool) y sombreador propio.
     *
     * @param {Object} THREE
     * @param {Object} scene
     * @param {number} n capacidad
     * @param {Object} opt {color, opacity, grow, drag, gravity, blending}
     * @returns {Object}
     */
    const particles = function(THREE, scene, n, opt) {
        const pos = new Float32Array(n * 3);
        const vel = new Float32Array(n * 3);
        const age = new Float32Array(n);
        const life = new Float32Array(n);
        const size = new Float32Array(n);
        const size0 = new Float32Array(n);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aAge', new THREE.BufferAttribute(age, 1));
        geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
        const mat = new THREE.ShaderMaterial({
            vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
            blending: opt.blending || THREE.NormalBlending,
            uniforms: {uColor: {value: new THREE.Color(opt.color)}, uOpacity: {value: opt.opacity}}
        });
        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;
        pts.renderOrder = 5;
        scene.add(pts);
        let head = 0;
        return {
            points: pts, material: mat,
            emit: function(x, y, z, vx, vy, vz, s, l) {
                const i = head;
                head = (head + 1) % n;
                pos[i * 3] = x;
                pos[i * 3 + 1] = y;
                pos[i * 3 + 2] = z;
                vel[i * 3] = vx;
                vel[i * 3 + 1] = vy;
                vel[i * 3 + 2] = vz;
                age[i] = 0.0001;
                life[i] = l;
                size[i] = size0[i] = s;
            },
            update: function(dt, wind) {
                const g = opt.gravity || 0;
                const drag = Math.exp(-(opt.drag || 0.6) * dt);
                for (let i = 0; i < n; i++) {
                    if (age[i] <= 0 || age[i] >= 1) {
                        continue;
                    }
                    age[i] += dt / life[i];
                    vel[i * 3] = vel[i * 3] * drag + wind.x * (1 - drag);
                    vel[i * 3 + 1] = vel[i * 3 + 1] * drag - g * dt;
                    vel[i * 3 + 2] = vel[i * 3 + 2] * drag + wind.z * (1 - drag);
                    pos[i * 3] += vel[i * 3] * dt;
                    pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
                    pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
                    size[i] = size0[i] * (1 + (opt.grow || 0) * age[i]);
                }
                geo.attributes.position.needsUpdate = true;
                geo.attributes.aAge.needsUpdate = true;
                geo.attributes.aSize.needsUpdate = true;
            }
        };
    };

    /**
     * Crea el controlador de efectos del mundo.
     *
     * @param {Object} world mundo 3D (eval_kit)
     * @returns {Object}
     */
    const create = function(world) {
        const THREE = world.THREE;
        const scene = world.scene;
        const Q = world.quality || {particles: 1, lights: 14};
        const pq = Q.particles;
        const dust = particles(THREE, scene, Math.round(2400 * pq), {color: 0xb8a284, opacity: 0.55, grow: 2.6, drag: 0.9});
        const spray = particles(THREE, scene, Math.round(900 * pq), {color: 0xdfe9ee, opacity: 0.55, grow: 0.8, drag: 1.4,
            gravity: 6});
        const haze = particles(THREE, scene, Math.round(700 * pq), {color: 0xc8b496, opacity: 0.34, grow: 1.4, drag: 0.4});
        const wind = new THREE.Vector3(0.6, 0, 0.3);
        const state = {night: false, fog: false, wind: false};
        const wet = [];
        const lights = [];
        const fx = {state: state, wind: wind, emitters: [], sprayers: [], nightLights: [], area: null, dust: dust};

        // Huella húmeda: parches oscuros que se secan en ~90 s.
        const wetGeo = new THREE.PlaneGeometry(1, 1);
        wetGeo.rotateX(-Math.PI / 2);
        const wetPool = [];
        for (let i = 0; i < 90; i++) {
            const m = new THREE.Mesh(wetGeo, new THREE.MeshStandardMaterial({color: 0x2e2620, transparent: true, opacity: 0,
                roughness: 0.25, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3}));
            m.visible = false;
            m.renderOrder = 1;
            scene.add(m);
            wetPool.push({mesh: m, t: 0});
        }
        let wetHead = 0;
        const markWet = function(x, y, z, yaw, w) {
            const p = wetPool[wetHead];
            wetHead = (wetHead + 1) % wetPool.length;
            p.mesh.position.set(x, y + 0.06, z);
            p.mesh.rotation.y = yaw;
            p.mesh.scale.set(4.5, 1, w);
            p.mesh.visible = true;
            p.t = 0;
            wet.push({x: x, z: z, t: 0});
            if (wet.length > 400) {
                wet.shift();
            }
        };
        const isWet = function(x, z) {
            for (let i = wet.length - 1; i >= 0; i--) {
                const d = wet[i];
                if (d.t < 90 && Math.abs(d.x - x) < 9 && Math.abs(d.z - z) < 9) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Registra un vehículo que levanta polvo al moverse.
         *
         * @param {Object} obj grupo del vehículo (frente +x)
         * @param {Object} opt {rear: x trasero, width, height}
         */
        fx.addDustEmitter = function(obj, opt) {
            fx.emitters.push({obj: obj, opt: opt || {}, last: obj.position.clone(), acc: 0});
        };
        /**
         * Registra un aljibe: riega por las boquillas y deja la huella húmeda.
         *
         * @param {Object} obj camión aljibe
         * @param {number[][]} nozzles boquillas en coordenadas del modelo
         */
        fx.addSprayer = function(obj, nozzles) {
            fx.sprayers.push({obj: obj, nozzles: nozzles, last: obj.position.clone(), acc: 0, mark: 0});
        };
        /**
         * Registra una fuente de luz nocturna (focos de un equipo o torre).
         *
         * @param {Object} obj objeto al que se ancla
         * @param {Object} opt {pos:[x,y,z], dir:[x,y,z], kind: vehicle|tower, range}
         */
        fx.addNightLight = function(obj, opt) {
            fx.nightLights.push({obj: obj, opt: opt});
            if (state.night) {
                makeLight(fx.nightLights[fx.nightLights.length - 1]);
            }
        };

        const makeLight = function(nl) {
            if (nl.light || lights.length >= Q.lights) {
                return;
            }
            const o = nl.opt;
            const tower = o.kind === 'tower';
            const l = new THREE.SpotLight(tower ? 0xfff2d8 : 0xfff6e8, tower ? 9000 : 4000, o.range || (tower ? 160 : 110),
                tower ? 0.9 : 0.5, 0.55, 1.5);
            l.position.set(o.pos[0], o.pos[1], o.pos[2]);
            l.target.position.set(o.pos[0] + o.dir[0], o.pos[1] + o.dir[1], o.pos[2] + o.dir[2]);
            nl.obj.add(l);
            nl.obj.add(l.target);
            nl.light = l;
            lights.push(l);
        };

        const day = {
            sun: world.sun.intensity, sunColor: world.sun.color.clone(), hemi: world.hemi.intensity,
            exposure: world.renderer.toneMappingExposure, zenith: world.sky.uniforms.zenith.value.clone(),
            horizon: world.sky.uniforms.horizon.value.clone(), ground: world.sky.uniforms.ground.value.clone(),
            fogColor: world.scene.fog.color.clone(), fogNear: world.scene.fog.near, fogFar: world.scene.fog.far,
            sunDir: world.sunDir.clone()
        };
        // Materiales luminosos (focos, balizas): se buscan al aplicar el ambiente,
        // porque la escena se construye después de crear los efectos.
        const emissive = [];
        const collectEmissive = function() {
            scene.traverse(function(o) {
                if (o.isMesh && o.material && o.material.emissive && o.material.emissiveIntensity > 0.9 &&
                        o.material.userData.mlxBase === undefined) {
                    o.material.userData.mlxBase = o.material.emissiveIntensity;
                    emissive.push(o.material);
                }
            });
        };

        /**
         * Aplica el ambiente según el estado (noche, neblina, viento).
         */
        const apply = function() {
            const night = state.night;
            const fog = state.fog;
            const sky = world.sky.uniforms;
            if (night) {
                // Luz de luna suficiente para reconocer bancos y caminos fuera de los focos.
                world.sun.intensity = 0.42;
                world.sun.color.set(0x9db4e0);
                world.hemi.intensity = 0.22;
                world.renderer.toneMappingExposure = 1.35;
                sky.zenith.value.set(0x03060f);
                sky.horizon.value.set(fog ? 0x2a3038 : 0x141b28);
                sky.ground.value.set(0x07080a);
                world.sunDir.copy(new THREE.Vector3(-0.4, 0.75, 0.5).normalize());
                scene.environment = null;
                fx.nightLights.forEach(makeLight);
                lights.forEach(l => {
                    l.visible = true;
                });
            } else {
                world.sun.intensity = fog ? day.sun * 0.55 : day.sun;
                world.sun.color.copy(day.sunColor);
                world.hemi.intensity = fog ? day.hemi * 1.4 : day.hemi;
                world.renderer.toneMappingExposure = day.exposure;
                sky.zenith.value.copy(fog ? new THREE.Color(0xb9c0c6) : day.zenith);
                sky.horizon.value.copy(fog ? new THREE.Color(0xd6d9db) : day.horizon);
                sky.ground.value.copy(day.ground);
                world.sunDir.copy(day.sunDir);
                scene.environment = world.envTexture;
                lights.forEach(l => {
                    l.visible = false;
                });
            }
            collectEmissive();
            emissive.forEach(m => {
                m.emissiveIntensity = m.userData.mlxBase * (night ? 2.6 : 1);
            });
            if (fog) {
                // Camanchaca: reduce la visibilidad en proporción al tamaño de la faena.
                const ext = world.extent || 400;
                scene.fog.color.set(night ? 0x20262c : 0xcfd3d6);
                scene.fog.near = ext * 0.1;
                scene.fog.far = ext * (night ? 1.6 : 2.4);
            } else if (night) {
                scene.fog.color.set(0x0b0f16);
                scene.fog.near = day.fogNear * 0.6;
                scene.fog.far = day.fogFar * 0.5;
            } else {
                scene.fog.color.copy(day.fogColor);
                scene.fog.near = day.fogNear;
                scene.fog.far = day.fogFar;
            }
            wind.set(state.wind ? 6.5 : 0.6, 0, state.wind ? 2.8 : 0.3);
            dust.material.uniforms.uOpacity.value = night ? 0.3 : 0.55;
            dust.material.uniforms.uColor.value.set(night ? 0x6d6558 : 0xb8a284);
        };

        fx.set = function(name, on) {
            state[name] = !!on;
            apply();
        };

        const tmp = new THREE.Vector3();
        const side = new THREE.Vector3();
        world.updaters.push(function(dt) {
            // Polvo detrás de los vehículos en movimiento (menos sobre camino regado).
            fx.emitters.forEach(function(e) {
                const p = e.obj.getWorldPosition(tmp);
                const v = p.distanceTo(e.last) / Math.max(dt, 1e-3);
                e.last.copy(p);
                if (v < 0.8 || v > 80 || !e.obj.visible) {
                    return;
                }
                const k = isWet(p.x, p.z) ? 0.15 : 1;
                e.acc += dt * Math.min(40, v * 3.2) * k * (state.wind ? 1.4 : 1) * pq;
                const sc = e.obj.scale.x;
                while (e.acc > 1) {
                    e.acc -= 1;
                    const rear = (e.opt.rear || -4) * (0.9 + Math.random() * 0.2);
                    const w = (e.opt.width || 3) * (Math.random() - 0.5);
                    side.set(rear, 0.3, w).multiplyScalar(sc).applyQuaternion(e.obj.quaternion);
                    dust.emit(p.x + side.x, p.y + side.y + Math.random() * 0.8, p.z + side.z,
                        (Math.random() - 0.5) * 1.5, 0.6 + Math.random() * 1.2, (Math.random() - 0.5) * 1.5,
                        (e.opt.size || 3.2) * sc, 3.5 + Math.random() * 2.5);
                }
            });
            // Riego del aljibe.
            fx.sprayers.forEach(function(s) {
                const p = s.obj.getWorldPosition(tmp);
                const v = p.distanceTo(s.last) / Math.max(dt, 1e-3);
                s.last.copy(p);
                if (v < 0.5 || v > 80) {
                    return;
                }
                s.acc += dt * 160 * pq;
                const q = s.obj.quaternion;
                const back = new THREE.Vector3(-1, 0, 0).applyQuaternion(q);
                while (s.acc > 1) {
                    s.acc -= 1;
                    const nz = s.nozzles[Math.floor(Math.random() * s.nozzles.length)];
                    side.set(nz[0], nz[1], nz[2]).applyQuaternion(q).add(p);
                    const spread = (Math.random() - 0.5) * 5;
                    const lat = new THREE.Vector3(0, 0, 1).applyQuaternion(q).multiplyScalar(spread);
                    spray.emit(side.x, side.y, side.z, back.x * 4 + lat.x, 1.5 + Math.random(), back.z * 4 + lat.z,
                        0.45 + Math.random() * 0.4, 0.7 + Math.random() * 0.4);
                }
                s.mark += v * dt;
                if (s.mark > 3.5) {
                    s.mark = 0;
                    const tail = new THREE.Vector3(-8.5, 0, 0).applyQuaternion(q).add(p);
                    const yaw = Math.atan2(-back.z, back.x);
                    markWet(tail.x, p.y - 0.05, tail.z, yaw, 9);
                }
            });
            wetPool.forEach(function(w) {
                if (!w.mesh.visible) {
                    return;
                }
                w.t += dt;
                w.mesh.material.opacity = Math.max(0, 0.55 * (1 - w.t / 90));
                if (w.t > 90) {
                    w.mesh.visible = false;
                }
            });
            wet.forEach(d => {
                d.t += dt;
            });
            // Polvo en suspensión con viento.
            if (state.wind && fx.area) {
                const a = fx.area;
                fx.hazeAcc = (fx.hazeAcc || 0) + dt * 70 * pq;
                for (; fx.hazeAcc > 1; fx.hazeAcc--) {
                    const x = a.minX + Math.random() * (a.maxX - a.minX);
                    const z = a.minZ + Math.random() * (a.maxZ - a.minZ);
                    const y = (a.heightAt ? a.heightAt(x, z) : 0) + Math.random() * 6;
                    haze.emit(x, y, z, wind.x, 0.2, wind.z, 22 + Math.random() * 26, 7 + Math.random() * 5);
                }
            }
            dust.update(dt, wind);
            spray.update(dt, wind);
            haze.update(dt, wind);
        });
        apply();
        return fx;
    };

    return {create: create};
});
