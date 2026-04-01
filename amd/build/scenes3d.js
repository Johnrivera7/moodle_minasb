// MinasLab — escenas WebGL Three.js (túnel, tajo, ventilación) — motor compartido para todas las prácticas del arquetipo.
define([], function() {
    'use strict';

    /**
     * Tamaño del canvas acorde al contenedor (evita franjas vacías “cortadas”).
     */
    function viewportDimensions(host) {
        var w = host.clientWidth || 640;
        var ch = host.clientHeight;
        var h;
        if (ch > 160) {
            h = Math.min(ch - 4, 640);
        } else {
            h = Math.min(460, Math.max(300, Math.round(w * 0.58)));
        }
        h = Math.max(280, h);
        return {w: w, h: h};
    }

    /**
     * Órbita + zoom con mouse o trackpad (rueda / pellizco ≈ Ctrl+rueda).
     */
    function attachTrackpadOrbit(THREE, domElement, camera, target, initial) {
        initial = initial || {};
        var theta = initial.theta != null ? initial.theta : 0.85;
        var phi = initial.phi != null ? initial.phi : 0.48;
        var radius = initial.radius != null ? initial.radius : 38;
        var minR = initial.minR != null ? initial.minR : 10;
        var maxR = initial.maxR != null ? initial.maxR : 130;
        var minPhi = initial.minPhi != null ? initial.minPhi : 0.1;
        var maxPhi = initial.maxPhi != null ? initial.maxPhi : 1.48;
        var orbitDragging = {v: false};
        var orbitDragEnabled = true;
        var activePid = -1;
        var lastX = 0;
        var lastY = 0;

        function applyOrbit() {
            var cp = Math.cos(phi);
            camera.position.set(
                target.x + radius * cp * Math.sin(theta),
                target.y + radius * Math.sin(phi),
                target.z + radius * cp * Math.cos(theta)
            );
            camera.lookAt(target);
        }
        applyOrbit();

        function onPointerDown(e) {
            if (!orbitDragEnabled) {
                return;
            }
            if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'pen') {
                return;
            }
            orbitDragging.v = true;
            activePid = e.pointerId;
            lastX = e.clientX;
            lastY = e.clientY;
            domElement.style.cursor = 'grabbing';
            try {
                domElement.setPointerCapture(e.pointerId);
            } catch (err) {
                // ignore
            }
        }
        function onPointerUp(e) {
            orbitDragging.v = false;
            domElement.style.cursor = 'grab';
            try {
                domElement.releasePointerCapture(e.pointerId);
            } catch (err2) {
                // ignore
            }
        }
        function onPointerMove(e) {
            if (!orbitDragEnabled || !orbitDragging.v || e.pointerId !== activePid) {
                return;
            }
            var dx = e.clientX - lastX;
            var dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            theta -= dx * 0.0048;
            phi -= dy * 0.0038;
            phi = Math.max(minPhi, Math.min(maxPhi, phi));
            applyOrbit();
        }
        function onWheel(e) {
            e.preventDefault();
            var dy = e.deltaY;
            if (e.deltaMode === 1) {
                dy *= 14;
            } else if (e.deltaMode === 2) {
                dy *= 60;
            }
            var sens = e.ctrlKey ? 0.0018 : 0.0011;
            var factor = 1 + dy * sens;
            radius *= factor;
            radius = Math.max(minR, Math.min(maxR, radius));
            applyOrbit();
        }

        domElement.style.touchAction = 'none';
        domElement.style.cursor = 'grab';
        domElement.addEventListener('pointerdown', onPointerDown);
        domElement.addEventListener('pointerup', onPointerUp);
        domElement.addEventListener('pointercancel', onPointerUp);
        domElement.addEventListener('pointerleave', onPointerUp);
        domElement.addEventListener('pointermove', onPointerMove);
        domElement.addEventListener('wheel', onWheel, {passive: false});

        return {
            dispose: function() {
                domElement.removeEventListener('pointerdown', onPointerDown);
                domElement.removeEventListener('pointerup', onPointerUp);
                domElement.removeEventListener('pointercancel', onPointerUp);
                domElement.removeEventListener('pointerleave', onPointerUp);
                domElement.removeEventListener('pointermove', onPointerMove);
                domElement.removeEventListener('wheel', onWheel);
            },
            isDragging: function() {
                return orbitDragging.v;
            },
            applyOrbit: applyOrbit,
            /** Rotación lenta cuando el usuario no arrastra (p. ej. vista del tajo). */
            spinIdle: function(rate) {
                var r = rate != null ? rate : 0.00022;
                if (!orbitDragEnabled) {
                    return;
                }
                if (!orbitDragging.v) {
                    theta += r;
                    applyOrbit();
                }
            },
            setOrbitDragEnabled: function(v) {
                orbitDragEnabled = !!v;
                if (!orbitDragEnabled) {
                    orbitDragging.v = false;
                    domElement.style.cursor = 'default';
                } else {
                    domElement.style.cursor = 'grab';
                }
            },
            getAngles: function() {
                return {theta: theta, phi: phi, radius: radius};
            },
            setAngles: function(t, p, r) {
                if (t != null) {
                    theta = t;
                }
                if (p != null) {
                    phi = p;
                }
                if (r != null) {
                    radius = r;
                }
                phi = Math.max(minPhi, Math.min(maxPhi, phi));
                radius = Math.max(minR, Math.min(maxR, radius));
                applyOrbit();
            }
        };
    }

    /**
     * Álgebra / voladura: frente de malla con barrenos (2×2 resaltado) — sin rieles de túnel.
     */
    function mountBlastFace(viewport, activity, theme, THREE) {
        var host = viewport;
        var dim0 = viewportDimensions(host);
        var w = dim0.w;
        var h = dim0.h;

        var scene = new THREE.Scene();
        var bg = 0x1e2229;
        scene.background = new THREE.Color(bg);
        scene.fog = new THREE.Fog(bg, 6, 38);

        var camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 120);
        camera.position.set(0, 2.8, 9.2);

        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.verticalAlign = 'top';
        host.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0x8a9098, 0.55));
        var key = new THREE.DirectionalLight(0xfff5e6, 1.25);
        key.position.set(4, 10, 12);
        key.castShadow = true;
        scene.add(key);
        var rim = new THREE.PointLight(theme.warm, 0.6, 30);
        rim.position.set(-3, 2, 4);
        scene.add(rim);

        /* Suelo galería */
        var floor = new THREE.Mesh(
            new THREE.PlaneGeometry(24, 16),
            new THREE.MeshStandardMaterial({color: 0x3a3530, roughness: 0.95})
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        floor.receiveShadow = true;
        scene.add(floor);

        /* Macizo rocoso alrededor */
        var sideMat = new THREE.MeshStandardMaterial({color: 0x2d2a26, roughness: 0.98});
        var left = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 10), sideMat);
        left.position.set(-7, 3, -1);
        scene.add(left);
        var right = left.clone();
        right.position.x = 7;
        scene.add(right);
        var roof = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 10), sideMat);
        roof.position.set(0, 5.6, -1);
        scene.add(roof);

        /* Frente de voladura */
        var face = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 7.5),
            new THREE.MeshStandardMaterial({
                color: 0x5e564c,
                roughness: 0.92,
                metalness: 0.05,
                bumpScale: 0.02
            })
        );
        face.position.set(0, 3.2, -3.95);
        face.receiveShadow = true;
        scene.add(face);

        var holeMat = new THREE.MeshStandardMaterial({color: 0x1a1815, roughness: 0.88});
        var chargeMat = new THREE.MeshStandardMaterial({
            color: 0xff6622,
            emissive: 0x551100,
            emissiveIntensity: 0.45,
            roughness: 0.45,
            metalness: 0.2
        });
        var charges = [];
        var gx;
        var gy;
        for (gy = 0; gy < 4; gy++) {
            for (gx = 0; gx < 4; gx++) {
                var hx = -2.1 + gx * 1.35;
                var hy = 1.35 + (3 - gy) * 1.55;
                var hole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.22, 10), holeMat);
                hole.rotation.x = Math.PI / 2;
                hole.position.set(hx, hy, -3.78);
                hole.castShadow = true;
                scene.add(hole);
                if (gx >= 1 && gx <= 2 && gy >= 1 && gy <= 2) {
                    var ch = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.2, 8), chargeMat);
                    ch.rotation.x = Math.PI / 2;
                    ch.position.set(hx, hy, -3.55);
                    scene.add(ch);
                    charges.push(ch);
                }
            }
        }

        /* Marco matricial decorativo [ ] */
        var frameMat = new THREE.MeshStandardMaterial({color: 0xc8b89a, metalness: 0.4, roughness: 0.4});
        var fthick = 0.12;
        var fwide = 5.2;
        var fhi = 3.6;
        var topB = new THREE.Mesh(new THREE.BoxGeometry(fwide, fthick, 0.08), frameMat);
        topB.position.set(0, 4.85, -3.5);
        scene.add(topB);
        var botB = topB.clone();
        botB.position.y = 1.55;
        scene.add(botB);
        var leftB = new THREE.Mesh(new THREE.BoxGeometry(fthick, fhi, 0.08), frameMat);
        leftB.position.set(-2.55, 3.2, -3.5);
        scene.add(leftB);
        var rightB = leftB.clone();
        rightB.position.x = 2.55;
        scene.add(rightB);

        var lookT = new THREE.Vector3(0, 3.1, -4);
        var orbitBlast = attachTrackpadOrbit(THREE, renderer.domElement, camera, lookT, {
            theta: 0.2,
            phi: 0.35,
            radius: 9.5,
            minR: 4.5,
            maxR: 22,
            minPhi: 0.12,
            maxPhi: 1.35
        });

        var t0 = performance.now();
        var animId;
        var running = true;
        function loop(now) {
            if (!running) {
                return;
            }
            animId = requestAnimationFrame(loop);
            var tsec = (now - t0) * 0.001;
            var ci;
            for (ci = 0; ci < charges.length; ci++) {
                charges[ci].material.emissiveIntensity = 0.35 + Math.sin(tsec * 3 + ci) * 0.15;
            }
            renderer.render(scene, camera);
        }
        animId = requestAnimationFrame(loop);

        function onResize() {
            var dim = viewportDimensions(host);
            w = dim.w;
            h = dim.h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);
        var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
        if (ro) {
            ro.observe(host);
        }

        return {
            dispose: function() {
                running = false;
                if (animId) {
                    cancelAnimationFrame(animId);
                }
                if (ro) {
                    ro.disconnect();
                }
                window.removeEventListener('resize', onResize);
                orbitBlast.dispose();
                renderer.dispose();
                if (host.contains(renderer.domElement)) {
                    host.removeChild(renderer.domElement);
                }
            }
        };
    }

    /**
     * Túnel subterráneo: galería con rieles, polvo, luces móviles, cableado.
     */
    function mountTunnel(viewport, activity, theme, THREE) {
        if (activity && activity.subject_slug === 'algebra') {
            return mountBlastFace(viewport, activity, theme, THREE);
        }
        var host = viewport;
        var dim0 = viewportDimensions(host);
        var w = dim0.w;
        var h = dim0.h;

        var scene = new THREE.Scene();
        /* Niebla lineal + fondo más claro: legibilidad de paredes, rieles y suelo (no “universo”). */
        var fogCol = 0x2d3848;
        scene.fog = new THREE.Fog(fogCol, 14, 88);
        scene.background = new THREE.Color(fogCol);

        var camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 220);
        camera.position.set(0, 2.2, 14);
        scene.add(camera);

        var renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.22;
        renderer.domElement.style.display = 'block';
        host.appendChild(renderer.domElement);

        var amb = new THREE.AmbientLight(0xa0b0c8, 0.62);
        scene.add(amb);
        scene.add(new THREE.HemisphereLight(0x8899aa, 0x3a3020, 0.5));

        var spot = new THREE.SpotLight(theme.warm, 4.2, 90, 0.42, 0.32, 1);
        spot.position.set(4, 8, 10);
        spot.target.position.set(0, -2, -20);
        spot.castShadow = true;
        scene.add(spot);
        scene.add(spot.target);

        var fill = new THREE.PointLight(theme.cool, 1.45, 50);
        fill.position.set(-4, 2, -6);
        scene.add(fill);

        /* Luz tipo lámpara de casco: ilumina el frente al avanzar la cámara. */
        var headlamp = new THREE.SpotLight(0xfff4e0, 5.5, 42, 0.72, 0.38, 1);
        headlamp.position.set(0, 0.12, 0.22);
        headlamp.castShadow = true;
        var headTarget = new THREE.Object3D();
        headTarget.position.set(0, -0.18, -1);
        camera.add(headlamp);
        camera.add(headTarget);
        headlamp.target = headTarget;

        var tunnel = new THREE.Mesh(
            new THREE.CylinderGeometry(5.2, 5.2, 90, 48, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0x4a5668,
                roughness: 0.86,
                metalness: 0.1,
                emissive: 0x1c2435,
                emissiveIntensity: 0.48,
                side: THREE.BackSide,
                flatShading: false
            })
        );
        tunnel.rotation.z = Math.PI / 2;
        tunnel.receiveShadow = true;
        scene.add(tunnel);

        var floor = new THREE.Mesh(
            new THREE.PlaneGeometry(11, 96),
            new THREE.MeshStandardMaterial({color: 0x4a3f32, roughness: 0.94, metalness: 0.04})
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -3.26, 0);
        floor.receiveShadow = true;
        scene.add(floor);

        var railMat = new THREE.MeshStandardMaterial({color: 0x4a5568, metalness: 0.55, roughness: 0.42});
        var ri;
        for (ri = -1; ri <= 1; ri += 2) {
            var rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 85), railMat);
            rail.position.set(ri * 0.95, -3.15, 0);
            rail.castShadow = true;
            scene.add(rail);
        }

        var tieG = new THREE.BoxGeometry(1.85, 0.09, 0.38);
        var tieM = new THREE.MeshStandardMaterial({color: 0x3d3428, roughness: 0.9});
        for (var t = 0; t < 36; t++) {
            var tie = new THREE.Mesh(tieG, tieM);
            tie.position.set(0, -3.22, -40 + t * 2.1);
            tie.receiveShadow = true;
            scene.add(tie);
        }

        var cable = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 78, 8),
            new THREE.MeshStandardMaterial({color: 0x2a2a2a, metalness: 0.6, roughness: 0.4})
        );
        cable.rotation.z = Math.PI / 2;
        cable.position.set(0, 3.5, 0);
        scene.add(cable);

        /* Arcos de sostén y durmientes laterales */
        var archMat = new THREE.MeshStandardMaterial({color: 0x4a3d32, roughness: 0.88, metalness: 0.05});
        var archZ;
        for (archZ = -38; archZ < 38; archZ += 6) {
            var leg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 4.4, 0.38), archMat);
            leg.position.set(-3.85, -1, archZ);
            scene.add(leg);
            var leg2 = leg.clone();
            leg2.position.x = 3.85;
            scene.add(leg2);
            var beam = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.28, 0.45), archMat);
            beam.position.set(0, 1.15, archZ);
            scene.add(beam);
        }

        /* Vagoneta sobre rieles */
        var cartGrp = new THREE.Group();
        var cBody = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.75, 2.4),
            new THREE.MeshStandardMaterial({color: 0x6b4423, roughness: 0.75, metalness: 0.1})
        );
        cBody.position.y = 0.42;
        cartGrp.add(cBody);
        var wMat = new THREE.MeshStandardMaterial({color: 0x2a2a2a, metalness: 0.65, roughness: 0.35});
        var wx;
        var wheelPos = [[-0.58, 0.22, -0.85], [0.58, 0.22, -0.85], [-0.58, 0.22, 0.85], [0.58, 0.22, 0.85]];
        for (wx = 0; wx < 4; wx++) {
            var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 12), wMat);
            wh.rotation.z = Math.PI / 2;
            wh.position.set(wheelPos[wx][0], wheelPos[wx][1], wheelPos[wx][2]);
            cartGrp.add(wh);
        }
        cartGrp.position.set(0, -3.06, -12);
        scene.add(cartGrp);

        /* Luces colgantes por tramo */
        var li;
        for (li = 0; li < 9; li++) {
            var hang = new THREE.PointLight(theme.warm, 0.5, 24);
            hang.position.set((li % 2 === 0 ? 1.9 : -1.9), 3.1, -36 + li * 8.5);
            scene.add(hang);
        }

        /* Filtración: gotas */
        var dripCount = 120;
        var dripGeom = new THREE.BufferGeometry();
        var dpos = new Float32Array(dripCount * 3);
        for (i = 0; i < dripCount; i++) {
            dpos[i * 3] = (Math.random() - 0.5) * 3.8;
            dpos[i * 3 + 1] = Math.random() * 4;
            dpos[i * 3 + 2] = -42 + Math.random() * 84;
        }
        dripGeom.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
        var dripMat = new THREE.PointsMaterial({
            color: 0x5a9cc8,
            size: 0.04,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        var drips = new THREE.Points(dripGeom, dripMat);
        scene.add(drips);

        var bolt;
        for (var b = 0; b < 24; b++) {
            bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.1, 0.25, 6),
                new THREE.MeshStandardMaterial({color: 0x555555, metalness: 0.7, roughness: 0.35})
            );
            bolt.rotation.z = Math.PI / 2;
            bolt.position.set(Math.sin(b) * 4.5, -1 + (b % 4) * 1.2, -35 + b * 2.8);
            scene.add(bolt);
        }

        var dustCount = 72;
        var dustGeom = new THREE.BufferGeometry();
        var pos = new Float32Array(dustCount * 3);
        var i;
        var seed = theme.hash || 1;
        for (i = 0; i < dustCount; i++) {
            var ix = i * 3;
            pos[ix] = (Math.sin(seed + i * 0.7) * 3.8);
            pos[ix + 1] = (Math.cos(seed + i * 0.3) * 2.5);
            pos[ix + 2] = -50 + (i / dustCount) * 90 + (i % 7) * 0.5;
        }
        dustGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        var dustMat = new THREE.PointsMaterial({
            color: 0x5c6570,
            size: 0.022,
            transparent: true,
            opacity: 0.09,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        var dust = new THREE.Points(dustGeom, dustMat);
        scene.add(dust);

        var ang = 0;
        var tunnelLook = new THREE.Vector3(0, -0.5, -22);
        var orbitTunnel = attachTrackpadOrbit(THREE, renderer.domElement, camera, tunnelLook, {
            theta: 0.12,
            phi: 0.28,
            radius: 16,
            minR: 6,
            maxR: 48,
            minPhi: 0.08,
            maxPhi: 1.25
        });

        var animId;
        var running = true;
        var start = performance.now();
        function loop(now) {
            if (!running) {
                return;
            }
            animId = requestAnimationFrame(loop);
            var tsec = (now - start) * 0.001;
            ang += 0.0022;
            spot.intensity = 2.2 + Math.sin(tsec * 2.1) * 0.35;
            fill.intensity = 0.75 + Math.sin(tsec * 1.7) * 0.15;
            headlamp.intensity = 5 + Math.sin(tsec * 3.1) * 0.4;
            dust.rotation.y = tsec * 0.02;
            var positions = dust.geometry.attributes.position.array;
            for (i = 0; i < dustCount; i++) {
                positions[i * 3 + 2] += 0.015 + Math.sin(i + tsec) * 0.002;
                if (positions[i * 3 + 2] > 40) {
                    positions[i * 3 + 2] = -45;
                }
            }
            dust.geometry.attributes.position.needsUpdate = true;
            cartGrp.position.z = -38 + ((tsec * 2.2) % 76);
            cartGrp.children.forEach(function(ch, cidx) {
                if (cidx > 0) {
                    ch.rotation.x += 0.14;
                }
            });
            var darr = drips.geometry.attributes.position.array;
            for (i = 0; i < dripCount; i++) {
                darr[i * 3 + 1] -= 0.045;
                if (darr[i * 3 + 1] < -3.5) {
                    darr[i * 3 + 1] = 4 + Math.random() * 0.5;
                }
            }
            drips.geometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
        }
        animId = requestAnimationFrame(loop);

        function onResize() {
            var dim = viewportDimensions(host);
            w = dim.w;
            h = dim.h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);
        var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function() {
            onResize();
        }) : null;
        if (ro) {
            ro.observe(host);
        }

        return {
            dispose: function() {
                running = false;
                if (animId) {
                    cancelAnimationFrame(animId);
                }
                if (ro) {
                    ro.disconnect();
                }
                window.removeEventListener('resize', onResize);
                orbitTunnel.dispose();
                renderer.dispose();
                if (host.contains(renderer.domElement)) {
                    host.removeChild(renderer.domElement);
                }
            }
        };
    }

    /**
     * Rajo a cielo abierto: plataformas, polvo, camiones, sol.
     */
    function mountPit(viewport, activity, theme, THREE) {
        var host = viewport;
        var dim0 = viewportDimensions(host);
        var w = dim0.w;
        var h = dim0.h;

        var scene = new THREE.Scene();
        var fogCol = 0xb4bcc8;
        scene.fog = new THREE.Fog(fogCol, 42, 260);
        var gradCv = document.createElement('canvas');
        gradCv.width = 8;
        gradCv.height = 256;
        var gcx = gradCv.getContext('2d');
        var gLin = gcx.createLinearGradient(0, 0, 0, 256);
        gLin.addColorStop(0, '#dce4ee');
        gLin.addColorStop(0.45, '#aeb8c8');
        gLin.addColorStop(1, '#8a9098');
        gcx.fillStyle = gLin;
        gcx.fillRect(0, 0, 8, 256);
        var skyTex = new THREE.CanvasTexture(gradCv);
        scene.background = skyTex;

        var camera = new THREE.PerspectiveCamera(46, w / h, 0.5, 600);
        camera.position.set(40, 24, 44);

        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.style.display = 'block';
        host.appendChild(renderer.domElement);

        var sun = new THREE.DirectionalLight(0xf2f6ff, 1.25);
        sun.position.set(-48, 96, 36);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 10;
        sun.shadow.camera.far = 240;
        sun.shadow.camera.left = -90;
        sun.shadow.camera.right = 90;
        sun.shadow.camera.top = 90;
        sun.shadow.camera.bottom = -90;
        scene.add(sun);
        scene.add(new THREE.HemisphereLight(0xc8d0dc, 0x6a6058, 0.55));
        scene.add(new THREE.AmbientLight(0x9aa4b0, 0.35));

        var ground = new THREE.Mesh(
            new THREE.PlaneGeometry(340, 340),
            new THREE.MeshStandardMaterial({color: 0x8f9096, roughness: 0.94, metalness: 0.03})
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.06;
        ground.receiveShadow = true;
        scene.add(ground);

        var linesGroup = new THREE.Group();
        linesGroup.name = 'ml-contours';
        scene.add(linesGroup);

        /* Curvas de nivel en terreno (estilo plano / MDT didáctico). */
        var contourMat = new THREE.LineBasicMaterial({color: 0x1a4a8c, transparent: true, opacity: 0.92});
        var cr;
        for (cr = 38; cr <= 118; cr += 14) {
            var pts = [];
            var seg = 72;
            var sgi;
            for (sgi = 0; sgi <= seg; sgi++) {
                var a = (sgi / seg) * Math.PI * 2;
                pts.push(new THREE.Vector3(Math.cos(a) * cr, 0.04, Math.sin(a) * cr));
            }
            var cg = new THREE.BufferGeometry().setFromPoints(pts);
            linesGroup.add(new THREE.LineLoop(cg, contourMat));
        }

        var equipGroup = new THREE.Group();
        equipGroup.name = 'ml-equipment';
        scene.add(equipGroup);

        /* Excavadora / palas (simplificada) */
        var excav = new THREE.Group();
        var exBase = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.2, 5),
            new THREE.MeshStandardMaterial({color: 0xd4a574, roughness: 0.85})
        );
        exBase.position.y = 0.6;
        exBase.castShadow = true;
        excav.add(exBase);
        var exCab = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 2, 2.4),
            new THREE.MeshStandardMaterial({color: 0xffcc66, metalness: 0.2, roughness: 0.6})
        );
        exCab.position.set(0, 2.2, 0.5);
        exCab.castShadow = true;
        excav.add(exCab);
        var exBoom = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.55, 14),
            new THREE.MeshStandardMaterial({color: 0xaaaaaa, metalness: 0.45, roughness: 0.4})
        );
        exBoom.position.set(1.2, 4.5, 5);
        exBoom.rotation.x = -0.35;
        exBoom.castShadow = true;
        excav.add(exBoom);
        var exBucket = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1, 2.2),
            new THREE.MeshStandardMaterial({color: 0x555555, metalness: 0.5, roughness: 0.5})
        );
        exBucket.position.set(2.5, 2.8, 14);
        exBucket.rotation.x = 0.25;
        exBucket.castShadow = true;
        excav.add(exBucket);
        excav.position.set(24, 0.2, 20);
        equipGroup.add(excav);

        var pitSolidMeshes = [];
        pitSolidMeshes.push(ground);

        var pitWall = new THREE.MeshStandardMaterial({
            color: 0x6d6864,
            roughness: 0.93,
            metalness: 0.05,
            side: THREE.DoubleSide,
            flatShading: false
        });
        var benchLineMat = new THREE.LineBasicMaterial({color: 0x2563eb, transparent: true, opacity: 0.95});
        var bermLineMat = new THREE.LineBasicMaterial({color: 0x60a5fa, transparent: true, opacity: 0.88});

        var tier;
        for (var level = 0; level < 8; level++) {
            var r0 = 26 - level * 2.8;
            var r1 = 24 - level * 2.8;
            if (r1 < 3) {
                break;
            }
            tier = new THREE.Mesh(
                new THREE.CylinderGeometry(r0, r1, 2.8, 40, 1, true),
                pitWall
            );
            tier.position.y = level * 2.6;
            tier.castShadow = true;
            tier.receiveShadow = true;
            scene.add(tier);
            /* Borde de banco = curva de nivel (referencia tipo plano). */
            var bpts = [];
            var bseg = 64;
            var bi;
            for (bi = 0; bi <= bseg; bi++) {
                var ba = (bi / bseg) * Math.PI * 2;
                bpts.push(new THREE.Vector3(Math.cos(ba) * r0, level * 2.6 + 1.38, Math.sin(ba) * r0));
            }
            linesGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(bpts), benchLineMat));
            /* Berma: anillo interior más claro (solo línea). */
            var rBerm = r0 - 1.1;
            if (rBerm > 2.5) {
                var bpts2 = [];
                for (bi = 0; bi <= bseg; bi++) {
                    ba = (bi / bseg) * Math.PI * 2;
                    bpts2.push(new THREE.Vector3(Math.cos(ba) * rBerm, level * 2.6 + 1.4, Math.sin(ba) * rBerm));
                }
                linesGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(bpts2), bermLineMat));
            }
            pitSolidMeshes.push(tier);
        }

        /* Rampa de acceso (volumen oscuro, más legible que el resto). */
        var rampMesh = new THREE.Mesh(
            new THREE.BoxGeometry(5.5, 0.45, 58),
            new THREE.MeshStandardMaterial({color: 0x2a2826, roughness: 0.94, metalness: 0.06})
        );
        rampMesh.rotation.set(-0.38, 0.72, 0.05);
        rampMesh.position.set(40, 12, 36);
        rampMesh.castShadow = true;
        rampMesh.receiveShadow = true;
        scene.add(rampMesh);
        pitSolidMeshes.push(rampMesh);

        var road = new THREE.Mesh(
            new THREE.RingGeometry(10, 14, 64),
            new THREE.MeshStandardMaterial({color: 0x2c2c2c, roughness: 0.9})
        );
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.4;
        road.receiveShadow = true;
        road.castShadow = true;
        scene.add(road);
        pitSolidMeshes.push(road);

        var truckMat = new THREE.MeshStandardMaterial({color: 0xff6b35, metalness: 0.3, roughness: 0.65});
        var truckMat2 = new THREE.MeshStandardMaterial({color: 0xe8d44d, metalness: 0.25, roughness: 0.7});
        var trucks = [];
        for (var tr = 0; tr < 6; tr++) {
            var grp = new THREE.Group();
            var body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 4), tr % 2 === 0 ? truckMat : truckMat2);
            body.position.y = 0.8;
            body.castShadow = true;
            grp.add(body);
            grp.position.set(Math.cos(tr * 1.02) * (14 + (tr % 3)), 1, Math.sin(tr * 1.02) * (14 + (tr % 3)));
            grp.rotation.y = tr * 1.05;
            equipGroup.add(grp);
            trucks.push(grp);
        }

        var dustP = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({color: 0xc9b8a0, size: 0.14, transparent: true, opacity: 0.35})
        );
        var dc = 300;
        var dpos = new Float32Array(dc * 3);
        for (var d = 0; d < dc; d++) {
            dpos[d * 3] = (Math.random() - 0.5) * 50;
            dpos[d * 3 + 1] = Math.random() * 25;
            dpos[d * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        dustP.geometry.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
        scene.add(dustP);

        var pitCenter = new THREE.Vector3(0, 9, 0);
        var orbitPit = attachTrackpadOrbit(THREE, renderer.domElement, camera, pitCenter, {
            theta: 0.95,
            phi: 0.52,
            radius: 52,
            minR: 22,
            maxR: 120,
            minPhi: 0.18,
            maxPhi: 1.38
        });

        pitSolidMeshes.push(equipGroup);

        var pt = theme.pitTools || {};
        var measureMode = false;
        var measurePoints = [];
        var measureGroup = new THREE.Group();
        scene.add(measureGroup);
        var raycaster = new THREE.Raycaster();
        var ndc = new THREE.Vector2();
        var camTween = null;
        var ptrDown = {x: 0, y: 0};

        function clearMeasureVisual() {
            while (measureGroup.children.length) {
                var ch = measureGroup.children[0];
                measureGroup.remove(ch);
                if (ch.geometry) {
                    ch.geometry.dispose();
                }
                if (ch.material) {
                    if (Array.isArray(ch.material)) {
                        ch.material.forEach(function(m) {
                            m.dispose();
                        });
                    } else {
                        ch.material.dispose();
                    }
                }
            }
        }

        var toolbar = document.createElement('div');
        toolbar.className = 'ml-3d-toolbar';
        toolbar.setAttribute('role', 'toolbar');

        function addToolButton(label, act, extraClass) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'ml-3d-toolbtn' + (extraClass ? ' ' + extraClass : '');
            b.textContent = label || '';
            b.setAttribute('data-act', act);
            return b;
        }

        var row1 = document.createElement('div');
        row1.className = 'ml-3d-toolbar__row';
        row1.appendChild(addToolButton(pt.presetIso || 'ISO', 'preset-iso'));
        row1.appendChild(addToolButton(pt.presetPlan || 'Planta', 'preset-plan'));
        row1.appendChild(addToolButton(pt.presetSection || 'Perfil', 'preset-section'));
        var measureBtn = addToolButton(pt.measureToggle || 'Medir', 'measure', 'ml-3d-toolbtn--accent');
        row1.appendChild(measureBtn);
        row1.appendChild(addToolButton(pt.clearMeasure || 'Borrar medición', 'clear-measure'));

        var row2 = document.createElement('div');
        row2.className = 'ml-3d-toolbar__row';
        var labCont = document.createElement('label');
        labCont.className = 'ml-3d-tool-check';
        var chkCont = document.createElement('input');
        chkCont.type = 'checkbox';
        chkCont.checked = true;
        chkCont.setAttribute('data-act', 'toggle-contours');
        labCont.appendChild(chkCont);
        labCont.appendChild(document.createTextNode(' ' + (pt.layerContours || 'Contornos')));
        row2.appendChild(labCont);
        var labEq = document.createElement('label');
        labEq.className = 'ml-3d-tool-check';
        var chkEq = document.createElement('input');
        chkEq.type = 'checkbox';
        chkEq.checked = true;
        chkEq.setAttribute('data-act', 'toggle-equip');
        labEq.appendChild(chkEq);
        labEq.appendChild(document.createTextNode(' ' + (pt.layerEquip || 'Equipos')));
        row2.appendChild(labEq);

        var readout = document.createElement('span');
        readout.className = 'ml-3d-toolbar__readout';
        readout.setAttribute('aria-live', 'polite');
        row2.appendChild(readout);

        var hintEl = document.createElement('p');
        hintEl.className = 'ml-3d-toolbar__hint';
        toolbar.appendChild(row1);
        toolbar.appendChild(row2);
        toolbar.appendChild(hintEl);
        host.appendChild(toolbar);

        function startPreset(angles) {
            camTween = {
                a: orbitPit.getAngles(),
                b: angles,
                t0: performance.now(),
                dur: 560
            };
        }

        function onToolbarClick(ev) {
            var t = ev.target;
            var act = t.getAttribute && t.getAttribute('data-act');
            if (!act) {
                return;
            }
            if (act === 'preset-iso') {
                startPreset({theta: 0.95, phi: 0.52, radius: 52});
            } else if (act === 'preset-plan') {
                startPreset({theta: 0.88, phi: 0.22, radius: 78});
            } else if (act === 'preset-section') {
                startPreset({theta: 0.06, phi: 0.38, radius: 56});
            } else if (act === 'measure') {
                measureMode = !measureMode;
                orbitPit.setOrbitDragEnabled(!measureMode);
                measureBtn.classList.toggle('ml-3d-toolbtn--on', measureMode);
                hintEl.textContent = measureMode ? (pt.measureHint || '') : '';
            } else if (act === 'clear-measure') {
                measurePoints = [];
                clearMeasureVisual();
                readout.textContent = '';
            }
        }

        function onToolbarChange(ev) {
            var inp = ev.target;
            var act = inp.getAttribute && inp.getAttribute('data-act');
            if (!act || inp.type !== 'checkbox') {
                return;
            }
            if (act === 'toggle-contours') {
                linesGroup.visible = inp.checked;
            } else if (act === 'toggle-equip') {
                equipGroup.visible = inp.checked;
            }
        }

        toolbar.addEventListener('click', onToolbarClick);
        toolbar.addEventListener('change', onToolbarChange);

        function onPitPointerDown(e) {
            ptrDown.x = e.clientX;
            ptrDown.y = e.clientY;
        }

        function onPitPointerUp(e) {
            if (!measureMode || e.button !== 0) {
                return;
            }
            var dx = e.clientX - ptrDown.x;
            var dy = e.clientY - ptrDown.y;
            if (dx * dx + dy * dy > 100) {
                return;
            }
            var rect = renderer.domElement.getBoundingClientRect();
            ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(ndc, camera);
            var hits = raycaster.intersectObjects(pitSolidMeshes, true);
            if (!hits.length) {
                return;
            }
            var hitp = hits[0].point.clone();
            if (measurePoints.length >= 2) {
                measurePoints = [];
                clearMeasureVisual();
                readout.textContent = '';
            }
            measurePoints.push(hitp);
            var mk = new THREE.Mesh(
                new THREE.SphereGeometry(0.42, 14, 14),
                new THREE.MeshStandardMaterial({color: 0xf97316, emissive: 0x442208, roughness: 0.55, metalness: 0.15})
            );
            mk.position.copy(hitp);
            measureGroup.add(mk);
            if (measurePoints.length === 2) {
                var g = new THREE.BufferGeometry().setFromPoints([measurePoints[0], measurePoints[1]]);
                var ln = new THREE.Line(g, new THREE.LineBasicMaterial({color: 0xf97316}));
                measureGroup.add(ln);
                var dist = measurePoints[0].distanceTo(measurePoints[1]);
                readout.textContent = (pt.distLabel || 'Distancia') + ': ' + (Math.round(dist * 10) / 10) + ' m';
            }
        }

        renderer.domElement.addEventListener('pointerdown', onPitPointerDown);
        renderer.domElement.addEventListener('pointerup', onPitPointerUp);

        var camAng = 0;
        var pitAnim;
        var pitRunning = true;
        function loop(now) {
            if (!pitRunning) {
                return;
            }
            pitAnim = requestAnimationFrame(loop);
            now = now != null ? now : performance.now();
            camAng += 0.0012;
            if (camTween) {
                var u = Math.min(1, (now - camTween.t0) / camTween.dur);
                u = u * u * (3 - 2 * u);
                var A = camTween.a;
                var B = camTween.b;
                orbitPit.setAngles(
                    A.theta + (B.theta - A.theta) * u,
                    A.phi + (B.phi - A.phi) * u,
                    A.radius + (B.radius - A.radius) * u
                );
                if (u >= 1) {
                    camTween = null;
                }
            } else if (!measureMode) {
                orbitPit.spinIdle(0.00018);
            }
            trucks.forEach(function(tk, idx) {
                tk.rotation.y += 0.008 + idx * 0.001;
                tk.position.y = 1 + Math.sin(camAng * 3 + idx) * 0.15;
            });
            excav.rotation.y = Math.sin(camAng * 1.8) * 0.45;
            exBoom.rotation.x = -0.35 + Math.sin(camAng * 2.4) * 0.12;
            exBucket.rotation.x = 0.25 + Math.sin(camAng * 2.4 + 0.5) * 0.08;
            var dposArr = dustP.geometry.attributes.position.array;
            for (var di = 0; di < dc; di++) {
                dposArr[di * 3 + 1] += 0.02 + Math.sin(di * 0.1 + camAng * 5) * 0.008;
                if (dposArr[di * 3 + 1] > 35) {
                    dposArr[di * 3 + 1] = 0;
                }
            }
            dustP.geometry.attributes.position.needsUpdate = true;
            dustP.rotation.y += 0.0012;
            renderer.render(scene, camera);
        }
        pitAnim = requestAnimationFrame(loop);

        function onResize() {
            var dim = viewportDimensions(host);
            w = dim.w;
            h = dim.h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);
        var roPit = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function() {
            onResize();
        }) : null;
        if (roPit) {
            roPit.observe(host);
        }

        return {
            dispose: function() {
                pitRunning = false;
                if (pitAnim) {
                    cancelAnimationFrame(pitAnim);
                }
                if (roPit) {
                    roPit.disconnect();
                }
                window.removeEventListener('resize', onResize);
                toolbar.removeEventListener('click', onToolbarClick);
                toolbar.removeEventListener('change', onToolbarChange);
                renderer.domElement.removeEventListener('pointerdown', onPitPointerDown);
                renderer.domElement.removeEventListener('pointerup', onPitPointerUp);
                clearMeasureVisual();
                orbitPit.dispose();
                skyTex.dispose();
                renderer.dispose();
                if (host.contains(toolbar)) {
                    host.removeChild(toolbar);
                }
                if (host.contains(renderer.domElement)) {
                    host.removeChild(renderer.domElement);
                }
            }
        };
    }

    /**
     * Rajo: ciclo perforación → carguío → transporte → botadero (terreno cálido, rampa animada, etapas etiquetadas).
     */
    function mountPitCycle(viewport, activity, theme, THREE) {
        var host = viewport;
        var dim0 = viewportDimensions(host);
        var w = dim0.w;
        var h = dim0.h;

        function makeZoneSprite(txt, bg, fg) {
            var cv = document.createElement('canvas');
            cv.width = 640;
            cv.height = 140;
            var cx = cv.getContext('2d');
            cx.fillStyle = bg;
            cx.fillRect(0, 0, 640, 140);
            cx.strokeStyle = 'rgba(255,255,255,0.35)';
            cx.lineWidth = 4;
            cx.strokeRect(2, 2, 636, 136);
            cx.fillStyle = fg || '#ffffff';
            cx.font = 'bold 38px system-ui,Segoe UI,sans-serif';
            cx.textAlign = 'center';
            cx.textBaseline = 'middle';
            cx.fillText(txt, 320, 70);
            var tex = new THREE.CanvasTexture(cv);
            var spr = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true, depthTest: false}));
            spr.scale.set(34, 7.5, 1);
            return spr;
        }

        function makeHaulTruck(bodyCol) {
            var g = new THREE.Group();
            var mat = new THREE.MeshStandardMaterial({color: bodyCol, metalness: 0.28, roughness: 0.68});
            var cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 3), mat);
            cab.position.set(0, 1.4, 2.2);
            cab.castShadow = true;
            g.add(cab);
            var bed = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 7), mat);
            bed.position.set(0, 1.1, -2.5);
            bed.castShadow = true;
            g.add(bed);
            var w1;
            for (w1 = 0; w1 < 4; w1++) {
                var wh = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.55, 0.55, 0.4, 10),
                    new THREE.MeshStandardMaterial({color: 0x222222, roughness: 0.9})
                );
                wh.rotation.z = Math.PI / 2;
                wh.position.set(w1 % 2 === 0 ? -1.4 : 1.4, 0.35, (w1 < 2 ? 3.5 : -4.2));
                wh.castShadow = true;
                g.add(wh);
            }
            return g;
        }

        function spiralPos(u) {
            u = ((u % 1) + 1) % 1;
            var turns = 5.5 * Math.PI * 2;
            var ang = u * turns;
            var r = 34 - u * 26;
            var y = u * 15.5 + 0.35;
            return new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r);
        }

        function spiralTan(u) {
            var e = 0.004;
            var p0 = spiralPos(u);
            var p1 = spiralPos(u + e);
            return p1.clone().sub(p0).normalize();
        }

        var scene = new THREE.Scene();
        var fogC = 0xc4b8a8;
        scene.fog = new THREE.Fog(fogC, 48, 280);
        var skyCv = document.createElement('canvas');
        skyCv.width = 8;
        skyCv.height = 256;
        var skx = skyCv.getContext('2d');
        var skg = skx.createLinearGradient(0, 0, 0, 256);
        skg.addColorStop(0, '#7eb8e8');
        skg.addColorStop(0.42, '#d4c4a8');
        skg.addColorStop(1, '#a89878');
        skx.fillStyle = skg;
        skx.fillRect(0, 0, 8, 256);
        var skyTex = new THREE.CanvasTexture(skyCv);
        scene.background = skyTex;

        var camera = new THREE.PerspectiveCamera(46, w / h, 0.5, 600);
        camera.position.set(44, 28, 48);

        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.domElement.style.display = 'block';
        host.appendChild(renderer.domElement);

        var sun = new THREE.DirectionalLight(0xfff4e0, 1.28);
        sun.position.set(-52, 102, 42);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 10;
        sun.shadow.camera.far = 260;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        scene.add(sun);
        scene.add(new THREE.HemisphereLight(0xd8e4f0, 0x7a6a58, 0.52));
        scene.add(new THREE.AmbientLight(0x9a9088, 0.38));

        var ground = new THREE.Mesh(
            new THREE.PlaneGeometry(360, 360),
            new THREE.MeshStandardMaterial({color: 0x9d907c, roughness: 0.94, metalness: 0.04})
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        scene.add(ground);

        var rockWall = new THREE.MeshStandardMaterial({
            color: 0x7a6b5c,
            roughness: 0.92,
            metalness: 0.06,
            side: THREE.DoubleSide
        });
        var pitSolidMeshes = [];
        pitSolidMeshes.push(ground);

        var linesGroup = new THREE.Group();
        linesGroup.name = 'ml-contours-cycle';
        scene.add(linesGroup);
        var contourMat = new THREE.LineBasicMaterial({color: 0x3d5a8a, transparent: true, opacity: 0.75});
        var cr;
        for (cr = 36; cr <= 110; cr += 16) {
            var pts = [];
            var seg = 64;
            var sgi;
            for (sgi = 0; sgi <= seg; sgi++) {
                var a = (sgi / seg) * Math.PI * 2;
                pts.push(new THREE.Vector3(Math.cos(a) * cr, 0.06, Math.sin(a) * cr));
            }
            linesGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), contourMat));
        }

        var lv;
        for (lv = 0; lv < 7; lv++) {
            var r0 = 27 - lv * 2.85;
            var r1 = 24.5 - lv * 2.85;
            if (r1 < 3) {
                break;
            }
            var tier = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, 2.7, 44, 1, true), rockWall);
            tier.position.y = lv * 2.55;
            tier.castShadow = true;
            tier.receiveShadow = true;
            scene.add(tier);
            pitSolidMeshes.push(tier);
        }

        var rampMat = new THREE.MeshStandardMaterial({color: 0x4a4238, roughness: 0.93, metalness: 0.05});
        var ri;
        for (ri = 0; ri < 28; ri++) {
            var uR = ri / 28;
            var pR = spiralPos(uR);
            var segR = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 7), rampMat);
            segR.position.copy(pR);
            var tn = spiralTan(uR);
            segR.lookAt(pR.clone().add(tn));
            segR.rotation.x = -0.12;
            segR.castShadow = true;
            segR.receiveShadow = true;
            scene.add(segR);
            pitSolidMeshes.push(segR);
        }

        var equipGroup = new THREE.Group();
        equipGroup.name = 'ml-equipment-cycle';
        scene.add(equipGroup);

        /* Perforación: dos perforadoras simplificadas */
        var drillMat = new THREE.MeshStandardMaterial({color: 0xf5c542, roughness: 0.55, metalness: 0.22});
        var mastMat = new THREE.MeshStandardMaterial({color: 0xddd8d0, metalness: 0.4, roughness: 0.45});
        var dxi;
        for (dxi = 0; dxi < 2; dxi++) {
            var dg = new THREE.Group();
            var baseD = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 6), drillMat);
            baseD.position.y = 0.6;
            baseD.castShadow = true;
            dg.add(baseD);
            var mast = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 11), mastMat);
            mast.position.set(1.2, 6.5, 0);
            mast.castShadow = true;
            dg.add(mast);
            dg.position.set(-26 + dxi * 7, 8.2, 18);
            dg.rotation.y = 0.4 + dxi * 0.2;
            equipGroup.add(dg);
        }

        var dustDrill = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({color: 0xe8e0d8, size: 0.22, transparent: true, opacity: 0.55})
        );
        var nd = 80;
        var darr = new Float32Array(nd * 3);
        for (var di = 0; di < nd; di++) {
            darr[di * 3] = -24 + Math.random() * 6;
            darr[di * 3 + 1] = 2 + Math.random() * 4;
            darr[di * 3 + 2] = 16 + Math.random() * 5;
        }
        dustDrill.geometry.setAttribute('position', new THREE.BufferAttribute(darr, 3));
        scene.add(dustDrill);

        /* Carguío: excavadora + cola de camiones */
        var exG = new THREE.Group();
        var exBase = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.3, 5.5), new THREE.MeshStandardMaterial({color: 0xe8b84a, roughness: 0.82}));
        exBase.position.y = 0.65;
        exBase.castShadow = true;
        exG.add(exBase);
        var exBoom = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 13), mastMat);
        exBoom.position.set(1.4, 4.8, 4.5);
        exBoom.rotation.x = -0.42;
        exBoom.castShadow = true;
        exG.add(exBoom);
        var exBk = new THREE.Mesh(new THREE.BoxGeometry(2, 1.1, 2.4), new THREE.MeshStandardMaterial({color: 0x444444, metalness: 0.45, roughness: 0.5}));
        exBk.position.set(2.2, 3.2, 12.5);
        exBk.rotation.x = 0.2;
        exBk.castShadow = true;
        exG.add(exBk);
        exG.position.set(24, 2.4, 22);
        exG.rotation.y = -0.9;
        equipGroup.add(exG);

        var waitTruck = makeHaulTruck(0xff7722);
        waitTruck.position.set(18, 2.2, 28);
        waitTruck.rotation.y = 2.1;
        equipGroup.add(waitTruck);

        /* Botadero */
        var dumpPile = new THREE.Mesh(
            new THREE.ConeGeometry(7, 4, 12),
            new THREE.MeshStandardMaterial({color: 0x8a8580, roughness: 0.95})
        );
        dumpPile.position.set(-22, 2, -28);
        dumpPile.castShadow = true;
        scene.add(dumpPile);
        pitSolidMeshes.push(dumpPile);

        var dumpTruck = makeHaulTruck(0xff9933);
        dumpTruck.position.set(-26, 2.2, -24);
        dumpTruck.rotation.y = 0.8;
        var dumpBed = dumpTruck.children[1];
        equipGroup.add(dumpTruck);

        /* Etiquetas de etapa */
        var s1 = makeZoneSprite('PERFORACIÓN', '#d4a017', '#1a1408');
        s1.position.set(-24, 18, 22);
        scene.add(s1);
        var s2 = makeZoneSprite('CARGUÍO', '#e07020', '#ffffff');
        s2.position.set(28, 14, 26);
        scene.add(s2);
        var s3 = makeZoneSprite('TRANSPORTE', '#2a6ebd', '#ffffff');
        s3.position.set(8, 22, -8);
        scene.add(s3);
        var s4 = makeZoneSprite('BOTADERO', '#3d8c47', '#ffffff');
        s4.position.set(-24, 12, -32);
        scene.add(s4);

        /* Camiones en rampa */
        var roadTrucks = [];
        var t0 = makeHaulTruck(0xff6600);
        var t1 = makeHaulTruck(0xffaa33);
        var t2 = makeHaulTruck(0xff6600);
        roadTrucks.push({g: t0, u: 0.05});
        roadTrucks.push({g: t1, u: 0.38});
        roadTrucks.push({g: t2, u: 0.72});
        roadTrucks.forEach(function(rt) {
            equipGroup.add(rt.g);
        });

        var pitCenter = new THREE.Vector3(0, 10, 0);
        var orbitPit = attachTrackpadOrbit(THREE, renderer.domElement, camera, pitCenter, {
            theta: 0.88,
            phi: 0.5,
            radius: 58,
            minR: 24,
            maxR: 130,
            minPhi: 0.16,
            maxPhi: 1.36
        });

        pitSolidMeshes.push(equipGroup);

        var pt = theme.pitTools || {};
        var measureMode = false;
        var measurePoints = [];
        var measureGroup = new THREE.Group();
        scene.add(measureGroup);
        var raycaster = new THREE.Raycaster();
        var ndc = new THREE.Vector2();
        var camTween = null;
        var ptrDown = {x: 0, y: 0};

        function clearMeasureVisual() {
            while (measureGroup.children.length) {
                var ch = measureGroup.children[0];
                measureGroup.remove(ch);
                if (ch.geometry) {
                    ch.geometry.dispose();
                }
                if (ch.material) {
                    if (Array.isArray(ch.material)) {
                        ch.material.forEach(function(m) {
                            m.dispose();
                        });
                    } else {
                        ch.material.dispose();
                    }
                }
            }
        }

        var toolbar = document.createElement('div');
        toolbar.className = 'ml-3d-toolbar';
        toolbar.setAttribute('role', 'toolbar');

        function addToolButton(label, act, extraClass) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'ml-3d-toolbtn' + (extraClass ? ' ' + extraClass : '');
            b.textContent = label || '';
            b.setAttribute('data-act', act);
            return b;
        }

        var row1 = document.createElement('div');
        row1.className = 'ml-3d-toolbar__row';
        row1.appendChild(addToolButton(pt.presetIso || 'ISO', 'preset-iso'));
        row1.appendChild(addToolButton(pt.presetPlan || 'Planta', 'preset-plan'));
        row1.appendChild(addToolButton(pt.presetSection || 'Perfil', 'preset-section'));
        var measureBtn = addToolButton(pt.measureToggle || 'Medir', 'measure', 'ml-3d-toolbtn--accent');
        row1.appendChild(measureBtn);
        row1.appendChild(addToolButton(pt.clearMeasure || 'Borrar medición', 'clear-measure'));

        var row2 = document.createElement('div');
        row2.className = 'ml-3d-toolbar__row';
        var labCont = document.createElement('label');
        labCont.className = 'ml-3d-tool-check';
        var chkCont = document.createElement('input');
        chkCont.type = 'checkbox';
        chkCont.checked = true;
        chkCont.setAttribute('data-act', 'toggle-contours');
        labCont.appendChild(chkCont);
        labCont.appendChild(document.createTextNode(' ' + (pt.layerContours || 'Contornos')));
        row2.appendChild(labCont);
        var labEq = document.createElement('label');
        labEq.className = 'ml-3d-tool-check';
        var chkEq = document.createElement('input');
        chkEq.type = 'checkbox';
        chkEq.checked = true;
        chkEq.setAttribute('data-act', 'toggle-equip');
        labEq.appendChild(chkEq);
        labEq.appendChild(document.createTextNode(' ' + (pt.layerEquip || 'Equipos')));
        row2.appendChild(labEq);

        var readout = document.createElement('span');
        readout.className = 'ml-3d-toolbar__readout';
        readout.setAttribute('aria-live', 'polite');
        row2.appendChild(readout);

        var hintEl = document.createElement('p');
        hintEl.className = 'ml-3d-toolbar__hint';
        toolbar.appendChild(row1);
        toolbar.appendChild(row2);
        toolbar.appendChild(hintEl);
        host.appendChild(toolbar);

        function startPreset(angles) {
            camTween = {
                a: orbitPit.getAngles(),
                b: angles,
                t0: performance.now(),
                dur: 560
            };
        }

        function onToolbarClick(ev) {
            var tgt = ev.target;
            var act = tgt.getAttribute && tgt.getAttribute('data-act');
            if (!act) {
                return;
            }
            if (act === 'preset-iso') {
                startPreset({theta: 0.88, phi: 0.5, radius: 58});
            } else if (act === 'preset-plan') {
                startPreset({theta: 0.9, phi: 0.2, radius: 82});
            } else if (act === 'preset-section') {
                startPreset({theta: 0.05, phi: 0.36, radius: 58});
            } else if (act === 'measure') {
                measureMode = !measureMode;
                orbitPit.setOrbitDragEnabled(!measureMode);
                measureBtn.classList.toggle('ml-3d-toolbtn--on', measureMode);
                hintEl.textContent = measureMode ? (pt.measureHint || '') : '';
            } else if (act === 'clear-measure') {
                measurePoints = [];
                clearMeasureVisual();
                readout.textContent = '';
            }
        }

        function onToolbarChange(ev) {
            var inp = ev.target;
            var act = inp.getAttribute && inp.getAttribute('data-act');
            if (!act || inp.type !== 'checkbox') {
                return;
            }
            if (act === 'toggle-contours') {
                linesGroup.visible = inp.checked;
            } else if (act === 'toggle-equip') {
                equipGroup.visible = inp.checked;
                s1.visible = s2.visible = s3.visible = s4.visible = inp.checked;
            }
        }

        toolbar.addEventListener('click', onToolbarClick);
        toolbar.addEventListener('change', onToolbarChange);

        function onPitPointerDown(e) {
            ptrDown.x = e.clientX;
            ptrDown.y = e.clientY;
        }

        function onPitPointerUp(e) {
            if (!measureMode || e.button !== 0) {
                return;
            }
            var dx = e.clientX - ptrDown.x;
            var dy = e.clientY - ptrDown.y;
            if (dx * dx + dy * dy > 100) {
                return;
            }
            var rect = renderer.domElement.getBoundingClientRect();
            ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(ndc, camera);
            var hits = raycaster.intersectObjects(pitSolidMeshes, true);
            if (!hits.length) {
                return;
            }
            var hitp = hits[0].point.clone();
            if (measurePoints.length >= 2) {
                measurePoints = [];
                clearMeasureVisual();
                readout.textContent = '';
            }
            measurePoints.push(hitp);
            var mk = new THREE.Mesh(
                new THREE.SphereGeometry(0.42, 14, 14),
                new THREE.MeshStandardMaterial({color: 0xf97316, emissive: 0x442208, roughness: 0.55, metalness: 0.15})
            );
            mk.position.copy(hitp);
            measureGroup.add(mk);
            if (measurePoints.length === 2) {
                var g = new THREE.BufferGeometry().setFromPoints([measurePoints[0], measurePoints[1]]);
                var ln = new THREE.Line(g, new THREE.LineBasicMaterial({color: 0xf97316}));
                measureGroup.add(ln);
                var dist = measurePoints[0].distanceTo(measurePoints[1]);
                readout.textContent = (pt.distLabel || 'Distancia') + ': ' + (Math.round(dist * 10) / 10) + ' m';
            }
        }

        renderer.domElement.addEventListener('pointerdown', onPitPointerDown);
        renderer.domElement.addEventListener('pointerup', onPitPointerUp);

        var camAng = 0;
        var pitAnim;
        var pitRunning = true;
        var pathSpeed = 0.00042;

        function loop(now) {
            if (!pitRunning) {
                return;
            }
            pitAnim = requestAnimationFrame(loop);
            now = now != null ? now : performance.now();
            camAng += 0.0015;
            if (camTween) {
                var u = Math.min(1, (now - camTween.t0) / camTween.dur);
                u = u * u * (3 - 2 * u);
                var A = camTween.a;
                var B = camTween.b;
                orbitPit.setAngles(
                    A.theta + (B.theta - A.theta) * u,
                    A.phi + (B.phi - A.phi) * u,
                    A.radius + (B.radius - A.radius) * u
                );
                if (u >= 1) {
                    camTween = null;
                }
            } else if (!measureMode) {
                orbitPit.spinIdle(0.00014);
            }

            roadTrucks.forEach(function(rt) {
                rt.u += pathSpeed;
                if (rt.u > 1) {
                    rt.u -= 1;
                }
                var p = spiralPos(rt.u);
                rt.g.position.copy(p);
                var tn = spiralTan(rt.u);
                rt.g.lookAt(p.clone().add(tn));
            });

            exG.rotation.y = Math.sin(camAng * 1.6) * 0.35;
            exBoom.rotation.x = -0.42 + Math.sin(camAng * 2.2) * 0.1;
            exBk.rotation.x = 0.2 + Math.sin(camAng * 2.2 + 0.4) * 0.12;
            dumpBed.rotation.x = 0.35 + Math.sin(camAng * 1.4) * 0.08;

            var dposArr = dustDrill.geometry.attributes.position.array;
            for (var dj = 0; dj < nd; dj++) {
                dposArr[dj * 3 + 1] += 0.04 + Math.sin(dj * 0.2 + camAng * 6) * 0.02;
                if (dposArr[dj * 3 + 1] > 8) {
                    dposArr[dj * 3 + 1] = 0;
                }
            }
            dustDrill.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }
        pitAnim = requestAnimationFrame(loop);

        function onResize() {
            var dim = viewportDimensions(host);
            w = dim.w;
            h = dim.h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);
        var roPit = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function() {
            onResize();
        }) : null;
        if (roPit) {
            roPit.observe(host);
        }

        return {
            dispose: function() {
                pitRunning = false;
                if (pitAnim) {
                    cancelAnimationFrame(pitAnim);
                }
                if (roPit) {
                    roPit.disconnect();
                }
                window.removeEventListener('resize', onResize);
                toolbar.removeEventListener('click', onToolbarClick);
                toolbar.removeEventListener('change', onToolbarChange);
                renderer.domElement.removeEventListener('pointerdown', onPitPointerDown);
                renderer.domElement.removeEventListener('pointerup', onPitPointerUp);
                clearMeasureVisual();
                orbitPit.dispose();
                skyTex.dispose();
                renderer.dispose();
                if (host.contains(toolbar)) {
                    host.removeChild(toolbar);
                }
                if (host.contains(renderer.domElement)) {
                    host.removeChild(renderer.domElement);
                }
            }
        };
    }

    /**
     * Ventilación: chimenea, ventilador, partículas bidireccionales.
     */
    function mountVent(viewport, activity, theme, THREE) {
        var host = viewport;
        var dimV = viewportDimensions(host);
        var w = dimV.w;
        var h = dimV.h;

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x070a10);
        scene.fog = new THREE.FogExp2(0x070a10, 0.04);

        var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 120);
        camera.position.set(10, 5, 14);

        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.display = 'block';
        host.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0x8899bb, 0x1a1a1a, 0.9));
        var inner = new THREE.PointLight(theme.cool, 1.1, 40);
        inner.position.set(0, 2, 0);
        scene.add(inner);

        var shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(2.1, 2.4, 16, 32, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0x3a404c,
                metalness: 0.25,
                roughness: 0.75,
                side: THREE.DoubleSide
            })
        );
        scene.add(shaft);

        var fan = new THREE.Group();
        var blade;
        for (var bi = 0; bi < 6; bi++) {
            blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.08, 1.8),
                new THREE.MeshStandardMaterial({color: 0x5a6578, metalness: 0.5, roughness: 0.4})
            );
            blade.rotation.y = (bi / 6) * Math.PI * 2;
            fan.add(blade);
        }
        fan.position.y = 7.5;
        scene.add(fan);

        var motor = new THREE.Mesh(
            new THREE.CylinderGeometry(1.1, 1.2, 2.2, 24),
            new THREE.MeshStandardMaterial({color: 0x3a4555, metalness: 0.4, roughness: 0.45})
        );
        motor.position.y = 5.2;
        scene.add(motor);

        var ladder = new THREE.Group();
        var lr;
        for (lr = 0; lr < 18; lr++) {
            var rung = new THREE.Mesh(
                new THREE.BoxGeometry(0.85, 0.08, 0.12),
                new THREE.MeshStandardMaterial({color: 0x6a7488, metalness: 0.35, roughness: 0.5})
            );
            rung.position.set(2.35, -6 + lr * 0.75, 0);
            ladder.add(rung);
        }
        var railSide = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 13.5, 0.12),
            new THREE.MeshStandardMaterial({color: 0x555a66, metalness: 0.5, roughness: 0.4})
        );
        railSide.position.set(2.75, 0.5, 0);
        ladder.add(railSide);
        var railSide2 = railSide.clone();
        railSide2.position.x = 1.95;
        ladder.add(railSide2);
        scene.add(ladder);

        var grille = new THREE.Mesh(
            new THREE.TorusGeometry(2.35, 0.12, 10, 36),
            new THREE.MeshStandardMaterial({color: 0x5a6570, metalness: 0.55, roughness: 0.35})
        );
        grille.rotation.x = Math.PI / 2;
        grille.position.y = 8.2;
        scene.add(grille);

        var q = 55;
        var nFresh = 140;
        var nRet = 140;
        var grpF = new THREE.Group();
        var grpR = new THREE.Group();
        var matF = new THREE.MeshBasicMaterial({color: theme.cool, transparent: true, opacity: 0.65});
        var matR = new THREE.MeshBasicMaterial({color: theme.warm, transparent: true, opacity: 0.55});
        var i2;
        for (i2 = 0; i2 < nFresh; i2++) {
            var m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), matF);
            m.position.set((Math.random() - 0.5) * 2.2, Math.random() * 14 - 7, (Math.random() - 0.5) * 2.2);
            grpF.add(m);
        }
        for (i2 = 0; i2 < nRet; i2++) {
            var m2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), matR);
            m2.position.set((Math.random() - 0.5) * 2.2, Math.random() * 14 - 7, (Math.random() - 0.5) * 2.2);
            grpR.add(m2);
        }
        scene.add(grpF);
        scene.add(grpR);

        var ventInput = document.getElementById('ml-vent-r');
        var onVentInput = function(e) {
            q = parseInt(e.target.value, 10) || 10;
        };
        if (ventInput) {
            ventInput.addEventListener('input', onVentInput);
        }

        var ventAnim;
        var ventRunning = true;
        function loop() {
            if (!ventRunning) {
                return;
            }
            ventAnim = requestAnimationFrame(loop);
            var speed = 0.02 + (q / 100) * 0.12;
            fan.rotation.y += 0.08 + q * 0.0008;
            grpF.children.forEach(function(p) {
                p.position.y += speed;
                if (p.position.y > 7.5) {
                    p.position.y = -7.5;
                }
            });
            grpR.children.forEach(function(p) {
                p.position.y -= speed * 0.85;
                if (p.position.y < -7.5) {
                    p.position.y = 7.5;
                }
            });
            inner.intensity = 0.7 + (q / 100) * 0.8;
            motor.rotation.y += 0.02 + q * 0.0002;
            camera.position.x = 10 + Math.sin(Date.now() * 0.0003) * 0.5;
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
        }
        ventAnim = requestAnimationFrame(loop);

        function onResize() {
            var dim = viewportDimensions(host);
            w = dim.w;
            h = dim.h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);
        var roVent = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function() {
            onResize();
        }) : null;
        if (roVent) {
            roVent.observe(host);
        }

        return {
            dispose: function() {
                ventRunning = false;
                if (ventAnim) {
                    cancelAnimationFrame(ventAnim);
                }
                if (ventInput) {
                    ventInput.removeEventListener('input', onVentInput);
                }
                if (roVent) {
                    roVent.disconnect();
                }
                window.removeEventListener('resize', onResize);
                renderer.dispose();
                if (host.contains(renderer.domElement)) {
                    host.removeChild(renderer.domElement);
                }
            },
            setQ: function(v) {
                q = v;
            }
        };
    }

    return {
        mountTunnel: mountTunnel,
        mountPit: mountPit,
        mountPitCycle: mountPitCycle,
        mountVent: mountVent
    };
});
