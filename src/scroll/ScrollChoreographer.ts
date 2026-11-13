import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';
import {
  CameraPose,
  LAYER_EXPLODED_Y,
  LAYER_ORDER,
  LayerKey,
  WATCH_STAGES,
} from '../data/watchSpecs';
import { WatchScene } from '../scene/WatchScene';
import { HudController } from '../ui/HudController';

gsap.registerPlugin(ScrollTrigger);

interface SectionBounds {
  top: number;
  height: number;
  dwellScrollY: number;
}

export class ScrollChoreographer {
  private lenis: Lenis;
  private watchScene: WatchScene;
  private hud: HudController;
  private onLockClick?: () => void;

  private sectionBounds: SectionBounds[] = [];
  private reducedMotion = false;
  private wasLocked = false;
  private scrollTriggerInstance: ScrollTrigger | null = null;
  private lastProgress = 0;

  constructor(
    watchScene: WatchScene,
    hud: HudController,
    reducedMotion: boolean,
    onLockClick?: () => void
  ) {
    this.watchScene = watchScene;
    this.hud = hud;
    this.reducedMotion = reducedMotion;
    this.onLockClick = onLockClick;

    this.lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reducedMotion,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.15,
    });

    this.lenis.on('scroll', ({ velocity }: { velocity: number }) => {
      ScrollTrigger.update();
      if (!this.reducedMotion) {
        this.watchScene.watch.applyScrollImpulse(velocity);
      }
    });

    gsap.ticker.add(this.onTick);
    gsap.ticker.lagSmoothing(0);

    this.measureSections();
    this.setupScrollTrigger();
    window.addEventListener('resize', this.handleResize);

    // Initial evaluation
    this.evaluateAtProgress(0, true);
  }

  private onTick = (time: number): void => {
    if (!this.reducedMotion) {
      this.lenis.raf(time * 1000);
    }
    this.watchScene.renderFrame();
  };

  private handleResize = (): void => {
    this.measureSections();
    ScrollTrigger.refresh();
    this.evaluateAtProgress(this.lastProgress, true);
  };

  private measureSections(): void {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.scroll-section'));
    this.sectionBounds = els.map((el, idx) => {
      const top = el.offsetTop;
      const height = el.offsetHeight;
      let dwellScrollY = top + height * 0.56;
      if (idx === 0) dwellScrollY = 0;
      if (idx === els.length - 1) {
        dwellScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      }
      return { top, height, dwellScrollY };
    });
  }

  private setupScrollTrigger(): void {
    this.scrollTriggerInstance?.kill();
    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: '#scroll-track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        this.lastProgress = self.progress;
        this.evaluateAtProgress(self.progress, false);
      },
    });
  }

  public setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    this.watchScene.setReducedMotion(value);
    if (value) {
      this.lenis.stop();
    } else {
      this.lenis.start();
    }
    this.evaluateAtProgress(this.lastProgress, true);
  }

  public scrollToStage(stageIndex: number): void {
    const clamped = Math.max(0, Math.min(WATCH_STAGES.length - 1, stageIndex));
    const targetY = this.sectionBounds[clamped]?.dwellScrollY ?? 0;

    if (this.reducedMotion) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      this.evaluateAtProgress(targetY / maxScroll, true);
    } else {
      this.lenis.scrollTo(targetY, {
        duration: 1.35,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
    }
  }

  /**
   * Maps global scroll progress [0..1] into a continuous stage coordinate [0..11]
   * with a smooth macro-pause plateau inside each component section (stages 1..10).
   */
  private computeStageFloat(scrollY: number): { stageFloat: number; inDwell: boolean } {
    if (this.sectionBounds.length < 12) {
      return { stageFloat: 0, inDwell: false };
    }

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const y = THREE.MathUtils.clamp(scrollY, 0, maxScroll);

    // Stage 0 (Hero): stays at 0 until 45% through hero, then transitions 0 -> 1 into stage-1 dwell
    for (let i = 0; i < this.sectionBounds.length; i++) {
      const sec = this.sectionBounds[i];
      const secEnd = sec.top + sec.height;

      if (i === 0 && y < sec.top + sec.height * 0.45) {
        return { stageFloat: 0, inDwell: true };
      }

      if (i >= 1 && i <= 10) {
        const transStart = i === 1
          ? this.sectionBounds[0].top + this.sectionBounds[0].height * 0.45
          : this.sectionBounds[i - 1].top + this.sectionBounds[i - 1].height * 0.82;
        const dwellStart = sec.top + sec.height * 0.36;
        const dwellEnd = sec.top + sec.height * 0.82;

        if (y >= transStart && y < dwellStart) {
          const t = THREE.MathUtils.clamp((y - transStart) / Math.max(1, dwellStart - transStart), 0, 1);
          const eased = t * t * (3 - 2 * t);
          return { stageFloat: i - 1 + eased, inDwell: eased > 0.72 };
        }

        if (y >= dwellStart && y <= dwellEnd) {
          return { stageFloat: i, inDwell: true };
        }
      }

      if (i === 11) {
        const transStart = this.sectionBounds[10].top + this.sectionBounds[10].height * 0.82;
        if (y >= transStart || y >= secEnd - window.innerHeight) {
          const t = THREE.MathUtils.clamp((y - transStart) / Math.max(1, maxScroll - transStart), 0, 1);
          return { stageFloat: 10 + t, inDwell: false };
        }
      }
    }

    return { stageFloat: 11, inDwell: false };
  }

  private computeLayerOffsets(stageFloat: number): {
    offsets: Record<LayerKey, number>;
    locked: boolean;
  } {
    const offsets = {} as Record<LayerKey, number>;

    // Stages 0..10: progressive layer-by-layer vertical explosion
    if (stageFloat <= 10) {
      for (let idx = 0; idx < LAYER_ORDER.length; idx++) {
        const key = LAYER_ORDER[idx];
        const targetY = LAYER_EXPLODED_Y[key];
        const layerStage = idx + 1;

        if (stageFloat >= layerStage) {
          // Already peeled / separated to its exploded position
          offsets[key] = targetY;
        } else if (stageFloat > layerStage - 1) {
          // Currently peeling open toward its exploded position
          const t = stageFloat - (layerStage - 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const startY = idx >= 3 ? this.upperStackLift(stageFloat - t) : 0;
          offsets[key] = THREE.MathUtils.lerp(startY, targetY, eased);
        } else {
          // Still nested in the upper watch assembly above the active gap
          offsets[key] = idx >= 3 ? this.upperStackLift(stageFloat) : 0;
        }
      }
      return { offsets, locked: false };
    }

    // Stage 10..11: Smooth reassembly + crisp tactile "click" at t = 0.72
    const tFinale = THREE.MathUtils.clamp(stageFloat - 10, 0, 1);
    const clickPoint = 0.72;
    let collapseScale = 1;
    let locked = false;

    if (tFinale < clickPoint) {
      const u = tFinale / clickPoint;
      // Ease into slight 0.04 preload just before final click snap
      const eased = u * u * (3 - 2 * u);
      collapseScale = THREE.MathUtils.lerp(1, 0.035, eased);
    } else {
      locked = true;
      const snapU = THREE.MathUtils.clamp((tFinale - clickPoint) / 0.14, 0, 1);
      // Crisp micro-overshoot bounce for mechanical latch click
      collapseScale = snapU < 1 ? 0.035 * (1 - snapU) - Math.sin(snapU * Math.PI) * 0.012 : 0;
    }

    for (const key of LAYER_ORDER) {
      offsets[key] = LAYER_EXPLODED_Y[key] * collapseScale;
    }

    return { offsets, locked };
  }

  /**
   * Lifts yet-unseparated upper layers out of the way once the movement opens (stage >= 3.x),
   * keeping the currently inspected layer visually unobstructed from above.
   */
  private upperStackLift(stageFloat: number): number {
    if (stageFloat <= 3) return 0;
    const u = THREE.MathUtils.clamp((stageFloat - 3) / 7, 0, 1);
    return THREE.MathUtils.lerp(0.85, 3.25, u);
  }

  private evaluateAtProgress(overallProgress: number, snapCamera: boolean): void {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollY = overallProgress * maxScroll;
    const { stageFloat, inDwell } = this.computeStageFloat(scrollY);

    const lowIdx = Math.floor(THREE.MathUtils.clamp(stageFloat, 0, 11));
    const highIdx = Math.min(11, lowIdx + 1);
    const alpha = stageFloat - lowIdx;

    const isMobile = this.watchScene.getIsMobile();
    const poseA: CameraPose = isMobile
      ? WATCH_STAGES[lowIdx].mobileCamera
      : WATCH_STAGES[lowIdx].desktopCamera;
    const poseB: CameraPose = isMobile
      ? WATCH_STAGES[highIdx].mobileCamera
      : WATCH_STAGES[highIdx].desktopCamera;

    const pos: [number, number, number] = [
      THREE.MathUtils.lerp(poseA.position[0], poseB.position[0], alpha),
      THREE.MathUtils.lerp(poseA.position[1], poseB.position[1], alpha),
      THREE.MathUtils.lerp(poseA.position[2], poseB.position[2], alpha),
    ];
    const target: [number, number, number] = [
      THREE.MathUtils.lerp(poseA.target[0], poseB.target[0], alpha),
      THREE.MathUtils.lerp(poseA.target[1], poseB.target[1], alpha),
      THREE.MathUtils.lerp(poseA.target[2], poseB.target[2], alpha),
    ];
    const fov = THREE.MathUtils.lerp(poseA.fov, poseB.fov, alpha);
    const aperture = THREE.MathUtils.lerp(poseA.aperture, poseB.aperture, alpha);
    const turntableWeight = Math.max(0, 1 - stageFloat * 2.2);

    const { offsets, locked } = this.computeLayerOffsets(stageFloat);

    if (locked && !this.wasLocked) {
      this.watchScene.triggerClickImpulse();
      this.onLockClick?.();
    }
    this.wasLocked = locked;

    this.watchScene.setPose(pos, target, fov, aperture, turntableWeight, offsets, snapCamera);
    this.hud.update(stageFloat, inDwell, overallProgress, locked);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    gsap.ticker.remove(this.onTick);
    this.scrollTriggerInstance?.kill();
    this.lenis.destroy();
  }
}
