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
 * Modelos procedurales detallados de equipos mineros a escala real.
 *
 * Técnicas: cajas con aristas redondeadas, perfiles extruidos con bisel,
 * neumáticos torneados con banda en chevrón, cilindros hidráulicos con vástago
 * cromado, barandas tubulares, pintura con barniz y polvo de faena procedural
 * acumulado en las partes bajas. Cada modelo se "hornea" en una malla por
 * material para reducir las llamadas de dibujo.
 *
 * Orientación: el frente de los vehículos mira a +x, y hacia arriba, z lateral.
 *
 * @module     mod_minaslab/eval_models
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    'use strict';

    const TAU = Math.PI * 2;
    const cache = new WeakMap();

    // ---------------------------------------------------------------------
    // Texturas y materiales.
    // ---------------------------------------------------------------------

    /**
     * Crea una textura de canvas.
     *
     * @param {Object} THREE
     * @param {number} w
     * @param {number} h
     * @param {Function} draw (ctx, w, h)
     * @param {boolean} color si es textura de color (sRGB)
     * @returns {Object}
     */
    const canvasTex = function(THREE, w, h, draw, color) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        draw(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c);
        if (color) {
            t.colorSpace = THREE.SRGBColorSpace;
        }
        t.anisotropy = 8;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return t;
    };

    /**
     * Polvo de faena: oscurece y tiñe de tierra las partes bajas del equipo
     * (coordenadas del modelo) con ruido de valor 3D.
     *
     * @param {Object} mat material estándar o físico
     * @param {number} height altura (m) hasta la que llega el polvo
     * @param {number} amount intensidad 0–1
     * @returns {Object}
     */
    const dusty = function(mat, height, amount) {
        mat.onBeforeCompile = function(sh) {
            sh.uniforms.mlxDustH = {value: height};
            sh.uniforms.mlxDustK = {value: amount};
            sh.vertexShader = sh.vertexShader
                .replace('#include <common>', '#include <common>\nvarying vec3 vMlxObj;')
                .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMlxObj = position;');
            sh.fragmentShader = sh.fragmentShader
                .replace('#include <common>', [
                    '#include <common>',
                    'varying vec3 vMlxObj;',
                    'uniform float mlxDustH;',
                    'uniform float mlxDustK;',
                    'float mlxH(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }',
                    'float mlxN(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
                    '  return mix(mix(mix(mlxH(i), mlxH(i + vec3(1,0,0)), f.x), mix(mlxH(i + vec3(0,1,0)),',
                    '  mlxH(i + vec3(1,1,0)), f.x), f.y), mix(mix(mlxH(i + vec3(0,0,1)), mlxH(i + vec3(1,0,1)), f.x),',
                    '  mix(mlxH(i + vec3(0,1,1)), mlxH(i + vec3(1,1,1)), f.x), f.y), f.z); }'
                ].join('\n'))
                .replace('#include <map_fragment>', [
                    '#include <map_fragment>',
                    'float mlxNoise = mlxN(vMlxObj * 2.3) * 0.6 + mlxN(vMlxObj * 9.0) * 0.4;',
                    'float mlxD = (1.0 - smoothstep(0.0, mlxDustH, vMlxObj.y + (mlxNoise - 0.5) * mlxDustH * 0.5));',
                    'mlxD = clamp(mlxD * mlxDustK + (mlxNoise - 0.55) * 0.18 * mlxDustK, 0.0, 1.0);',
                    'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.47, 0.37, 0.28), mlxD);'
                ].join('\n'))
                .replace('#include <roughnessmap_fragment>',
                    '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.95, mlxD);');
        };
        mat.customProgramCacheKey = () => 'mlx-dust-' + height + '-' + amount;
        return mat;
    };

    /**
     * Materiales compartidos (uno por espacio de nombres THREE).
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const mats = function(THREE) {
        if (cache.has(THREE)) {
            return cache.get(THREE);
        }
        const tread = canvasTex(THREE, 64, 256, function(g, w, h) {
            // Mapa normal de relieve fino del caucho.
            g.fillStyle = 'rgb(128,128,255)';
            g.fillRect(0, 0, w, h);
            for (let i = 0; i < 900; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                g.fillStyle = 'rgba(' + (100 + Math.random() * 56) + ',' + (100 + Math.random() * 56) + ',255,0.6)';
                g.fillRect(x, y, 2, 2);
            }
        }, false);
        const grille = canvasTex(THREE, 256, 128, function(g, w, h) {
            g.fillStyle = '#16181a';
            g.fillRect(0, 0, w, h);
            for (let x = 4; x < w; x += 10) {
                const gr = g.createLinearGradient(x, 0, x + 6, 0);
                gr.addColorStop(0, '#3a3f44');
                gr.addColorStop(0.5, '#6d7379');
                gr.addColorStop(1, '#2a2e32');
                g.fillStyle = gr;
                g.fillRect(x, 4, 6, h - 8);
            }
        }, true);
        const stripes = canvasTex(THREE, 256, 64, function(g, w, h) {
            g.fillStyle = '#f2b51d';
            g.fillRect(0, 0, w, h);
            g.fillStyle = '#151515';
            for (let x = -h; x < w + h; x += 48) {
                g.beginPath();
                g.moveTo(x, h);
                g.lineTo(x + 24, h);
                g.lineTo(x + 24 + h, 0);
                g.lineTo(x + h, 0);
                g.closePath();
                g.fill();
            }
        }, true);
        const louver = canvasTex(THREE, 128, 128, function(g, w, h) {
            g.fillStyle = '#d7d9d6';
            g.fillRect(0, 0, w, h);
            for (let y = 6; y < h; y += 10) {
                g.fillStyle = '#8f9493';
                g.fillRect(6, y, w - 12, 4);
                g.fillStyle = '#f4f5f2';
                g.fillRect(6, y + 4, w - 12, 1);
            }
        }, true);
        const P = (o) => new THREE.MeshPhysicalMaterial(o);
        const S = (o) => new THREE.MeshStandardMaterial(o);
        const m = {
            yellow: dusty(P({color: 0xf0ae19, roughness: 0.42, metalness: 0.12, clearcoat: 0.55,
                clearcoatRoughness: 0.35}), 2.6, 0.85),
            yellowHi: dusty(P({color: 0xf0ae19, roughness: 0.42, metalness: 0.12, clearcoat: 0.55,
                clearcoatRoughness: 0.35}), 7, 0.55),
            white: dusty(P({color: 0xeeeeea, roughness: 0.4, metalness: 0.05, clearcoat: 0.6,
                clearcoatRoughness: 0.3}), 1.2, 0.7),
            red: dusty(P({color: 0xb71c1c, roughness: 0.4, metalness: 0.1, clearcoat: 0.5}), 1.5, 0.6),
            steel: dusty(S({color: 0x3a3d40, roughness: 0.55, metalness: 0.65}), 2.2, 0.75),
            steelLight: S({color: 0x8d9296, roughness: 0.38, metalness: 0.85}),
            chrome: S({color: 0xe8e8e8, roughness: 0.12, metalness: 1.0}),
            rubber: dusty(S({color: 0x151515, roughness: 0.9, metalness: 0, normalMap: tread,
                normalScale: new THREE.Vector2(0.6, 0.6)}), 1.4, 0.55),
            rim: dusty(S({color: 0x9b9c96, roughness: 0.45, metalness: 0.6}), 1.6, 0.7),
            glass: P({color: 0x0f1d26, roughness: 0.04, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.05,
                transparent: true, opacity: 0.62, envMapIntensity: 2.4, side: THREE.DoubleSide}),
            black: S({color: 0x101112, roughness: 0.7, metalness: 0.2}),
            grille: S({map: grille, roughness: 0.5, metalness: 0.5}),
            stripes: S({map: stripes, roughness: 0.6, metalness: 0.1}),
            louver: dusty(S({map: louver, roughness: 0.5, metalness: 0.3}), 3, 0.5),
            headlight: S({color: 0xffffff, emissive: 0xfff2cf, emissiveIntensity: 2.2, roughness: 0.2}),
            taillight: S({color: 0xff2020, emissive: 0xc00000, emissiveIntensity: 1.2, roughness: 0.3}),
            amber: S({color: 0xffb000, emissive: 0xff8c00, emissiveIntensity: 1.6, roughness: 0.3}),
            orange: S({color: 0xff6a00, roughness: 0.6, side: THREE.DoubleSide}),
            hivis: S({color: 0xc6ff1a, roughness: 0.65, emissive: 0x1f2a00}),
            reflect: S({color: 0xe0e0e0, roughness: 0.2, metalness: 0.9, emissive: 0x303030}),
            denim: S({color: 0x1f3a5f, roughness: 0.85}),
            skin: S({color: 0xc08a64, roughness: 0.7}),
            boot: S({color: 0x2b1d14, roughness: 0.8}),
            rope: S({color: 0x2a2a2a, roughness: 0.5, metalness: 0.8}),
            rock: S({color: 0x7f6652, roughness: 1}),
            wood: S({color: 0x8b6a43, roughness: 0.85})
        };
        cache.set(THREE, m);
        return m;
    };

    // ---------------------------------------------------------------------
    // Primitivas.
    // ---------------------------------------------------------------------

    /**
     * Caja con todas las aristas redondeadas, centrada en el origen.
     *
     * @param {Object} THREE
     * @param {number} w ancho (x)
     * @param {number} h alto (y)
     * @param {number} d fondo (z)
     * @param {number} r radio de redondeo
     * @returns {Object} BufferGeometry
     */
    const rbox = function(THREE, w, h, d, r) {
        r = Math.max(0.005, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01));
        const iw = w - 2 * r;
        const ih = h - 2 * r;
        const c = Math.min(r, iw / 2 - 0.001, ih / 2 - 0.001);
        const s = new THREE.Shape();
        const x0 = -iw / 2;
        const y0 = -ih / 2;
        s.moveTo(x0 + c, y0);
        s.lineTo(x0 + iw - c, y0);
        s.quadraticCurveTo(x0 + iw, y0, x0 + iw, y0 + c);
        s.lineTo(x0 + iw, y0 + ih - c);
        s.quadraticCurveTo(x0 + iw, y0 + ih, x0 + iw - c, y0 + ih);
        s.lineTo(x0 + c, y0 + ih);
        s.quadraticCurveTo(x0, y0 + ih, x0, y0 + ih - c);
        s.lineTo(x0, y0 + c);
        s.quadraticCurveTo(x0, y0, x0 + c, y0);
        const g = new THREE.ExtrudeGeometry(s, {depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelSize: r,
            bevelThickness: r, bevelSegments: 2, curveSegments: 3});
        g.translate(0, 0, -(d - 2 * r) / 2);
        return g;
    };

    /**
     * Malla con sombras.
     *
     * @param {Object} THREE
     * @param {Object} geo
     * @param {Object} mat
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Object}
     */
    const mesh = function(THREE, geo, mat, x, y, z) {
        const o = new THREE.Mesh(geo, mat);
        o.position.set(x || 0, y || 0, z || 0);
        o.castShadow = true;
        o.receiveShadow = true;
        return o;
    };

    /**
     * Agrega una caja redondeada al grupo.
     *
     * @param {Object} g grupo
     * @param {Object} THREE
     * @param {Object} mat
     * @param {number[]} size [w, h, d]
     * @param {number[]} pos [x, y, z]
     * @param {number} r radio
     * @param {number[]} rot [rx, ry, rz]
     * @returns {Object}
     */
    const rb = function(g, THREE, mat, size, pos, r, rot) {
        const o = mesh(THREE, rbox(THREE, size[0], size[1], size[2], r === undefined ? 0.08 : r), mat, pos[0], pos[1], pos[2]);
        if (rot) {
            o.rotation.set(rot[0], rot[1], rot[2]);
        }
        g.add(o);
        return o;
    };

    /**
     * Cilindro entre dos puntos.
     *
     * @param {Object} THREE
     * @param {Object} a Vector3
     * @param {Object} b Vector3
     * @param {number} r radio
     * @param {Object} mat
     * @param {number} seg segmentos radiales
     * @returns {Object}
     */
    const rod = function(THREE, a, b, r, mat, seg) {
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        const o = mesh(THREE, new THREE.CylinderGeometry(r, r, len, seg || 12, 1), mat);
        o.position.copy(a).addScaledVector(dir, 0.5);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        return o;
    };

    /**
     * Cilindro hidráulico: camisa pintada y vástago cromado.
     *
     * @param {Object} g grupo
     * @param {Object} THREE
     * @param {Object} M materiales
     * @param {number[]} a anclaje inferior
     * @param {number[]} b anclaje superior
     * @param {number} r radio de la camisa
     */
    const hydraulic = function(g, THREE, M, a, b, r) {
        const A = new THREE.Vector3(a[0], a[1], a[2]);
        const B = new THREE.Vector3(b[0], b[1], b[2]);
        const mid = A.clone().lerp(B, 0.55);
        g.add(rod(THREE, A, mid, r, M.steel, 16));
        g.add(rod(THREE, mid.clone().lerp(A, 0.05), B, r * 0.55, M.chrome, 14));
        [A, B].forEach(function(p) {
            const eye = mesh(THREE, new THREE.SphereGeometry(r * 1.15, 12, 8), M.steel, p.x, p.y, p.z);
            g.add(eye);
        });
    };

    /**
     * Tubo a lo largo de una polilínea (barandas, mangueras, cables).
     *
     * @param {Object} THREE
     * @param {number[][]} pts puntos
     * @param {number} r radio
     * @param {Object} mat
     * @param {boolean} curved suavizar la curva
     * @returns {Object}
     */
    const tube = function(THREE, pts, r, mat, curved) {
        const v = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        let path;
        if (curved) {
            path = new THREE.CatmullRomCurve3(v);
        } else {
            path = new THREE.CurvePath();
            for (let i = 0; i < v.length - 1; i++) {
                path.add(new THREE.LineCurve3(v[i], v[i + 1]));
            }
        }
        const segs = curved ? Math.max(12, pts.length * 8) : (pts.length - 1) * 2;
        return mesh(THREE, new THREE.TubeGeometry(path, segs, r, 8, false), mat);
    };

    /**
     * Baranda con postes, pasamanos y travesaño medio.
     *
     * @param {Object} g grupo
     * @param {Object} THREE
     * @param {Object} mat
     * @param {number[][]} pts recorrido a la altura del piso
     * @param {number} h altura
     */
    const railing = function(g, THREE, mat, pts, h) {
        h = h || 1.05;
        g.add(tube(THREE, pts.map(p => [p[0], p[1] + h, p[2]]), 0.03, mat));
        g.add(tube(THREE, pts.map(p => [p[0], p[1] + h * 0.5, p[2]]), 0.022, mat));
        const A = new THREE.Vector3();
        const B = new THREE.Vector3();
        for (let i = 0; i < pts.length - 1; i++) {
            A.set(pts[i][0], pts[i][1], pts[i][2]);
            B.set(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
            const n = Math.max(1, Math.round(A.distanceTo(B) / 1.4));
            for (let k = 0; k <= n; k++) {
                if (k === n && i < pts.length - 2) {
                    continue;
                }
                const p = A.clone().lerp(B, k / n);
                g.add(rod(THREE, p, p.clone().setY(p.y + h), 0.028, mat, 6));
            }
        }
    };

    /**
     * Escalera inclinada con largueros y peldaños.
     *
     * @param {Object} g grupo
     * @param {Object} THREE
     * @param {Object} M materiales
     * @param {number[]} a pie (centro)
     * @param {number[]} b cabeza (centro)
     * @param {number} w ancho
     */
    const stairs = function(g, THREE, M, a, b, w) {
        const A = new THREE.Vector3(a[0], a[1], a[2]);
        const B = new THREE.Vector3(b[0], b[1], b[2]);
        const hd = new THREE.Vector3(B.x - A.x, 0, B.z - A.z).normalize();
        const side = new THREE.Vector3(-hd.z, 0, hd.x).multiplyScalar(w / 2);
        [-1, 1].forEach(function(sd) {
            const a1 = A.clone().addScaledVector(side, sd);
            const b1 = B.clone().addScaledVector(side, sd);
            g.add(rod(THREE, a1, b1, 0.05, M.steel, 6));
            g.add(rod(THREE, a1.clone().setY(a1.y + 1), b1.clone().setY(b1.y + 1), 0.025, M.yellow, 6));
            g.add(rod(THREE, a1, a1.clone().setY(a1.y + 1), 0.025, M.yellow, 6));
        });
        const n = Math.max(3, Math.round((B.y - A.y) / 0.25));
        const ang = Math.atan2(-side.z, side.x);
        for (let i = 1; i < n; i++) {
            const p = A.clone().lerp(B, i / n);
            const step = mesh(THREE, new THREE.BoxGeometry(w, 0.03, 0.24), M.steelLight, p.x, p.y, p.z);
            step.rotation.y = ang;
            g.add(step);
        }
    };

    /**
     * Calcomanía (texto) sobre un plano.
     *
     * @param {Object} THREE
     * @param {string} text
     * @param {number} w ancho (m)
     * @param {number} h alto (m)
     * @param {string} fg color
     * @returns {Object}
     */
    const decal = function(THREE, text, w, h, fg) {
        const tex = canvasTex(THREE, 512, Math.round(512 * h / w), function(g, cw, ch) {
            g.clearRect(0, 0, cw, ch);
            g.fillStyle = fg || '#111';
            g.font = '800 ' + Math.round(ch * 0.78) + 'px "Helvetica Neue", Arial, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(text, cw / 2, ch / 2 + ch * 0.04);
        }, true);
        const m = new THREE.MeshStandardMaterial({map: tex, transparent: true, roughness: 0.5, depthWrite: false,
            polygonOffset: true, polygonOffsetFactor: -2});
        const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        o.userData.keep = true;
        return o;
    };

    // ---------------------------------------------------------------------
    // Horneado: fusiona las mallas por material.
    // ---------------------------------------------------------------------

    /**
     * Fusiona todas las mallas del grupo (salvo userData.keep) en una malla por material.
     *
     * @param {Object} THREE
     * @param {Object} root grupo
     * @returns {Object} grupo nuevo
     */
    const bake = function(THREE, root) {
        root.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
        const buckets = new Map();
        const kept = [];
        const m4 = new THREE.Matrix4();
        root.traverse(function(o) {
            if (!o.isMesh) {
                return;
            }
            if (o.userData.keep) {
                kept.push(o);
                return;
            }
            let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
            m4.multiplyMatrices(inv, o.matrixWorld);
            g.applyMatrix4(m4);
            if (!g.attributes.normal) {
                g.computeVertexNormals();
            }
            const key = o.material.uuid;
            if (!buckets.has(key)) {
                buckets.set(key, {mat: o.material, geos: []});
            }
            buckets.get(key).geos.push(g);
        });
        const out = new THREE.Group();
        buckets.forEach(function(b) {
            let n = 0;
            b.geos.forEach(g => {
                n += g.attributes.position.count;
            });
            const pos = new Float32Array(n * 3);
            const nor = new Float32Array(n * 3);
            const uv = new Float32Array(n * 2);
            let o3 = 0;
            let o2 = 0;
            b.geos.forEach(function(g) {
                pos.set(g.attributes.position.array, o3);
                nor.set(g.attributes.normal.array, o3);
                if (g.attributes.uv) {
                    uv.set(g.attributes.uv.array, o2);
                }
                o3 += g.attributes.position.count * 3;
                o2 += g.attributes.position.count * 2;
                g.dispose();
            });
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            geo.computeBoundingSphere();
            const mm = new THREE.Mesh(geo, b.mat);
            mm.castShadow = !b.mat.transparent;
            mm.receiveShadow = true;
            out.add(mm);
        });
        kept.forEach(function(o) {
            m4.multiplyMatrices(inv, o.matrixWorld);
            o.parent.remove(o);
            m4.decompose(o.position, o.quaternion, o.scale);
            out.add(o);
        });
        out.userData = Object.assign({}, root.userData);
        return out;
    };

    // ---------------------------------------------------------------------
    // Neumáticos y llantas.
    // ---------------------------------------------------------------------

    /**
     * Neumático minero torneado con banda en chevrón y llanta con pernos.
     * El eje queda a lo largo de z.
     *
     * @param {Object} THREE
     * @param {Object} M materiales
     * @param {number} R radio exterior
     * @param {number} W ancho de banda
     * @param {Object} opt {rimColor, lugs, dual}
     * @returns {Object} grupo
     */
    const tire = function(THREE, M, R, W, opt) {
        opt = opt || {};
        const g = new THREE.Group();
        const rimR = R * 0.47;
        const prof = [
            [rimR * 1.02, -W * 0.44], [R * 0.80, -W * 0.50], [R * 0.93, -W * 0.48], [R * 0.985, -W * 0.40],
            [R * 0.995, -W * 0.30], [R * 0.995, W * 0.30], [R * 0.985, W * 0.40], [R * 0.93, W * 0.48],
            [R * 0.80, W * 0.50], [rimR * 1.02, W * 0.44]
        ].map(p => new THREE.Vector2(p[0], p[1]));
        const body = new THREE.LatheGeometry(prof, 48);
        body.rotateX(Math.PI / 2);
        g.add(mesh(THREE, body, M.rubber));
        // Tacos en chevrón (dos medias bandas desfasadas).
        const nLug = opt.lugs === undefined ? Math.round(R * 18) : opt.lugs;
        // Piezas pequeñas y repetidas: caja simple (el bisel no se aprecia y reduce triángulos).
        const lugGeo = new THREE.BoxGeometry(R * 0.20, R * 0.075, W * 0.40);
        for (let i = 0; i < nLug; i++) {
            [-1, 1].forEach(function(sd) {
                const a = (i + (sd > 0 ? 0.5 : 0)) / nLug * TAU;
                const lug = mesh(THREE, lugGeo, M.rubber);
                lug.position.set(Math.cos(a) * R * 1.0, Math.sin(a) * R * 1.0, sd * W * 0.22);
                lug.rotation.set(0, 0, a + Math.PI / 2);
                lug.rotateY(sd * 0.42);
                g.add(lug);
            });
        }
        // Llanta: disco con taza, aro y pernos.
        const rimProf = [
            [0.02, W * 0.18], [rimR * 0.35, W * 0.20], [rimR * 0.45, W * 0.05], [rimR * 0.9, W * 0.02],
            [rimR * 1.0, W * 0.40], [rimR * 1.04, W * 0.44], [rimR * 1.04, -W * 0.44], [rimR * 0.98, -W * 0.40],
            [rimR * 0.9, -W * 0.10], [rimR * 0.4, -W * 0.08], [0.02, -W * 0.08]
        ].map(p => new THREE.Vector2(p[0], p[1]));
        const rim = new THREE.LatheGeometry(rimProf, 36);
        rim.rotateX(Math.PI / 2);
        g.add(mesh(THREE, rim, opt.rimMat || M.rim));
        const nutGeo = new THREE.CylinderGeometry(R * 0.022, R * 0.022, W * 0.06, 6);
        nutGeo.rotateX(Math.PI / 2);
        const nN = 18;
        for (let i = 0; i < nN; i++) {
            const a = i / nN * TAU;
            g.add(mesh(THREE, nutGeo, M.steelLight, Math.cos(a) * rimR * 0.62, Math.sin(a) * rimR * 0.62, W * 0.2));
        }
        const hub = new THREE.CylinderGeometry(rimR * 0.28, rimR * 0.32, W * 0.12, 24);
        hub.rotateX(Math.PI / 2);
        g.add(mesh(THREE, hub, M.steel, 0, 0, W * 0.24));
        return g;
    };

    // ---------------------------------------------------------------------
    // Camión de extracción.
    // ---------------------------------------------------------------------

    /**
     * Camión de extracción mecánico de alto tonelaje (clase 220–290 t) a escala real.
     *
     * @param {Object} THREE
     * @param {number} payload carga útil (t)
     * @param {boolean} loaded mostrar carga
     * @param {string} number número interno de flota
     * @returns {Object} grupo (frente hacia +x), userData.load = malla de la carga
     */
    const haulTruck = function(THREE, payload, loaded, number) {
        const M = mats(THREE);
        const s = Math.pow((payload || 227) / 227, 0.33);
        const g = new THREE.Group();
        const L = 13.0;
        const W = 7.6;
        const R = 1.8;
        const TW = 1.15;
        const xf = 3.35;
        const xr = -2.55;
        const zf = W / 2 - TW * 0.55;
        const zr1 = W / 2 - TW * 0.55;
        const zr2 = zr1 - TW * 1.08;

        // Ruedas.
        [-1, 1].forEach(function(sd) {
            const wf = tire(THREE, M, R, TW);
            wf.position.set(xf, R, sd * zf);
            if (sd < 0) {
                wf.rotation.y = Math.PI;
            }
            g.add(wf);
            [zr1, zr2].forEach(function(zz) {
                const wr = tire(THREE, M, R, TW);
                wr.position.set(xr, R, sd * zz);
                if (sd < 0) {
                    wr.rotation.y = Math.PI;
                }
                g.add(wr);
            });
        });

        // Bastidor, puente trasero y mandos finales.
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.yellow, [9.6, 0.9, 0.45], [0.2, 2.05, sd * 0.85], 0.08);
        });
        [-3.6, -1.2, 1.4, 3.8].forEach(function(x) {
            rb(g, THREE, M.yellow, [0.5, 0.6, 1.8], [x, 2.05, 0], 0.06);
        });
        const axle = new THREE.CylinderGeometry(0.55, 0.55, zr2 * 2 - 0.4, 24);
        axle.rotateX(Math.PI / 2);
        g.add(mesh(THREE, axle, M.yellow, xr, R, 0));
        rb(g, THREE, M.yellow, [1.8, 1.5, 1.8], [xr, R + 0.1, 0], 0.35);
        [-1, 1].forEach(function(sd) {
            const fd = new THREE.CylinderGeometry(0.7, 0.85, 0.5, 24);
            fd.rotateX(Math.PI / 2);
            g.add(mesh(THREE, fd, M.steel, xr, R, sd * (zr2 - TW * 0.6)));
            // Suspensión delantera (struts) y trasera.
            hydraulic(g, THREE, M, [xf, R + 0.5, sd * (zf - 0.9)], [xf - 0.2, 3.5, sd * 1.25], 0.22);
            hydraulic(g, THREE, M, [xr + 0.6, R + 0.4, sd * 1.1], [xr + 1.6, 2.6, sd * 0.85], 0.2);
            // Guardafangos delanteros curvos.
            const fender = new THREE.TorusGeometry(R + 0.25, 0.09, 6, 24, Math.PI * 0.62);
            const fm = mesh(THREE, fender, M.yellow, xf, R, sd * zf);
            fm.rotation.z = Math.PI * 0.19;
            fm.scale.set(1, 1, 6.5);
            g.add(fm);
        });

        // Módulo motor, radiador, parachoques.
        rb(g, THREE, M.yellow, [2.8, 1.9, 2.6], [4.15, 3.0, 0], 0.18);
        rb(g, THREE, M.steel, [0.25, 1.75, 2.4], [5.62, 3.0, 0], 0.05);
        const grill = mesh(THREE, new THREE.PlaneGeometry(2.25, 1.55), M.grille, 5.76, 3.0, 0);
        grill.rotation.y = Math.PI / 2;
        g.add(grill);
        rb(g, THREE, M.stripes, [0.45, 0.65, 4.2], [5.85, 1.75, 0], 0.06);
        rb(g, THREE, M.steel, [0.6, 0.35, 5.2], [5.7, 1.35, 0], 0.06);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.headlight, [0.08, 0.28, 0.5], [6.1, 1.78, sd * 1.5], 0.04);
            rb(g, THREE, M.steel, [0.35, 0.22, 0.5], [6.05, 1.0, sd * 0.9], 0.05);
        });

        // Cubierta superior, guardas, escalera diagonal y barandas.
        rb(g, THREE, M.yellow, [3.4, 0.22, W], [4.05, 4.1, 0], 0.05);
        rb(g, THREE, M.steel, [3.3, 0.35, W - 0.1], [4.05, 3.85, 0], 0.05);
        // Escalera diagonal de acceso que cruza el frente (de abajo a la izquierda hacia la cubierta).
        stairs(g, THREE, M, [6.45, 0.55, 3.1], [6.1, 4.1, 0.2], 0.7);
        rb(g, THREE, M.steel, [0.9, 0.08, 1.0], [6.25, 0.5, 3.4], 0.02);
        railing(g, THREE, M.yellow, [[2.45, 4.21, W / 2 - 0.08], [5.7, 4.21, W / 2 - 0.08], [5.7, 4.21, 1.0]], 1.05);
        railing(g, THREE, M.yellow, [[5.7, 4.21, -0.4], [5.7, 4.21, -W / 2 + 0.08], [4.9, 4.21, -W / 2 + 0.08]], 1.05);
        // Cabina en el lado izquierdo.
        const cab = new THREE.Group();
        rb(cab, THREE, M.yellow, [2.3, 2.3, 2.4], [0, 1.15, 0], 0.16);
        rb(cab, THREE, M.yellow, [2.45, 0.18, 2.6], [0, 2.38, 0], 0.06);
        const wfront = mesh(THREE, new THREE.PlaneGeometry(2.2, 1.15), M.glass, 1.17, 1.55, 0);
        wfront.rotation.y = Math.PI / 2;
        wfront.rotation.x = -0.12;
        cab.add(wfront);
        [-1, 1].forEach(function(sd) {
            const ws = mesh(THREE, new THREE.PlaneGeometry(1.9, 1.05), M.glass, -0.05, 1.6, sd * 1.21);
            if (sd < 0) {
                ws.rotation.y = Math.PI;
            }
            cab.add(ws);
        });
        rb(cab, THREE, M.steel, [0.08, 0.05, 1.2], [1.22, 2.05, 0], 0.02);
        cab.position.set(4.1, 4.21, -2.35);
        g.add(cab);
        // Espejos, filtros de aire, escapes, baliza.
        [[5.9, 5.6, -3.7], [5.9, 5.6, 3.7]].forEach(function(p) {
            g.add(rod(THREE, new THREE.Vector3(5.6, 4.6, p[2] * 0.9), new THREE.Vector3(p[0], p[1], p[2]), 0.03, M.steel, 6));
            rb(g, THREE, M.black, [0.08, 0.7, 0.45], p, 0.03);
        });
        [-0.2, 0.9].forEach(function(z) {
            const ac = new THREE.CylinderGeometry(0.32, 0.32, 1.1, 20);
            ac.rotateZ(Math.PI / 2);
            g.add(mesh(THREE, ac, M.steel, 4.0, 4.62, z + 1.6));
        });
        [1.05, 1.45].forEach(function(z) {
            g.add(rod(THREE, new THREE.Vector3(3.0, 3.9, z), new THREE.Vector3(3.0, 5.6, z), 0.12, M.steel, 14));
        });
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12), M.amber, 4.6, 6.75, -2.35));
        // Estanques de combustible y aceite hidráulico.
        rb(g, THREE, M.yellow, [2.1, 1.25, 1.0], [1.15, 2.85, -2.6], 0.3);
        rb(g, THREE, M.yellow, [2.1, 1.25, 1.0], [1.15, 2.85, 2.6], 0.3);

        // Tolva con visera sobre la cabina, nervaduras y cilindros de levante.
        const bodyGrp = new THREE.Group();
        const BW = W - 0.15;
        const prof = new THREE.Shape();
        prof.moveTo(-6.6, 0.0);
        prof.lineTo(1.9, 0.0);
        prof.lineTo(2.3, 1.55);
        prof.lineTo(2.3, 3.75);
        prof.lineTo(-6.0, 2.25);
        prof.lineTo(-6.8, 0.65);
        prof.closePath();
        const side = new THREE.ExtrudeGeometry(prof, {depth: 0.12, bevelEnabled: true, bevelSize: 0.06,
            bevelThickness: 0.05, bevelSegments: 2});
        [-1, 1].forEach(function(sd) {
            const sm = mesh(THREE, side, M.yellowHi, 0, 0, sd * (BW / 2) - 0.06);
            bodyGrp.add(sm);
            // Nervaduras verticales y viga superior.
            for (let x = -5.6; x <= 1.4; x += 1.4) {
                const top = 2.25 + (x + 6.0) / 8.3 * 1.5;
                rb(bodyGrp, THREE, M.yellowHi, [0.22, top - 0.1, 0.2], [x, (top - 0.1) / 2 + 0.05, sd * (BW / 2 + 0.1)], 0.06);
            }
            bodyGrp.add(tube(THREE, [[-6.0, 2.3, sd * (BW / 2 + 0.08)], [2.3, 3.8, sd * (BW / 2 + 0.08)]], 0.14, M.yellowHi));
        });
        rb(bodyGrp, THREE, M.yellowHi, [8.8, 0.25, BW], [-2.35, 0.05, 0], 0.08);
        const tail = rb(bodyGrp, THREE, M.yellowHi, [1.6, 0.22, BW], [-7.3, 0.35, 0], 0.06);
        tail.rotation.z = 0.42;
        rb(bodyGrp, THREE, M.yellowHi, [0.3, 3.75, BW], [2.2, 1.88, 0], 0.08);
        // Visera (canopy) que protege la cabina, con nervaduras inferiores y faldón frontal.
        const canopy = rb(bodyGrp, THREE, M.yellowHi, [3.9, 0.22, BW + 0.2], [4.15, 3.82, 0], 0.08);
        canopy.rotation.z = 0.03;
        for (let z = -3; z <= 3; z += 1.5) {
            rb(bodyGrp, THREE, M.yellowHi, [3.7, 0.32, 0.14], [4.1, 3.6, z], 0.04);
        }
        rb(bodyGrp, THREE, M.yellowHi, [0.2, 0.55, BW + 0.2], [6.05, 3.6, 0], 0.05);
        // El piso de la tolva va sobre las ruedas traseras (como en el equipo real).
        const BY = 3.75;
        bodyGrp.position.set(0, BY, 0);
        g.add(bodyGrp);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.steel, [0.5, BY - 2.45, 0.4], [-4.3, (BY + 2.45) / 2, sd * 0.85], 0.06);
            rb(g, THREE, M.black, [0.6, 0.25, 0.5], [1.6, BY - 0.12, sd * 0.85], 0.05);
            rb(g, THREE, M.yellow, [0.5, BY - 2.6, 0.45], [1.6, (BY + 2.25) / 2 - 0.15, sd * 0.85], 0.06);
            hydraulic(g, THREE, M, [0.9, 2.3, sd * 1.35], [-0.6, BY + 0.05, sd * 1.5], 0.24);
        });
        // Calcomanías de flota y luces traseras.
        const num = number || ('C-' + Math.round(100 + payload / 3));
        [-1, 1].forEach(function(sd) {
            const d = decal(THREE, num, 1.9, 0.7, '#151515');
            d.position.set(-1.3, BY + 1.55, sd * (BW / 2 + 0.25));
            if (sd < 0) {
                d.rotation.y = Math.PI;
            }
            g.add(d);
            rb(g, THREE, M.taillight, [0.08, 0.25, 0.4], [-4.85, 2.1, sd * 0.85], 0.03);
        });

        // Carga (separada para poder mostrarla u ocultarla).
        const heapGeo = new THREE.PlaneGeometry(8.0, BW - 0.4, 24, 12);
        heapGeo.rotateX(-Math.PI / 2);
        const hp = heapGeo.attributes.position;
        for (let i = 0; i < hp.count; i++) {
            const x = hp.getX(i);
            const z = hp.getZ(i);
            const u = 1 - Math.pow(Math.abs(x + 0.3) / 4.0, 2);
            const v = 1 - Math.pow(Math.abs(z) / ((BW - 0.4) / 2), 2);
            const n = Math.sin(x * 3.1 + z * 1.7) * 0.12 + Math.sin(x * 7.3 - z * 5.1) * 0.06;
            hp.setY(i, Math.max(0, u) * Math.max(0, v) * 2.4 + n);
        }
        heapGeo.computeVertexNormals();
        const heap = mesh(THREE, heapGeo, M.rock, -2.4, BY + 0.9, 0);
        heap.userData.keep = true;
        g.add(heap);

        const out = bake(THREE, g);
        const load = out.children.find(c => c.geometry === heapGeo);
        if (load) {
            load.visible = !!loaded;
        }
        out.scale.setScalar(s);
        out.userData.load = load;
        out.userData.length = L * s;
        out.userData.width = W * s;
        out.userData.tireDiameter = R * 2 * s;
        return out;
    };

    // ---------------------------------------------------------------------
    // Orugas.
    // ---------------------------------------------------------------------

    /**
     * Oruga con bastidor de perfil redondeado, rodillos y zapatas con garras.
     *
     * @param {Object} g grupo
     * @param {Object} THREE
     * @param {Object} M materiales
     * @param {number} len largo total
     * @param {number} h alto
     * @param {number} w ancho de zapata
     * @param {number} z posición lateral
     */
    const crawler = function(g, THREE, M, len, h, w, z) {
        const r = h / 2;
        const half = len / 2 - r;
        const frame = new THREE.Shape();
        frame.moveTo(-half, -r * 0.7);
        frame.lineTo(half, -r * 0.7);
        frame.absarc(half, 0, r * 0.7, -Math.PI / 2, Math.PI / 2, false);
        frame.lineTo(-half, r * 0.7);
        frame.absarc(-half, 0, r * 0.7, Math.PI / 2, Math.PI * 1.5, false);
        const fg = new THREE.ExtrudeGeometry(frame, {depth: w * 0.7, bevelEnabled: true, bevelSize: 0.06,
            bevelThickness: 0.06, bevelSegments: 2, curveSegments: 16});
        fg.translate(0, r, -w * 0.35);
        g.add(mesh(THREE, fg, M.steel, 0, 0, z));
        // Ruedas guía y rodillos.
        [-half, half].forEach(function(x) {
            const idl = new THREE.CylinderGeometry(r * 0.78, r * 0.78, w * 0.78, 24);
            idl.rotateX(Math.PI / 2);
            g.add(mesh(THREE, idl, M.steelLight, x, r, z));
        });
        const nr = Math.max(3, Math.round(len / 1.4));
        for (let i = 1; i < nr; i++) {
            const roller = new THREE.CylinderGeometry(r * 0.3, r * 0.3, w * 0.8, 14);
            roller.rotateX(Math.PI / 2);
            g.add(mesh(THREE, roller, M.steelLight, -half + i / nr * 2 * half, r * 0.33, z));
        }
        // Zapatas a lo largo del contorno (estadio).
        const per = 4 * half + 2 * Math.PI * r;
        const pitch = Math.max(0.35, h * 0.16);
        const n = Math.round(per / pitch);
        const shoe = new THREE.BoxGeometry(pitch * 0.92, h * 0.07, w);
        const grouser = new THREE.BoxGeometry(pitch * 0.18, h * 0.07, w);
        for (let i = 0; i < n; i++) {
            let q = i / n * per;
            let x;
            let y;
            let ang;
            if (q < 2 * half) {
                x = -half + q;
                y = 0;
                ang = 0;
            } else if (q < 2 * half + Math.PI * r) {
                const a = (q - 2 * half) / r - Math.PI / 2;
                x = half + Math.cos(a) * r;
                y = r + Math.sin(a) * r;
                ang = a + Math.PI / 2;
            } else if (q < 4 * half + Math.PI * r) {
                q -= 2 * half + Math.PI * r;
                x = half - q;
                y = 2 * r;
                ang = Math.PI;
            } else {
                const a = (q - 4 * half - Math.PI * r) / r + Math.PI / 2;
                x = -half + Math.cos(a) * r;
                y = r + Math.sin(a) * r;
                ang = a + Math.PI / 2;
            }
            const sm = mesh(THREE, shoe, M.steel, x, y, z);
            sm.rotation.z = ang;
            g.add(sm);
            const gm = mesh(THREE, grouser, M.steel, x - Math.sin(ang) * h * 0.06, y + Math.cos(ang) * -h * 0.06, z);
            gm.rotation.z = ang;
            g.add(gm);
        }
    };

    // ---------------------------------------------------------------------
    // Pala eléctrica de cables.
    // ---------------------------------------------------------------------

    /**
     * Pala eléctrica de cables (clase 4100) a escala real, frente hacia +x.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const ropeShovel = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        crawler(g, THREE, M, 12.6, 2.8, 2.4, -4.7);
        crawler(g, THREE, M, 12.6, 2.8, 2.4, 4.7);
        rb(g, THREE, M.steel, [7.5, 1.4, 7.4], [0, 2.3, 0], 0.2);
        const ring = new THREE.CylinderGeometry(4.6, 4.8, 0.9, 40);
        g.add(mesh(THREE, ring, M.steel, 0, 3.3, 0));
        const up = new THREE.Group();
        up.position.y = 3.75;
        // Plataforma giratoria y sala de máquinas con celosías.
        rb(up, THREE, M.yellow, [15.5, 1.0, 11.0], [-1.2, 0.5, 0], 0.15);
        rb(up, THREE, M.white, [11.5, 6.6, 9.4], [-2.6, 4.3, 0], 0.35);
        [-1, 1].forEach(function(sd) {
            for (let k = 0; k < 4; k++) {
                const lv = mesh(THREE, new THREE.PlaneGeometry(1.8, 2.4), M.louver, -6.5 + k * 2.6, 3.8, sd * 4.72);
                if (sd < 0) {
                    lv.rotation.y = Math.PI;
                }
                up.add(lv);
            }
            const d = decal(THREE, 'MINASLAB 4100', 6.5, 1.0, '#c48a00');
            d.position.set(-2.6, 6.6, sd * 4.73);
            if (sd < 0) {
                d.rotation.y = Math.PI;
            }
            up.add(d);
        });
        rb(up, THREE, M.yellow, [12, 0.3, 10], [-2.6, 7.75, 0], 0.08);
        railing(up, THREE, M.yellow, [[-8.4, 7.9, -4.9], [3.2, 7.9, -4.9], [3.2, 7.9, 4.9], [-8.4, 7.9, 4.9],
            [-8.4, 7.9, -4.9]], 1.1);
        // Contrapeso trasero.
        rb(up, THREE, M.yellow, [2.6, 4.8, 10.2], [-9.6, 3.0, 0], 0.3);
        // Cabina del operador elevada (adelante izquierda).
        const cab = new THREE.Group();
        rb(cab, THREE, M.white, [3.2, 2.9, 3.0], [0, 1.45, 0], 0.18);
        const wf = mesh(THREE, new THREE.PlaneGeometry(2.8, 1.7), M.glass, 1.62, 1.7, 0);
        wf.rotation.y = Math.PI / 2;
        cab.add(wf);
        const ws = mesh(THREE, new THREE.PlaneGeometry(2.6, 1.5), M.glass, 0.1, 1.75, -1.52);
        ws.rotation.y = Math.PI;
        cab.add(ws);
        cab.position.set(4.6, 4.6, -3.6);
        up.add(cab);
        rb(up, THREE, M.yellow, [4.2, 0.25, 3.6], [4.6, 4.5, -3.6], 0.06);
        stairs(up, THREE, M, [6.4, 1.0, -2.0], [4.0, 4.5, -2.0], 0.8);
        stairs(up, THREE, M, [-6.0, -3.2, 6.3], [-4.0, 1.0, 6.3], 0.8);
        // Pórtico (A-frame) de tubos.
        const gt = new THREE.Vector3(-3.0, 17.5, 0);
        [-1, 1].forEach(function(sd) {
            up.add(rod(THREE, new THREE.Vector3(-0.2, 7.9, sd * 3.0), gt.clone().setZ(sd * 1.0), 0.32, M.yellow, 14));
            up.add(rod(THREE, new THREE.Vector3(-7.6, 7.9, sd * 3.0), gt.clone().setZ(sd * 1.0), 0.28, M.yellow, 14));
        });
        rb(up, THREE, M.yellow, [1.0, 0.8, 2.8], [gt.x, gt.y, 0], 0.15);
        // Pluma de cajón ahusada.
        const foot = new THREE.Vector3(5.0, 3.0, 0);
        const point = new THREE.Vector3(18.0, 19.0, 0);
        const bdir = new THREE.Vector3().subVectors(point, foot);
        const blen = bdir.length();
        const bshape = new THREE.Shape();
        bshape.moveTo(0, -0.95);
        bshape.lineTo(blen, -0.6);
        bshape.lineTo(blen, 0.6);
        bshape.lineTo(0, 0.95);
        bshape.closePath();
        const bgeo = new THREE.ExtrudeGeometry(bshape, {depth: 1.6, bevelEnabled: true, bevelSize: 0.12,
            bevelThickness: 0.12, bevelSegments: 2});
        bgeo.translate(0, 0, -0.8);
        const boom = mesh(THREE, bgeo, M.yellow, foot.x, foot.y, 0);
        boom.rotation.z = Math.atan2(bdir.y, bdir.x);
        up.add(boom);
        // Poleas de punta de pluma.
        [-0.75, 0.75].forEach(function(z) {
            const sh = new THREE.CylinderGeometry(1.7, 1.7, 0.45, 32);
            sh.rotateX(Math.PI / 2);
            up.add(mesh(THREE, sh, M.steel, point.x + 0.4, point.y, z));
        });
        // Cables de suspensión (pórtico → punta de pluma).
        [-0.9, 0.9].forEach(function(z) {
            up.add(rod(THREE, gt.clone().setZ(z * 0.8), point.clone().setZ(z), 0.07, M.rope, 6));
        });
        // Mango doble, montura y balde con dientes.
        const saddle = foot.clone().lerp(point, 0.43);
        rb(up, THREE, M.yellow, [1.8, 1.8, 2.6], [saddle.x, saddle.y, 0], 0.2);
        const dip = new THREE.Vector3(17.0, 6.6, 0);
        [-0.65, 0.65].forEach(function(z) {
            up.add(rod(THREE, saddle.clone().setZ(z).add(new THREE.Vector3(-3.0, 1.2, 0)), dip.clone().setZ(z)
                .add(new THREE.Vector3(-1.6, 0.8, 0)), 0.38, M.yellow, 12));
        });
        const dipper = new THREE.Group();
        const dshape = new THREE.Shape();
        dshape.moveTo(-1.8, -1.9);
        dshape.lineTo(1.9, -2.3);
        dshape.lineTo(2.3, 1.6);
        dshape.lineTo(-1.2, 2.3);
        dshape.lineTo(-2.2, 0.4);
        dshape.closePath();
        const dg = new THREE.ExtrudeGeometry(dshape, {depth: 4.4, bevelEnabled: true, bevelSize: 0.15,
            bevelThickness: 0.15, bevelSegments: 2});
        dg.translate(0, 0, -2.2);
        dipper.add(mesh(THREE, dg, M.steel));
        rb(dipper, THREE, M.yellow, [0.4, 0.5, 4.6], [2.25, 1.65, 0], 0.08);
        rb(dipper, THREE, M.yellow, [0.3, 3.2, 4.2], [-2.05, -0.2, 0], 0.08, [0, 0, -0.35]);
        [-2.3, 2.3].forEach(function(z) {
            dipper.add(tube(THREE, [[1.9, 1.5, z], [0.6, 3.6, z * 0.6], [-0.6, 3.6, z * 0.6], [-1.0, 2.2, z]], 0.12,
                M.steel, true));
        });
        for (let k = 0; k < 5; k++) {
            const tooth = new THREE.ConeGeometry(0.22, 0.9, 6);
            tooth.rotateZ(-Math.PI / 2 - 0.15);
            dipper.add(mesh(THREE, tooth, M.steelLight, 2.7, 1.75, -1.8 + k * 0.9));
        }
        dipper.position.copy(dip);
        dipper.rotation.z = -0.25;
        up.add(dipper);
        [-0.5, 0.5].forEach(function(z) {
            up.add(rod(THREE, point.clone().setZ(z).add(new THREE.Vector3(1.4, -0.8, 0)), dip.clone().setZ(z)
                .add(new THREE.Vector3(1.6, 2.2, 0)), 0.08, M.rope, 6));
        });
        // Focos.
        [-1, 1].forEach(function(sd) {
            rb(up, THREE, M.headlight, [0.15, 0.35, 0.55], [3.35, 7.2, sd * 4.0], 0.05);
        });
        g.add(up);
        const out = bake(THREE, g);
        out.userData.kind = 'shovel';
        return out;
    };

    // ---------------------------------------------------------------------
    // Perforadora de pozos de tronadura.
    // ---------------------------------------------------------------------

    /**
     * Perforadora rotativa sobre orugas con mástil reticulado (≈ 20 m).
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const drillRig = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        crawler(g, THREE, M, 9.2, 1.5, 0.9, -2.1);
        crawler(g, THREE, M, 9.2, 1.5, 0.9, 2.1);
        rb(g, THREE, M.yellow, [12.0, 0.6, 5.4], [0.3, 1.9, 0], 0.1);
        rb(g, THREE, M.yellow, [6.0, 2.8, 4.4], [-2.2, 3.6, 0], 0.3);
        [-1, 1].forEach(function(sd) {
            for (let k = 0; k < 2; k++) {
                const lv = mesh(THREE, new THREE.PlaneGeometry(1.5, 1.8), M.louver, -3.6 + k * 2.2, 3.7, sd * 2.22);
                if (sd < 0) {
                    lv.rotation.y = Math.PI;
                }
                g.add(lv);
            }
        });
        // Colector de polvo y estanques.
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.75, 0.75, 2.4, 20), M.yellow, 1.6, 3.4, 1.6));
        rb(g, THREE, M.yellow, [1.6, 1.4, 1.5], [1.8, 2.9, -1.6], 0.2);
        // Cabina.
        const cab = new THREE.Group();
        rb(cab, THREE, M.white, [2.4, 2.4, 2.2], [0, 1.2, 0], 0.15);
        const wf = mesh(THREE, new THREE.PlaneGeometry(2.0, 1.4), M.glass, 1.22, 1.4, 0);
        wf.rotation.y = Math.PI / 2;
        cab.add(wf);
        const ws = mesh(THREE, new THREE.PlaneGeometry(1.8, 1.3), M.glass, 0, 1.45, 1.12);
        cab.add(ws);
        cab.position.set(4.4, 2.2, 1.2);
        g.add(cab);
        // Gatos niveladores.
        [[5.6, -2.3], [5.6, 2.3], [-5.2, 0]].forEach(function(p) {
            hydraulic(g, THREE, M, [p[0], 0.25, p[1]], [p[0], 2.0, p[1]], 0.2);
            rb(g, THREE, M.steel, [0.9, 0.12, 0.9], [p[0], 0.06, p[1]], 0.03);
        });
        // Mástil reticulado de 4 cordones con diagonales.
        const mx = 5.5;
        const mz = -0.9;
        const mh = 19;
        const a = 0.65;
        const corners = [[-a, -a], [a, -a], [a, a], [-a, a]];
        corners.forEach(function(c) {
            g.add(rod(THREE, new THREE.Vector3(mx + c[0], 2.2, mz + c[1]), new THREE.Vector3(mx + c[0], 2.2 + mh,
                mz + c[1]), 0.09, M.yellow, 8));
        });
        for (let y = 2.2; y < 2.2 + mh - 0.5; y += 1.2) {
            for (let k = 0; k < 4; k++) {
                const c1 = corners[k];
                const c2 = corners[(k + 1) % 4];
                g.add(rod(THREE, new THREE.Vector3(mx + c1[0], y, mz + c1[1]), new THREE.Vector3(mx + c2[0], y + 1.2,
                    mz + c2[1]), 0.04, M.yellow, 5));
                g.add(rod(THREE, new THREE.Vector3(mx + c1[0], y, mz + c1[1]), new THREE.Vector3(mx + c2[0], y, mz + c2[1]),
                    0.035, M.yellow, 5));
            }
        }
        rb(g, THREE, M.yellow, [1.8, 0.5, 1.8], [mx, 2.2 + mh + 0.2, mz], 0.08);
        // Cabezal rotatorio, barra y campana de polvo.
        rb(g, THREE, M.steel, [1.1, 1.6, 1.1], [mx, 13.5, mz], 0.12);
        g.add(rod(THREE, new THREE.Vector3(mx, 0.3, mz), new THREE.Vector3(mx, 13.0, mz), 0.12, M.steelLight, 12));
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.6, 0.9, 0.6, 20), M.black, mx, 0.35, mz));
        // Carrusel de barras.
        for (let k = 0; k < 3; k++) {
            const zz = mz + 0.95 + k * 0.42;
            g.add(rod(THREE, new THREE.Vector3(mx - 0.9, 3.0, zz), new THREE.Vector3(mx - 0.9, 13.5, zz), 0.1, M.steelLight, 12));
        }
        [4.0, 12.5].forEach(function(y) {
            rb(g, THREE, M.yellow, [0.3, 0.25, 1.5], [mx - 0.9, y, mz + 1.37], 0.05);
        });
        railing(g, THREE, M.yellow, [[-6.0, 2.2, -2.65], [3.0, 2.2, -2.65]], 1.0);
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.12, 0.12, 0.2, 10), M.amber, 4.4, 4.75, 1.2));
        const out = bake(THREE, g);
        out.userData.kind = 'drill';
        return out;
    };

    // ---------------------------------------------------------------------
    // Cargador frontal.
    // ---------------------------------------------------------------------

    /**
     * Cargador frontal de gran tamaño (clase 990) articulado, frente hacia +x.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const wheelLoader = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        const R = 1.25;
        [[2.4, 1], [2.4, -1], [-2.4, 1], [-2.4, -1]].forEach(function(p) {
            const w = tire(THREE, M, R, 0.95);
            w.position.set(p[0], R, p[1] * 1.75);
            if (p[1] < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
        });
        // Bastidor trasero, motor y contrapeso.
        rb(g, THREE, M.yellow, [5.0, 1.6, 2.4], [-2.6, 2.2, 0], 0.2);
        rb(g, THREE, M.yellow, [3.0, 1.9, 2.8], [-3.3, 3.4, 0], 0.3);
        rb(g, THREE, M.grille, [0.2, 1.2, 2.2], [-4.85, 3.3, 0], 0.04);
        rb(g, THREE, M.yellow, [0.8, 1.4, 3.0], [-5.2, 1.9, 0], 0.25);
        // Cabina.
        const cab = new THREE.Group();
        rb(cab, THREE, M.yellow, [2.2, 2.3, 2.2], [0, 1.15, 0], 0.16);
        [[1.12, 0, Math.PI / 2], [-1.12, 0, -Math.PI / 2]].forEach(function(p) {
            const w = mesh(THREE, new THREE.PlaneGeometry(1.9, 1.3), M.glass, p[0], 1.45, p[1]);
            w.rotation.y = p[2];
            cab.add(w);
        });
        [-1, 1].forEach(function(sd) {
            const w = mesh(THREE, new THREE.PlaneGeometry(1.8, 1.3), M.glass, 0, 1.45, sd * 1.11);
            if (sd < 0) {
                w.rotation.y = Math.PI;
            }
            cab.add(w);
        });
        cab.position.set(-0.9, 3.0, 0);
        g.add(cab);
        // Articulación y bastidor delantero.
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.45, 0.45, 1.2, 18), M.steel, 0.2, 2.1, 0));
        rb(g, THREE, M.yellow, [3.2, 1.3, 1.8], [2.0, 2.0, 0], 0.2);
        // Brazos de levante, balancín y balde.
        [-1, 1].forEach(function(sd) {
            const arm = rb(g, THREE, M.yellow, [4.6, 0.55, 0.4], [3.9, 3.0, sd * 1.05], 0.12);
            arm.rotation.z = -0.38;
            hydraulic(g, THREE, M, [1.8, 2.2, sd * 1.3], [3.8, 3.4, sd * 1.25], 0.17);
        });
        rb(g, THREE, M.yellow, [0.5, 1.6, 0.5], [3.4, 3.9, 0], 0.12);
        hydraulic(g, THREE, M, [1.6, 3.4, 0], [3.3, 4.4, 0], 0.17);
        const bshape = new THREE.Shape();
        bshape.moveTo(0, 0);
        bshape.lineTo(1.9, -0.1);
        bshape.lineTo(1.8, 0.25);
        bshape.quadraticCurveTo(0.5, 0.2, 0.2, 1.6);
        bshape.lineTo(-0.15, 1.7);
        bshape.closePath();
        const bg = new THREE.ExtrudeGeometry(bshape, {depth: 4.2, bevelEnabled: true, bevelSize: 0.06,
            bevelThickness: 0.06, bevelSegments: 2});
        bg.translate(0, 0, -2.1);
        g.add(mesh(THREE, bg, M.steel, 5.7, 0.35, 0));
        for (let k = 0; k < 7; k++) {
            const tooth = new THREE.ConeGeometry(0.1, 0.5, 6);
            tooth.rotateZ(-Math.PI / 2);
            g.add(mesh(THREE, tooth, M.steelLight, 7.75, 0.3, -1.8 + k * 0.6));
        }
        stairs(g, THREE, M, [-2.4, 0.5, 2.6], [-1.6, 3.0, 1.5], 0.6);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.headlight, [0.1, 0.25, 0.35], [0.2, 5.15, sd * 0.85], 0.04);
        });
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.11, 0.11, 0.2, 10), M.amber, -1.2, 5.45, 0));
        const out = bake(THREE, g);
        out.userData.kind = 'loader';
        return out;
    };

    // ---------------------------------------------------------------------
    // Camioneta de supervisión.
    // ---------------------------------------------------------------------

    /**
     * Camioneta doble cabina de faena (pértiga con banderín, baliza, barra antivuelco).
     *
     * @param {Object} THREE
     * @param {string} number número interno
     * @returns {Object}
     */
    const pickup = function(THREE, number) {
        const M = mats(THREE);
        const g = new THREE.Group();
        const W = 1.85;
        const prof = new THREE.Shape();
        prof.moveTo(-2.65, 0.45);
        prof.lineTo(2.55, 0.45);
        prof.quadraticCurveTo(2.75, 0.5, 2.72, 0.85);
        prof.lineTo(2.6, 1.05);
        prof.quadraticCurveTo(2.1, 1.12, 1.25, 1.18);
        prof.lineTo(0.55, 1.78);
        prof.quadraticCurveTo(0.45, 1.86, 0.2, 1.86);
        prof.lineTo(-1.05, 1.86);
        prof.quadraticCurveTo(-1.18, 1.84, -1.2, 1.7);
        prof.lineTo(-1.25, 1.2);
        prof.lineTo(-2.65, 1.2);
        prof.closePath();
        const body = new THREE.ExtrudeGeometry(prof, {depth: W - 0.2, bevelEnabled: true, bevelSize: 0.08,
            bevelThickness: 0.1, bevelSegments: 4, curveSegments: 10});
        body.translate(0, 0, -(W - 0.2) / 2);
        g.add(mesh(THREE, body, M.white));
        // Vidrios.
        const glassSide = new THREE.Shape();
        glassSide.moveTo(1.15, 1.22);
        glassSide.lineTo(0.52, 1.74);
        glassSide.lineTo(-1.05, 1.74);
        glassSide.lineTo(-1.12, 1.22);
        glassSide.closePath();
        const gs = new THREE.ShapeGeometry(glassSide);
        // Vidrio de doble cara: la misma silueta sirve para ambos costados.
        [-1, 1].forEach(function(sd) {
            g.add(mesh(THREE, gs, M.glass, 0, 0, sd * (W / 2 + 0.005)));
        });
        const wind = mesh(THREE, new THREE.PlaneGeometry(1.55, 0.78), M.glass, 0.86, 1.47, 0);
        wind.rotation.set(0, Math.PI / 2, 0);
        wind.rotateX(0.7);
        g.add(wind);
        // Pilares de puertas y manillas.
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.black, [0.05, 0.5, 0.02], [-0.25, 1.47, sd * (W / 2 + 0.01)], 0.01);
            rb(g, THREE, M.black, [0.16, 0.04, 0.03], [0.35, 1.12, sd * (W / 2 + 0.02)], 0.01);
            rb(g, THREE, M.black, [0.16, 0.04, 0.03], [-0.75, 1.12, sd * (W / 2 + 0.02)], 0.01);
        });
        // Pisadera (pick-up) y barra antivuelco.
        rb(g, THREE, M.black, [1.3, 0.04, W - 0.3], [-1.95, 1.215, 0], 0.01);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.white, [1.45, 0.12, 0.08], [-1.95, 1.25, sd * (W / 2 - 0.12)], 0.03);
        });
        [-1, 1].forEach(function(sd) {
            g.add(tube(THREE, [[-1.4, 1.22, sd * 0.78], [-1.4, 2.05, sd * 0.78], [-1.6, 2.05, sd * 0.6]], 0.04, M.black,
                true));
        });
        g.add(tube(THREE, [[-1.4, 2.05, -0.78], [-1.4, 2.05, 0.78]], 0.04, M.black));
        rb(g, THREE, M.amber, [0.25, 0.1, 1.1], [0.0, 1.95, 0], 0.03);
        // Parachoques, defensa, faros.
        rb(g, THREE, M.black, [0.25, 0.32, W + 0.05], [2.75, 0.62, 0], 0.08);
        g.add(tube(THREE, [[2.85, 0.5, -0.6], [3.05, 0.75, -0.55], [3.05, 1.0, -0.4], [3.05, 1.0, 0.4], [3.05, 0.75, 0.55],
            [2.85, 0.5, 0.6]], 0.04, M.black, true));
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.headlight, [0.06, 0.12, 0.32], [2.73, 0.95, sd * 0.65], 0.03);
            rb(g, THREE, M.taillight, [0.05, 0.25, 0.12], [-2.73, 0.95, sd * 0.82], 0.02);
        });
        rb(g, THREE, M.black, [0.2, 0.25, W + 0.05], [-2.75, 0.55, 0], 0.06);
        // Ruedas con arcos.
        [[1.65, 1], [1.65, -1], [-1.55, 1], [-1.55, -1]].forEach(function(p) {
            const w = tire(THREE, M, 0.4, 0.27, {lugs: 0, rimMat: M.steelLight});
            w.position.set(p[0], 0.4, p[1] * 0.8);
            if (p[1] < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
            const arch = new THREE.TorusGeometry(0.46, 0.05, 6, 16, Math.PI);
            g.add(mesh(THREE, arch, M.black, p[0], 0.45, p[1] * (W / 2 + 0.02)));
        });
        // Pértiga con banderín y número interno.
        g.add(rod(THREE, new THREE.Vector3(-2.45, 1.2, 0.82), new THREE.Vector3(-2.45, 5.4, 0.82), 0.022, M.white, 6));
        g.add(mesh(THREE, new THREE.PlaneGeometry(0.6, 0.4), M.orange, -2.15, 5.15, 0.82));
        [-1, 1].forEach(function(sd) {
            const d = decal(THREE, number || 'SUP-07', 0.7, 0.2, '#0d47a1');
            d.position.set(-1.9, 0.95, sd * (W / 2 + 0.06));
            if (sd < 0) {
                d.rotation.y = Math.PI;
            }
            g.add(d);
        });
        const out = bake(THREE, g);
        out.userData.kind = 'pickup';
        return out;
    };

    // ---------------------------------------------------------------------
    // Trabajador con EPP.
    // ---------------------------------------------------------------------

    /**
     * Trabajador de pie con casco, lentes, chaleco reflectante y botas.
     *
     * @param {Object} THREE
     * @param {boolean} vest con chaleco de alta visibilidad
     * @returns {Object}
     */
    const worker = function(THREE, vest) {
        const M = mats(THREE);
        const g = new THREE.Group();
        const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 12);
        [-1, 1].forEach(function(sd) {
            g.add(mesh(THREE, cap(0.085, 0.72), M.denim, 0, 0.5, sd * 0.11));
            rb(g, THREE, M.boot, [0.3, 0.13, 0.14], [0.05, 0.065, sd * 0.11], 0.04);
            const arm = mesh(THREE, cap(0.06, 0.52), vest === false ? M.denim : M.orange, 0, 1.15, sd * 0.27);
            arm.rotation.x = sd * 0.12;
            g.add(arm);
            g.add(mesh(THREE, new THREE.SphereGeometry(0.06, 10, 8), M.boot, 0.0, 0.83, sd * 0.3));
        });
        g.add(mesh(THREE, cap(0.17, 0.42), M.orange, 0, 1.18, 0));
        if (vest !== false) {
            const vg = mesh(THREE, cap(0.185, 0.36), M.hivis, 0, 1.2, 0);
            vg.scale.set(0.95, 1, 1.05);
            g.add(vg);
            [1.08, 1.3].forEach(function(y) {
                const band = mesh(THREE, new THREE.TorusGeometry(0.188, 0.018, 6, 24), M.reflect, 0, y, 0);
                band.rotation.x = Math.PI / 2;
                g.add(band);
            });
        }
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10), M.skin, 0, 1.55, 0));
        g.add(mesh(THREE, new THREE.SphereGeometry(0.11, 16, 12), M.skin, 0, 1.68, 0));
        rb(g, THREE, M.black, [0.03, 0.04, 0.17], [0.1, 1.7, 0], 0.01);
        const helmet = new THREE.LatheGeometry([[0, 0.14], [0.06, 0.135], [0.11, 0.1], [0.13, 0.04], [0.13, 0.0],
            [0.17, -0.01], [0.17, -0.025], [0.12, -0.02], [0.0, -0.02]].map(p => new THREE.Vector2(p[0], p[1])), 24);
        g.add(mesh(THREE, helmet, M.white, 0, 1.74, 0));
        const out = bake(THREE, g);
        out.userData.kind = 'worker';
        return out;
    };

    // ---------------------------------------------------------------------
    // Sonda diamantina y estación total.
    // ---------------------------------------------------------------------

    /**
     * Sonda de perforación diamantina sobre plataforma con mástil reticulado.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const diamondDrill = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        rb(g, THREE, M.steel, [6.0, 0.35, 3.2], [0, 0.18, 0], 0.05);
        rb(g, THREE, M.red, [3.0, 1.9, 2.0], [-1.6, 1.3, 0], 0.18);
        [-1, 1].forEach(function(sd) {
            const lv = mesh(THREE, new THREE.PlaneGeometry(1.4, 1.0), M.louver, -1.8, 1.4, sd * 1.01);
            if (sd < 0) {
                lv.rotation.y = Math.PI;
            }
            g.add(lv);
        });
        // Mástil reticulado de 2 cordones frontales y 2 traseros.
        const h = 11;
        const pts = [[0.9, -0.35], [0.9, 0.35], [1.5, -0.35], [1.5, 0.35]];
        pts.forEach(function(p) {
            g.add(rod(THREE, new THREE.Vector3(p[0], 0.35, p[1]), new THREE.Vector3(p[0], h, p[1]), 0.05, M.red, 6));
        });
        for (let y = 0.6; y < h - 0.6; y += 0.9) {
            g.add(rod(THREE, new THREE.Vector3(0.9, y, -0.35), new THREE.Vector3(1.5, y + 0.9, -0.35), 0.025, M.red, 4));
            g.add(rod(THREE, new THREE.Vector3(0.9, y, 0.35), new THREE.Vector3(1.5, y + 0.9, 0.35), 0.025, M.red, 4));
            g.add(rod(THREE, new THREE.Vector3(1.5, y, -0.35), new THREE.Vector3(1.5, y, 0.35), 0.02, M.red, 4));
        }
        hydraulic(g, THREE, M, [-0.6, 0.4, 0], [1.2, 5.0, 0], 0.11);
        rb(g, THREE, M.steel, [0.6, 0.8, 0.6], [1.2, 6.5, 0], 0.08);
        g.add(rod(THREE, new THREE.Vector3(1.2, 0.2, 0), new THREE.Vector3(1.2, 6.2, 0), 0.05, M.steelLight, 8));
        // Barras en rack, bomba de lodos y estanque.
        for (let k = 0; k < 6; k++) {
            g.add(rod(THREE, new THREE.Vector3(-2.8, 0.45 + k * 0.1, -1.4), new THREE.Vector3(2.6, 0.45 + k * 0.1, -1.4),
                0.04, M.steelLight, 6));
        }
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.55, 0.55, 1.0, 18), M.white, 2.5, 0.85, 1.0));
        railing(g, THREE, M.yellow, [[-2.9, 0.35, 1.55], [2.9, 0.35, 1.55]], 1.0);
        const out = bake(THREE, g);
        out.userData.kind = 'ddrill';
        return out;
    };

    /**
     * Estación total sobre trípode con base nivelante y anteojo.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const totalStation = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const a = i / 3 * TAU;
            g.add(rod(THREE, new THREE.Vector3(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55), new THREE.Vector3(Math.cos(a) * 0.06,
                1.48, Math.sin(a) * 0.06), 0.022, M.wood, 6));
        }
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), M.steel, 0, 1.5, 0));
        rb(g, THREE, M.yellow, [0.16, 0.24, 0.2], [0, 1.66, 0], 0.03);
        const scope = new THREE.CylinderGeometry(0.045, 0.05, 0.22, 14);
        scope.rotateZ(Math.PI / 2);
        g.add(mesh(THREE, scope, M.black, 0.02, 1.72, 0));
        rb(g, THREE, M.black, [0.02, 0.08, 0.1], [-0.09, 1.64, 0], 0.01);
        const out = bake(THREE, g);
        out.userData.kind = 'station';
        return out;
    };

    return {
        mats: mats, rbox: rbox, bake: bake, tire: tire, haulTruck: haulTruck, ropeShovel: ropeShovel, drillRig: drillRig,
        wheelLoader: wheelLoader, pickup: pickup, worker: worker, diamondDrill: diamondDrill, totalStation: totalStation
    };
});
