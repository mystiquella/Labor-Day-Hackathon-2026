import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { RISK_COLORS } from "@/lib/riskModel";

// 3D simulation of the Himalayan glacier network. Procedural terrain mesh from
// the orographic spine, risk-colored glowing markers, drag-to-rotate + auto
// spin, click-to-select. No external API — pure three.js on local coordinates.

const MIN_LAT = 26, MAX_LAT = 37, MIN_LON = 67, MAX_LON = 96;
const W3 = 220, D3 = 140;

// Orographic spine (lat, lon) — shared with the 2D map for consistency.
const SPINE = [
  [34.5, 70.5], [35.5, 74.5], [36.0, 76.0], [35.5, 76.5], [34.5, 77.0],
  [33.0, 77.5], [31.5, 78.5], [30.5, 79.5], [29.5, 81.0], [28.5, 83.0],
  [28.2, 85.5], [27.9, 87.5], [27.8, 89.0], [27.9, 90.5], [28.2, 91.5],
  [28.5, 92.5], [29.0, 94.0], [29.5, 95.0],
];

function lonLatToWorld(lon, lat) {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * W3 - W3 / 2;
  const z = -(((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * D3 - D3 / 2);
  return { x, z };
}

// Analytical terrain height from distance to the ridge spine + low-freq relief.
function terrainHeight(lon, lat) {
  let minD = Infinity;
  for (const [sla, slo] of SPINE) {
    const d = Math.hypot((lon - slo) * 1.05, (lat - sla) * 1.35);
    if (d < minD) minD = d;
  }
  const ridge = Math.exp(-(minD * minD) / (2 * 0.95 * 0.95));
  const noise =
    0.18 * (Math.sin(lon * 1.7) + Math.cos(lat * 1.4)) +
    0.12 * Math.sin(lon * 3.0 + lat * 2.1) +
    0.08 * Math.cos(lat * 4.2 - lon * 1.3);
  return ridge * 8.5 + noise * 1.6 + 0.7;
}

function heightColor(h, maxH) {
  const t = Math.min(1, h / maxH);
  // dark slate valleys -> teal mid -> icy white peaks
  const c = new THREE.Color();
  if (t < 0.45) {
    c.lerpColors(new THREE.Color("#0b1f33"), new THREE.Color("#0e3a52"), t / 0.45);
  } else if (t < 0.78) {
    c.lerpColors(new THREE.Color("#0e3a52"), new THREE.Color("#3b6f86"), (t - 0.45) / 0.33);
  } else {
    c.lerpColors(new THREE.Color("#3b6f86"), new THREE.Color("#e6eef5"), (t - 0.78) / 0.22);
  }
  return c;
}

export default function GlacierMap3D({ glaciers, selectedId, onSelect, height = 500 }) {
  const containerRef = useRef(null);
  const labelRef = useRef(null);
  const stateRef = useRef(null);
  const selRef = useRef(selectedId);
  useEffect(() => { selRef.current = selectedId; }, [selectedId]);

  // Stable marker data
  const markerData = useMemo(
    () => glaciers.map((g) => {
      const { x, z } = lonLatToWorld(g.longitude, g.latitude);
      const y = terrainHeight(g.longitude, g.latitude);
      return { id: g.glacier_id, name: g.glacier_name, country: g.country, level: g.risk_level, score: g.risk_score, pos: [x, y, z] };
    }),
    [glaciers]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b1220, 180, 420);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Terrain mesh
    const SEG = 140;
    const geo = new THREE.PlaneGeometry(W3, D3, SEG, SEG);
    geo.rotateX(-Math.PI / 2); // lay flat, y up
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    let maxH = 0;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const lon = MIN_LON + ((x + W3 / 2) / W3) * (MAX_LON - MIN_LON);
      const lat = MIN_LAT + ((-z + D3 / 2) / D3) * (MAX_LAT - MIN_LAT);
      const h = terrainHeight(lon, lat);
      pos.setY(i, h);
      if (h > maxH) maxH = h;
    }
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getY(i);
      const c = heightColor(h, maxH);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0.05 });
    const terrain = new THREE.Mesh(geo, mat);
    scene.add(terrain);

    // Wireframe overlay for a "simulation grid" look
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08 })
    );
    terrain.add(wire);

    // Base platform
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(W3 + 6, 1.5, D3 + 6),
      new THREE.MeshStandardMaterial({ color: 0x0b1426, roughness: 1, transparent: true, opacity: 0.7 })
    );
    base.position.y = -0.8;
    scene.add(base);

    // Lighting
    scene.add(new THREE.HemisphereLight(0x88aacc, 0x0b1426, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(60, 120, 80);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.4);
    rim.position.set(-80, 40, -60);
    scene.add(rim);

    // Markers
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    const colorHex = (lvl) => new THREE.Color(RISK_COLORS[lvl]);
    const markerMeshes = markerData.map((m) => {
      const g = new THREE.SphereGeometry(1.6, 16, 16);
      const c = colorHex(m.level);
      const mm = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7, roughness: 0.4 });
      const sphere = new THREE.Mesh(g, mm);
      sphere.position.set(m.pos[0], m.pos[1] + 1.5, m.pos[2]);
      sphere.userData = { id: m.id, baseColor: c };
      markerGroup.add(sphere);

      // glow halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.18, depthWrite: false })
      );
      halo.position.copy(sphere.position);
      halo.userData = { isHalo: true, id: m.id };
      markerGroup.add(halo);
      sphere.userData.halo = halo;
      return sphere;
    });

    // Selected ring (reused)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.18, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    scene.add(ring);

    // Camera orbit state
    const cam = {
      radius: 210,
      azimuth: 0.6,
      polar: 1.15,
      target: new THREE.Vector3(0, 4, 0),
      autoSpin: 0.0014,
    };
    const updateCamera = () => {
      const r = cam.radius;
      const phi = cam.polar;
      const th = cam.azimuth;
      camera.position.set(
        cam.target.x + r * Math.sin(phi) * Math.sin(th),
        cam.target.y + r * Math.cos(phi),
        cam.target.z + r * Math.sin(phi) * Math.cos(th)
      );
      camera.lookAt(cam.target);
    };
    updateCamera();

    // Pointer interaction
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const drag = { active: false, moved: false, x: 0, y: 0 };

    const onPointerDown = (e) => {
      drag.active = true; drag.moved = false; drag.x = e.clientX; drag.y = e.clientY;
    };
    const onPointerMove = (e) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      cam.azimuth -= dx * 0.005;
      cam.polar = Math.max(0.25, Math.min(1.4, cam.polar - dy * 0.005));
    };
    const onPointerUp = (e) => {
      if (drag.active && !drag.moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(markerMeshes, false);
        if (hits.length > 0) onSelect(hits[0].object.userData.id);
      }
      drag.active = false;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    stateRef.current = { cam, markerMeshes, ring, camera, renderer, scene, terrain };

    // Animation loop
    let raf;
    const clock = new THREE.Clock();
    const labelEl = labelRef.current;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!drag.active) cam.azimuth += cam.autoSpin;
      updateCamera();

      // pulse halos + selected handling
      markerMeshes.forEach((s) => {
        const isSel = s.userData.id === selRef.current;
        const sc = isSel ? 1.7 + Math.sin(t * 4) * 0.12 : 1;
        s.scale.setScalar(sc);
        s.userData.halo.scale.setScalar(isSel ? 1.6 : 1 + Math.sin(t * 2 + s.position.x) * 0.05);
        s.userData.halo.material.opacity = isSel ? 0.32 : 0.16;
      });
      const sel = markerMeshes.find((s) => s.userData.id === selRef.current);
      if (sel) {
        ring.visible = true;
        ring.position.copy(sel.position);
        ring.position.y -= 1.4;
        ring.rotation.z = t * 0.8;
        // project label
        if (labelEl) {
          const v = sel.position.clone();
          v.y += 5;
          v.project(camera);
          const rect = renderer.domElement.getBoundingClientRect();
          const x = (v.x * 0.5 + 0.5) * rect.width;
          const y = (-v.y * 0.5 + 0.5) * rect.height;
          labelEl.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
          labelEl.style.opacity = v.z < 1 ? "1" : "0";
        }
      } else {
        ring.visible = false;
        if (labelEl) labelEl.style.opacity = "0";
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      geo.dispose(); mat.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      stateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glaciers, height]);

  const selected = markerData.find((m) => m.id === selectedId);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black"
      style={{ height }}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {selected && (
        <div
          ref={labelRef}
          className="pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded-md bg-slate-950/85 px-2 py-1 text-[11px] font-semibold text-slate-100 backdrop-blur"
          style={{ opacity: 0, willChange: "transform" }}
        >
          {selected.name}
          <span className="ml-1.5 rounded px-1 py-0.5 text-[9px]" style={{ background: RISK_COLORS[selected.level], color: "#0b1220" }}>
            {selected.level}
          </span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-slate-950/70 px-3 py-2 text-[10px] backdrop-blur">
        {Object.entries(RISK_COLORS).map(([lvl, c]) => (
          <span key={lvl} className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: c }} />
            {lvl}
          </span>
        ))}
      </div>
      <div className="absolute right-3 top-3 rounded-lg bg-slate-950/70 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur">
        3D simulation · drag to rotate
      </div>
    </div>
  );
}