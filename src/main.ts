import './styles/main.css';
import { ClickSoundEngine } from './audio/ClickSound';
import { WatchScene } from './scene/WatchScene';
import { ScrollChoreographer } from './scroll/ScrollChoreographer';
import { HudController } from './ui/HudController';

function bootstrap(): void {
  const canvas = document.getElementById('watch-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Missing #watch-canvas element');
  }

  const sound = new ClickSoundEngine();
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionMedia.matches;

  const watchScene = new WatchScene(canvas, () => {
    if (sound.enabled) {
      sound.playEscapementTick();
    }
  });
  watchScene.setReducedMotion(reducedMotion);

  let choreographer: ScrollChoreographer;

  const hud = new HudController((stageIndex) => {
    choreographer.scrollToStage(stageIndex);
  });

  choreographer = new ScrollChoreographer(watchScene, hud, reducedMotion, () => {
    if (sound.enabled) {
      sound.playLockClick();
    }
  });

  // Sync reduced motion toggle UI
  const motionToggle = document.getElementById('motion-toggle') as HTMLButtonElement | null;
  const motionLabel = document.getElementById('motion-label');
  const applyReducedMotionUI = (enabled: boolean) => {
    reducedMotion = enabled;
    document.documentElement.classList.toggle('reduced-motion', enabled);
    if (motionToggle) {
      motionToggle.setAttribute('aria-pressed', String(enabled));
    }
    if (motionLabel) {
      motionLabel.textContent = enabled ? 'Motion: Reduced' : 'Motion: Full';
    }
    choreographer.setReducedMotion(enabled);
  };

  applyReducedMotionUI(reducedMotion);

  motionToggle?.addEventListener('click', () => {
    applyReducedMotionUI(!reducedMotion);
  });

  motionMedia.addEventListener('change', (e) => {
    applyReducedMotionUI(e.matches);
  });

  // Sound toggle UI
  const soundToggle = document.getElementById('sound-toggle') as HTMLButtonElement | null;
  const soundLabel = document.getElementById('sound-label');
  const wave1 = document.getElementById('sound-wave-1');
  const wave2 = document.getElementById('sound-wave-2');

  const syncSoundUI = (enabled: boolean) => {
    soundToggle?.setAttribute('aria-pressed', String(enabled));
    if (soundLabel) {
      soundLabel.textContent = enabled ? 'Sound: On' : 'Sound: Off';
    }
    if (wave1) wave1.style.opacity = enabled ? '1' : '0.25';
    if (wave2) wave2.style.opacity = enabled ? '1' : '0.25';
  };
  syncSoundUI(false);

  soundToggle?.addEventListener('click', () => {
    const enabled = sound.toggle();
    syncSoundUI(enabled);
  });

  // Brand Home & Finale Replay
  const brandHome = document.getElementById('brand-home');
  brandHome?.addEventListener('click', (e) => {
    e.preventDefault();
    choreographer.scrollToStage(0);
  });

  const replayBtn = document.getElementById('replay-btn');
  replayBtn?.addEventListener('click', () => {
    choreographer.scrollToStage(0);
  });
}

bootstrap();
