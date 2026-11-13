import { WATCH_STAGES, WatchStageSpec } from '../data/watchSpecs';

export class HudController {
  private heroEl: HTMLElement;
  private panelEl: HTMLElement;
  private finaleEl: HTMLElement;
  private lockBadgeEl: HTMLElement;
  private lockTextEl: HTMLElement;
  private clickFlashEl: HTMLElement;

  private stepEl: HTMLElement;
  private tagEl: HTMLElement;
  private nameEl: HTMLElement;
  private fnEl: HTMLElement;
  private specLabelEl: HTMLElement;
  private specValueEl: HTMLElement;

  private railFillEl: HTMLElement;
  private railButtons: HTMLButtonElement[] = [];
  private mobileIndexEl: HTMLElement;
  private mobileNameEl: HTMLElement;

  private activeStage = -1;
  private isLocked = false;

  constructor(onSelectStage: (stageIndex: number) => void) {
    this.heroEl = this.mustGet('hud-hero');
    this.panelEl = this.mustGet('hud-panel');
    this.finaleEl = this.mustGet('hud-finale');
    this.lockBadgeEl = this.mustGet('lock-badge');
    this.lockTextEl = this.mustGet('lock-text');
    this.clickFlashEl = this.mustGet('click-flash');

    this.stepEl = this.mustGet('panel-step');
    this.tagEl = this.mustGet('panel-layer-tag');
    this.nameEl = this.mustGet('panel-name');
    this.fnEl = this.mustGet('panel-function');
    this.specLabelEl = this.mustGet('panel-spec-label');
    this.specValueEl = this.mustGet('panel-spec-value');

    this.railFillEl = this.mustGet('rail-fill');
    this.mobileIndexEl = this.mustGet('mobile-stage-index');
    this.mobileNameEl = this.mustGet('mobile-stage-name');

    this.buildProgressRail(onSelectStage);
  }

  private mustGet(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing DOM element #${id}`);
    return el;
  }

  private buildProgressRail(onSelectStage: (stageIndex: number) => void): void {
    const list = this.mustGet('rail-list');
    list.innerHTML = '';

    for (const stage of WATCH_STAGES) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item-btn';
      btn.dataset.stage = String(stage.stageIndex);
      btn.setAttribute('aria-label', `Jump to ${stage.shortName}`);

      const label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = stage.shortName;

      const pip = document.createElement('span');
      pip.className = 'rail-item-pip';
      pip.setAttribute('aria-hidden', 'true');

      btn.append(label, pip);
      btn.addEventListener('click', () => onSelectStage(stage.stageIndex));

      li.appendChild(btn);
      list.appendChild(li);
      this.railButtons.push(btn);
    }
  }

  public update(
    stageFloat: number,
    inDwellZone: boolean,
    overallProgress: number,
    reassemblyLocked: boolean
  ): void {
    this.railFillEl.style.height = `${(overallProgress * 100).toFixed(2)}%`;

    const nearestStage = Math.round(stageFloat);
    const clampedStage = Math.max(0, Math.min(WATCH_STAGES.length - 1, nearestStage));
    const stageSpec = WATCH_STAGES[clampedStage];

    if (clampedStage !== this.activeStage) {
      this.activeStage = clampedStage;
      this.syncRailActive(stageSpec);
      if (clampedStage >= 1 && clampedStage <= 10) {
        this.applyPanelContent(stageSpec);
      }
    }

    // Hero visibility
    const showHero = stageFloat < 0.38;
    this.heroEl.classList.toggle('is-visible', showHero);
    this.heroEl.setAttribute('aria-hidden', String(!showHero));

    // Component macro panel visibility (fades in when settled near/inside a component stage)
    const showPanel = clampedStage >= 1 && clampedStage <= 10 && inDwellZone;
    this.panelEl.classList.toggle('is-visible', showPanel);
    this.panelEl.setAttribute('aria-hidden', String(!showPanel));

    // Finale visibility
    const showFinale = stageFloat > 10.35;
    this.finaleEl.classList.toggle('is-visible', showFinale);
    this.finaleEl.setAttribute('aria-hidden', String(!showFinale));

    // Lock click state
    if (reassemblyLocked !== this.isLocked) {
      this.isLocked = reassemblyLocked;
      this.lockBadgeEl.classList.toggle('is-locked', reassemblyLocked);
      this.lockTextEl.textContent = reassemblyLocked
        ? 'Calibre Locked · 0.002 mm'
        : 'Reassembling Calibre';

      if (reassemblyLocked) {
        this.clickFlashEl.classList.remove('is-pulsing');
        void this.clickFlashEl.offsetWidth;
        this.clickFlashEl.classList.add('is-pulsing');
      }
    }
  }

  private syncRailActive(spec: WatchStageSpec): void {
    for (const btn of this.railButtons) {
      const idx = Number(btn.dataset.stage);
      if (idx === spec.stageIndex) {
        btn.setAttribute('aria-current', 'step');
      } else {
        btn.removeAttribute('aria-current');
      }
    }
    this.mobileIndexEl.textContent = String(spec.stageIndex).padStart(2, '0');
    this.mobileNameEl.textContent = spec.shortName;
  }

  private applyPanelContent(spec: WatchStageSpec): void {
    this.stepEl.textContent = spec.stepLabel;
    this.tagEl.textContent = spec.tag;
    this.nameEl.textContent = spec.name;
    this.fnEl.textContent = spec.fn;
    this.specLabelEl.textContent = spec.specLabel;
    this.specValueEl.textContent = spec.specValue;
    this.panelEl.classList.toggle('is-right', spec.panelSide === 'right');
  }
}
