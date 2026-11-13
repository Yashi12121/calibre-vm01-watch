import * as THREE from 'three';

export interface GearGeometryOptions {
  teeth: number;
  outerRadius: number;
  rootRadius: number;
  rimInnerRadius: number;
  hubRadius: number;
  boreRadius: number;
  thickness: number;
  spokes: number;
  bevel?: boolean;
}

export function createGearGeometry(opts: GearGeometryOptions): THREE.BufferGeometry {
  const {
    teeth,
    outerRadius,
    rootRadius,
    rimInnerRadius,
    hubRadius,
    boreRadius,
    thickness,
    spokes,
    bevel = true,
  } = opts;

  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.62;
    const a4 = a0 + step * 0.74;

    const p0x = Math.cos(a0) * rootRadius;
    const p0y = Math.sin(a0) * rootRadius;
    if (i === 0) {
      shape.moveTo(p0x, p0y);
    } else {
      shape.lineTo(p0x, p0y);
    }
    shape.lineTo(Math.cos(a1) * rootRadius, Math.sin(a1) * rootRadius);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * rootRadius, Math.sin(a4) * rootRadius);
  }
  shape.closePath();

  // Center arbor bore
  if (boreRadius > 0.004) {
    const bore = new THREE.Path();
    bore.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    shape.holes.push(bore);
  }

  // Openworked spoke cutouts
  if (spokes > 0 && rimInnerRadius > hubRadius + 0.025) {
    const spokeGap = (Math.PI * 2) / spokes;
    const halfArmAngle = Math.min(0.14, spokeGap * 0.14);
    for (let s = 0; s < spokes; s++) {
      const startA = s * spokeGap + halfArmAngle;
      const endA = (s + 1) * spokeGap - halfArmAngle;
      if (endA <= startA + 0.06) continue;

      const cutout = new THREE.Path();
      cutout.absarc(0, 0, rimInnerRadius, startA, endA, false);
      cutout.lineTo(Math.cos(endA) * hubRadius, Math.sin(endA) * hubRadius);
      cutout.absarc(0, 0, hubRadius, endA, startA, true);
      cutout.closePath();
      shape.holes.push(cutout);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevel,
    bevelThickness: bevel ? Math.min(0.008, thickness * 0.22) : 0,
    bevelSize: bevel ? Math.min(0.006, thickness * 0.18) : 0,
    bevelSegments: 2,
    curveSegments: 24,
  });

  geo.translate(0, 0, -thickness / 2);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function createEscapeWheelGeometry(
  teeth: number,
  outerRadius: number,
  rootRadius: number,
  thickness: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const tipAngle = a0 + step * 0.42;
    const backAngle = a0 + step * 0.24;
    const nextRoot = a0 + step * 0.66;

    const p0x = Math.cos(a0) * rootRadius;
    const p0y = Math.sin(a0) * rootRadius;
    if (i === 0) shape.moveTo(p0x, p0y);
    else shape.lineTo(p0x, p0y);

    // Swept club tooth
    shape.lineTo(Math.cos(tipAngle) * outerRadius, Math.sin(tipAngle) * outerRadius);
    shape.lineTo(
      Math.cos(tipAngle - 0.08) * (outerRadius * 0.96),
      Math.sin(tipAngle - 0.08) * (outerRadius * 0.96)
    );
    shape.lineTo(
      Math.cos(backAngle) * (rootRadius * 1.12),
      Math.sin(backAngle) * (rootRadius * 1.12)
    );
    shape.lineTo(Math.cos(nextRoot) * rootRadius, Math.sin(nextRoot) * rootRadius);
  }
  shape.closePath();

  const innerRim = rootRadius * 0.78;
  const hubR = rootRadius * 0.28;
  for (let s = 0; s < 3; s++) {
    const startA = s * ((Math.PI * 2) / 3) + 0.18;
    const endA = (s + 1) * ((Math.PI * 2) / 3) - 0.18;
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRim, startA, endA, false);
    hole.absarc(0, 0, hubR, endA, startA, true);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 1,
    curveSegments: 18,
  });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function createRotorGeometry(
  outerR: number,
  hubR: number,
  thickness: number
): THREE.BufferGeometry {
  // Semi-circular openworked oscillating weight
  const shape = new THREE.Shape();
  const startA = -Math.PI * 0.46;
  const endA = Math.PI * 0.46;

  shape.absarc(0, 0, outerR, startA, endA, false);
  shape.lineTo(Math.cos(endA) * hubR, Math.sin(endA) * hubR);
  shape.absarc(0, 0, hubR, endA, startA, true);
  shape.closePath();

  // Two openworked fan windows inside the rotor
  const winOuter = outerR * 0.82;
  const winInner = hubR * 1.65;
  const windows: [number, number][] = [
    [-Math.PI * 0.36, -0.14],
    [0.14, Math.PI * 0.36],
  ];

  for (const [w0, w1] of windows) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, winOuter, w0, w1, false);
    hole.absarc(0, 0, winInner, w1, w0, true);
    hole.closePath();
    shape.holes.push(hole);
  }

  const bore = new THREE.Path();
  bore.absarc(0, 0, hubR * 0.42, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 48,
  });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function createRotorMassRimGeometry(
  outerR: number,
  innerR: number,
  thickness: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const startA = -Math.PI * 0.46;
  const endA = Math.PI * 0.46;
  shape.absarc(0, 0, outerR, startA, endA, false);
  shape.absarc(0, 0, innerR, endA, startA, true);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 48,
  });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function createHairspringGeometry(
  turns: number,
  startR: number,
  endR: number,
  tubeR: number
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const totalSamples = turns * 44;
  for (let i = 0; i <= totalSamples; i++) {
    const t = i / totalSamples;
    const angle = t * turns * Math.PI * 2;
    const r = startR + (endR - startR) * t;
    points.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, totalSamples, tubeR, 5, false);
}

export function createDomedCrystalGeometry(radius: number, domeHeight: number): THREE.BufferGeometry {
  // Smooth box-domed sapphire crystal profile revolved with LatheGeometry
  const pts: THREE.Vector2[] = [];
  const steps = 20;
  // Inner concave profile -> outer convex dome
  pts.push(new THREE.Vector2(0.001, domeHeight - 0.045));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const r = t * (radius - 0.04);
    const y = (domeHeight - 0.045) * Math.sqrt(Math.max(0, 1 - t * t * 0.72));
    pts.push(new THREE.Vector2(r, y));
  }
  pts.push(new THREE.Vector2(radius, 0.0));
  pts.push(new THREE.Vector2(radius, 0.035));
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const r = t * radius;
    const y = 0.035 + domeHeight * Math.sqrt(Math.max(0, 1 - t * t * 0.76));
    pts.push(new THREE.Vector2(Math.max(0.001, r), y));
  }

  const geo = new THREE.LatheGeometry(pts, 72);
  geo.computeVertexNormals();
  return geo;
}

export function createDauphineHandGeometry(
  length: number,
  tail: number,
  halfWidth: number,
  height: number
): THREE.BufferGeometry {
  // 3D diamond-faceted dauphine blade along -Z (12 o'clock)
  const vertices = new Float32Array([
    // Left top facet
    0, height, tail,
    -halfWidth, 0.004, 0,
    0, height * 0.45, -length,

    // Right top facet
    0, height, tail,
    0, height * 0.45, -length,
    halfWidth, 0.004, 0,

    // Left bottom facet
    0, -0.006, tail,
    0, 0.0, -length,
    -halfWidth, 0.004, 0,

    // Right bottom facet
    0, -0.006, tail,
    halfWidth, 0.004, 0,
    0, 0.0, -length,

    // Tail cap left
    0, height, tail,
    0, -0.006, tail,
    -halfWidth, 0.004, 0,

    // Tail cap right
    0, height, tail,
    halfWidth, 0.004, 0,
    0, -0.006, tail,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

export function createCurvedStrapHalfGeometry(
  width: number,
  taperWidth: number,
  length: number,
  thickness: number,
  directionSign: 1 | -1
): THREE.BufferGeometry {
  // Side profile in Z-Y plane, extruded across X then tapered slightly
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.04, directionSign * 1.46),
    new THREE.Vector3(0, -0.22, directionSign * (1.46 + length * 0.32)),
    new THREE.Vector3(0, -0.56, directionSign * (1.46 + length * 0.68)),
    new THREE.Vector3(0, -0.98, directionSign * (1.46 + length * 0.96)),
  ]);

  const segments = 24;
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const halfW = THREE.MathUtils.lerp(width / 2, taperWidth / 2, t);
    const halfT = (thickness * (1 - t * 0.25)) / 2;

    // Normal points mostly along Y
    const n = frames.normals[i];
    const up = new THREE.Vector3(0, 1, 0).lerp(n, 0.2).normalize();

    // 4 corners around cross-section (top-left, top-right, bottom-right, bottom-left)
    const corners = [
      new THREE.Vector3(-halfW, 0, 0).addScaledVector(up, halfT).add(p),
      new THREE.Vector3(halfW, 0, 0).addScaledVector(up, halfT).add(p),
      new THREE.Vector3(halfW, 0, 0).addScaledVector(up, -halfT).add(p),
      new THREE.Vector3(-halfW, 0, 0).addScaledVector(up, -halfT).add(p),
    ];

    for (let c = 0; c < 4; c++) {
      positions.push(corners[c].x, corners[c].y, corners[c].z);
      uvs.push(c === 0 || c === 3 ? 0 : 1, t * 1.2);
    }

    if (i < segments) {
      const base = i * 4;
      const next = (i + 1) * 4;
      // Top
      indices.push(base + 0, base + 1, next + 1, base + 0, next + 1, next + 0);
      // Bottom
      indices.push(base + 2, base + 3, next + 3, base + 2, next + 3, next + 2);
      // Right
      indices.push(base + 1, base + 2, next + 2, base + 1, next + 2, next + 1);
      // Left
      indices.push(base + 3, base + 0, next + 0, base + 3, next + 0, next + 3);
    }
  }

  // End caps
  indices.push(0, 3, 2, 0, 2, 1);
  const last = segments * 4;
  indices.push(last + 0, last + 1, last + 2, last + 0, last + 2, last + 3);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createSculptedLugGeometry(): THREE.BufferGeometry {
  // Curved side profile in Z-Y plane, extruded across X width with smooth bevels
  const profile = new THREE.Shape();
  profile.moveTo(0.0, 0.14);
  profile.bezierCurveTo(0.24, 0.13, 0.42, 0.06, 0.56, -0.05);
  profile.bezierCurveTo(0.61, -0.09, 0.6, -0.14, 0.54, -0.15);
  profile.bezierCurveTo(0.38, -0.15, 0.18, -0.13, 0.0, -0.15);
  profile.closePath();

  const geo = new THREE.ExtrudeGeometry(profile, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 4,
    curveSegments: 16,
  });

  // Rotate so X-axis of shape becomes +Z (extending outward from case), and extrusion is along X
  geo.translate(0, 0, -0.08);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

