// MinasLab — escenas WebGL Three.js (túnel, tajo, ventilación) — motor compartido para todas las prácticas del arquetipo.
define([], function() {
    'use strict';

    /**
     * Túnel subterráneo: galería con rieles, polvo, luces móviles, cableado.
     */
    function mountTunnel(viewport, activity, theme, THREE) {
        var host = viewport;
        var w = host.clientWidth || 640;
        var h = 380;

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
        var mx = 0;
        var my = 0;
        var onMove = function(e) {
            mx += e.movementX * 0.0018;
            my += e.movementY * 0.0009;
        };
        renderer.domElement.addEventListener('mousemove', onMove);

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
            camera.position.x = Math.sin(ang * 0.7 + mx) * 2.8;
            camera.position.y = 2.2 + Math.sin(tsec * 0.4) * 0.08 + my;
            camera.lookAt(0, -0.5, -12 - ang * 6);
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
            w = host.clientWidth || 640;
            h = Math.min(420, Math.max(280, Math.round(w * 0.52)));
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
                renderer.domElement.removeEventListener('mousemove', onMove);
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
        var w = host.clientWidth || 640;
        var h = 380;

        var scene = new THREE.Scene();
        var sky = 0x8eb4dc;
        scene.background = new THREE.Color(sky);
        scene.fog = new THREE.Fog(sky, 35, 220);

        var camera = new THREE.PerspectiveCamera(48, w / h, 0.5, 600);
        camera.position.set(36, 22, 36);

        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        host.appendChild(renderer.domElement);

        var sun = new THREE.DirectionalLight(0xfff2dd, 1.45);
        sun.position.set(-40, 90, 30);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 10;
        sun.shadow.camera.far = 220;
        sun.shadow.camera.left = -80;
        sun.shadow.camera.right = 80;
        sun.shadow.camera.top = 80;
        sun.shadow.camera.bottom = -80;
        scene.add(sun);
        scene.add(new THREE.HemisphereLight(0xb8c4d4, 0x5a4a38, 0.5));

        var ground = new THREE.Mesh(
            new THREE.PlaneGeometry(320, 320),
            new THREE.MeshStandardMaterial({color: 0x6e5a42, roughness: 0.96, metalness: 0.02})
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.08;
        ground.receiveShadow = true;
        scene.add(ground);

        var sunMesh = new THREE.Mesh(
            new THREE.SphereGeometry(10, 20, 20),
            new THREE.MeshBasicMaterial({color: 0xfff2cc})
        );
        sunMesh.position.set(-38, 92, 28);
        scene.add(sunMesh);

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
        scene.add(excav);

        var tier;
        for (var level = 0; level < 8; level++) {
            var r0 = 26 - level * 2.8;
            var r1 = 24 - level * 2.8;
            tier = new THREE.Mesh(
                new THREE.CylinderGeometry(r0, r1, 2.8, 48, 1, true),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(0.07 + level * 0.028, 0.42, 0.26 + level * 0.03),
                    roughness: 0.94,
                    metalness: 0.04,
                    side: THREE.DoubleSide
                })
            );
            tier.position.y = level * 2.6;
            tier.castShadow = true;
            tier.receiveShadow = true;
            scene.add(tier);
        }

        var road = new THREE.Mesh(
            new THREE.RingGeometry(10, 14, 64),
            new THREE.MeshStandardMaterial({color: 0x2c2c2c, roughness: 0.9})
        );
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.4;
        road.receiveShadow = true;
        road.castShadow = true;
        scene.add(road);

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
            scene.add(grp);
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

        var pitMx = 0;
        var pitMy = 0;
        var pitDrag = false;
        var pitLastX = 0;
        var pitLastY = 0;
        var pitEl = renderer.domElement;
        function pitOnDown(e) {
            pitDrag = true;
            pitLastX = e.clientX;
            pitLastY = e.clientY;
        }
        function pitOnUp() {
            pitDrag = false;
        }
        function pitOnMove(e) {
            if (!pitDrag) {
                return;
            }
            pitMx += (e.clientX - pitLastX) * 0.0045;
            pitMy += (e.clientY - pitLastY) * 0.003;
            pitLastX = e.clientX;
            pitLastY = e.clientY;
        }
        pitEl.addEventListener('pointerdown', pitOnDown);
        pitEl.addEventListener('pointerup', pitOnUp);
        pitEl.addEventListener('pointerleave', pitOnUp);
        pitEl.addEventListener('pointermove', pitOnMove);

        var camAng = 0;
        var pitAnim;
        var pitRunning = true;
        function loop() {
            if (!pitRunning) {
                return;
            }
            pitAnim = requestAnimationFrame(loop);
            camAng += 0.0012;
            var elev = 0.38 + Math.sin(camAng * 0.55) * 0.05 + pitMy;
            elev = Math.max(0.2, Math.min(0.78, elev));
            var theta = camAng + pitMx;
            var rad = 38;
            camera.position.x = Math.cos(theta) * rad * Math.cos(elev);
            camera.position.z = Math.sin(theta) * rad * Math.cos(elev);
            camera.position.y = rad * Math.sin(elev) + 9;
            camera.lookAt(0, 6.5, 0);
            trucks.forEach(function(tk, idx) {
                tk.rotation.y += 0.008 + idx * 0.001;
                tk.position.y = 1 + Math.sin(camAng * 3 + idx) * 0.15;
            });
            excav.rotation.y = Math.sin(camAng * 1.8) * 0.45;
            exBoom.rotation.x = -0.35 + Math.sin(camAng * 2.4) * 0.12;
            exBucket.rotation.x = 0.25 + Math.sin(camAng * 2.4 + 0.5) * 0.08;
            sunMesh.position.y = 92 + Math.sin(camAng) * 0.8;
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
            w = host.clientWidth || 640;
            h = Math.min(420, Math.max(280, Math.round(w * 0.52)));
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
                pitEl.removeEventListener('pointerdown', pitOnDown);
                pitEl.removeEventListener('pointerup', pitOnUp);
                pitEl.removeEventListener('pointerleave', pitOnUp);
                pitEl.removeEventListener('pointermove', pitOnMove);
                renderer.dispose();
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
        var w = host.clientWidth || 640;
        var h = 380;

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x070a10);
        scene.fog = new THREE.FogExp2(0x070a10, 0.04);

        var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 120);
        camera.position.set(10, 5, 14);

        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
            w = host.clientWidth || 640;
            h = Math.min(420, Math.max(280, Math.round(w * 0.52)));
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
        mountVent: mountVent
    };
});
