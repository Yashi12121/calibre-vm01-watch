import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createStudioEnvironment } from './studioEnv';
import { WatchModel } from './WatchModel';
import { LAYER_ORDER, LayerKey } from '../data/watchSpecs';

export class WatchScene {
  public readonly renderer: THREE.WebGLRenderer;
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly watch: WatchModel;

  private composer: EffectComposer;
  private bokehPass: BokehPass;
  private studioSpot: THREE.SpotLight;

  private targetCamPos = new THREE.Vector3(2.25, 2.35, 4.35);
  private targetLookAt = new THREE.Vector3(-0.45, -0.08, 0.05);
  private currentLookAt = new THREE.Vector3(-0.45, -0.08, 0.05);
  private targetFov = 36;
  private targetAperture = 0.00018;

  private pointerX = 0;
  private pointerY = 0;
  private smoothPointerX = 0;
  private smoothPointerY = 0;

  private turntableAngle = 0;
  private turntableWeight = 1;
  private clickImpulse = 0;
  private reducedMotion = false;
  private isMobile = false;
  private onEscapementBeat?: () => void;

  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement, onEscapementBeat?: () => void) {
    this.onEscapementBeat = onEscapementBeat;
    this.isMobile = window.innerWidth <= 900;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setClearColor('#050506', 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#050506');
    this.scene.fog = new THREE.FogExp2('#050506', 0.032);

    const envMap = createStudioEnvironment(this.renderer);
    this.scene.environment = envMap;

    this.camera = new THREE.PerspectiveCamera(
      36,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    this.camera.position.copy(this.targetCamPos);
    this.camera.lookAt(this.currentLookAt);

    // Soft overhead studio spotlight + subtle directional rim lights
    this.studioSpot = new THREE.SpotLight('#fff6e6', 24, 24, 0.5, 0.9, 1.5);
    this.studioSpot.position.set(-2.6, 5.8, 3.4);
    this.scene.add(this.studioSpot);
    this.scene.add(this.studioSpot.target);

    const warmRim = new THREE.DirectionalLight('#e8ca8e', 1.35);
    warmRim.position.set(4.5, 2.8, -3.5);
    this.scene.add(warmRim);

    const coolEdge = new THREE.DirectionalLight('#b9cef2', 0.85);
    coolEdge.position.set(-3.8, -2.5, 4.0);
    this.scene.add(coolEdge);

    // Build Watch Assembly
    this.watch = new WatchModel();
    this.scene.add(this.watch.root);

    // Post-processing: Render -> Bokeh DoF -> ACES ToneMap Output
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bokehPass = new BokehPass(this.scene, this.camera, {
      focus: 4.9,
      aperture: 0.00018,
      maxblur: 0.0085,
    });
    this.composer.addPass(this.bokehPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
  }

  public setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    if (value) {
      this.turntableAngle = 0;
      this.watch.root.rotation.set(0, 0, 0);
    }
  }

  public getIsMobile(): boolean {
    return this.isMobile;
  }

  public setPose(
    pos: [number, number, number],
    target: [number, number, number],
    fov: number,
    aperture: number,
    turntableWeight: number,
    layerOffsets: Record<LayerKey, number>,
    snapImmediately = false
  ): void {
    this.targetCamPos.set(pos[0], pos[1], pos[2]);
    this.targetLookAt.set(target[0], target[1], target[2]);
    this.targetFov = fov;
    this.targetAperture = this.reducedMotion ? 0.00004 : aperture;
    this.turntableWeight = turntableWeight;
    this.watch.setLayerYOffsets(layerOffsets);

    if (snapImmediately || this.reducedMotion) {
      this.camera.position.copy(this.targetCamPos);
      this.currentLookAt.copy(this.targetLookAt);
      this.camera.fov = this.targetFov;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.currentLookAt);
    }
  }

  public triggerClickImpulse(): void {
    this.clickImpulse = 1.0;
  }

  public setTurntableSpin(active: boolean): void {
    if (!active) {
      this.turntableWeight = 0;
    }
  }

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.isMobile || this.reducedMotion) return;
    this.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private handleResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.isMobile = w <= 900;

    const dpr = Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.bokehPass.setSize(w, h);
  };

  public renderFrame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    const stepped = this.watch.tick(dt, elapsed, this.reducedMotion);
    if (stepped && this.onEscapementBeat && !this.reducedMotion) {
      this.onEscapementBeat();
    }

    // Smooth pointer parallax
    this.smoothPointerX = THREE.MathUtils.lerp(
      this.smoothPointerX,
      this.reducedMotion ? 0 : this.pointerX,
      0.06
    );
    this.smoothPointerY = THREE.MathUtils.lerp(
      this.smoothPointerY,
      this.reducedMotion ? 0 : this.pointerY,
      0.06
    );

    // Turntable slow hero rotation smoothly blends back to 0° when entering exploded views
    if (this.turntableWeight > 0.02 && !this.reducedMotion) {
      this.turntableAngle = (this.turntableAngle + dt * 0.14 * this.turntableWeight) % (Math.PI * 2);
    } else {
      // Shortest-angle return to 0
      const normalized = ((this.turntableAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
      this.turntableAngle = THREE.MathUtils.lerp(normalized, 0, this.reducedMotion ? 1 : 0.12);
    }

    // Tactile micro-click recoil on final assembly lock
    if (this.clickImpulse > 0.001) {
      this.clickImpulse *= Math.exp(-10 * dt);
    } else {
      this.clickImpulse = 0;
    }

    this.watch.root.rotation.y = this.turntableAngle + this.smoothPointerX * 0.08;
    this.watch.root.rotation.x = this.smoothPointerY * 0.05 + this.clickImpulse * 0.022;
    this.watch.root.position.y = -this.clickImpulse * 0.028;

    // Smooth camera interpolation (snaps cleanly in reduced motion)
    const camLerp = this.reducedMotion ? 1 : 1 - Math.exp(-7.5 * dt);
    this.camera.position.lerp(this.targetCamPos, camLerp);
    this.currentLookAt.lerp(this.targetLookAt, camLerp);

    if (Math.abs(this.camera.fov - this.targetFov) > 0.01) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, camLerp);
      this.camera.updateProjectionMatrix();
    }

    this.camera.lookAt(this.currentLookAt);

    // Keep studio spotlight aimed cleanly at active focal height
    this.studioSpot.target.position.copy(this.currentLookAt);
    this.studioSpot.position.set(
      this.currentLookAt.x - 2.6,
      this.currentLookAt.y + 5.6,
      this.currentLookAt.z + 3.2
    );

    // Update BokehPass focal distance to exact active layer distance
    const uniforms = this.bokehPass.uniforms as Record<string, THREE.IUniform<number>>;
    const focusDist = this.camera.position.distanceTo(this.currentLookAt);
    uniforms['focus'].value = THREE.MathUtils.lerp(uniforms['focus'].value, focusDist, 0.15);
    uniforms['aperture'].value = THREE.MathUtils.lerp(
      uniforms['aperture'].value,
      this.isMobile ? this.targetAperture * 0.55 : this.targetAperture,
      0.12
    );

    this.composer.render();
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    for (const key of LAYER_ORDER) {
      this.watch.layers[key].traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
    }
    this.renderer.dispose();
  }
}
