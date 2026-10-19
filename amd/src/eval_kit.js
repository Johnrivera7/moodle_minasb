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
 * Motor de render realista para las evaluaciones prácticas MinasLab.
 *
 * Iluminación física (cielo procedural + PMREM, sol con sombras suaves, ACES),
 * terreno procedural con rajo de bancos exactos (cápsula), rampa con cortes y
 * rellenos, líneas topográficas de cresta/pata, equipos mineros y herramientas
 * de interacción: explorar/inspeccionar, medir y brújula.
 *
 * Sistema de coordenadas: x = Este, y = cota, −z = Norte (1 unidad = 1 m).
 *
 * @module     mod_minaslab/eval_kit
 * @copyright  2026 John Rivera González
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
/* eslint-disable no-bitwise */
// Las operaciones a nivel de bits son intencionales: generador pseudoaleatorio y ruido de gradiente.
define(['mod_minaslab/eval_models'], function(models) {
    'use strict';

    // ---------------------------------------------------------------------
    // Utilidades numéricas y ruido.
    // ---------------------------------------------------------------------

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (a, b, v) => {
        const t = clamp((v - a) / (b - a), 0, 1);
        return t * t * (3 - 2 * t);
    };

    /**
     * Generador pseudoaleatorio mulberry32.
     *
     * @param {number} seed
     * @returns {Function}
     */
    const mulberry = function(seed) {
        let a = seed >>> 0;
        return function() {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    };

    /**
     * Ruido de gradiente 2D (tipo Perlin) con fbm.
     *
     * @param {number} seed
     * @returns {{noise: Function, fbm: Function, ridged: Function}}
     */
    const makeNoise = function(seed) {
        const rnd = mulberry(seed || 1);
        const perm = new Uint8Array(512);
        const base = [];
        for (let i = 0; i < 256; i++) {
            base.push(i);
        }
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            const t = base[i];
            base[i] = base[j];
            base[j] = t;
        }
        for (let i = 0; i < 512; i++) {
            perm[i] = base[i & 255];
        }
        const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
        const grad = function(h, x, y) {
            switch (h & 7) {
                case 0: return x + y;
                case 1: return -x + y;
                case 2: return x - y;
                case 3: return -x - y;
                case 4: return x;
                case 5: return -x;
                case 6: return y;
                default: return -y;
            }
        };
        const noise = function(x, y) {
            const xi = Math.floor(x);
            const yi = Math.floor(y);
            const X = xi & 255;
            const Y = yi & 255;
            const xf = x - xi;
            const yf = y - yi;
            const u = fade(xf);
            const v = fade(yf);
            const aa = perm[perm[X] + Y];
            const ab = perm[perm[X] + Y + 1];
            const ba = perm[perm[X + 1] + Y];
            const bb = perm[perm[X + 1] + Y + 1];
            return lerp(
                lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
                lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
                v
            ) * 0.7;
        };
        const fbm = function(x, y, oct) {
            let a = 1;
            let f = 1;
            let s = 0;
            let n = 0;
            for (let i = 0; i < (oct || 5); i++) {
                s += a * noise(x * f, y * f);
                n += a;
                a *= 0.5;
                f *= 2.03;
            }
            return s / n;
        };
        const ridged = function(x, y, oct) {
            let a = 1;
            let f = 1;
            let s = 0;
            let n = 0;
            for (let i = 0; i < (oct || 5); i++) {
                s += a * (1 - Math.abs(noise(x * f, y * f)));
                n += a;
                a *= 0.5;
                f *= 2.1;
            }
            return s / n;
        };
        return {noise: noise, fbm: fbm, ridged: ridged};
    };

    // ---------------------------------------------------------------------
    // Texturas procedurales (canvas).
    // ---------------------------------------------------------------------

    /**
     * Textura de detalle (albedo gris + mapa normal) para suelos y roca.
     *
     * @param {Object} THREE
     * @param {number} seed
     * @returns {{map: Object, normal: Object}}
     */
    const detailTextures = function(THREE, seed) {
        const size = 512;
        const rnd = mulberry(seed || 1);
        const lattice = new Float32Array(64 * 64);
        for (let i = 0; i < lattice.length; i++) {
            lattice[i] = rnd() * 2 - 1;
        }
        const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
        /**
         * Ruido de valor periódico con período 'per' celdas (per divide a 64).
         *
         * @param {number} x
         * @param {number} y
         * @param {number} per
         * @returns {number}
         */
        const vnoise = function(x, y, per) {
            const xi = Math.floor(x);
            const yi = Math.floor(y);
            const fx = fade(x - xi);
            const fy = fade(y - yi);
            const at = (i, j) => lattice[(((i % per) + per) % per) * 64 + (((j % per) + per) % per)];
            return lerp(lerp(at(xi, yi), at(xi + 1, yi), fx), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), fx), fy);
        };
        const h = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const u = x / size;
                const v = y / size;
                let val = 0;
                let amp = 0.55;
                for (const per of [4, 8, 16, 32]) {
                    val += vnoise(u * per, v * per, per) * amp;
                    amp *= 0.55;
                }
                // Clastos: realce de máximos de alta frecuencia.
                const g = vnoise(u * 16 + 7, v * 16 + 3, 16) * 0.6 + vnoise(u * 32 + 2, v * 32 + 9, 32) * 0.4;
                val += Math.max(0, g - 0.3) * 0.8;
                h[y * size + x] = val;
            }
        }
        const c1 = document.createElement('canvas');
        c1.width = c1.height = size;
        const c2 = document.createElement('canvas');
        c2.width = c2.height = size;
        const g1 = c1.getContext('2d');
        const g2 = c2.getContext('2d');
        const i1 = g1.createImageData(size, size);
        const i2 = g2.createImageData(size, size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = y * size + x;
                const v = h[i];
                const l = clamp(222 + v * 48, 150, 255);
                i1.data[i * 4] = l;
                i1.data[i * 4 + 1] = l;
                i1.data[i * 4 + 2] = l;
                i1.data[i * 4 + 3] = 255;
                const dx = h[y * size + ((x + 1) % size)] - h[y * size + ((x - 1 + size) % size)];
                const dy = h[((y + 1) % size) * size + x] - h[((y - 1 + size) % size) * size + x];
                const s = 2.2;
                const nx = -dx * s;
                const ny = -dy * s;
                const len = Math.sqrt(nx * nx + ny * ny + 1);
                i2.data[i * 4] = (nx / len * 0.5 + 0.5) * 255;
                i2.data[i * 4 + 1] = (ny / len * 0.5 + 0.5) * 255;
                i2.data[i * 4 + 2] = (1 / len * 0.5 + 0.5) * 255;
                i2.data[i * 4 + 3] = 255;
            }
        }
        g1.putImageData(i1, 0, 0);
        g2.putImageData(i2, 0, 0);
        const map = new THREE.CanvasTexture(c1);
        map.colorSpace = THREE.SRGBColorSpace;
        const normal = new THREE.CanvasTexture(c2);
        [map, normal].forEach(function(t) {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.anisotropy = 8;
        });
        return {map: map, normal: normal};
    };

    /**
     * Textura de cartel / señalética.
     *
     * @param {Object} THREE
     * @param {string[]} lines
     * @param {Object} opt {bg, fg, w, h, border}
     * @returns {Object}
     */
    const signTexture = function(THREE, lines, opt) {
        opt = opt || {};
        const w = opt.w || 512;
        const h = opt.h || 256;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d');
        g.fillStyle = opt.bg || '#f5f5f0';
        g.fillRect(0, 0, w, h);
        g.lineWidth = 14;
        g.strokeStyle = opt.border || '#1b1b1b';
        g.strokeRect(7, 7, w - 14, h - 14);
        g.fillStyle = opt.fg || '#111';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const fs = opt.fs || Math.floor(h / (lines.length + 1.2));
        g.font = '700 ' + fs + 'px "Helvetica Neue", Arial, sans-serif';
        lines.forEach(function(t, i) {
            g.fillText(t, w / 2, h / (lines.length + 1) * (i + 1));
        });
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        return tex;
    };

    /**
     * Anti-repetición del mapa de detalle: mezcla dos escalas y atenúa el detalle
     * con la distancia para evitar mosaicos y muaré en terrenos extensos.
     *
     * @param {Object} material MeshStandardMaterial con map
     * @returns {Object} el mismo material
     */
    const antiTile = function(material) {
        material.onBeforeCompile = function(shader) {
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', [
                '#ifdef USE_MAP',
                '  vec4 mlxA = texture2D( map, vMapUv );',
                '  vec4 mlxB = texture2D( map, vMapUv * 0.161 + vec2( 0.37, 0.71 ) );',
                '  vec4 mlxC = texture2D( map, vMapUv * 0.031 + vec2( 0.13, 0.29 ) );',
                '  vec4 mlxD = mlxA * 0.5 + mlxB * 0.3 + mlxC * 0.2;',
                '  float mlxFade = smoothstep( 120.0, 1100.0, length( vViewPosition ) );',
                '  diffuseColor *= mix( mlxD, vec4( mlxC.rgb * 0.5 + vec3( 0.44 ), 1.0 ), mlxFade );',
                '#endif'
            ].join('\n'));
        };
        material.customProgramCacheKey = () => 'mlx-antitile';
        return material;
    };

    // ---------------------------------------------------------------------
    // Geometría del rajo (cápsula de bancos exactos + rampa).
    // ---------------------------------------------------------------------

    /**
     * Modelo geométrico del rajo. La pared se define por la distancia a un
     * segmento (cápsula), de modo que bermas y caras tienen ancho constante.
     *
     * @param {Object} p parámetros: halfLength, radius, benches, benchHeight, faceAngle, berm, rampWidth, rampGrade
     * @param {Object} c centro {x, z}
     * @returns {Object}
     */
    const makePit = function(p, c) {
        c = c || {x: 0, z: 0};
        const L = p.halfLength;
        const R = p.radius;
        const H = p.benchHeight;
        const n = p.benches;
        const face = H / Math.tan(p.faceAngle * Math.PI / 180);
        const period = face + p.berm;
        const depth = n * H;
        const rampW = p.rampWidth || 0;
        const grade = p.rampGrade || 0;

        const local = function(x, z) {
            const lx = x - c.x;
            const lz = z - c.z;
            const cx = clamp(lx, -L, L);
            const dx = lx - cx;
            const r = Math.sqrt(dx * dx + lz * lz);
            return {s: R - r, r: r, dx: dx, dz: lz};
        };

        /**
         * Superficie de bancos (sin rampa) para un desplazamiento interior s.
         *
         * @param {number} s
         */
        const benchY = function(s) {
            if (s < 0) {
                return Infinity;
            }
            const k = Math.floor(s / period);
            if (k >= n) {
                return -depth;
            }
            const w = s - k * period;
            if (w < face) {
                return -k * H - H * (w / face);
            }
            return -(k + 1) * H;
        };

        /**
         * Punto sobre el anillo de radio r a la coordenada perimetral q.
         *
         * @param {Object} q
         * @param {number} r
         */
        const ringPoint = function(q, r) {
            const per = 4 * L + 2 * Math.PI * r;
            q = ((q % per) + per) % per;
            let x;
            let z;
            if (q < 2 * L) {
                x = -L + q;
                z = -r;
            } else if (q < 2 * L + Math.PI * r) {
                const a = (q - 2 * L) / r - Math.PI / 2;
                x = L + r * Math.cos(a);
                z = r * Math.sin(a);
            } else if (q < 4 * L + Math.PI * r) {
                x = L - (q - 2 * L - Math.PI * r);
                z = r;
            } else {
                const b = Math.PI / 2 - (q - 4 * L - Math.PI * r) / r;
                x = -L - r * Math.cos(b);
                z = r * Math.sin(b);
            }
            return {x: x + c.x, z: z + c.z};
        };

        const perimAt = r => 4 * L + 2 * Math.PI * r;

        /**
         * Coordenada perimetral (local) de un punto a la distancia r del eje.
         *
         * @param {number} lx
         * @param {number} lz
         * @param {number} r
         * @returns {number}
         */
        const qOf = function(lx, lz, r) {
            if (lx >= -L && lx <= L) {
                return lz < 0 ? lx + L : 2 * L + Math.PI * r + (L - lx);
            }
            if (lx > L) {
                return 2 * L + (Math.atan2(lz, lx - L) + Math.PI / 2) * r;
            }
            return 4 * L + Math.PI * r + (Math.PI / 2 - Math.atan2(lz, -(lx + L))) * r;
        };

        // Eje de la rampa: desciende con pendiente constante y se desplaza hacia el
        // interior a razón de (período / H) por metro de profundidad. Bajo la rampa,
        // los bancos interiores se desplazan hacia el centro en el ancho de la rampa
        // (como en un diseño real), con una transición en el tramo inicial.
        const path = [];
        const pf = [];
        if (rampW > 0 && grade > 0) {
            const s0 = rampW / 2;
            let q = 0;
            let l = 0;
            for (let guard = 0; guard < 20000; guard++) {
                const y = -grade * l;
                const s = s0 + (-y) * period / H;
                const r = R - s;
                const f = q / perimAt(r);
                if (-y > depth || r < rampW || f >= 0.995) {
                    break;
                }
                const pt = ringPoint(q, r);
                path.push({x: pt.x, y: y, z: pt.z, l: l, s: s, q: q, r: r});
                pf.push(f);
                q += 1;
                l += 1;
            }
        }
        const taperLen = 80;

        /**
         * Punto del eje de rampa en la fracción perimetral f (o null fuera de la rampa).
         *
         * @param {number} f
         * @returns {Object|null}
         */
        const rampAtF = function(f) {
            const cnt = pf.length;
            if (!cnt || f < pf[0] || f > pf[cnt - 1]) {
                return null;
            }
            let lo = 0;
            let hi = cnt - 1;
            while (hi - lo > 1) {
                const mid = (lo + hi) >> 1;
                if (pf[mid] <= f) {
                    lo = mid;
                } else {
                    hi = mid;
                }
            }
            return path[lo];
        };

        const tanCut = Math.tan(p.faceAngle * Math.PI / 180);

        const kindAt = function(se) {
            if (se < 0) {
                return 'outside';
            }
            const k = Math.floor(se / period);
            if (k >= n) {
                return 'floor';
            }
            return (se - k * period) < face ? 'face' : 'berm';
        };

        /**
         * Cota del rajo en (x, z) e información de clasificación.
         *
         * @param {number} x
         * @param {number} z
         * @returns {{y: number, kind: string, s: number}} kind: outside|face|berm|floor|ramp
         */
        const sample = function(x, z) {
            const lc = local(x, z);
            const s = lc.s;
            if (s < 0) {
                return {y: Infinity, kind: 'outside', s: s};
            }
            const rp = path.length ? rampAtF(qOf(x - c.x, z - c.z, lc.r) / perimAt(lc.r)) : null;
            if (!rp) {
                return {y: benchY(s), kind: kindAt(s), s: s};
            }
            const outer = rp.s - rampW / 2;
            const inner = rp.s + rampW / 2;
            if (s >= outer && s <= inner) {
                return {y: rp.y, kind: 'ramp', s: s, l: rp.l};
            }
            if (s < outer) {
                return {y: clamp(benchY(s), rp.y, rp.y + (outer - s) * tanCut), kind: kindAt(s), s: s};
            }
            const se = s - rampW * smooth(0, taperLen, rp.l);
            return {y: clamp(benchY(se), rp.y - (s - inner) * tanCut, rp.y), kind: kindAt(se), s: s};
        };

        /**
         * Posición real de una línea de banco nominal (cresta o pata) en la coordenada q.
         *
         * @param {number} q coordenada perimetral sobre el anillo nominal
         * @param {number} sn desplazamiento interior nominal
         * @returns {Object|null} {x, z} o null si la línea queda dentro de la rampa
         */
        const benchLinePoint = function(q, sn) {
            const rn = R - sn;
            const f = q / perimAt(rn);
            const rp = rampAtF(f);
            let sa = sn;
            if (rp) {
                const shifted = sn + rampW * smooth(0, taperLen, rp.l);
                if (shifted > rp.s + rampW / 2) {
                    sa = shifted;
                } else if (sn >= rp.s - rampW / 2) {
                    return null;
                }
            }
            const ra = R - sa;
            if (ra <= 0) {
                return null;
            }
            return ringPoint(f * perimAt(ra), ra);
        };

        /**
         * Punto a la distancia l del inicio de la rampa.
         *
         * @param {number} l
         */
        const rampAt = function(l) {
            if (!path.length) {
                return null;
            }
            const i = clamp(Math.round(l), 0, path.length - 1);
            return path[i];
        };

        /**
         * Punto en la cara del banco k (0 = superior) sobre la pared norte, en x.
         *
         * @param {number} k
         * @param {number} x
         * @param {number} frac
         */
        const wallPoint = function(k, x, frac) {
            frac = frac === undefined ? 0.5 : frac;
            const sn = k * period + face * frac;
            const pt = benchLinePoint(x - c.x + L, sn);
            return {x: pt ? pt.x : x, y: -k * H - H * frac, z: pt ? pt.z : c.z - (R - sn)};
        };

        /**
         * Punto sobre la berma del banco k (al pie de la cara k), pared norte.
         *
         * @param {number} k
         * @param {number} x
         * @returns {Object}
         */
        const bermPoint = function(k, x) {
            const sn = k * period + face + p.berm / 2;
            const pt = benchLinePoint(x - c.x + L, sn);
            return {x: pt ? pt.x : x, y: -(k + 1) * H, z: pt ? pt.z : c.z - (R - sn)};
        };

        return {
            params: p, center: c, L: L, R: R, H: H, n: n, face: face, period: period, depth: depth,
            sample: sample, benchY: benchY, local: local, ringPoint: ringPoint, path: path,
            rampAt: rampAt, wallPoint: wallPoint, bermPoint: bermPoint, benchLinePoint: benchLinePoint,
            floorRadius: R - n * period,
            bounds: {minX: c.x - L - R, maxX: c.x + L + R, minZ: c.z - R, maxZ: c.z + R}
        };
    };

    /**
     * Niveles de calidad gráfica elegidos por el usuario al abrir la actividad.
     * terrain/detail/particles escalan malla del terreno, rocas y partículas.
     */
    const QUALITY = {
        high: {level: 'high', antialias: true, pixelRatio: 2, shadow: 4096, terrain: 1, detail: 1, particles: 1, lights: 14},
        medium: {level: 'medium', antialias: true, pixelRatio: 1.25, shadow: 2048, terrain: 0.6, detail: 0.6, particles: 0.6,
            lights: 8},
        low: {level: 'low', antialias: false, pixelRatio: 0.9, shadow: 0, terrain: 0.32, detail: 0.3, particles: 0.3, lights: 4}
    };

    // ---------------------------------------------------------------------
    // Mundo: renderer, cámara, cielo, luces y controles.
    // ---------------------------------------------------------------------

    const SKY_VS = 'varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition);' +
        ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }';
    const SKY_FS = 'uniform vec3 sunDir; uniform vec3 zenith; uniform vec3 horizon; uniform vec3 ground; varying vec3 vDir;' +
        'void main(){ vec3 d = normalize(vDir); float h = d.y;' +
        ' vec3 col = mix(horizon, zenith, pow(clamp(h,0.0,1.0), 0.45));' +
        ' col = mix(col, ground, smoothstep(0.0, -0.08, h));' +
        ' float sd = max(dot(d, normalize(sunDir)), 0.0);' +
        ' col += vec3(1.0,0.86,0.62) * pow(sd, 9.0) * 0.35 + vec3(1.0,0.95,0.85) * pow(sd, 900.0) * 6.0;' +
        ' float haze = 1.0 - smoothstep(0.0, 0.25, abs(h)); col = mix(col, horizon * 1.05, haze * 0.35);' +
        ' gl_FragColor = vec4(col, 1.0); }';

    /**
     * Crea el mundo 3D sobre un contenedor.
     *
     * @param {HTMLElement} host
     * @param {Object} THREE
     * @param {Object} opt {extent, sunAz, sunEl, seed}
     * @returns {Object}
     */
    const createWorld = function(host, THREE, opt) {
        opt = opt || {};
        const extent = opt.extent || 400;
        const Q = QUALITY[opt.quality] || QUALITY.high;
        const renderer = new THREE.WebGLRenderer({antialias: Q.antialias, powerPreference: 'high-performance'});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pixelRatio));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = Q.shadow > 0;
        renderer.shadowMap.type = Q.shadow >= 4096 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
        renderer.localClippingEnabled = true;
        renderer.domElement.className = 'mlx-canvas';
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const horizon = new THREE.Color(0xd9d2c4);
        scene.fog = new THREE.Fog(horizon.clone(), extent * 2, Math.max(7500, extent * 18));

        const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 20000);

        // Sol.
        const sunAz = (opt.sunAz === undefined ? 300 : opt.sunAz) * Math.PI / 180;
        const sunEl = (opt.sunEl === undefined ? 38 : opt.sunEl) * Math.PI / 180;
        const sunDir = new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), -Math.cos(sunAz) * Math.cos(sunEl));

        // Cielo.
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: SKY_VS,
            fragmentShader: SKY_FS,
            uniforms: {
                sunDir: {value: sunDir},
                zenith: {value: new THREE.Color(0x2f6fb8)},
                horizon: {value: horizon.clone()},
                ground: {value: new THREE.Color(0x9a8a74)}
            },
            side: THREE.BackSide,
            depthWrite: false,
            fog: false
        });
        const sky = new THREE.Mesh(new THREE.SphereGeometry(15000, 48, 24), skyMat);
        sky.frustumCulled = false;
        scene.add(sky);

        // Entorno de iluminación indirecta a partir del cielo (PMREM).
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
        const envTarget = pmrem.fromScene(envScene, 0.02);
        scene.environment = envTarget.texture;

        const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x8b6f52, 0.55);
        scene.add(hemi);
        const sun = new THREE.DirectionalLight(0xfff0dc, 2.7);
        sun.position.copy(sunDir).multiplyScalar(extent * 2.2);
        sun.castShadow = Q.shadow > 0;
        const maxTex = renderer.capabilities.maxTextureSize || 4096;
        sun.shadow.mapSize.set(Math.min(Q.shadow || 512, maxTex), Math.min(Q.shadow || 512, maxTex));
        const sc = sun.shadow.camera;
        sc.left = -extent;
        sc.right = extent;
        sc.top = extent;
        sc.bottom = -extent;
        sc.near = 10;
        sc.far = extent * 5;
        sun.shadow.bias = -0.00025;
        sun.shadow.normalBias = 0.8;
        scene.add(sun);
        scene.add(sun.target);

        // Capa de etiquetas HTML.
        const labelLayer = document.createElement('div');
        labelLayer.className = 'mlx-labels';
        host.appendChild(labelLayer);
        const labels = [];

        const world = {
            quality: Q,
            THREE: THREE, renderer: renderer, scene: scene, camera: camera, host: host, sun: sun, hemi: hemi,
            sky: skyMat, envTexture: envTarget.texture, horizon: horizon,
            sunDir: sunDir, extent: extent, labels: labels, labelLayer: labelLayer,
            pickables: [], grounds: [], planes: [], updaters: [], focus: {}, surveyLines: [],
            listeners: {}, clipPlanes: [], disposed: false
        };

        world.on = function(name, fn) {
            (world.listeners[name] = world.listeners[name] || []).push(fn);
        };
        world.emit = function(name, data) {
            (world.listeners[name] || []).forEach(fn => fn(data));
        };

        /**
         * Etiqueta HTML anclada a una posición 3D.
         *
         * @param {Object} pos
         * @param {string} html
         * @param {string} cls
         * @param {Object} info
         */
        world.addLabel = function(pos, html, cls, info) {
            const el = document.createElement('div');
            el.className = 'mlx-label ' + (cls || '');
            el.innerHTML = html;
            labelLayer.appendChild(el);
            const lab = {el: el, pos: new THREE.Vector3(pos.x, pos.y, pos.z), visible: true};
            if (info) {
                el.classList.add('is-clickable');
                el.setAttribute('role', 'button');
                el.tabIndex = 0;
                const fire = function(e) {
                    e.stopPropagation();
                    world.emit('inspect', {info: info, pos: lab.pos});
                };
                el.addEventListener('click', fire);
                el.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        fire(e);
                    }
                });
            }
            labels.push(lab);
            return lab;
        };

        /**
         * Registra una vista de cámara con nombre.
         *
         * @param {string} id
         * @param {Object} target
         * @param {number} dist
         * @param {number} az
         * @param {number} el
         */
        world.addFocus = function(id, target, dist, az, el) {
            world.focus[id] = {target: new THREE.Vector3(target.x, target.y, target.z), dist: dist, az: az, el: el};
        };

        world.addPickable = function(obj, info) {
            obj.userData.mlInfo = info;
            world.pickables.push(obj);
        };

        // Controles de órbita con amortiguación (arrastre: rotar; botón derecho o Shift: desplazar; rueda: zoom).
        const ctl = {
            target: new THREE.Vector3(0, 0, 0), dist: extent * 1.6, az: 0.6, el: 0.75,
            tAz: 0.6, tEl: 0.75, tDist: extent * 1.6, tTarget: new THREE.Vector3(), minDist: 6,
            maxDist: extent * 6, anim: null
        };
        ctl.tTarget.copy(ctl.target);
        world.controls = ctl;

        const applyCamera = function() {
            const ce = Math.cos(ctl.el);
            camera.position.set(
                ctl.target.x + ctl.dist * ce * Math.sin(ctl.az),
                ctl.target.y + ctl.dist * Math.sin(ctl.el),
                ctl.target.z + ctl.dist * ce * Math.cos(ctl.az)
            );
            camera.lookAt(ctl.target);
        };

        world.setView = function(v, instant) {
            ctl.tTarget.set(v.target.x, v.target.y, v.target.z);
            ctl.tDist = clamp(v.dist, ctl.minDist, ctl.maxDist);
            ctl.tAz = v.az;
            // Tomar el camino angular más corto.
            while (ctl.tAz - ctl.az > Math.PI) {
                ctl.tAz -= Math.PI * 2;
            }
            while (ctl.tAz - ctl.az < -Math.PI) {
                ctl.tAz += Math.PI * 2;
            }
            ctl.tEl = clamp(v.el, 0.05, 1.53);
            if (instant) {
                ctl.target.copy(ctl.tTarget);
                ctl.dist = ctl.tDist;
                ctl.az = ctl.tAz;
                ctl.el = ctl.tEl;
            }
        };
        world.getView = function() {
            return {target: {x: ctl.tTarget.x, y: ctl.tTarget.y, z: ctl.tTarget.z}, dist: ctl.tDist, az: ctl.tAz, el: ctl.tEl};
        };
        world.focusOn = function(id) {
            const f = world.focus[id];
            if (f) {
                world.setView(f);
                return true;
            }
            return false;
        };

        const canvas = renderer.domElement;
        const pointers = new Map();
        let dragMode = null;
        let downPos = null;
        let last = null;
        let pinchDist = 0;

        canvas.addEventListener('contextmenu', e => e.preventDefault());
        canvas.addEventListener('pointerdown', function(e) {
            canvas.setPointerCapture(e.pointerId);
            pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
            downPos = {x: e.clientX, y: e.clientY, t: performance.now()};
            last = {x: e.clientX, y: e.clientY};
            dragMode = (e.button === 2 || e.shiftKey) ? 'pan' : 'rotate';
            if (pointers.size === 2) {
                const pts = Array.from(pointers.values());
                pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                dragMode = 'pinch';
            }
        });
        canvas.addEventListener('pointermove', function(e) {
            if (!pointers.has(e.pointerId)) {
                world.emit('hover', {x: e.clientX, y: e.clientY});
                return;
            }
            pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
            if (dragMode === 'pinch' && pointers.size === 2) {
                const pts = Array.from(pointers.values());
                const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                if (pinchDist > 0) {
                    ctl.tDist = clamp(ctl.tDist * pinchDist / d, ctl.minDist, ctl.maxDist);
                }
                pinchDist = d;
                return;
            }
            const dx = e.clientX - last.x;
            const dy = e.clientY - last.y;
            last = {x: e.clientX, y: e.clientY};
            if (dragMode === 'rotate') {
                ctl.tAz -= dx * 0.005;
                ctl.tEl = clamp(ctl.tEl + dy * 0.004, 0.05, 1.53);
            } else if (dragMode === 'pan') {
                const scale = ctl.dist * 0.0016;
                const right = new THREE.Vector3(Math.cos(ctl.az), 0, -Math.sin(ctl.az));
                const fwd = new THREE.Vector3(-Math.sin(ctl.az), 0, -Math.cos(ctl.az));
                ctl.tTarget.addScaledVector(right, -dx * scale).addScaledVector(fwd, dy * scale);
            }
        });
        const endPointer = function(e) {
            if (!pointers.has(e.pointerId)) {
                return;
            }
            pointers.delete(e.pointerId);
            if (downPos && pointers.size === 0) {
                const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
                if (moved < 6 && performance.now() - downPos.t < 600 && e.button !== 2) {
                    world.emit('click', {x: e.clientX, y: e.clientY});
                }
            }
            if (pointers.size === 0) {
                dragMode = null;
            }
        };
        canvas.addEventListener('pointerup', endPointer);
        canvas.addEventListener('pointercancel', endPointer);
        canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            const f = Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012));
            ctl.tDist = clamp(ctl.tDist * f, ctl.minDist, ctl.maxDist);
        }, {passive: false});

        // Raycasting.
        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        world.raycast = function(clientX, clientY, objects) {
            const rect = canvas.getBoundingClientRect();
            ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(ndc, camera);
            const hits = raycaster.intersectObjects(objects, true);
            for (let i = 0; i < hits.length; i++) {
                const h = hits[i];
                // Ignorar la parte recortada por planos de corte.
                if (world.clipPlanes.length && world.clipPlanes.some(pl => pl.distanceToPoint(h.point) < 0) &&
                    world.grounds.indexOf(h.object) >= 0) {
                    continue;
                }
                if (h.object.visible !== false) {
                    return h;
                }
            }
            return null;
        };
        world.findInfo = function(obj) {
            while (obj) {
                if (obj.userData && obj.userData.mlInfo) {
                    return obj.userData.mlInfo;
                }
                obj = obj.parent;
            }
            return null;
        };

        // Redimensionamiento.
        const resize = function() {
            const w = host.clientWidth || 800;
            const h = host.clientHeight || 500;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(host);
        resize();

        // Bucle de render (se pausa cuando no es visible).
        let visible = true;
        const io = new IntersectionObserver(function(entries) {
            visible = entries[0].isIntersecting;
        });
        io.observe(host);
        const clock = new THREE.Clock();
        const tmp = new THREE.Vector3();
        renderer.setAnimationLoop(function() {
            if (!visible || document.hidden) {
                return;
            }
            const dt = Math.min(clock.getDelta(), 0.1);
            const k = 1 - Math.pow(0.0015, dt);
            ctl.az = lerp(ctl.az, ctl.tAz, k);
            ctl.el = lerp(ctl.el, ctl.tEl, k);
            ctl.dist = lerp(ctl.dist, ctl.tDist, k);
            ctl.target.lerp(ctl.tTarget, k);
            applyCamera();
            // La sombra sigue al objetivo para mantener resolución.
            sun.target.position.copy(ctl.target);
            sun.position.copy(ctl.target).addScaledVector(sunDir, extent * 2.2);
            const t = clock.elapsedTime;
            for (let i = 0; i < world.updaters.length; i++) {
                world.updaters[i](dt, t);
            }
            renderer.render(scene, camera);
            // Etiquetas.
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            for (let i = 0; i < labels.length; i++) {
                const lab = labels[i];
                tmp.copy(lab.pos).project(camera);
                const on = lab.visible && tmp.z < 1 && tmp.z > -1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
                if (!on) {
                    lab.el.style.display = 'none';
                    continue;
                }
                lab.el.style.display = '';
                lab.el.style.transform = 'translate(-50%, -100%) translate(' + ((tmp.x * 0.5 + 0.5) * w).toFixed(1) +
                    'px,' + ((-tmp.y * 0.5 + 0.5) * h).toFixed(1) + 'px)';
            }
            world.emit('frame', {az: ctl.az, el: ctl.el, dist: ctl.dist});
        });

        world.dispose = function() {
            world.disposed = true;
            renderer.setAnimationLoop(null);
            ro.disconnect();
            io.disconnect();
            renderer.dispose();
        };

        return world;
    };

    // ---------------------------------------------------------------------
    // Terreno.
    // ---------------------------------------------------------------------

    // Paletas de roca (lineal, se convierten a color THREE).
    const ROCK = [0x8a6a52, 0x7d7469, 0x9b7b5b, 0x6f655d, 0xa48463, 0x857060, 0x93806c];

    /**
     * Construye la superficie natural + rajo en una malla de alta resolución y un
     * terreno lejano de baja resolución con cordillera de fondo.
     *
     * @param {Object} world
     * @param {Object} cfg {seed, pit, patch:{minX,maxX,minZ,maxZ}, cell, relief, pads:[{x,z,r,y}], colors}
     * @returns {Object} {heightAt(x,z), mesh, far}
     */
    const buildTerrain = function(world, cfg) {
        const THREE = world.THREE;
        const nz = makeNoise(cfg.seed || 7);
        const pit = cfg.pit || null;
        const relief = cfg.relief === undefined ? 18 : cfg.relief;
        const pads = cfg.pads || [];
        const colors = cfg.colors || {};
        const soil = new THREE.Color(colors.soil || 0xb59a78);
        const soil2 = new THREE.Color(colors.soil2 || 0x9c7d5f);
        const gravel = new THREE.Color(colors.gravel || 0xa89a88);
        const road = new THREE.Color(colors.road || 0x8f8577);
        const snow = new THREE.Color(0xf4f6f8);
        const rockCols = ROCK.map(h => new THREE.Color(h));

        /**
         * Distancia exterior a la cresta del rajo (para atenuar el relieve natural).
         *
         * @param {number} x
         * @param {number} z
         */
        const pitOut = function(x, z) {
            if (!pit) {
                return 1e6;
            }
            return -pit.local(x, z).s;
        };

        const natural = function(x, z) {
            const d = Math.hypot(x, z);
            // Relieve local suave y cordillera lejana.
            let y = nz.fbm(x * 0.0035 + 3.1, z * 0.0035 - 1.7, 5) * relief +
                nz.fbm(x * 0.012, z * 0.012, 3) * relief * 0.18;
            const far = smooth(900, 3200, d);
            y += far * (nz.ridged(x * 0.0009 + 7, z * 0.0009 + 2, 5) * 900 - 250);
            if (cfg.slope) {
                y += x * cfg.slope.x + z * cfg.slope.z;
            }
            if (cfg.modify) {
                y = cfg.modify(x, z, y);
            }
            // Plataforma alrededor del rajo.
            const po = pitOut(x, z);
            const mask = smooth(15, 160, po);
            y = y * mask + (cfg.collar || 0) * (1 - mask);
            // Explanadas de obras.
            for (let i = 0; i < pads.length; i++) {
                const pd = pads[i];
                const dd = pd.w ? Math.max(Math.abs(x - pd.x) - pd.w / 2, Math.abs(z - pd.z) - pd.d / 2, 0)
                    : Math.max(0, Math.hypot(x - pd.x, z - pd.z) - pd.r);
                const m = 1 - smooth(0, pd.blend || 40, dd);
                y = lerp(y, pd.y, m);
            }
            return y;
        };

        const sampleAt = function(x, z) {
            const nat = natural(x, z);
            if (!pit) {
                return {y: nat, kind: 'natural'};
            }
            const sp = pit.sample(x, z);
            if (sp.y === Infinity) {
                if (sp.fillTop !== undefined && sp.fillTop > nat) {
                    return {y: sp.fillTop, kind: 'fill'};
                }
                return {y: nat, kind: 'natural'};
            }
            let y = Math.min(nat, sp.y);
            if (sp.kind === 'face' || sp.kind === 'cut') {
                // Rugosidad de la cara del banco (sin alterar las bermas).
                y += nz.noise(x * 0.35, z * 0.35 + sp.y * 0.2) * 0.45 + nz.noise(x * 1.3, z * 1.3) * 0.15;
            }
            return {y: y, kind: y < nat - 0.01 || sp.kind === 'ramp' ? sp.kind : 'natural', s: sp.s};
        };

        const patch = cfg.patch;
        const cell = cfg.cell || 1.5;
        const nx = Math.max(2, Math.round((patch.maxX - patch.minX) / cell));
        const nzc = Math.max(2, Math.round((patch.maxZ - patch.minZ) / cell));
        const geo = new THREE.PlaneGeometry(patch.maxX - patch.minX, patch.maxZ - patch.minZ, nx, nzc);
        geo.rotateX(-Math.PI / 2);
        geo.translate((patch.minX + patch.maxX) / 2, 0, (patch.minZ + patch.maxZ) / 2);
        const pos = geo.attributes.position;
        const kinds = new Array(pos.count);
        const hole = cfg.hole || null;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const s = sampleAt(x, z);
            const inHole = hole && x > hole.minX && x < hole.maxX && z > hole.minZ && z < hole.maxZ;
            pos.setY(i, inHole ? s.y - 10 : s.y);
            kinds[i] = s.kind;
        }
        geo.computeVertexNormals();

        // Colores por vértice: estratos en caras, gravilla en bermas, camino en rampa.
        const nrm = geo.attributes.normal;
        const col = new Float32Array(pos.count * 3);
        const uv = geo.attributes.uv;
        const tc = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            const ny = nrm.getY(i);
            const kind = kinds[i];
            const slope = 1 - ny;
            const v1 = nz.noise(x * 0.05, z * 0.05);
            const v2 = nz.noise(x * 0.4 + 9, z * 0.4 - 4);
            if (kind === 'ramp') {
                tc.copy(road).offsetHSL(0, 0, v2 * 0.03 + v1 * 0.02);
            } else if (kind === 'natural' || kind === 'outside') {
                tc.copy(soil).lerp(soil2, clamp(0.5 + v1 * 0.9, 0, 1));
                if (slope > 0.35) {
                    tc.lerp(rockCols[1], clamp((slope - 0.35) * 2, 0, 0.8));
                }
                if (y > 380) {
                    tc.lerp(snow, smooth(380, 520, y + v1 * 60) * clamp(ny * 1.4, 0, 1));
                }
                tc.offsetHSL(0, 0, v2 * 0.025);
            } else {
                // Estratos de roca con deformación suave.
                const warp = nz.fbm(x * 0.01, z * 0.01, 3) * 9;
                const band = Math.floor((y + warp) / 4.5);
                const idx = ((band % rockCols.length) + rockCols.length) % rockCols.length;
                tc.copy(rockCols[idx]).lerp(rockCols[(idx + 3) % rockCols.length], clamp(0.5 + v2, 0, 1) * 0.35);
                // Óxidos y vetillas.
                const ox = Math.max(0, nz.noise(x * 0.08 + 30, (y + z) * 0.08));
                tc.lerp(new THREE.Color(0xa0522d), ox * 0.45);
                if (slope < 0.25) {
                    // Superficie de berma/piso: material tronado y gravilla.
                    tc.lerp(gravel, 0.65).offsetHSL(0, 0, v2 * 0.04);
                } else {
                    tc.offsetHSL(0, 0, -0.05 + v2 * 0.05);
                }
            }
            col[i * 3] = tc.r;
            col[i * 3 + 1] = tc.g;
            col[i * 3 + 2] = tc.b;
            // UV triplanar por vértice según el eje dominante de la normal (sin estiramiento en caras).
            const ax = Math.abs(nrm.getX(i));
            const az = Math.abs(nrm.getZ(i));
            if (ny > 0.62) {
                uv.setXY(i, x / 9, z / 9);
            } else if (ax > az) {
                uv.setXY(i, z / 6, y / 6);
            } else {
                uv.setXY(i, x / 6, y / 6);
            }
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        const tex = detailTextures(THREE, (cfg.seed || 7) + 11);
        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true, map: tex.map, normalMap: tex.normal, normalScale: new THREE.Vector2(0.9, 0.9),
            roughness: 0.97, metalness: 0, envMapIntensity: 0.6, clippingPlanes: world.clipPlanes
        });
        antiTile(mat);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        world.scene.add(mesh);
        world.grounds.push(mesh);

        if (cfg.noFar) {
            return {heightAt: (x, z) => sampleAt(x, z).y, natural: natural, mesh: mesh, far: null, sample: sampleAt};
        }
        // Terreno lejano (se hunde bajo las zonas de detalle para no interferir).
        const fh = cfg.farHole || patch;
        const farSize = cfg.farSize || 9000;
        const fseg = world.quality && world.quality.terrain < 0.5 ? 140 : 220;
        const farGeo = new THREE.PlaneGeometry(farSize, farSize, fseg, fseg);
        farGeo.rotateX(-Math.PI / 2);
        const fpos = farGeo.attributes.position;
        const fcol = new Float32Array(fpos.count * 3);
        for (let i = 0; i < fpos.count; i++) {
            const x = fpos.getX(i);
            const z = fpos.getZ(i);
            let y;
            const m = farSize / fseg * 1.05;
            const inside = x > fh.minX + m && x < fh.maxX - m && z > fh.minZ + m && z < fh.maxZ - m;
            if (inside) {
                y = Math.min(natural(x, z), sampleAt(x, z).y) - 12;
            } else {
                y = natural(x, z);
            }
            fpos.setY(i, y);
        }
        farGeo.computeVertexNormals();
        const fn = farGeo.attributes.normal;
        const fuv = farGeo.attributes.uv;
        for (let i = 0; i < fpos.count; i++) {
            const x = fpos.getX(i);
            const y = fpos.getY(i);
            const z = fpos.getZ(i);
            // Misma coloración que el terreno natural de detalle para que el borde no se note.
            const v1 = nz.noise(x * 0.05, z * 0.05);
            const v2 = nz.noise(x * 0.4 + 9, z * 0.4 - 4);
            const slope = 1 - fn.getY(i);
            tc.copy(soil).lerp(soil2, clamp(0.5 + v1 * 0.9, 0, 1));
            if (slope > 0.35) {
                tc.lerp(rockCols[1], clamp((slope - 0.35) * 2, 0, 0.8));
            }
            tc.lerp(rockCols[3], clamp((slope - 0.15) * 1.6, 0, 0.6));
            tc.lerp(snow, smooth(380, 520, y + nz.noise(x * 0.004, z * 0.004) * 60) * clamp(fn.getY(i) * 1.4, 0, 1));
            tc.offsetHSL(0, 0, v2 * 0.025);
            fcol[i * 3] = tc.r;
            fcol[i * 3 + 1] = tc.g;
            fcol[i * 3 + 2] = tc.b;
            fuv.setXY(i, x / 9, z / 9);
        }
        farGeo.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
        const farMat = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.97, metalness: 0,
            map: tex.map, normalMap: tex.normal, normalScale: new THREE.Vector2(0.6, 0.6), envMapIntensity: 0.6,
            clippingPlanes: world.clipPlanes, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4});
        antiTile(farMat);
        const far = new THREE.Mesh(farGeo, farMat);
        far.receiveShadow = true;
        world.scene.add(far);

        return {
            heightAt: function(x, z) {
                return sampleAt(x, z).y;
            },
            natural: natural, mesh: mesh, far: far, sample: sampleAt
        };
    };

    /**
     * Líneas topográficas de cresta y pata de cada banco (con ajuste de medición).
     *
     * @param {Object} world
     * @param {Object} pit
     * @param {Object} terrain
     */
    const addSurveyLines = function(world, pit, terrain) {
        const THREE = world.THREE;
        const matCrest = new THREE.LineBasicMaterial({color: 0xffe14d, transparent: true, opacity: 0.95, fog: true});
        const matToe = new THREE.LineBasicMaterial({color: 0x4dd2ff, transparent: true, opacity: 0.95, fog: true});
        const group = new THREE.Group();
        group.name = 'survey';
        for (let k = 0; k < pit.n; k++) {
            [[k * pit.period, -k * pit.H, matCrest], [k * pit.period + pit.face, -(k + 1) * pit.H, matToe]].forEach(function(def) {
                const r = pit.R - def[0];
                const per = 4 * pit.L + 2 * Math.PI * r;
                let seg = [];
                const flush = function() {
                    if (seg.length > 1) {
                        const g = new THREE.BufferGeometry().setFromPoints(seg);
                        const line = new THREE.Line(g, def[2]);
                        group.add(line);
                        world.surveyLines.push(seg.slice());
                    }
                    seg = [];
                };
                for (let q = 0; q <= per; q += 1.5) {
                    const p = pit.benchLinePoint(q, def[0]);
                    if (!p) {
                        flush();
                        continue;
                    }
                    const ty = terrain.heightAt(p.x, p.z);
                    // Solo donde la línea coincide con el terreno (se interrumpe en la rampa).
                    if (Math.abs(ty - def[1]) < 0.9) {
                        seg.push(new THREE.Vector3(p.x, def[1] + 0.12, p.z));
                    } else {
                        flush();
                    }
                }
                flush();
            });
        }
        world.scene.add(group);
        world.surveyGroup = group;
        return group;
    };

    /**
     * Ajusta un punto a la línea topográfica más cercana (radio en metros).
     *
     * @param {Object} world
     * @param {Object} p Vector3
     * @param {number} radius
     * @returns {Object|null} Vector3 ajustado
     */
    const snapToSurvey = function(world, p, radius) {
        const THREE = world.THREE;
        let best = null;
        let bd = radius;
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const line = new THREE.Line3();
        const out = new THREE.Vector3();
        world.surveyLines.forEach(function(seg) {
            for (let i = 0; i < seg.length - 1; i++) {
                a.copy(seg[i]);
                b.copy(seg[i + 1]);
                line.set(a, b);
                line.closestPointToPoint(p, true, out);
                const d = out.distanceTo(p);
                if (d < bd) {
                    bd = d;
                    best = out.clone();
                    best.y -= 0.12;
                }
            }
        });
        return best;
    };

    // ---------------------------------------------------------------------
    // Materiales y modelos.
    // ---------------------------------------------------------------------

    const materials = function(THREE) {
        const m = (color, rough, metal, extra) => new THREE.MeshStandardMaterial(Object.assign({
            color: color, roughness: rough, metalness: metal}, extra || {}));
        return {
            cat: m(0xf2b200, 0.45, 0.25),
            catDark: m(0xc48f00, 0.55, 0.25),
            steel: m(0x6f757c, 0.4, 0.85),
            darkSteel: m(0x34383d, 0.5, 0.8),
            tire: m(0x1c1c1c, 0.9, 0.0),
            rim: m(0xd9a400, 0.5, 0.4),
            glass: m(0x223344, 0.08, 0.2, {transparent: true, opacity: 0.75, envMapIntensity: 1.5}),
            white: m(0xf1f1ee, 0.5, 0.1),
            red: m(0xc62828, 0.5, 0.1),
            orange: m(0xff6d00, 0.55, 0.0),
            concrete: m(0xb9b4aa, 0.92, 0.0),
            shotcrete: m(0x9c968c, 0.95, 0.0),
            dark: m(0x0b0b0c, 1, 0),
            blue: m(0x1f5fa8, 0.5, 0.2),
            green: m(0x2e7d32, 0.6, 0.1),
            roof: m(0xc9ced3, 0.35, 0.75),
            wood: m(0x8b6a43, 0.85, 0),
            core: m(0x8d8f91, 0.6, 0.05),
            water: m(0x2c5d6b, 0.06, 0.15, {envMapIntensity: 1.6}),
            tailings: m(0xbfb9a8, 0.95, 0),
            hivis: m(0xd7ff2f, 0.6, 0, {emissive: 0x2a3300})
        };
    };

    const box = function(THREE, w, h, d, mat) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    };
    const cyl = function(THREE, rt, rb, h, mat, seg) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    };

    // Los equipos detallados viven en mod_minaslab/eval_models; aquí se mantiene la
    // misma interfaz (THREE, M, ...) que usan las escenas.

    /**
     * Camión de extracción de alto tonelaje.
     *
     * @param {Object} THREE
     * @param {Object} M materiales (no se usa; compatibilidad)
     * @param {number} payload t
     * @param {boolean} loaded con carga
     * @param {string} number número interno
     * @returns {Object}
     */
    const haulTruck = (THREE, M, payload, loaded, number) => models.haulTruck(THREE, payload, loaded, number);

    /**
     * Pala eléctrica de cables.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const ropeShovel = THREE => models.ropeShovel(THREE);

    /**
     * Perforadora de pozos de tronadura.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const drillRig = THREE => models.drillRig(THREE);

    /**
     * Camioneta de supervisión.
     *
     * @param {Object} THREE
     * @param {Object} M materiales (no se usa; compatibilidad)
     * @param {string} number número interno
     * @param {string} variant hx | lx | tx
     * @returns {Object}
     */
    const pickup = (THREE, M, number, variant) => models.pickup(THREE, number, variant);

    /**
     * Trabajador con EPP.
     *
     * @param {Object} THREE
     * @param {Object} M materiales (no se usa; compatibilidad)
     * @param {boolean} vest con chaleco
     * @returns {Object}
     */
    const worker = (THREE, M, vest) => models.worker(THREE, vest);

    /**
     * Letrero con poste.
     *
     * @param {Object} THREE
     * @param {Object} M
     * @param {string[]} lines
     * @param {Object} opt
     */
    const signPost = function(THREE, M, lines, opt) {
        opt = opt || {};
        const g = new THREE.Group();
        const w = opt.width || 3;
        const h = opt.height || 1.5;
        const tex = signTexture(THREE, lines, opt);
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: tex, roughness: 0.6,
            side: THREE.DoubleSide}));
        panel.position.y = (opt.pole || 2.2) + h / 2;
        g.add(panel);
        [-1, 1].forEach(function(sd) {
            const p = cyl(THREE, 0.06, 0.06, (opt.pole || 2.2) + h, M.steel, 8);
            p.position.set(sd * w * 0.42, ((opt.pole || 2.2) + h) / 2, -0.05);
            g.add(p);
        });
        return g;
    };

    /**
     * Estaca topográfica con banderín.
     *
     * @param {Object} THREE
     * @param {Object} M
     * @param {number} color
     */
    const stake = function(THREE, M, color) {
        const g = new THREE.Group();
        const p = cyl(THREE, 0.05, 0.05, 1.6, M.wood, 6);
        p.position.y = 0.8;
        g.add(p);
        const f = box(THREE, 0.02, 0.3, 0.45, new THREE.MeshStandardMaterial({color: color || 0xff3d00, roughness: 0.6}));
        f.position.set(0, 1.45, 0.22);
        g.add(f);
        return g;
    };

    /**
     * Estación total sobre trípode.
     *
     * @param {Object} THREE
     * @returns {Object}
     */
    const totalStation = THREE => models.totalStation(THREE);

    /**
     * Pretil de seguridad a lo largo de una polilínea (sección triangular).
     *
     * @param {Object} THREE
     * @param {Object[]} pts puntos {x,y,z}
     * @param {number} height
     * @param {Object} mat
     * @returns {Object}
     */
    const bermAlong = function(THREE, pts, height, mat) {
        const base = height / Math.tan(41 * Math.PI / 180);
        const verts = [];
        const idx = [];
        for (let i = 0; i < pts.length; i++) {
            const a = pts[Math.max(0, i - 1)];
            const b = pts[Math.min(pts.length - 1, i + 1)];
            let tx = b.x - a.x;
            let tz = b.z - a.z;
            const tl = Math.hypot(tx, tz) || 1;
            tx /= tl;
            tz /= tl;
            const nxv = -tz;
            const nzv = tx;
            const p = pts[i];
            verts.push(p.x - nxv * base, p.y, p.z - nzv * base);
            verts.push(p.x, p.y + height, p.z);
            verts.push(p.x + nxv * base, p.y, p.z + nzv * base);
            if (i > 0) {
                const o = (i - 1) * 3;
                const q = i * 3;
                idx.push(o, q, o + 1, q, q + 1, o + 1, o + 1, q + 1, o + 2, q + 1, q + 2, o + 2);
            }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const mesh = new THREE.Mesh(g, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    };

    /**
     * Rocas dispersas (instanciadas) sobre una función de altura.
     *
     * @param {Object} world
     * @param {number} count
     * @param {Object} area
     * @param {Function} heightAt
     * @param {number} seed
     * @param {Function} filter
     */
    const scatterRocks = function(world, count, area, heightAt, seed, filter) {
        const THREE = world.THREE;
        const rnd = mulberry(seed || 3);
        const geo = new THREE.IcosahedronGeometry(1, 1);
        const p = geo.attributes.position;
        // Deformación determinista por posición: los vértices duplicados de la malla no indexada
        // se desplazan igual y la roca queda cerrada (facetada, sin grietas).
        const hash = (x, y, z) => {
            const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + (seed || 3)) * 43758.5453;
            return v - Math.floor(v);
        };
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i);
            const y = p.getY(i);
            const z = p.getZ(i);
            const f = 0.72 + hash(Math.round(x * 1000), Math.round(y * 1000), Math.round(z * 1000)) * 0.5;
            p.setXYZ(i, x * f, y * f * 0.68, z * f);
        }
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({color: 0x8b7765, roughness: 0.95});
        const inst = new THREE.InstancedMesh(geo, mat, count);
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const e = new THREE.Euler();
        const s = new THREE.Vector3();
        const v = new THREE.Vector3();
        const c = new THREE.Color();
        let n = 0;
        for (let i = 0; i < count * 4 && n < count; i++) {
            const x = lerp(area.minX, area.maxX, rnd());
            const z = lerp(area.minZ, area.maxZ, rnd());
            if (filter && !filter(x, z)) {
                continue;
            }
            const sc = 0.3 + Math.pow(rnd(), 3) * 1.6;
            v.set(x, heightAt(x, z) + sc * 0.2, z);
            e.set(rnd() * 3, rnd() * 3, rnd() * 3);
            q.setFromEuler(e);
            s.set(sc, sc, sc);
            m.compose(v, q, s);
            inst.setMatrixAt(n, m);
            c.setHSL(0.07 + rnd() * 0.03, 0.18 + rnd() * 0.12, 0.33 + rnd() * 0.15);
            inst.setColorAt(n, c);
            n++;
        }
        inst.count = n;
        inst.castShadow = true;
        inst.receiveShadow = true;
        world.scene.add(inst);
        return inst;
    };

    /**
     * Polvo en suspensión (partículas suaves) alrededor de un emisor.
     *
     * @param {Object} world
     * @param {Object} center
     * @param {number} radius
     * @param {number} count
     */
    const dust = function(world, center, radius, count) {
        const THREE = world.THREE;
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(210,190,160,0.55)');
        grd.addColorStop(1, 'rgba(210,190,160,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c);
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const seeds = [];
        for (let i = 0; i < count; i++) {
            seeds.push([Math.random() * Math.PI * 2, Math.random() * radius, Math.random() * 12, Math.random()]);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({map: tex, size: radius * 0.5, transparent: true, depthWrite: false,
            opacity: 0.45, sizeAttenuation: true});
        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;
        world.scene.add(pts);
        const obj = {center: center, points: pts};
        world.updaters.push(function(dt, t) {
            for (let i = 0; i < count; i++) {
                const sd = seeds[i];
                const a = sd[0] + t * 0.05 * (sd[3] - 0.5);
                const r = sd[1];
                pos[i * 3] = obj.center.x + Math.cos(a) * r + Math.sin(t * 0.2 + sd[0]) * 2;
                pos[i * 3 + 1] = obj.center.y + ((sd[2] + t * 0.8 * sd[3]) % 14);
                pos[i * 3 + 2] = obj.center.z + Math.sin(a) * r;
            }
            geo.attributes.position.needsUpdate = true;
        });
        return obj;
    };

    /**
     * Superficie de agua con brillo animado.
     *
     * @param {Object} world
     * @param {Object} geo
     */
    const water = function(world, geo) {
        const THREE = world.THREE;
        const tex = detailTextures(THREE, 99).normal;
        tex.repeat.set(6, 6);
        const mat = new THREE.MeshStandardMaterial({color: 0x2f6170, roughness: 0.18, metalness: 0.1,
            normalMap: tex, normalScale: new THREE.Vector2(0.12, 0.12), envMapIntensity: 1.3, side: THREE.DoubleSide,
            transparent: true, opacity: 0.94});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        world.updaters.push(function(dt, t) {
            tex.offset.set(t * 0.01, t * 0.006);
        });
        world.scene.add(mesh);
        return mesh;
    };

    /**
     * Orienta un objeto (frente +x) a lo largo de una tangente y lo apoya en el terreno.
     *
     * @param {Object} obj
     * @param {Object} p
     * @param {Object} q
     */
    const placeAlong = function(obj, p, q) {
        obj.position.set(p.x, p.y, p.z);
        obj.rotation.set(0, Math.atan2(-(q.z - p.z), q.x - p.x), 0);
        const dy = q.y - p.y;
        const dh = Math.hypot(q.x - p.x, q.z - p.z) || 1;
        obj.rotateZ(Math.atan2(dy, dh));
    };

    return {
        QUALITY: QUALITY, clamp: clamp, lerp: lerp, smooth: smooth, mulberry: mulberry, makeNoise: makeNoise,
        createWorld: createWorld, makePit: makePit, buildTerrain: buildTerrain, addSurveyLines: addSurveyLines,
        snapToSurvey: snapToSurvey, materials: materials, box: box, cyl: cyl, haulTruck: haulTruck,
        ropeShovel: ropeShovel, drillRig: drillRig, pickup: pickup, worker: worker, signPost: signPost,
        wheelLoader: THREE => models.wheelLoader(THREE), diamondDrill: THREE => models.diamondDrill(THREE),
        siteOffice: (THREE, title) => models.siteOffice(THREE, title), crusherStation: THREE => models.crusherStation(THREE),
        wheel: function(THREE, M, r, w) {
            const g = new THREE.Group();
            const t = models.tire(THREE, models.mats(THREE), r, w);
            t.position.y = r;
            g.add(t);
            return g;
        },
        signTexture: signTexture, stake: stake, totalStation: totalStation, bermAlong: bermAlong,
        scatterRocks: scatterRocks, dust: dust, water: water, placeAlong: placeAlong, detailTextures: detailTextures
    };
});
