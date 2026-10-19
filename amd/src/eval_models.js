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
        const chevron = canvasTex(THREE, 256, 64, function(g, w, h) {
            g.fillStyle = '#f2f2f2';
            g.fillRect(0, 0, w, h);
            g.fillStyle = '#c81414';
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
        const cladding = canvasTex(THREE, 128, 64, function(g, w, h) {
            // Plancha ondulada (costaneras verticales) para módulos y naves.
            for (let x = 0; x < w; x++) {
                const v = 205 + Math.round(Math.sin(x / w * Math.PI * 16) * 32);
                g.fillStyle = 'rgb(' + v + ',' + v + ',' + (v - 4) + ')';
                g.fillRect(x, 0, 1, h);
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
            rimYellow: dusty(P({color: 0xe9a917, roughness: 0.45, metalness: 0.2, clearcoat: 0.4}), 1.6, 0.8),
            alloy: dusty(S({color: 0xc3c6c9, roughness: 0.28, metalness: 0.95}), 0.6, 0.6),
            redPaint: dusty(P({color: 0xa50f15, roughness: 0.32, metalness: 0.15, clearcoat: 0.9,
                clearcoatRoughness: 0.12}), 0.7, 0.7),
            plastic: dusty(S({color: 0x1a1b1c, roughness: 0.65, metalness: 0.05}), 0.6, 0.6),
            glass: P({color: 0x0f1d26, roughness: 0.04, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.05,
                transparent: true, opacity: 0.62, envMapIntensity: 2.4, side: THREE.DoubleSide}),
            black: S({color: 0x101112, roughness: 0.7, metalness: 0.2}),
            grille: S({map: grille, roughness: 0.5, metalness: 0.5}),
            stripes: S({map: stripes, roughness: 0.6, metalness: 0.1}),
            chevron: S({map: chevron, roughness: 0.3, metalness: 0.4, emissive: 0x200000}),
            green: S({color: 0x20d020, emissive: 0x0a8a0a, emissiveIntensity: 1.2, roughness: 0.3}),
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
            cladding: dusty(S({map: cladding, roughness: 0.45, metalness: 0.55}), 1.0, 0.5),
            concrete: dusty(S({color: 0xb3ada2, roughness: 0.95}), 3.0, 0.45),
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
        const parts = [];
        const m4 = new THREE.Matrix4();
        const meshes = [];
        // Recorrido propio: las partes móviles (userData.part) se hornean por separado.
        const walk = function(o) {
            o.children.forEach(function(c) {
                if (c.userData.part) {
                    parts.push(c);
                    return;
                }
                if (c.isMesh) {
                    meshes.push(c);
                }
                walk(c);
            });
        };
        walk(root);
        meshes.forEach(function(o) {
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
        // Partes móviles: horneadas en su propio sistema (pivote) y reubicadas.
        parts.forEach(function(p) {
            const rel = new THREE.Matrix4().multiplyMatrices(inv, p.matrixWorld);
            const bp = bake(THREE, p);
            rel.decompose(bp.position, bp.quaternion, bp.scale);
            bp.name = 'mlx:' + p.userData.part;
            out.add(bp);
        });
        out.userData = Object.assign({}, root.userData);
        delete out.userData.part;
        return out;
    };

    /**
     * Parte móvil horneada por nombre (funciona también en copias con clone()).
     *
     * @param {Object} obj modelo
     * @param {string} name nombre de la parte
     * @returns {Object|null}
     */
    const part = (obj, name) => obj.getObjectByName('mlx:' + name) || null;

    /**
     * Grupo pivote para una parte móvil.
     *
     * @param {Object} THREE
     * @param {string} name
     * @param {number[]} pos pivote [x, y, z] en el sistema del padre
     * @returns {Object}
     */
    const pivot = function(THREE, name, pos) {
        const p = new THREE.Group();
        p.position.set(pos[0], pos[1], pos[2]);
        p.userData.part = name;
        return p;
    };

    // ---------------------------------------------------------------------
    // Marcas (ficticias) y rotulación.
    // ---------------------------------------------------------------------

    /** Marcas ficticias usadas en los equipos (no corresponden a fabricantes reales). */
    const BRAND = {heavy: 'MINEXA', tire: 'ROCATRAX', pickup: 'KAIRO', drill: 'SONDAX', company: 'MINERA CERRO ACONCAGUA'};

    /**
     * Emblema metálico (placa cromada con texto en relieve) para parrillas y capós.
     *
     * @param {Object} THREE
     * @param {string} text
     * @param {number} w ancho (m)
     * @param {number} h alto (m)
     * @param {Object} opt {bg, fg, chrome}
     * @returns {Object} malla (se conserva al hornear)
     */
    const badge = function(THREE, text, w, h, opt) {
        opt = opt || {};
        const tex = canvasTex(THREE, 512, Math.round(512 * h / w), function(g, cw, ch) {
            const r = ch * 0.45;
            const grd = g.createLinearGradient(0, 0, 0, ch);
            grd.addColorStop(0, opt.chrome === false ? opt.bg : '#f4f4f4');
            grd.addColorStop(0.5, opt.chrome === false ? opt.bg : '#9a9ea3');
            grd.addColorStop(1, opt.chrome === false ? opt.bg : '#e6e6e6');
            g.fillStyle = grd;
            g.beginPath();
            g.moveTo(r, 2);
            g.arcTo(cw - 2, 2, cw - 2, ch - 2, r);
            g.arcTo(cw - 2, ch - 2, 2, ch - 2, r);
            g.arcTo(2, ch - 2, 2, 2, r);
            g.arcTo(2, 2, cw - 2, 2, r);
            g.fill();
            g.fillStyle = opt.bg || '#111';
            g.beginPath();
            const m = ch * 0.12;
            g.moveTo(r + m, m);
            g.arcTo(cw - m, m, cw - m, ch - m, r - m);
            g.arcTo(cw - m, ch - m, m, ch - m, r - m);
            g.arcTo(m, ch - m, m, m, r - m);
            g.arcTo(m, m, cw - m, m, r - m);
            g.fill();
            g.fillStyle = opt.fg || '#e9e9e9';
            g.font = 'italic 900 ' + Math.round(ch * 0.58) + 'px "Arial Black", "Helvetica Neue", Arial, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(text, cw / 2, ch / 2 + ch * 0.03);
        }, true);
        const mat = new THREE.MeshStandardMaterial({map: tex, transparent: true, roughness: 0.25, metalness: 0.6,
            polygonOffset: true, polygonOffsetFactor: -2});
        const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        o.userData.keep = true;
        return o;
    };

    /**
     * Rotulación del flanco del neumático (texto en relieve dispuesto en círculo).
     *
     * @param {Object} THREE
     * @param {string} text
     * @returns {Object} textura
     */
    const sidewallTex = function(THREE, text) {
        const key = 'sw:' + text;
        const m = mats(THREE);
        m.__tex = m.__tex || {};
        if (m.__tex[key]) {
            return m.__tex[key];
        }
        const t = canvasTex(THREE, 1024, 1024, function(g, w) {
            g.clearRect(0, 0, w, w);
            g.translate(w / 2, w / 2);
            g.fillStyle = '#4a4a4a';
            g.font = '900 64px "Arial Black", Arial, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            const full = (text + '   ').repeat(2);
            const n = full.length;
            for (let i = 0; i < n; i++) {
                g.save();
                g.rotate(i / n * TAU);
                g.translate(0, -w * 0.405);
                g.fillText(full[i], 0, 0);
                g.restore();
            }
            g.strokeStyle = '#3a3a3a';
            g.lineWidth = 6;
            g.beginPath();
            g.arc(0, 0, w * 0.46, 0, TAU);
            g.stroke();
        }, true);
        m.__tex[key] = t;
        return t;
    };

    // ---------------------------------------------------------------------
    // Neumáticos y llantas.
    // ---------------------------------------------------------------------

    /**
     * Taco de banda: paralelogramo inclinado extruido radialmente con bisel.
     *
     * @param {Object} THREE
     * @param {number} lu largo circunferencial
     * @param {number} w0 inicio axial
     * @param {number} w1 fin axial
     * @param {number} slant inclinación (tangente)
     * @param {number} h altura del taco
     * @returns {Object} BufferGeometry (base en y = 0, altura hacia +y)
     */
    const lugGeometry = function(THREE, lu, w0, w1, slant, h) {
        const s = new THREE.Shape();
        s.moveTo(-lu / 2 + slant * w0, w0);
        s.lineTo(lu / 2 + slant * w0, w0);
        s.lineTo(lu / 2 * 0.85 + slant * w1, w1);
        s.lineTo(-lu / 2 * 0.85 + slant * w1, w1);
        s.closePath();
        const bev = Math.min(lu, Math.abs(w1 - w0)) * 0.08;
        const g = new THREE.ExtrudeGeometry(s, {depth: h - bev, bevelEnabled: true, bevelSize: bev, bevelThickness: bev,
            bevelSegments: 1, curveSegments: 1});
        g.rotateX(-Math.PI / 2);
        return g;
    };

    /**
     * Neumático realista con carcasa torneada, banda con tacos y nervio central,
     * rotulación del flanco y llanta (minera de varias piezas o de aleación).
     * El eje queda a lo largo de z; la cara exterior mira a +z.
     *
     * @param {Object} THREE
     * @param {Object} M materiales
     * @param {number} R radio exterior
     * @param {number} W ancho de banda
     * @param {Object} opt {pattern: mining|loader|allterrain, rim: mining|alloy, rimMat, label, lugs}
     * @returns {Object} grupo
     */
    const tire = function(THREE, M, R, W, opt) {
        opt = opt || {};
        const g = new THREE.Group();
        const pattern = opt.pattern || 'mining';
        const alloy = (opt.rim || (pattern === 'allterrain' ? 'alloy' : 'mining')) === 'alloy';
        const rimR = alloy ? R * 0.56 : R * 0.42;
        const lugH = pattern === 'allterrain' ? R * 0.035 : R * (pattern === 'loader' ? 0.07 : 0.05);
        const Rc = R - lugH * 0.85;

        // Carcasa con hombros redondeados.
        const prof = [
            [rimR * 1.04, -W * 0.40], [rimR * 1.12, -W * 0.47], [R * 0.78, -W * 0.51], [R * 0.9, -W * 0.5],
            [Rc * 0.975, -W * 0.44], [Rc, -W * 0.36], [Rc, W * 0.36], [Rc * 0.975, W * 0.44], [R * 0.9, W * 0.5],
            [R * 0.78, W * 0.51], [rimR * 1.12, W * 0.47], [rimR * 1.04, W * 0.40]
        ].map(p => new THREE.Vector2(p[0], p[1]));
        const body = new THREE.LatheGeometry(prof, 56);
        body.rotateX(Math.PI / 2);
        g.add(mesh(THREE, body, M.rubber));

        // Banda de rodado.
        const n = opt.lugs !== undefined ? opt.lugs : Math.max(18, Math.round(TAU * R / (pattern === 'allterrain' ?
            0.09 : (pattern === 'loader' ? 0.42 : 0.36))));
        if (n > 0) {
            const lu = TAU * Rc / n * (pattern === 'allterrain' ? 0.62 : (pattern === 'loader' ? 0.6 : 0.74));
            const geos = [];
            if (pattern === 'allterrain') {
                geos.push([lugGeometry(THREE, lu, W * 0.04, W * 0.22, 0.25, lugH), 0]);
                geos.push([lugGeometry(THREE, lu, W * 0.25, W * 0.45, -0.15, lugH), 0.5]);
            } else {
                geos.push([lugGeometry(THREE, lu, W * 0.07, W * 0.46, pattern === 'loader' ? 0.65 : 0.35, lugH), 0]);
            }
            for (let i = 0; i < n; i++) {
                [-1, 1].forEach(function(sd) {
                    geos.forEach(function(gd) {
                        const a = (i + (sd > 0 ? 0.5 : 0) + gd[1]) / n * TAU;
                        const lug = mesh(THREE, gd[0], M.rubber, Math.cos(a) * Rc * 0.995, Math.sin(a) * Rc * 0.995, 0);
                        lug.rotation.set(0, 0, a - Math.PI / 2);
                        if (sd < 0) {
                            lug.rotateY(Math.PI);
                        }
                        g.add(lug);
                    });
                });
            }
            if (pattern !== 'allterrain') {
                // Nervio central continuo.
                const rib = new THREE.TorusGeometry(Rc + lugH * 0.35, lugH * 0.45, 6, 64);
                const rm = mesh(THREE, rib, M.rubber);
                rm.scale.set(1, 1, W * 0.07 / (lugH * 0.45));
                g.add(rm);
            }
        }

        // Rotulación de flanco en la cara exterior.
        const label = opt.label || (BRAND.tire + (pattern === 'allterrain' ? '  A/T  265/65 R17' :
            '  MINING RADIAL  E-4  ★★'));
        const ringIn = rimR * 1.18;
        const ringOut = R * 0.88;
        const sw = new THREE.RingGeometry(ringIn, ringOut, 64, 1);
        const swUv = sw.attributes.uv;
        const swPos = sw.attributes.position;
        for (let i = 0; i < swPos.count; i++) {
            // Mapear el anillo al círculo de texto de la textura (radio relativo 0,405 del lienzo).
            const x = swPos.getX(i);
            const y = swPos.getY(i);
            const rr = Math.hypot(x, y);
            const k = 0.405 / ((ringIn + ringOut) / 2) * (0.92 + (rr - ringIn) / (ringOut - ringIn) * 0.16);
            swUv.setXY(i, 0.5 + x * k, 0.5 + y * k);
        }
        const swMat = new THREE.MeshStandardMaterial({map: sidewallTex(THREE, label), transparent: true, roughness: 0.85,
            polygonOffset: true, polygonOffsetFactor: -1});
        const swm = new THREE.Mesh(sw, swMat);
        swm.position.z = W * 0.512;
        swm.userData.keep = true;
        g.add(swm);

        if (alloy) {
            // Llanta de aleación: barril, rayos dobles, tuercas y tapa central con emblema.
            const barrel = new THREE.LatheGeometry([[rimR * 1.02, -W * 0.42], [rimR * 1.04, -W * 0.38],
                [rimR * 0.96, -W * 0.3], [rimR * 0.96, W * 0.3], [rimR * 1.04, W * 0.38], [rimR * 1.02, W * 0.42]]
                .map(p => new THREE.Vector2(p[0], p[1])), 40);
            barrel.rotateX(Math.PI / 2);
            g.add(mesh(THREE, barrel, opt.rimMat || M.alloy));
            const face = new THREE.CylinderGeometry(rimR * 0.3, rimR * 0.34, W * 0.12, 24);
            face.rotateX(Math.PI / 2);
            g.add(mesh(THREE, face, opt.rimMat || M.alloy, 0, 0, W * 0.3));
            for (let k = 0; k < 6; k++) {
                const a = k / 6 * TAU;
                [-0.09, 0.09].forEach(function(da) {
                    const sp = rbox(THREE, rimR * 0.68, rimR * 0.11, W * 0.08, rimR * 0.03);
                    const spm = mesh(THREE, sp, opt.rimMat || M.alloy, Math.cos(a + da) * rimR * 0.62,
                        Math.sin(a + da) * rimR * 0.62, W * 0.32);
                    spm.rotation.z = a + da;
                    g.add(spm);
                });
                const nut = new THREE.CylinderGeometry(rimR * 0.035, rimR * 0.035, W * 0.06, 6);
                nut.rotateX(Math.PI / 2);
                g.add(mesh(THREE, nut, M.chrome, Math.cos(a + 0.52) * rimR * 0.2, Math.sin(a + 0.52) * rimR * 0.2, W * 0.37));
            }
            const capd = new THREE.CylinderGeometry(rimR * 0.13, rimR * 0.13, W * 0.04, 20);
            capd.rotateX(Math.PI / 2);
            g.add(mesh(THREE, capd, M.black, 0, 0, W * 0.38));
            return g;
        }

        // Llanta minera de varias piezas: aro con pestaña, anillo de bloqueo, disco, pernos y mando final.
        const rimMat = opt.rimMat || M.rim;
        const rimP = [
            [rimR * 1.06, -W * 0.44], [rimR * 1.06, -W * 0.40], [rimR * 0.98, -W * 0.37], [rimR * 0.98, W * 0.37],
            [rimR * 1.07, W * 0.40], [rimR * 1.07, W * 0.44], [rimR * 0.9, W * 0.44], [rimR * 0.9, W * 0.2],
            [rimR * 0.55, W * 0.16], [rimR * 0.5, W * 0.1], [rimR * 0.02, W * 0.1]
        ].map(p => new THREE.Vector2(p[0], p[1]));
        const rim = new THREE.LatheGeometry(rimP, 48);
        rim.rotateX(Math.PI / 2);
        g.add(mesh(THREE, rim, rimMat));
        const lock = new THREE.TorusGeometry(rimR * 1.0, rimR * 0.035, 6, 48);
        g.add(mesh(THREE, lock, M.steel, 0, 0, W * 0.43));
        const nN = 24;
        const nutGeo = new THREE.CylinderGeometry(rimR * 0.04, rimR * 0.04, W * 0.05, 6);
        nutGeo.rotateX(Math.PI / 2);
        for (let i = 0; i < nN; i++) {
            const a = i / nN * TAU;
            g.add(mesh(THREE, nutGeo, M.steelLight, Math.cos(a) * rimR * 0.72, Math.sin(a) * rimR * 0.72, W * 0.2));
        }
        const fd = new THREE.CylinderGeometry(rimR * 0.42, rimR * 0.46, W * 0.14, 32);
        fd.rotateX(Math.PI / 2);
        g.add(mesh(THREE, fd, M.steel, 0, 0, W * 0.17));
        const fdc = new THREE.CylinderGeometry(rimR * 0.2, rimR * 0.24, W * 0.08, 24);
        fdc.rotateX(Math.PI / 2);
        g.add(mesh(THREE, fdc, rimMat, 0, 0, W * 0.27));
        for (let i = 0; i < 8; i++) {
            const a = i / 8 * TAU;
            g.add(mesh(THREE, nutGeo, M.steelLight, Math.cos(a) * rimR * 0.33, Math.sin(a) * rimR * 0.33, W * 0.25));
        }
        g.add(rod(THREE, new THREE.Vector3(rimR * 0.85, 0, W * 0.3), new THREE.Vector3(rimR * 0.85, rimR * 0.06, W * 0.42),
            rimR * 0.015, M.chrome, 6));
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
            const wf = tire(THREE, M, R, TW, {pattern: 'mining', label: BRAND.tire + '  40.00R57  MINING RADIAL  E-4  ★★'});
            wf.position.set(xf, R, sd * zf);
            if (sd < 0) {
                wf.rotation.y = Math.PI;
            }
            g.add(wf);
            [zr1, zr2].forEach(function(zz) {
                const wr = tire(THREE, M, R, TW, {pattern: 'mining', label: BRAND.tire + '  40.00R57  MINING RADIAL  E-4  ★★'});
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
        [-0.4, 0.4].forEach(function(z) {
            const wp = rb(cab, THREE, M.black, [0.03, 0.75, 0.04], [1.2, 1.45, z], 0.01);
            wp.rotation.x = 0.5;
        });
        // Puerta lateral con marco y manilla, pasamanos.
        rb(cab, THREE, M.plastic, [1.4, 0.03, 0.02], [0.05, 2.1, -1.215], 0.005);
        rb(cab, THREE, M.plastic, [0.03, 2.0, 0.02], [0.75, 1.1, -1.215], 0.005);
        rb(cab, THREE, M.plastic, [0.03, 2.0, 0.02], [-0.65, 1.1, -1.215], 0.005);
        rb(cab, THREE, M.chrome, [0.2, 0.05, 0.05], [0.55, 1.1, -1.24], 0.01);
        cab.add(rod(THREE, new THREE.Vector3(-0.9, 0.3, -1.3), new THREE.Vector3(-0.9, 1.9, -1.3), 0.025, M.yellow, 6));
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
            // Cilindro de levante como parte móvil: se orienta y estira según el ángulo de la tolva.
            const hb = new THREE.Vector3(0.9, 2.3, sd * 1.35);
            const hl = new THREE.Vector3(-0.6, BY + 0.05, sd * 1.5).distanceTo(hb);
            const hpv = pivot(THREE, 'hoist' + sd, [hb.x, hb.y, hb.z]);
            hydraulic(hpv, THREE, M, [0, 0, 0], [0, hl, 0], 0.24);
            g.add(hpv);
        });
        // Rotulación: número de flota, marca y modelo; luces y franjas reflectantes.
        const num = number || ('C-' + Math.round(100 + payload / 3));
        const model = 'HT ' + Math.round(payload);
        const bodyDecals = [];
        [-1, 1].forEach(function(sd) {
            const d = decal(THREE, num, 1.9, 0.7, '#151515');
            d.position.set(-1.3, BY + 1.55, sd * (BW / 2 + 0.25));
            const br = decal(THREE, BRAND.heavy, 2.6, 0.5, '#151515');
            br.position.set(-4.4, BY + 1.15, sd * (BW / 2 + 0.25));
            const md = decal(THREE, model, 1.0, 0.28, '#151515');
            md.position.set(4.2, 3.35, sd * 1.33);
            [d, br, md].forEach(function(o) {
                if (sd < 0) {
                    o.rotation.y = Math.PI;
                }
                g.add(o);
            });
            bodyDecals.push(d, br);
            rb(g, THREE, M.taillight, [0.08, 0.25, 0.4], [-4.85, 2.1, sd * 0.85], 0.03);
            rb(g, THREE, M.amber, [0.08, 0.2, 0.25], [-4.85, 2.45, sd * 0.85], 0.03);
            // Guardabarros traseros y expulsores de roca entre duales.
            rb(g, THREE, M.plastic, [0.06, 1.1, 1.2], [xr - 2.1, 1.0, sd * (zr1 - 0.55)], 0.02);
            g.add(rod(THREE, new THREE.Vector3(xr + 0.2, 2.6, sd * (zr1 - TW * 0.54)), new THREE.Vector3(xr + 0.6,
                R * 2 - 0.15, sd * (zr1 - TW * 0.54)), 0.07, M.steel, 8));
            // Indicadores de carga útil (verde/ámbar/rojo) en las esquinas de la cubierta.
            [M.green, M.amber, M.taillight].forEach(function(mt, i) {
                g.add(mesh(THREE, new THREE.SphereGeometry(0.08, 10, 8), mt, 5.6, 4.55 + i * 0.2, sd * (W / 2 - 0.2)));
            });
        });
        // Cola de la tolva con franjas reflectantes y marca frontal sobre el radiador.
        const tailStripe = mesh(THREE, new THREE.PlaneGeometry(BW - 0.6, 0.35), M.chevron, -7.95, BY + 0.5, 0);
        tailStripe.rotation.y = -Math.PI / 2;
        tailStripe.rotateX(-0.42);
        g.add(tailStripe);
        const front = decal(THREE, BRAND.heavy, 2.2, 0.42, '#151515');
        front.position.set(5.62, 3.95, 0);
        front.rotation.y = Math.PI / 2;
        g.add(front);
        const fb = badge(THREE, BRAND.heavy, 0.9, 0.22, {bg: '#151515'});
        fb.position.set(5.77, 3.95 - 0.55, 0);
        fb.rotation.y = Math.PI / 2;
        g.add(fb);

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
        heap.name = 'mlx:load';
        g.add(heap);

        // Tolva (con su carga, rotulación lateral y franjas) como parte móvil con bisagra trasera.
        const hinge = [-4.3, BY, 0];
        const bodyPivot = pivot(THREE, 'body', hinge);
        g.add(bodyPivot);
        g.updateMatrixWorld(true);
        [bodyGrp, heap, tailStripe].concat(bodyDecals).forEach(o => bodyPivot.attach(o));
        g.userData.dump = {hinge: [hinge[0], hinge[1]], top: [-0.6, BY + 0.05], z: 1.5, len: new THREE.Vector3(-0.6,
            BY + 0.05, 1.5).distanceTo(new THREE.Vector3(0.9, 2.3, 1.35))};

        const out = bake(THREE, g);
        const load = part(out, 'load');
        if (load) {
            load.visible = !!loaded;
        }
        setDump(THREE, out, 0);
        out.scale.setScalar(s);
        out.userData.length = L * s;
        out.userData.width = W * s;
        out.userData.tireDiameter = R * 2 * s;
        return out;
    };

    /**
     * Levanta la tolva del camión (radianes) y reorienta los cilindros de levante.
     *
     * @param {Object} THREE
     * @param {Object} truck modelo de camión
     * @param {number} a ángulo de la tolva (0 = bajada)
     */
    const setDump = function(THREE, truck, a) {
        const d = truck.userData.dump;
        const body = part(truck, 'body');
        if (!d || !body) {
            return;
        }
        body.rotation.z = a;
        const Y = new THREE.Vector3(0, 1, 0);
        const Z = new THREE.Vector3(0, 0, 1);
        [1, -1].forEach(function(sd) {
            const h = part(truck, 'hoist' + sd);
            if (!h) {
                return;
            }
            const top = new THREE.Vector3(d.top[0] - d.hinge[0], d.top[1] - d.hinge[1], 0).applyAxisAngle(Z, a)
                .add(new THREE.Vector3(d.hinge[0], d.hinge[1], sd * d.z));
            const dir = top.sub(h.position);
            const len = dir.length();
            h.quaternion.setFromUnitVectors(Y, dir.normalize());
            h.scale.set(1, len / d.len, 1);
        });
    };

    /**
     * Ciclo de la pala: excavar en el frente (giro 0), girar cargada hacia el camión
     * (giro = swing), vaciar el balde y volver.
     *
     * @param {Object} THREE
     * @param {Object} shovel modelo de pala
     * @param {number} t tiempo (s)
     * @param {number} swing ángulo de giro hacia el camión (rad)
     */
    const animateShovel = function(THREE, shovel, t, swing) {
        const up = part(shovel, 'upper');
        const front = part(shovel, 'front');
        const rig = shovel.userData.rig;
        if (!up || !front || !rig) {
            return;
        }
        const T = 34;
        const p = ((t % T) + T) % T / T;
        const ease = x => x * x * (3 - 2 * x);
        const seg = (a, b) => ease(Math.min(1, Math.max(0, (p - a) / (b - a))));
        // Excavación: el balde sube por el frente; giro, descarga y retorno.
        const dig = seg(0.0, 0.3);
        const out1 = seg(0.32, 0.47);
        const back = seg(0.58, 0.78);
        const lower = seg(0.8, 0.98);
        up.rotation.y = swing * (out1 - back);
        let ang = -0.45 + 0.75 * dig;
        ang -= 0.75 * lower;
        front.rotation.z = ang;
        const crowd = 1.2 * Math.sin(dig * Math.PI) - 0.6 * lower;
        const dir = new THREE.Vector3(Math.cos(0.6), Math.sin(0.6), 0);
        front.position.copy(front.userData.home || (front.userData.home = front.position.clone())).addScaledVector(dir,
            crowd);
        const load = part(shovel, 'dload');
        if (load) {
            load.visible = p > 0.18 && p < 0.52;
        }
        // Cables desde la punta de pluma hasta el estrobo del balde.
        front.updateMatrix();
        const bail = new THREE.Vector3(rig.bail[0], rig.bail[1], 0).applyMatrix4(front.matrix);
        [1, -1].forEach(function(sd) {
            const r = part(shovel, 'rope' + sd);
            if (!r) {
                return;
            }
            const a = new THREE.Vector3(rig.point[0], rig.point[1], sd * rig.ropeZ);
            const b = bail.clone().setZ(sd * rig.ropeZ);
            const d = b.sub(a);
            r.position.copy(a);
            r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
            r.scale.set(1, d.length(), 1);
        });
    };

    /**
     * Postura del cargador: elevación de brazos y giro del balde (radianes).
     *
     * @param {Object} loader
     * @param {number} lift 0 = abajo
     * @param {number} tilt positivo = recogido, negativo = vaciando
     * @param {boolean} loaded material en el balde
     */
    const setLoaderPose = function(loader, lift, tilt, loaded) {
        const l = part(loader, 'lift');
        const b = part(loader, 'bucket');
        if (l) {
            l.rotation.z = lift;
        }
        if (b) {
            b.rotation.z = tilt - lift;
        }
        const m = part(loader, 'bload');
        if (m) {
            m.visible = !!loaded;
        }
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
            const d = decal(THREE, BRAND.heavy + '  RS-4100', 6.5, 1.0, '#c48a00');
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
        // Conjunto mango + balde como parte móvil (pivote en la montura).
        const front = pivot(THREE, 'front', [saddle.x, saddle.y, 0]);
        up.add(front);
        const rel = v => v.clone().sub(new THREE.Vector3(saddle.x, saddle.y, 0));
        [-0.65, 0.65].forEach(function(z) {
            front.add(rod(THREE, rel(saddle.clone().setZ(z).add(new THREE.Vector3(-3.0, 1.2, 0))), rel(dip.clone().setZ(z)
                .add(new THREE.Vector3(-1.6, 0.8, 0))), 0.38, M.yellow, 12));
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
        // Carga dentro del balde (visible entre la excavación y la descarga).
        const dl = new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2);
        const dlm = mesh(THREE, dl, M.rock, 0.2, 1.4, 0);
        dlm.scale.set(1.9, 1.0, 2.0);
        dlm.userData.keep = true;
        dlm.name = 'mlx:dload';
        dipper.add(dlm);
        dipper.position.copy(rel(dip));
        dipper.rotation.z = -0.25;
        front.add(dipper);
        // Cables de izaje dinámicos (cilindro unitario que se orienta cada cuadro).
        const ropeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 6);
        ropeGeo.translate(0, 0.5, 0);
        [1, -1].forEach(function(sd) {
            const rp = mesh(THREE, ropeGeo, M.rope);
            rp.userData.keep = true;
            rp.name = 'mlx:rope' + sd;
            up.add(rp);
        });
        up.userData.part = 'upper';
        g.userData.rig = {point: [point.x + 1.4, point.y - 0.8], bail: [dip.x - saddle.x + 0.9, dip.y - saddle.y + 3.3],
            ropeZ: 0.5};
        // Focos.
        [-1, 1].forEach(function(sd) {
            rb(up, THREE, M.headlight, [0.15, 0.35, 0.55], [3.35, 7.2, sd * 4.0], 0.05);
        });
        g.add(up);
        const out = bake(THREE, g);
        out.userData.kind = 'shovel';
        animateShovel(THREE, out, 0, 0);
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
        [-1, 1].forEach(function(sd) {
            const d = decal(THREE, BRAND.heavy + ' DR-271', 3.4, 0.5, '#151515');
            d.position.set(-2.2, 4.75, sd * 2.24);
            if (sd < 0) {
                d.rotation.y = Math.PI;
            }
            g.add(d);
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
        const TW = 0.95;
        const lab = BRAND.tire + '  35/65R33  L-5  ROCK';
        [[2.4, 1], [2.4, -1], [-2.4, 1], [-2.4, -1]].forEach(function(p) {
            const w = tire(THREE, M, R, TW, {pattern: 'loader', label: lab});
            w.position.set(p[0], R, p[1] * 1.75);
            if (p[1] < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
            // Guardafangos sobre cada rueda.
            const fender = new THREE.TorusGeometry(R + 0.18, 0.05, 6, 20, Math.PI * 0.7);
            const fm = mesh(THREE, fender, M.yellow, p[0], R, p[1] * 1.75);
            fm.rotation.z = Math.PI * 0.15;
            fm.scale.z = 9;
            g.add(fm);
        });

        // Bastidor trasero, sala de motor inclinada, contrapeso redondeado.
        rb(g, THREE, M.yellow, [5.2, 1.4, 2.3], [-2.6, 2.1, 0], 0.2);
        const hood = new THREE.Shape();
        hood.moveTo(-5.3, 0);
        hood.lineTo(-1.6, 0);
        hood.lineTo(-1.6, 1.7);
        hood.lineTo(-4.6, 1.45);
        hood.quadraticCurveTo(-5.3, 1.4, -5.35, 0.9);
        hood.closePath();
        const hg = new THREE.ExtrudeGeometry(hood, {depth: 2.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12,
            bevelSegments: 3, curveSegments: 8});
        hg.translate(0, 2.75, -1.25);
        g.add(mesh(THREE, hg, M.yellow));
        [-1, 1].forEach(function(sd) {
            for (let k = 0; k < 3; k++) {
                const lv = mesh(THREE, new THREE.PlaneGeometry(0.7, 0.8), M.louver, -4.2 + k * 0.85, 3.7, sd * 1.38);
                if (sd < 0) {
                    lv.rotation.y = Math.PI;
                }
                g.add(lv);
            }
        });
        rb(g, THREE, M.grille, [0.12, 1.1, 2.1], [-5.45, 3.4, 0], 0.04);
        const cw = new THREE.CylinderGeometry(1.0, 1.0, 3.1, 24, 1, false, Math.PI / 2, Math.PI);
        cw.rotateX(Math.PI / 2);
        const cwm = mesh(THREE, cw, M.yellow, -5.25, 1.8, 0);
        cwm.scale.set(0.55, 1, 1);
        g.add(cwm);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.taillight, [0.06, 0.18, 0.3], [-5.82, 2.3, sd * 1.1], 0.03);
            rb(g, THREE, M.headlight, [0.06, 0.2, 0.3], [-5.82, 2.0, sd * 1.1], 0.03);
        });
        g.add(rod(THREE, new THREE.Vector3(-2.6, 4.4, 0.7), new THREE.Vector3(-2.6, 5.5, 0.7), 0.13, M.steel, 14));
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), M.black, -3.6, 4.65, -0.6));

        // Cabina con estructura ROPS y grandes vidrios.
        const cab = new THREE.Group();
        rb(cab, THREE, M.yellow, [2.3, 0.5, 2.3], [0, 0.25, 0], 0.08);
        [[1.05, 1.05], [1.05, -1.05], [-1.05, 1.05], [-1.05, -1.05]].forEach(function(p) {
            rb(cab, THREE, M.yellow, [0.14, 2.1, 0.14], [p[0], 1.5, p[1]], 0.04);
        });
        rb(cab, THREE, M.yellow, [2.6, 0.2, 2.6], [0, 2.6, 0], 0.08);
        [[1.08, 0, Math.PI / 2], [-1.08, 0, -Math.PI / 2]].forEach(function(p) {
            const w = mesh(THREE, new THREE.PlaneGeometry(1.95, 1.9), M.glass, p[0], 1.5, p[1]);
            w.rotation.y = p[2];
            cab.add(w);
        });
        [-1, 1].forEach(function(sd) {
            const w = mesh(THREE, new THREE.PlaneGeometry(1.95, 1.9), M.glass, 0, 1.5, sd * 1.08);
            cab.add(w);
        });
        rb(cab, THREE, M.black, [0.03, 0.8, 0.04], [1.1, 1.3, 0], 0.01);
        [-1, 1].forEach(function(sd) {
            rb(cab, THREE, M.headlight, [0.1, 0.18, 0.3], [1.3, 2.62, sd * 0.85], 0.03);
            rb(cab, THREE, M.headlight, [0.1, 0.18, 0.3], [-1.3, 2.62, sd * 0.85], 0.03);
        });
        cab.add(mesh(THREE, new THREE.CylinderGeometry(0.11, 0.11, 0.2, 10), M.amber, -0.6, 2.82, 0));
        cab.position.set(-0.9, 2.8, 0);
        g.add(cab);
        stairs(g, THREE, M, [-1.2, 0.45, 2.75], [-0.55, 2.8, 1.45], 0.6);
        railing(g, THREE, M.yellow, [[-2.2, 2.85, 1.2], [0.4, 2.85, 1.2]], 1.0);

        // Articulación central y bastidor delantero.
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.45, 0.45, 1.3, 18), M.steel, 0.2, 2.1, 0));
        rb(g, THREE, M.yellow, [3.4, 1.4, 1.9], [2.1, 2.05, 0], 0.22);

        // Brazos de levante curvos (perfil extruido) y varillaje en Z.
        const iLift = g.children.length;
        const arm = new THREE.Shape();
        arm.moveTo(0, -0.35);
        arm.quadraticCurveTo(2.0, -0.1, 4.6, -1.7);
        arm.lineTo(4.75, -1.15);
        arm.quadraticCurveTo(2.2, 0.55, 0, 0.35);
        arm.closePath();
        const ag = new THREE.ExtrudeGeometry(arm, {depth: 0.32, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06,
            bevelSegments: 2, curveSegments: 10});
        ag.translate(0, 0, -0.16);
        [-1, 1].forEach(function(sd) {
            g.add(mesh(THREE, ag, M.yellow, 1.6, 3.4, sd * 1.05));
            hydraulic(g, THREE, M, [1.5, 1.9, sd * 1.32], [3.5, 3.05, sd * 1.28], 0.17);
            g.add(mesh(THREE, new THREE.CylinderGeometry(0.2, 0.2, 0.5, 14), M.steel, 1.6, 3.4, sd * 1.05).rotateX(Math.PI / 2));
        });
        rb(g, THREE, M.yellow, [0.4, 0.4, 2.1], [4.0, 2.55, 0], 0.1);
        const bell = rb(g, THREE, M.yellow, [0.45, 2.0, 0.45], [3.6, 3.9, 0], 0.12);
        bell.rotation.z = -0.25;
        hydraulic(g, THREE, M, [1.4, 3.3, 0], [3.35, 4.7, 0], 0.18);
        g.add(rod(THREE, new THREE.Vector3(3.9, 3.0, 0), new THREE.Vector3(5.7, 1.6, 0), 0.14, M.yellow, 10));

        // Balde con placas laterales, labio y dientes.
        const iBucket = g.children.length;
        const bshape = new THREE.Shape();
        bshape.moveTo(0, 0);
        bshape.lineTo(1.95, -0.1);
        bshape.lineTo(1.85, 0.22);
        bshape.quadraticCurveTo(0.45, 0.25, 0.2, 1.75);
        bshape.lineTo(-0.15, 1.85);
        bshape.closePath();
        const bg = new THREE.ExtrudeGeometry(bshape, {depth: 4.1, bevelEnabled: true, bevelSize: 0.05,
            bevelThickness: 0.05, bevelSegments: 2});
        bg.translate(0, 0, -2.05);
        g.add(mesh(THREE, bg, M.steel, 5.7, 0.35, 0));
        const side = new THREE.Shape();
        side.moveTo(0, 0);
        side.lineTo(1.95, -0.1);
        side.quadraticCurveTo(1.0, 1.4, -0.15, 1.85);
        side.closePath();
        const sg = new THREE.ExtrudeGeometry(side, {depth: 0.08, bevelEnabled: false});
        [-1, 1].forEach(function(sd) {
            g.add(mesh(THREE, sg, M.yellow, 5.7, 0.35, sd * 2.1 - 0.04));
        });
        rb(g, THREE, M.steelLight, [0.35, 0.1, 4.2], [7.55, 0.27, 0], 0.03);
        for (let k = 0; k < 8; k++) {
            const tooth = new THREE.ConeGeometry(0.1, 0.5, 6);
            tooth.rotateZ(-Math.PI / 2);
            g.add(mesh(THREE, tooth, M.steelLight, 7.85, 0.27, -1.85 + k * 0.53));
        }

        const iEnd = g.children.length;
        // Material dentro del balde (visible al cargar).
        const bl = mesh(THREE, new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2), M.rock, 6.6, 0.45, 0);
        bl.scale.set(0.95, 0.75, 1.9);
        bl.userData.keep = true;
        bl.name = 'mlx:bload';
        g.add(bl);
        // Brazos y balde como partes móviles anidadas.
        const kids = g.children.slice();
        const liftP = pivot(THREE, 'lift', [1.6, 3.4, 0]);
        const bucketP = pivot(THREE, 'bucket', [5.75, 1.3, 0]);
        g.add(liftP);
        g.updateMatrixWorld(true);
        liftP.attach(bucketP);
        g.updateMatrixWorld(true);
        kids.slice(iLift, iBucket).forEach(o => liftP.attach(o));
        kids.slice(iBucket, iEnd).concat([bl]).forEach(o => bucketP.attach(o));

        // Rotulación.
        [-1, 1].forEach(function(sd) {
            const d = decal(THREE, BRAND.heavy + ' WL-994', 2.4, 0.4, '#151515');
            d.position.set(-3.4, 3.05, sd * 1.4);
            if (sd < 0) {
                d.rotation.y = Math.PI;
            }
            g.add(d);
        });
        const rearBadge = decal(THREE, BRAND.heavy, 1.4, 0.3, '#151515');
        rearBadge.position.set(-5.84, 1.7, 0);
        rearBadge.rotation.y = -Math.PI / 2;
        g.add(rearBadge);
        const out = bake(THREE, g);
        out.userData.kind = 'loader';
        return out;
    };

    // ---------------------------------------------------------------------
    // Camioneta de supervisión.
    // ---------------------------------------------------------------------

    /**
     * Camioneta doble cabina de faena, roja (color habitual en las mineras), con
     * equipamiento minero: defensa, pértiga con banderín, baliza, barra de luces,
     * jaula antivuelco, snorkel, pisaderas, cintas reflectantes y número interno.
     *
     * Variantes (proporciones y rasgos reales de las camionetas más usadas en faenas chilenas,
     * sin logotipos de fabricantes): hx (doble cabina tradicional), lx (escudo frontal en «X»
     * y transición curva cabina–caja) y tx (frente alto rectangular).
     *
     * @param {Object} THREE
     * @param {string} number número interno
     * @param {string} variant hx | lx | tx
     * @returns {Object}
     */
    const pickup = function(THREE, number, variant) {
        const M = mats(THREE);
        const g = new THREE.Group();
        variant = variant || 'hx';
        const W = variant === 'tx' ? 1.9 : (variant === 'lx' ? 1.815 : 1.855);
        const paint = M.redPaint;
        const xr = -1.55;
        const xf = 1.55;
        const wr = 0.39;

        // Carrocería inferior: perfil lateral con pasos de rueda reales.
        const lo = new THREE.Shape();
        lo.moveTo(-2.68, 0.52);
        lo.lineTo(xr - 0.5, 0.52);
        lo.absarc(xr, 0.42, 0.5, Math.PI * 0.94, Math.PI * 0.06, true);
        lo.lineTo(xf - 0.5, 0.52);
        lo.absarc(xf, 0.42, 0.5, Math.PI * 0.94, Math.PI * 0.06, true);
        // Silueta según variante: altura del frente del capó, base del parabrisas y borde de la caja.
        const hf = variant === 'tx' ? 1.1 : (variant === 'lx' ? 0.93 : 1.0);
        const hb = variant === 'tx' ? 1.2 : (variant === 'lx' ? 1.13 : 1.16);
        const bt = variant === 'tx' ? 1.27 : (variant === 'lx' ? 1.2 : 1.22);
        lo.lineTo(2.55, 0.52);
        lo.quadraticCurveTo(2.72, 0.56, 2.72, 0.78);
        lo.lineTo(2.68, hf);
        if (variant === 'tx') {
            lo.lineTo(2.45, hf + 0.06);
        } else {
            lo.quadraticCurveTo(2.5, hf + 0.08, 2.1, hf + 0.1);
        }
        lo.lineTo(1.0, hb);
        lo.lineTo(-1.15, hb);
        if (variant === 'lx') {
            // Línea «J»: el borde de la caja desciende en curva desde la cabina.
            lo.quadraticCurveTo(-1.3, hb - 0.06, -1.5, bt);
        } else {
            lo.lineTo(-1.15, bt);
        }
        lo.lineTo(-2.68, bt);
        lo.lineTo(-2.7, 0.62);
        lo.closePath();
        const lower = new THREE.ExtrudeGeometry(lo, {depth: W - 0.14, bevelEnabled: true, bevelSize: 0.06,
            bevelThickness: 0.07, bevelSegments: 4, curveSegments: 14});
        lower.translate(0, 0, -(W - 0.14) / 2);
        g.add(mesh(THREE, lower, paint));

        // Cabina (invernadero) más angosta con parabrisas inclinado.
        const cab = new THREE.Shape();
        cab.moveTo(1.02, 0);
        cab.lineTo(0.38, 0.62);
        cab.quadraticCurveTo(0.28, 0.7, 0.12, 0.7);
        cab.lineTo(-0.98, 0.7);
        cab.quadraticCurveTo(-1.1, 0.69, -1.12, 0.58);
        cab.lineTo(-1.16, 0);
        cab.closePath();
        const cg = new THREE.ExtrudeGeometry(cab, {depth: W - 0.34, bevelEnabled: true, bevelSize: 0.07,
            bevelThickness: 0.08, bevelSegments: 4, curveSegments: 10});
        cg.translate(0, hb - 0.01, -(W - 0.34) / 2);
        if (variant === 'tx') {
            cg.scale(1, 1.06, 1);
        }
        g.add(mesh(THREE, cg, paint));
        // Vidrios: parabrisas, laterales y luneta.
        const wind = mesh(THREE, new THREE.PlaneGeometry(0.84, W - 0.42), M.glass, 0.72, 1.48, 0);
        wind.rotation.set(-Math.PI / 2, -0.78, 0);
        wind.rotation.order = 'YXZ';
        wind.rotation.set(-Math.PI / 2 + 0.0, 0, 0);
        wind.rotateY(0.78);
        g.add(wind);
        const sideGlass = new THREE.Shape();
        sideGlass.moveTo(0.93, 1.2);
        sideGlass.lineTo(0.42, 1.73);
        sideGlass.lineTo(-1.02, 1.73);
        sideGlass.lineTo(-1.06, 1.2);
        sideGlass.closePath();
        const sgGeo = new THREE.ShapeGeometry(sideGlass);
        [-1, 1].forEach(function(sd) {
            g.add(mesh(THREE, sgGeo, M.glass, 0, 0, sd * ((W - 0.34) / 2 + 0.09)));
            // Pilar B y marcos de puertas.
            rb(g, THREE, M.plastic, [0.07, 0.56, 0.02], [-0.12, 1.46, sd * ((W - 0.34) / 2 + 0.1)], 0.01);
            [[0.98, 0.62], [-0.12, 0.62], [-1.12, 0.62]].forEach(function(p) {
                rb(g, THREE, M.plastic, [0.012, 0.6, 0.012], [p[0], 0.86, sd * (W / 2 + 0.005)], 0.004);
            });
            rb(g, THREE, M.plastic, [2.1, 0.012, 0.012], [-0.07, 0.55, sd * (W / 2 + 0.005)], 0.004);
            [0.32, -0.75].forEach(function(x) {
                rb(g, THREE, M.chrome, [0.17, 0.035, 0.035], [x, 1.08, sd * (W / 2 + 0.02)], 0.01);
            });
            // Espejo retrovisor.
            g.add(rod(THREE, new THREE.Vector3(0.9, 1.25, sd * (W / 2 - 0.05)), new THREE.Vector3(0.95, 1.32,
                sd * (W / 2 + 0.18)), 0.02, M.plastic, 6));
            rb(g, THREE, M.plastic, [0.1, 0.2, 0.26], [0.95, 1.38, sd * (W / 2 + 0.24)], 0.04);
            // Cinta reflectante roja/blanca y logo de la minera en la puerta.
            rb(g, THREE, M.reflect, [5.1, 0.05, 0.01], [-0.05, 0.72, sd * (W / 2 + 0.012)], 0.004);
            const logo = decal(THREE, BRAND.company, 0.95, 0.12, '#ffffff');
            logo.position.set(0.25, 0.9, sd * (W / 2 + 0.03));
            if (sd < 0) {
                logo.rotation.y = Math.PI;
            }
            g.add(logo);
            const num = decal(THREE, number || 'CAM-23', 0.5, 0.15, '#ffffff');
            num.position.set(-0.78, 0.9, sd * (W / 2 + 0.03));
            if (sd < 0) {
                num.rotation.y = Math.PI;
            }
            g.add(num);
            // Pisaderas tubulares y guardafangos.
            g.add(tube(THREE, [[1.0, 0.42, sd * (W / 2 + 0.08)], [-1.1, 0.42, sd * (W / 2 + 0.08)]], 0.035, M.plastic));
            [xr, xf].forEach(function(x) {
                const flare = new THREE.TorusGeometry(0.52, 0.045, 6, 20, Math.PI * 0.88);
                const fm = mesh(THREE, flare, M.plastic, x, 0.42, sd * (W / 2 + 0.01));
                fm.rotation.z = Math.PI * 0.06;
                fm.scale.z = 2.2;
                g.add(fm);
            });
            rb(g, THREE, M.plastic, [0.03, 0.3, 0.28], [xr - 0.62, 0.45, sd * (W / 2 - 0.2)], 0.01);
        });
        const rear = mesh(THREE, new THREE.PlaneGeometry(0.3, W - 0.5), M.glass, -1.17, 1.48, 0);
        rear.rotation.set(-Math.PI / 2, 0, 0);
        rear.rotateY(-Math.PI / 2 + 0.08);
        g.add(rear);

        // Frente según variante (proporciones y rasgos de las camionetas más usadas en faena):
        // hx = parrilla trapezoidal grande con barra cromada; lx = escudo en «X» cromado con
        // focos altos y delgados; tx = parrilla rectangular vertical con lamas cromadas.
        const front = function(x, y, z) {
            return [2.66 + x, y, z];
        };
        if (variant === 'lx') {
            rb(g, THREE, M.plastic, [0.06, 0.3, 0.95], front(0.05, 0.82, 0), 0.03);
            for (let k = 0; k < 5; k++) {
                rb(g, THREE, M.steel, [0.02, 0.02, 0.9], front(0.08, 0.7 + k * 0.06, 0), 0.006);
            }
            [-1, 1].forEach(function(sd) {
                // Barras cromadas del escudo en «X».
                g.add(tube(THREE, [front(0.05, 0.98, sd * 0.42), front(0.08, 0.86, sd * 0.56), front(0.1, 0.62, sd * 0.66),
                    front(0.12, 0.46, sd * 0.6)], 0.022, M.chrome, true));
                const hl = rb(g, THREE, M.headlight, [0.05, 0.07, 0.38], front(0.0, 0.99, sd * 0.68), 0.02);
                hl.rotation.x = sd * -0.12;
                rb(g, THREE, M.headlight, [0.03, 0.2, 0.04], front(0.08, 0.62, sd * 0.8), 0.01);
            });
            rb(g, THREE, M.chrome, [0.03, 0.03, 0.9], front(0.08, 0.99, 0), 0.01);
        } else if (variant === 'tx') {
            rb(g, THREE, M.plastic, [0.06, 0.44, 1.2], front(0.05, 0.83, 0), 0.04);
            for (let k = 0; k < 9; k++) {
                rb(g, THREE, M.chrome, [0.03, 0.4, 0.025], front(0.09, 0.83, -0.52 + k * 0.13), 0.008);
            }
            rb(g, THREE, M.chrome, [0.035, 0.04, 1.22], front(0.09, 1.05, 0), 0.01);
            [-1, 1].forEach(function(sd) {
                rb(g, THREE, M.headlight, [0.06, 0.2, 0.3], front(0.0, 0.92, sd * 0.78), 0.03);
                rb(g, THREE, M.amber, [0.04, 0.06, 0.1], front(0.02, 0.8, sd * 0.86), 0.01);
                rb(g, THREE, M.headlight, [0.05, 0.08, 0.12], front(0.12, 0.62, sd * 0.62), 0.02);
            });
        } else {
            // Parrilla trapezoidal (más ancha abajo) con barra cromada que une los focos.
            const tz = new THREE.Shape();
            tz.moveTo(-0.5, 0.0);
            tz.lineTo(0.5, 0.0);
            tz.lineTo(0.62, -0.4);
            tz.lineTo(-0.62, -0.4);
            tz.closePath();
            const tg = new THREE.ExtrudeGeometry(tz, {depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02,
                bevelSegments: 1});
            tg.rotateY(Math.PI / 2);
            g.add(mesh(THREE, tg, M.plastic, 2.68, 1.03, 0));
            for (let k = 0; k < 6; k++) {
                rb(g, THREE, M.steel, [0.02, 0.02, 1.0 + k * 0.03], front(0.1, 0.95 - k * 0.06, 0), 0.006);
            }
            rb(g, THREE, M.chrome, [0.03, 0.05, 1.5], front(0.09, 0.98, 0), 0.015);
            [-1, 1].forEach(function(sd) {
                const hl = rb(g, THREE, M.headlight, [0.06, 0.1, 0.38], front(0.0, 0.97, sd * 0.72), 0.03);
                hl.rotation.y = sd * -0.15;
                rb(g, THREE, M.plastic, [0.06, 0.12, 0.2], front(0.1, 0.62, sd * 0.68), 0.03);
                rb(g, THREE, M.headlight, [0.05, 0.06, 0.12], front(0.13, 0.62, sd * 0.68), 0.02);
            });
        }
        const emb = badge(THREE, BRAND.pickup, 0.3, 0.08, {bg: '#151515'});
        emb.position.set(2.79, variant === 'lx' ? 0.86 : 0.88, 0);
        emb.rotation.y = Math.PI / 2;
        g.add(emb);
        rb(g, THREE, M.plastic, [0.2, 0.22, W + 0.04], [2.72, 0.55, 0], 0.07);
        // Defensa (bullbar) tubular.
        g.add(tube(THREE, [[2.8, 0.48, -0.78], [2.98, 0.62, -0.72], [3.0, 1.02, -0.55], [3.0, 1.06, 0], [3.0, 1.02, 0.55],
            [2.98, 0.62, 0.72], [2.8, 0.48, 0.78]], 0.038, M.black, true));
        [-0.32, 0.32].forEach(function(z) {
            g.add(rod(THREE, new THREE.Vector3(2.98, 0.5, z), new THREE.Vector3(3.0, 1.05, z * 0.9), 0.03, M.black, 8));
        });
        g.add(rod(THREE, new THREE.Vector3(2.82, 0.75, -0.72), new THREE.Vector3(2.98, 0.75, 0.72), 0.025, M.black, 6));
        // Snorkel (lado derecho).
        g.add(tube(THREE, [[2.0, 0.95, 0.94], [1.05, 1.15, 0.97], [0.82, 1.55, 0.88], [0.66, 1.92, 0.82]], 0.045, M.plastic,
            true));
        rb(g, THREE, M.plastic, [0.18, 0.12, 0.12], [0.66, 1.96, 0.82], 0.03);
        // Techo: barra de luces, baliza y antena.
        const ro = (variant === 'tx' ? 0.1 : 0) + (hb - 1.16);
        rb(g, THREE, M.plastic, [0.12, 0.08, 1.35], [0.3, 1.94 + ro, 0], 0.03);
        for (let k = -2; k <= 2; k++) {
            rb(g, THREE, M.headlight, [0.03, 0.06, 0.2], [0.37, 1.94 + ro, k * 0.25], 0.01);
        }
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.09, 0.11, 0.16, 16), M.amber, -0.6, 1.98 + ro, 0));
        g.add(rod(THREE, new THREE.Vector3(-0.9, 1.9 + ro, -0.6), new THREE.Vector3(-0.95, 2.6 + ro, -0.6), 0.006, M.black, 4));

        // Pick-up abierta: piso con revestimiento, bordes, jaula antivuelco y portalón.
        rb(g, THREE, M.plastic, [1.45, 0.03, W - 0.26], [-1.95, 1.2, 0], 0.01);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, paint, [1.52, 0.1, 0.1], [-1.95, 1.27, sd * (W / 2 - 0.08)], 0.04);
        });
        rb(g, THREE, paint, [0.1, 0.1, W - 0.12], [-2.68, 1.27, 0], 0.04);
        [-1, 1].forEach(function(sd) {
            g.add(tube(THREE, [[-1.25, 1.22, sd * 0.78], [-1.25, 2.02, sd * 0.72], [-2.2, 1.95, sd * 0.72],
                [-2.6, 1.25, sd * 0.78]], 0.035, M.black, true));
        });
        g.add(tube(THREE, [[-1.25, 2.02, -0.72], [-1.25, 2.02, 0.72]], 0.035, M.black));
        g.add(tube(THREE, [[-2.2, 1.95, -0.72], [-2.2, 1.95, 0.72]], 0.03, M.black));
        // Trasera: focos, parachoques con cinta, patente.
        [-1, 1].forEach(function(sd) {
            if (variant === 'tx') {
                rb(g, THREE, M.taillight, [0.04, 0.22, 0.22], [-2.73, 1.02, sd * 0.8], 0.02);
            } else if (variant === 'lx') {
                rb(g, THREE, M.taillight, [0.04, 0.42, 0.1], [-2.73, 0.95, sd * 0.84], 0.02);
                // Transición curva cabina–caja.
                g.add(tube(THREE, [[-1.12, 1.2, sd * (W / 2 - 0.05)], [-1.3, 1.12, sd * (W / 2 - 0.02)],
                    [-1.55, 1.24, sd * (W / 2 - 0.02)]], 0.03, paint, true));
            } else {
                rb(g, THREE, M.taillight, [0.04, 0.32, 0.14], [-2.73, 0.98, sd * 0.84], 0.02);
            }
        });
        rb(g, THREE, M.chrome, [0.18, 0.2, W - 0.1], [-2.76, 0.6, 0], 0.05);
        const plate = decal(THREE, 'FTRZ·21', 0.36, 0.12, '#111111');
        plate.material.color = new THREE.Color(0xffffff);
        const plateBg = mesh(THREE, new THREE.PlaneGeometry(0.4, 0.14), M.white, -2.86, 0.6, 0);
        plateBg.rotation.y = -Math.PI / 2;
        g.add(plateBg);
        plate.position.set(-2.865, 0.6, 0);
        plate.rotation.y = -Math.PI / 2;
        g.add(plate);
        const tailLogo = badge(THREE, BRAND.pickup, 0.4, 0.1, {bg: '#151515'});
        tailLogo.position.set(-2.72, 1.05, 0);
        tailLogo.rotation.y = -Math.PI / 2;
        g.add(tailLogo);

        // Ruedas todo terreno con llanta de aleación.
        [[xf, 1], [xf, -1], [xr, 1], [xr, -1]].forEach(function(p) {
            const w = tire(THREE, M, wr, 0.27, {pattern: 'allterrain'});
            w.position.set(p[0], wr, p[1] * 0.78);
            if (p[1] < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
        });
        // Pértiga con banderín (obligatoria en faena) en la esquina trasera izquierda.
        g.add(rod(THREE, new THREE.Vector3(-2.55, 1.3, -0.8), new THREE.Vector3(-2.55, 5.6, -0.8), 0.016, M.white, 6));
        for (let k = 0; k < 6; k++) {
            g.add(rod(THREE, new THREE.Vector3(-2.55, 1.6 + k * 0.7, -0.8), new THREE.Vector3(-2.55, 1.95 + k * 0.7, -0.8),
                0.019, M.taillight, 6));
        }
        g.add(mesh(THREE, new THREE.PlaneGeometry(0.62, 0.42), M.orange, -2.24, 5.35, -0.8));
        g.add(mesh(THREE, new THREE.SphereGeometry(0.035, 8, 6), M.amber, -2.55, 5.63, -0.8));
        const out = bake(THREE, g);
        out.userData.kind = 'pickup';
        out.userData.variant = variant;
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
        [-1, 1].forEach(function(sd) {
            const d = decal(THREE, BRAND.drill + ' DD-1500', 2.4, 0.38, '#ffffff');
            d.position.set(-1.6, 1.95, sd * 1.02);
            if (sd < 0) {
                d.rotation.y = Math.PI;
            }
            g.add(d);
        });
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

    // ---------------------------------------------------------------------
    // Equipos de apoyo y subterráneos.
    // ---------------------------------------------------------------------

    /**
     * Rotulación lateral de un equipo (ambos costados).
     *
     * @param {Object} g grupo
     * @param {Object} THREE
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {number} z media anchura
     * @param {number} w ancho
     * @param {string} color
     */
    const sideDecals = function(g, THREE, text, x, y, z, w, color) {
        [-1, 1].forEach(function(sd) {
            const d = decal(THREE, text, w, w * 0.16, color || '#151515');
            d.position.set(x, y, sd * z);
            if (sd < 0) {
                d.rotation.y = Math.PI;
            }
            g.add(d);
        });
    };

    /**
     * Cabina ROPS con vidrios en los cuatro costados.
     *
     * @param {Object} THREE
     * @param {Object} M
     * @param {number} w
     * @param {number} h
     * @param {number} d
     * @param {Object} paint
     * @returns {Object}
     */
    const ropsCab = function(THREE, M, w, h, d, paint) {
        const c = new THREE.Group();
        rb(c, THREE, paint, [w, 0.35, d], [0, 0.18, 0], 0.06);
        [[w / 2, d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [-w / 2, -d / 2]].forEach(function(p) {
            rb(c, THREE, paint, [0.12, h, 0.12], [p[0] * 0.95, h / 2 + 0.2, p[1] * 0.95], 0.03);
        });
        rb(c, THREE, paint, [w + 0.25, 0.16, d + 0.25], [0, h + 0.25, 0], 0.06);
        [[w / 2 * 0.97, 0, Math.PI / 2, d * 0.85], [-w / 2 * 0.97, 0, -Math.PI / 2, d * 0.85]].forEach(function(p) {
            const gl = mesh(THREE, new THREE.PlaneGeometry(p[3], h * 0.8), M.glass, p[0], h * 0.55 + 0.2, p[1]);
            gl.rotation.y = p[2];
            c.add(gl);
        });
        [-1, 1].forEach(function(sd) {
            c.add(mesh(THREE, new THREE.PlaneGeometry(w * 0.85, h * 0.8), M.glass, 0, h * 0.55 + 0.2, sd * d / 2 * 0.97));
            rb(c, THREE, M.headlight, [0.1, 0.14, 0.24], [w / 2 + 0.1, h + 0.3, sd * d * 0.35], 0.03);
            rb(c, THREE, M.headlight, [0.1, 0.14, 0.24], [-w / 2 - 0.1, h + 0.3, sd * d * 0.35], 0.03);
        });
        c.add(mesh(THREE, new THREE.CylinderGeometry(0.09, 0.1, 0.16, 12), M.amber, -w * 0.25, h + 0.42, 0));
        return c;
    };

    /**
     * Hoja curva (vertedera) extruida a lo ancho (z).
     *
     * @param {Object} THREE
     * @param {number} h alto
     * @param {number} w ancho
     * @param {number} t espesor
     * @returns {Object} BufferGeometry (cara cóncava hacia +x)
     */
    const curvedBlade = function(THREE, h, w, t) {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.quadraticCurveTo(-h * 0.45, h * 0.45, 0.1, h);
        s.lineTo(0.1 - t, h);
        s.quadraticCurveTo(-h * 0.45 - t, h * 0.45, -t, 0);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, {depth: w, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03,
            bevelSegments: 1, curveSegments: 10});
        g.translate(0, 0, -w / 2);
        return g;
    };

    /**
     * Motoniveladora (clase 16) con tándem trasero, cuello de cisne, círculo y vertedera.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const motorGrader = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        const R = 0.82;
        const lab = BRAND.tire + '  23.5R25  G-2';
        [[-2.55, 1], [-2.55, -1], [-4.15, 1], [-4.15, -1], [3.9, 1], [3.9, -1]].forEach(function(p) {
            const w = tire(THREE, M, R, 0.6, {pattern: 'loader', label: lab});
            w.position.set(p[0], R, p[1] * 1.2);
            if (p[1] < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
        });
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.yellow, [2.4, 0.5, 0.25], [-3.35, R, sd * 0.85], 0.08);
        });
        // Bastidor trasero y sala de motor.
        const eng = new THREE.Shape();
        eng.moveTo(-5.3, 0);
        eng.lineTo(-2.2, 0);
        eng.lineTo(-2.2, 1.25);
        eng.lineTo(-4.8, 1.1);
        eng.quadraticCurveTo(-5.3, 1.05, -5.3, 0.6);
        eng.closePath();
        const eg = new THREE.ExtrudeGeometry(eng, {depth: 1.9, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08,
            bevelSegments: 2});
        eg.translate(0, 1.15, -0.95);
        g.add(mesh(THREE, eg, M.yellow));
        rb(g, THREE, M.grille, [0.1, 0.9, 1.6], [-5.4, 1.75, 0], 0.03);
        g.add(rod(THREE, new THREE.Vector3(-3.4, 2.4, 0.5), new THREE.Vector3(-3.4, 3.2, 0.5), 0.09, M.steel, 12));
        [-1, 1].forEach(function(sd) {
            for (let k = 0; k < 3; k++) {
                const lv = mesh(THREE, new THREE.PlaneGeometry(0.6, 0.6), M.louver, -4.6 + k * 0.75, 1.75, sd * 1.04);
                if (sd < 0) {
                    lv.rotation.y = Math.PI;
                }
                g.add(lv);
            }
        });
        // Ripper trasero.
        rb(g, THREE, M.steel, [0.4, 0.4, 1.9], [-5.8, 1.1, 0], 0.06);
        [-0.6, 0, 0.6].forEach(function(z) {
            rb(g, THREE, M.steel, [0.18, 1.2, 0.12], [-6.0, 0.6, z], 0.03);
        });
        // Cabina.
        const cab = ropsCab(THREE, M, 1.8, 1.85, 1.9, M.yellow);
        cab.position.set(-1.3, 1.25, 0);
        g.add(cab);
        // Cuello de cisne (bastidor delantero) y eje delantero.
        g.add(tube(THREE, [[-0.4, 1.75, 0], [1.2, 2.05, 0], [3.0, 1.95, 0], [3.9, 1.45, 0]], 0.26, M.yellow, true));
        rb(g, THREE, M.yellow, [0.5, 0.35, 2.1], [3.9, R + 0.1, 0], 0.06);
        g.add(rod(THREE, new THREE.Vector3(3.9, 1.45, 0), new THREE.Vector3(3.9, R + 0.2, 0), 0.2, M.yellow, 10));
        rb(g, THREE, M.stripes, [0.15, 0.4, 1.6], [4.6, 0.95, 0], 0.04);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.headlight, [0.08, 0.14, 0.24], [4.0, 1.85, sd * 0.4], 0.03);
        });
        // Barra de tiro, círculo y vertedera orientada en diagonal.
        g.add(rod(THREE, new THREE.Vector3(3.5, 1.25, 0), new THREE.Vector3(1.4, 0.95, 0), 0.12, M.steel, 8));
        const ring = new THREE.TorusGeometry(1.0, 0.09, 8, 32);
        ring.rotateX(Math.PI / 2);
        g.add(mesh(THREE, ring, M.steel, 1.3, 0.95, 0));
        const blade = mesh(THREE, curvedBlade(THREE, 0.75, 4.3, 0.06), M.steel, 1.05, 0.18, 0);
        blade.rotation.y = 0.5;
        g.add(blade);
        const edge = rb(g, THREE, M.steelLight, [0.08, 0.12, 4.3], [1.05, 0.2, 0], 0.02);
        edge.rotation.y = 0.5;
        [-1, 1].forEach(function(sd) {
            hydraulic(g, THREE, M, [1.6, 2.05, sd * 0.35], [1.05 + sd * Math.sin(0.5) * -1.6, 0.9, sd * 1.4], 0.08);
        });
        sideDecals(g, THREE, BRAND.heavy + ' MG-16', -3.7, 2.0, 1.05, 1.9);
        const out = bake(THREE, g);
        out.userData.kind = 'grader';
        return out;
    };

    /**
     * Camión aljibe (riego de caminos) sobre el chasis del camión de extracción.
     *
     * @param {Object} THREE
     * @param {string} number número interno
     * @returns {Object} userData.spray = puntos de las boquillas (coordenadas del modelo)
     */
    const waterTruck = function(THREE, number) {
        const M = mats(THREE);
        const t = haulTruck(THREE, 227, false, number || 'AL-02');
        ['body', 'hoist1', 'hoist-1'].forEach(function(n) {
            const p = part(t, n);
            if (p) {
                p.parent.remove(p);
            }
        });
        delete t.userData.dump;
        const g = new THREE.Group();
        const tank = new THREE.CylinderGeometry(1.75, 1.75, 8.4, 40, 1);
        tank.rotateZ(Math.PI / 2);
        const tm = mesh(THREE, tank, M.yellowHi, -1.8, 5.35, 0);
        tm.scale.set(1, 1, 1.85);
        g.add(tm);
        [-6.0, 2.4].forEach(function(x, i) {
            const cap = new THREE.SphereGeometry(1.75, 32, 16, 0, TAU, 0, Math.PI / 2);
            cap.rotateZ(i ? -Math.PI / 2 : Math.PI / 2);
            const cm = mesh(THREE, cap, M.yellowHi, x, 5.35, 0);
            cm.scale.set(0.28, 1, 1.85);
            g.add(cm);
        });
        for (let x = -5.0; x <= 1.6; x += 1.65) {
            const band = new THREE.TorusGeometry(1.77, 0.06, 6, 40);
            band.rotateY(Math.PI / 2);
            const bm = mesh(THREE, band, M.steel, x, 5.35, 0);
            bm.scale.set(1, 1, 1.85);
            g.add(bm);
        }
        // Base del estanque, pasarela superior, escotilla y escalera.
        rb(g, THREE, M.steel, [8.6, 0.35, 2.4], [-1.8, 3.65, 0], 0.06);
        rb(g, THREE, M.steelLight, [6.0, 0.06, 1.0], [-1.8, 7.12, 0], 0.02);
        railing(g, THREE, M.yellow, [[-4.8, 7.12, 0.5], [1.2, 7.12, 0.5]], 0.9);
        railing(g, THREE, M.yellow, [[-4.8, 7.12, -0.5], [1.2, 7.12, -0.5]], 0.9);
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.45, 0.45, 0.2, 20), M.steel, -2.0, 7.2, 0));
        g.add(rod(THREE, new THREE.Vector3(2.3, 4.2, -3.2), new THREE.Vector3(1.5, 7.1, -0.6), 0.05, M.steel, 6));
        // Barra de riego trasera con boquillas y cañón de agua frontal.
        g.add(rod(THREE, new THREE.Vector3(-6.5, 1.6, -3.4), new THREE.Vector3(-6.5, 1.6, 3.4), 0.1, M.steel, 10));
        const spray = [];
        [-3.0, -1.0, 1.0, 3.0].forEach(function(z) {
            const n = mesh(THREE, new THREE.ConeGeometry(0.12, 0.3, 10), M.chrome, -6.6, 1.5, z);
            n.rotation.z = Math.PI / 2 + 0.6;
            g.add(n);
            spray.push([-6.75, 1.4, z]);
        });
        g.add(tube(THREE, [[-6.0, 3.7, 0], [-6.4, 2.6, 0], [-6.5, 1.65, 0]], 0.12, M.steel, true));
        rb(g, THREE, M.steel, [0.6, 0.5, 0.6], [5.0, 4.6, 1.8], 0.08);
        g.add(rod(THREE, new THREE.Vector3(5.0, 4.85, 1.8), new THREE.Vector3(5.9, 5.3, 1.8), 0.1, M.chrome, 10));
        sideDecals(g, THREE, 'AGUA NO POTABLE', -1.8, 5.4, 1.75 * 1.85 + 0.02, 3.6, '#0d47a1');
        sideDecals(g, THREE, BRAND.heavy + ' HT 227 W', -1.8, 4.5, 1.75 * 1.85 + 0.02, 2.6);
        const bt = bake(THREE, g);
        t.add(bt);
        t.userData.kind = 'water';
        t.userData.spray = spray;
        return t;
    };

    /**
     * Bulldozer sobre orugas (clase D10) con hoja semi-U y ripper.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const bulldozer = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        crawler(g, THREE, M, 4.9, 1.45, 0.75, -1.45);
        crawler(g, THREE, M, 4.9, 1.45, 0.75, 1.45);
        // Rueda motriz elevada (rasgo característico) sobre cada oruga.
        [-1.45, 1.45].forEach(function(z) {
            const sp = new THREE.CylinderGeometry(0.75, 0.75, 0.55, 20);
            sp.rotateX(Math.PI / 2);
            g.add(mesh(THREE, sp, M.steel, -2.0, 1.75, z));
        });
        rb(g, THREE, M.yellow, [5.0, 0.8, 2.0], [0.2, 1.55, 0], 0.15);
        const hood = new THREE.Shape();
        hood.moveTo(0, 0);
        hood.lineTo(3.0, 0);
        hood.lineTo(3.1, 1.35);
        hood.lineTo(0.2, 1.55);
        hood.closePath();
        const hg = new THREE.ExtrudeGeometry(hood, {depth: 1.8, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08,
            bevelSegments: 2});
        hg.translate(0, 1.9, -0.9);
        g.add(mesh(THREE, hg, M.yellow));
        rb(g, THREE, M.grille, [0.1, 1.15, 1.6], [3.2, 2.55, 0], 0.03);
        g.add(rod(THREE, new THREE.Vector3(1.8, 3.4, 0.5), new THREE.Vector3(1.8, 4.3, 0.5), 0.1, M.steel, 12));
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.28, 0.28, 0.5, 14), M.black, 1.0, 3.6, -0.5));
        const cab = ropsCab(THREE, M, 2.0, 2.0, 2.1, M.yellow);
        cab.position.set(-1.1, 1.95, 0);
        g.add(cab);
        rb(g, THREE, M.yellow, [1.0, 1.4, 2.2], [-2.55, 2.2, 0], 0.15);
        // Hoja semi-U con brazos de empuje y cilindros de levante.
        g.add(mesh(THREE, curvedBlade(THREE, 2.1, 5.2, 0.12), M.yellow, 4.6, 0.05, 0));
        [-1, 1].forEach(function(sd) {
            const wing = mesh(THREE, curvedBlade(THREE, 2.1, 0.7, 0.12), M.yellow, 4.4, 0.05, sd * 2.8);
            wing.rotation.y = sd * -0.45;
            g.add(wing);
            g.add(rod(THREE, new THREE.Vector3(0.0, 0.75, sd * 1.45), new THREE.Vector3(4.25, 0.6, sd * 1.6), 0.16, M.yellow,
                10));
            hydraulic(g, THREE, M, [2.9, 2.9, sd * 0.85], [4.25, 1.6, sd * 0.95], 0.13);
        });
        rb(g, THREE, M.steelLight, [0.15, 0.18, 5.2], [4.66, 0.1, 0], 0.03);
        // Ripper de un vástago.
        rb(g, THREE, M.steel, [0.5, 0.5, 1.6], [-3.4, 1.6, 0], 0.08);
        rb(g, THREE, M.steel, [0.35, 2.2, 0.3], [-3.75, 0.8, 0], 0.06, [0, 0, 0.18]);
        hydraulic(g, THREE, M, [-2.8, 2.5, 0.5], [-3.5, 1.7, 0.5], 0.11);
        sideDecals(g, THREE, BRAND.heavy + ' BD-10', 1.6, 2.9, 0.98, 1.9);
        const out = bake(THREE, g);
        out.userData.kind = 'dozer';
        return out;
    };

    /**
     * Cargador de bajo perfil (LHD, scoop) para minería subterránea.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const lhd = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        const R = 0.82;
        const lab = BRAND.tire + '  26.5R25  L-5S  UNDERGROUND';
        [[2.3, 1], [2.3, -1], [-2.1, 1], [-2.1, -1]].forEach(function(p) {
            const w = tire(THREE, M, R, 0.66, {pattern: 'loader', label: lab});
            w.position.set(p[0], R, p[1] * 1.15);
            if (p[1] < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
        });
        // Sección trasera (motor y contrapeso) baja.
        rb(g, THREE, M.yellow, [4.4, 1.25, 2.4], [-2.6, 1.35, 0], 0.18);
        rb(g, THREE, M.grille, [0.1, 0.8, 1.8], [-4.85, 1.45, 0], 0.03);
        rb(g, THREE, M.stripes, [0.12, 0.3, 2.3], [-4.86, 0.8, 0], 0.03);
        g.add(rod(THREE, new THREE.Vector3(-3.5, 2.0, 0.7), new THREE.Vector3(-3.5, 2.35, 0.7), 0.08, M.steel, 10));
        // Puesto del operador lateral con techo FOPS.
        rb(g, THREE, M.yellow, [1.6, 0.9, 1.0], [-0.2, 1.4, -0.75], 0.1);
        [[-0.9, -1.15], [0.6, -1.15], [-0.9, -0.3], [0.6, -0.3]].forEach(function(p) {
            rb(g, THREE, M.yellow, [0.1, 0.75, 0.1], [p[0], 2.2, p[1]], 0.02);
        });
        rb(g, THREE, M.yellow, [1.8, 0.12, 1.2], [-0.15, 2.6, -0.72], 0.04);
        // Articulación, bastidor delantero, brazo central y balde.
        g.add(mesh(THREE, new THREE.CylinderGeometry(0.35, 0.35, 1.0, 16), M.steel, 0.6, 1.2, 0));
        rb(g, THREE, M.yellow, [2.4, 1.0, 2.0], [2.0, 1.25, 0], 0.15);
        const boom = rb(g, THREE, M.yellow, [3.2, 0.5, 0.9], [3.1, 1.6, 0], 0.12);
        boom.rotation.z = -0.22;
        hydraulic(g, THREE, M, [1.4, 1.0, 0.6], [3.2, 1.75, 0.55], 0.12);
        hydraulic(g, THREE, M, [1.4, 1.0, -0.6], [3.2, 1.75, -0.55], 0.12);
        const bucket = new THREE.Shape();
        bucket.moveTo(0, 0);
        bucket.lineTo(1.7, -0.05);
        bucket.lineTo(1.6, 0.2);
        bucket.quadraticCurveTo(0.4, 0.2, 0.15, 1.2);
        bucket.lineTo(-0.1, 1.25);
        bucket.closePath();
        const bg = new THREE.ExtrudeGeometry(bucket, {depth: 2.8, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04,
            bevelSegments: 1});
        bg.translate(0, 0, -1.4);
        g.add(mesh(THREE, bg, M.steel, 4.4, 0.18, 0));
        rb(g, THREE, M.steelLight, [0.25, 0.08, 2.85], [6.05, 0.15, 0], 0.02);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.headlight, [0.08, 0.14, 0.26], [3.15, 2.0, sd * 0.85], 0.03);
            rb(g, THREE, M.headlight, [0.08, 0.14, 0.26], [-4.88, 2.0, sd * 0.85], 0.03);
        });
        sideDecals(g, THREE, BRAND.heavy + ' LH-14', -2.6, 1.6, 1.22, 1.7);
        const out = bake(THREE, g);
        out.userData.kind = 'lhd';
        return out;
    };

    /**
     * Jumbo de perforación de dos brazos para desarrollo de galerías.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const jumbo = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        const R = 0.62;
        [[1.6, 1], [1.6, -1], [-2.0, 1], [-2.0, -1]].forEach(function(p) {
            const w = tire(THREE, M, R, 0.45, {pattern: 'loader', label: BRAND.tire + '  14.00R24  UNDERGROUND'});
            w.position.set(p[0], R, p[1] * 1.0);
            if (p[1] < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
        });
        rb(g, THREE, M.yellow, [3.0, 1.0, 2.0], [-2.3, 1.2, 0], 0.15);
        rb(g, THREE, M.yellow, [2.6, 0.7, 1.8], [1.3, 1.0, 0], 0.12);
        // Carrete de cable eléctrico trasero.
        const reel = new THREE.CylinderGeometry(0.75, 0.75, 1.1, 24);
        reel.rotateX(Math.PI / 2);
        g.add(mesh(THREE, reel, M.steel, -3.6, 1.6, 0));
        const coil = new THREE.CylinderGeometry(0.6, 0.6, 1.0, 24);
        coil.rotateX(Math.PI / 2);
        g.add(mesh(THREE, coil, M.black, -3.6, 1.6, 0));
        // Techo de protección del operador.
        [[-0.9, 0.85], [-0.9, -0.85], [0.4, 0.85], [0.4, -0.85]].forEach(function(p) {
            rb(g, THREE, M.yellow, [0.1, 1.3, 0.1], [p[0], 2.1, p[1]], 0.02);
        });
        rb(g, THREE, M.yellow, [1.7, 0.12, 2.0], [-0.25, 2.8, 0], 0.04);
        // Dos brazos con viga de avance, perforadora y barra.
        [-1, 1].forEach(function(sd) {
            const a = new THREE.Vector3(2.4, 1.4, sd * 0.5);
            const b = new THREE.Vector3(5.6, 2.2 + (sd > 0 ? 0.6 : 0), sd * 0.95);
            g.add(rod(THREE, a, b, 0.17, M.yellow, 12));
            hydraulic(g, THREE, M, [2.6, 1.1, sd * 0.8], [4.6, 2.0, sd * 0.9], 0.08);
            rb(g, THREE, M.steel, [5.2, 0.18, 0.3], [b.x + 2.2, b.y + 0.15, b.z], 0.04);
            rb(g, THREE, M.red, [0.8, 0.35, 0.35], [b.x + 1.0, b.y + 0.4, b.z], 0.06);
            g.add(rod(THREE, new THREE.Vector3(b.x + 1.4, b.y + 0.4, b.z), new THREE.Vector3(b.x + 4.9, b.y + 0.4, b.z), 0.025,
                M.steelLight, 6));
        });
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.headlight, [0.08, 0.14, 0.26], [2.65, 1.5, sd * 0.75], 0.03);
        });
        sideDecals(g, THREE, BRAND.heavy + ' DD-422', -2.3, 1.45, 1.02, 1.7);
        const out = bake(THREE, g);
        out.userData.kind = 'jumbo';
        return out;
    };

    /**
     * Torre de iluminación móvil (remolque con generador y mástil de 4 focos).
     *
     * @param {Object} THREE
     * @returns {Object} userData.lamp = posición de los focos (modelo)
     */
    const lightTower = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        rb(g, THREE, M.yellow, [2.6, 1.3, 1.3], [0, 1.15, 0], 0.12);
        [-1, 1].forEach(function(sd) {
            const w = tire(THREE, M, 0.33, 0.2, {pattern: 'allterrain', rim: 'alloy', label: BRAND.tire + '  ST'});
            w.position.set(0, 0.33, sd * 0.8);
            if (sd < 0) {
                w.rotation.y = Math.PI;
            }
            g.add(w);
        });
        g.add(rod(THREE, new THREE.Vector3(1.3, 0.55, 0), new THREE.Vector3(2.6, 0.4, 0), 0.05, M.steel, 6));
        [[1.1, 1], [1.1, -1], [-1.1, 1], [-1.1, -1]].forEach(function(p) {
            g.add(rod(THREE, new THREE.Vector3(p[0], 0.7, p[1] * 0.6), new THREE.Vector3(p[0], 0.05, p[1] * 1.2), 0.04, M.steel,
                6));
        });
        g.add(rod(THREE, new THREE.Vector3(-0.8, 1.8, 0), new THREE.Vector3(-0.8, 9.0, 0), 0.09, M.steelLight, 10));
        rb(g, THREE, M.steel, [0.12, 0.9, 1.8], [-0.8, 9.1, 0], 0.03);
        [[0.4, 0.5], [-0.4, 0.5], [0.4, -0.5], [-0.4, -0.5]].forEach(function(p) {
            rb(g, THREE, M.steel, [0.2, 0.5, 0.65], [-0.7, 9.1 + p[0], p[1]], 0.04);
            rb(g, THREE, M.headlight, [0.03, 0.42, 0.56], [-0.59, 9.1 + p[0], p[1]], 0.02);
        });
        sideDecals(g, THREE, BRAND.heavy + ' LT-6', 0, 1.3, 0.66, 1.2);
        const out = bake(THREE, g);
        out.userData.kind = 'tower';
        out.userData.lamp = [-0.4, 9.1, 0];
        return out;
    };

    // ---------------------------------------------------------------------
    // Instalaciones de faena.
    // ---------------------------------------------------------------------

    /**
     * Módulo de oficina de faena (despacho): plancha ondulada, ventanas con marco,
     * puerta con escalera, equipo de aire acondicionado y mástil de radio.
     *
     * @param {Object} THREE
     * @param {string} title rótulo de la fachada
     * @returns {Object}
     */
    const siteOffice = function(THREE, title) {
        const M = mats(THREE);
        const g = new THREE.Group();
        const L = 12.2;
        const W = 3.0;
        const H = 2.9;
        rb(g, THREE, M.steel, [L, 0.35, W], [0, 0.45, 0], 0.04);
        [-5.4, 0, 5.4].forEach(function(x) {
            [-1, 1].forEach(function(sd) {
                rb(g, THREE, M.steel, [0.3, 0.3, 0.3], [x, 0.15, sd * 1.2], 0.03);
            });
        });
        const shell = mesh(THREE, rbox(THREE, L, H, W, 0.06), M.cladding, 0, 0.62 + H / 2, 0);
        g.add(shell);
        rb(g, THREE, M.white, [L + 0.3, 0.16, W + 0.4], [0, 0.62 + H + 0.08, 0], 0.04);
        // Ventanas en la fachada frontal (+z) y lateral.
        [-4.2, -1.4, 3.4].forEach(function(x) {
            rb(g, THREE, M.steelLight, [1.6, 1.15, 0.08], [x, 2.25, W / 2 + 0.02], 0.02);
            const gl = mesh(THREE, new THREE.PlaneGeometry(1.45, 1.0), M.glass, x, 2.25, W / 2 + 0.07);
            g.add(gl);
            rb(g, THREE, M.black, [0.05, 1.0, 0.04], [x, 2.25, W / 2 + 0.08], 0.01);
        });
        // Puerta, escalera con baranda y alero.
        rb(g, THREE, M.steelLight, [1.0, 2.15, 0.08], [1.3, 1.72, W / 2 + 0.02], 0.02);
        rb(g, THREE, M.black, [0.12, 0.05, 0.05], [1.65, 1.7, W / 2 + 0.08], 0.01);
        rb(g, THREE, M.white, [1.6, 0.08, 0.9], [1.3, 3.0, W / 2 + 0.45], 0.02);
        rb(g, THREE, M.steelLight, [1.4, 0.06, 1.0], [1.3, 0.6, W / 2 + 0.55], 0.02);
        stairs(g, THREE, M, [1.3, 0.0, W / 2 + 1.75], [1.3, 0.55, W / 2 + 1.05], 1.0);
        railing(g, THREE, M.yellow, [[0.6, 0.6, W / 2 + 1.05], [0.6, 0.6, W / 2 + 0.1]], 0.95);
        // Aire acondicionado y rótulo.
        rb(g, THREE, M.white, [0.9, 0.65, 0.35], [-2.8, 2.6, -W / 2 - 0.2], 0.05);
        rb(g, THREE, M.grille, [0.75, 0.5, 0.02], [-2.8, 2.6, -W / 2 - 0.38], 0.01);
        if (title) {
            const d = decal(THREE, title, 4.2, 0.55, '#0d47a1');
            d.position.set(-1.6, 3.2, W / 2 + 0.06);
            g.add(d);
        }
        // Mástil de radio con antena parabólica y balizas.
        g.add(rod(THREE, new THREE.Vector3(5.6, 3.6, -0.8), new THREE.Vector3(5.6, 11, -0.8), 0.06, M.steelLight, 8));
        for (let y = 4.5; y < 11; y += 1.6) {
            g.add(rod(THREE, new THREE.Vector3(5.45, y, -0.95), new THREE.Vector3(5.75, y + 0.8, -0.65), 0.02, M.steelLight, 4));
        }
        const dish = new THREE.SphereGeometry(0.55, 16, 8, 0, TAU, 0, 0.9);
        const dm = mesh(THREE, dish, M.white, 5.6, 8.8, -0.45);
        dm.rotation.x = Math.PI / 2;
        g.add(dm);
        g.add(mesh(THREE, new THREE.SphereGeometry(0.1, 10, 8), M.taillight, 5.6, 11.1, -0.8));
        const out = bake(THREE, g);
        out.userData.kind = 'office';
        return out;
    };

    /**
     * Estación de chancado primario: muro de descarga (MSE) con losa para camiones,
     * tolva, picarrocas, nave de chancador con revestimiento y galería de correa.
     * La losa de descarga queda hacia +x.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const crusherStation = function(THREE) {
        const M = mats(THREE);
        const g = new THREE.Group();
        // Muro de descarga en terraplén y losa de aproximación.
        // Foso de descarga: muro posterior y muros laterales abiertos hacia la tolva.
        rb(g, THREE, M.concrete, [2.2, 9, 18], [-5.0, 4.5, 0], 0.15);
        [-1, 1].forEach(function(sd) {
            rb(g, THREE, M.concrete, [12, 9, 1.6], [1.0, 4.5, sd * 8.2], 0.15);
            const wing = rb(g, THREE, M.concrete, [11, 8.6, 1.2], [12.5, 4.3, sd * 8.4], 0.15);
            wing.rotation.y = sd * 0.05;
        });
        // Terraplén bajo la losa de aproximación y bloque bajo la tolva.
        rb(g, THREE, M.concrete, [12, 8.6, 15], [12.5, 4.3, 0], 0.15);
        rb(g, THREE, M.concrete, [12, 0.5, 15], [12.5, 8.85, 0], 0.08);
        rb(g, THREE, M.steel, [8, 4.5, 8], [1.3, 2.25, 0], 0.1);
        rb(g, THREE, M.stripes, [0.8, 1.4, 14], [6.6, 9.75, 0], 0.08);
        // Tolva de recepción con revestimiento y picarrocas.
        const hop = new THREE.CylinderGeometry(6.2, 2.6, 5.2, 4, 1, true);
        hop.rotateY(Math.PI / 4);
        g.add(mesh(THREE, hop, M.steel, 1.3, 6.55, 0));
        rb(g, THREE, M.steelLight, [9.6, 0.35, 0.35], [1.3, 9.15, 4.6], 0.04);
        rb(g, THREE, M.steelLight, [9.6, 0.35, 0.35], [1.3, 9.15, -4.6], 0.04);
        rb(g, THREE, M.yellow, [1.2, 0.8, 1.2], [-3.6, 10.3, 5.6], 0.1);
        g.add(rod(THREE, new THREE.Vector3(-3.6, 10.6, 5.6), new THREE.Vector3(-0.8, 13.4, 3.6), 0.25, M.yellow, 10));
        g.add(rod(THREE, new THREE.Vector3(-0.8, 13.4, 3.6), new THREE.Vector3(1.6, 9.6, 1.5), 0.2, M.yellow, 10));
        hydraulic(g, THREE, M, [-3.2, 10.8, 5.2], [-1.4, 12.6, 4.1], 0.12);
        // Nave del chancador (estructura + revestimiento ondulado + techo a dos aguas).
        const nave = mesh(THREE, rbox(THREE, 12, 15, 14, 0.08), M.cladding, -12, 7.5, 0);
        g.add(nave);
        for (let x = -17.8; x <= -6.2; x += 2.9) {
            rb(g, THREE, M.steel, [0.25, 15.2, 0.25], [x, 7.6, 7.1], 0.02);
            rb(g, THREE, M.steel, [0.25, 15.2, 0.25], [x, 7.6, -7.1], 0.02);
        }
        const roof = new THREE.Shape();
        roof.moveTo(-7.4, 0);
        roof.lineTo(7.4, 0);
        roof.lineTo(0, 2.6);
        roof.closePath();
        const rg = new THREE.ExtrudeGeometry(roof, {depth: 12.6, bevelEnabled: false});
        rg.translate(0, 0, -6.3);
        rg.rotateY(Math.PI / 2);
        g.add(mesh(THREE, rg, M.white, -12, 15, 0));
        [-16, -12, -8].forEach(function(x) {
            rb(g, THREE, M.louver, [1.6, 1.2, 0.05], [x, 12, 7.06], 0.01);
        });
        rb(g, THREE, M.steelLight, [3.2, 4.0, 0.1], [-12, 2.0, 7.05], 0.02);
        // Galería de correa transportadora (reticulado) con cubierta.
        const a = new THREE.Vector3(-18, 4, 0);
        const b = new THREE.Vector3(-70, 20, -14);
        const dir = new THREE.Vector3().subVectors(b, a);
        const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(1.4);
        [-1, 1].forEach(function(sd) {
            [0, 2.2].forEach(function(h) {
                g.add(rod(THREE, a.clone().addScaledVector(side, sd).setY(a.y + h), b.clone().addScaledVector(side, sd)
                    .setY(b.y + h), 0.1, M.steel, 6));
            });
        });
        const nseg = 16;
        for (let i = 0; i <= nseg; i++) {
            const p = a.clone().lerp(b, i / nseg);
            g.add(rod(THREE, p.clone().addScaledVector(side, -1), p.clone().addScaledVector(side, 1), 0.06, M.steel, 5));
            [-1, 1].forEach(function(sd) {
                g.add(rod(THREE, p.clone().addScaledVector(side, sd), p.clone().addScaledVector(side, sd).setY(p.y + 2.2), 0.06,
                    M.steel, 5));
            });
            if (i % 4 === 2) {
                g.add(rod(THREE, p.clone().setY(0), p.clone().setY(p.y - 0.1), 0.25, M.steel, 8));
            }
        }
        const cover = new THREE.Mesh(new THREE.BoxGeometry(dir.length(), 0.12, 3.2), M.cladding);
        cover.position.copy(a).lerp(b, 0.5).setY((a.y + b.y) / 2 + 2.35);
        cover.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
        cover.castShadow = true;
        g.add(cover);
        const out = bake(THREE, g);
        out.userData.kind = 'crusher';
        out.userData.beltEnd = b;
        return out;
    };

    return {
        motorGrader: motorGrader, waterTruck: waterTruck, bulldozer: bulldozer, lhd: lhd, jumbo: jumbo,
        lightTower: lightTower,
        part: part, pivot: pivot, setDump: setDump, animateShovel: animateShovel, setLoaderPose: setLoaderPose,
        BRAND: BRAND, badge: badge,
        siteOffice: siteOffice, crusherStation: crusherStation,
        mats: mats, rbox: rbox, bake: bake, tire: tire, haulTruck: haulTruck, ropeShovel: ropeShovel, drillRig: drillRig,
        wheelLoader: wheelLoader, pickup: pickup, worker: worker, diamondDrill: diamondDrill, totalStation: totalStation
    };
});
