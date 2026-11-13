import * as THREE from 'three';

/**
 * Generates an HDR studio environment map purely in-memory via PMREMGenerator.
 * Positioned off-axis with dark negative fill directly overhead so anti-reflective
 * sapphire crystal reveals the obsidian dial crisply while catching sleek rim streaks.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#040405');

  const panelGeo = new THREE.PlaneGeometry(1, 1);

  const addPanel = (
    color: string,
    intensity: number,
    pos: [number, number, number],
    rot: [number, number, number],
    scale: [number, number]
  ) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(panelGeo, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(scale[0], scale[1], 1);
    envScene.add(mesh);
  };

  // Off-axis diagonal softbox left-rear (creates crisp crescent specular on bezel & dome edge)
  addPanel('#fff7ea', 2.8, [-5.5, 6.2, -3.2], [0.65, 0.72, 0.2], [5.5, 2.2]);
  // Cool architectural fill strip left-front
  addPanel('#c9dcff', 1.9, [-7.5, 3.8, 4.5], [0.3, 1.05, 0], [2.4, 8.0]);
  // Warm champagne-gold rim accent right
  addPanel('#ffdfa8', 3.2, [7.2, 3.0, -2.5], [0.25, -1.18, 0], [1.9, 8.5]);
  // Narrow high-contrast specular blade top-right
  addPanel('#ffffff', 3.8, [3.2, 7.0, 4.5], [0.85, -0.4, 0], [5.5, 0.65]);
  // Subtle lower warm bounce for caseback & rotor undersides
  addPanel('#c9b28a', 1.3, [0, -7.2, 3.0], [-Math.PI / 2.3, 0, 0], [6.5, 3.5]);
  // Back rim hairline
  addPanel('#f2e8d9', 2.6, [-1.0, 3.5, -7.5], [0.38, 0, 0], [7.5, 1.4]);

  const rt = pmrem.fromScene(envScene, 0.032);
  panelGeo.dispose();
  pmrem.dispose();

  return rt.texture;
}
