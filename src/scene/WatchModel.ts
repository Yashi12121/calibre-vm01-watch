import * as THREE from 'three';
import { LAYER_ORDER, LayerKey } from '../data/watchSpecs';
import {
  createCurvedStrapHalfGeometry,
  createDauphineHandGeometry,
  createDomedCrystalGeometry,
  createEscapeWheelGeometry,
  createGearGeometry,
  createHairspringGeometry,
  createRotorGeometry,
  createRotorMassRimGeometry,
  createSculptedLugGeometry,
} from './geometries';
import { createWatchMaterials, WatchMaterials } from './watchMaterials';

export class WatchModel {
  public readonly root = new THREE.Group();
  public readonly layers: Record<LayerKey, THREE.Group>;
  public readonly materials: WatchMaterials;

  // Animated horological sub-assemblies
  private rotorPivot = new THREE.Group();
  private balancePivot = new THREE.Group();
  private hairspringMesh!: THREE.Mesh;
  private escapeWheel = new THREE.Group();
  private fourthWheel = new THREE.Group();
  private thirdWheel = new THREE.Group();
  private centerWheel = new THREE.Group();
  private ratchetWheel = new THREE.Group();
  private barrelDrum = new THREE.Group();
  private hourHand = new THREE.Group();
  private minuteHand = new THREE.Group();
  private secondHand = new THREE.Group();

  // Base resting Y for each layer when assembled (0 explosion)
  private readonly assembledY: Record<LayerKey, number> = {
    strap: 0,
    caseBack: 0,
    rotor: 0,
    movementPlate: 0,
    gearTrain: 0,
    balanceWheel: 0,
    mainspringBarrel: 0,
    dial: 0,
    hands: 0,
    crystal: 0,
  };

  private rotorAngle = 0.65;
  private rotorVel = 0;
  private tickAccumulator = 0;
  private stepCount = 0;

  constructor() {
    this.materials = createWatchMaterials();
    this.layers = {
      strap: new THREE.Group(),
      caseBack: new THREE.Group(),
      rotor: new THREE.Group(),
      movementPlate: new THREE.Group(),
      gearTrain: new THREE.Group(),
      balanceWheel: new THREE.Group(),
      mainspringBarrel: new THREE.Group(),
      dial: new THREE.Group(),
      hands: new THREE.Group(),
      crystal: new THREE.Group(),
    };

    for (const key of LAYER_ORDER) {
      this.layers[key].name = `layer-${key}`;
      this.root.add(this.layers[key]);
    }

    this.buildStrap();
    this.buildCaseBack();
    this.buildRotor();
    this.buildMovementPlateAndMidCase();
    this.buildGearTrain();
    this.buildBalanceWheel();
    this.buildMainspringBarrel();
    this.buildDial();
    this.buildHands();
    this.buildCrystalAndBezel();
  }

  private addScrew(parent: THREE.Object3D, x: number, y: number, z: number, scale = 1): void {
    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028 * scale, 0.028 * scale, 0.016 * scale, 16),
      this.materials.bluedSteel
    );
    head.position.set(x, y, z);

    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.048 * scale, 0.008 * scale, 0.008 * scale),
      this.materials.darkChamber
    );
    slot.position.y = 0.006 * scale;
    head.add(slot);
    parent.add(head);
  }

  private addRubyJewel(parent: THREE.Object3D, x: number, y: number, z: number, radius = 0.036): void {
    const chaton = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.35, radius * 1.35, 0.014, 20),
      this.materials.champagneGold
    );
    chaton.position.set(x, y, z);
    parent.add(chaton);

    const jewel = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 0.9, 0.018, 20),
      this.materials.rubyJewel
    );
    jewel.position.set(x, y + 0.003, z);
    parent.add(jewel);
  }

  private buildStrap(): void {
    const g = this.layers.strap;

    // 12 o'clock & 6 o'clock leather halves
    const topStrapGeo = createCurvedStrapHalfGeometry(0.76, 0.66, 1.85, 0.13, -1);
    const bottomStrapGeo = createCurvedStrapHalfGeometry(0.76, 0.66, 1.85, 0.13, 1);

    const topStrap = new THREE.Mesh(topStrapGeo, this.materials.leatherStrap);
    const bottomStrap = new THREE.Mesh(bottomStrapGeo, this.materials.leatherStrap);
    g.add(topStrap, bottomStrap);

    // Quick-release spring bars at lug openings
    const barGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.84, 16);
    barGeo.rotateZ(Math.PI / 2);
    for (const zSign of [-1, 1]) {
      const bar = new THREE.Mesh(barGeo, this.materials.steelPolished);
      bar.position.set(0, -0.04, zSign * 1.46);
      g.add(bar);
    }

    // Folding 904L deployant clasp on 6 o'clock end
    const claspGroup = new THREE.Group();
    claspGroup.position.set(0, -0.82, 2.95);
    claspGroup.rotation.x = 0.42;

    const claspPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.055, 0.42),
      this.materials.steelBrushed
    );
    const claspBevel = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.022, 0.44),
      this.materials.steelPolished
    );
    claspBevel.position.y = 0.022;
    const claspShield = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.068, 24),
      this.materials.champagneGold
    );
    claspGroup.add(claspPlate, claspBevel, claspShield);
    g.add(claspGroup);

    // Dual leather keepers on 12 o'clock strap
    for (const zOff of [-2.05, -2.35]) {
      const keeper = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.16, 0.11),
        this.materials.leatherStrap
      );
      keeper.position.set(0, -0.3 + (zOff + 2.05) * 0.45, zOff);
      keeper.rotation.x = -0.38;
      g.add(keeper);
    }
  }

  private buildCaseBack(): void {
    const g = this.layers.caseBack;
    const yBase = -0.22;

    // Stepped 904L steel outer ring via LatheGeometry
    const ringPts = [
      new THREE.Vector2(1.1, yBase - 0.02),
      new THREE.Vector2(1.42, yBase - 0.02),
      new THREE.Vector2(1.44, yBase + 0.025),
      new THREE.Vector2(1.36, yBase + 0.05),
      new THREE.Vector2(1.12, yBase + 0.05),
      new THREE.Vector2(1.1, yBase - 0.02),
    ];
    const ringGeo = new THREE.LatheGeometry(ringPts, 72);
    const ring = new THREE.Mesh(ringGeo, this.materials.steelPolished);
    g.add(ring);

    // 6 spanner wrench notches around caseback perimeter
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const notch = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.024, 0.11),
        this.materials.steelBrushed
      );
      notch.position.set(Math.cos(a) * 1.28, yBase - 0.022, Math.sin(a) * 1.28);
      notch.rotation.y = -a;
      g.add(notch);
    }

    // Viton O-ring gasket seat
    const gasket = new THREE.Mesh(
      new THREE.TorusGeometry(1.34, 0.014, 12, 64),
      this.materials.darkChamber
    );
    gasket.rotation.x = Math.PI / 2;
    gasket.position.y = yBase + 0.048;
    g.add(gasket);

    // Exhibition sapphire crystal window
    const backGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.024, 64),
      this.materials.sapphireBack
    );
    backGlass.position.y = yBase + 0.014;
    g.add(backGlass);
  }

  private buildRotor(): void {
    const g = this.layers.rotor;
    const yBase = -0.14;

    this.rotorPivot.position.y = yBase;
    g.add(this.rotorPivot);

    // Openworked 18k champagne-gold oscillating bridge
    const blade = new THREE.Mesh(
      createRotorGeometry(1.12, 0.19, 0.026),
      this.materials.champagneBrushed
    );
    this.rotorPivot.add(blade);

    // Heavy 22k gold outer mass rim
    const massRim = new THREE.Mesh(
      createRotorMassRimGeometry(1.14, 0.96, 0.044),
      this.materials.champagneGold
    );
    this.rotorPivot.add(massRim);

    // Central steel bearing hub + 7 ceramic micro-balls
    const bearingRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.022, 14, 32),
      this.materials.steelPolished
    );
    bearingRing.rotation.x = Math.PI / 2;
    this.rotorPivot.add(bearingRing);

    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        this.materials.steelPolished
      );
      ball.position.set(Math.cos(a) * 0.115, 0, Math.sin(a) * 0.115);
      this.rotorPivot.add(ball);
    }

    const capScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.036, 24),
      this.materials.steelBrushed
    );
    this.rotorPivot.add(capScrew);
  }

  private buildMovementPlateAndMidCase(): void {
    const g = this.layers.movementPlate;

    // Mid-case body (outer barrel with chamfered edges)
    const casePts = [
      new THREE.Vector2(1.24, -0.17),
      new THREE.Vector2(1.44, -0.17),
      new THREE.Vector2(1.47, -0.08),
      new THREE.Vector2(1.47, 0.08),
      new THREE.Vector2(1.44, 0.16),
      new THREE.Vector2(1.24, 0.16),
      new THREE.Vector2(1.22, 0.06),
      new THREE.Vector2(1.22, -0.08),
      new THREE.Vector2(1.24, -0.17),
    ];
    const midCase = new THREE.Mesh(
      new THREE.LatheGeometry(casePts, 72),
      this.materials.steelBrushed
    );
    g.add(midCase);

    // Four sculpted curved tapered lugs (12 & 6 o'clock pairs)
    const lugGeo = createSculptedLugGeometry();
    const lugConfigs: { x: number; z: number; rotY: number }[] = [
      { x: -0.49, z: -1.16, rotY: Math.PI - 0.1 },
      { x: 0.49, z: -1.16, rotY: Math.PI + 0.1 },
      { x: -0.49, z: 1.16, rotY: 0.1 },
      { x: 0.49, z: 1.16, rotY: -0.1 },
    ];
    for (const cfg of lugConfigs) {
      const lug = new THREE.Mesh(lugGeo, this.materials.steelPolished);
      lug.position.set(cfg.x, -0.01, cfg.z);
      lug.rotation.y = cfg.rotY;
      g.add(lug);
    }

    // Fluted winding crown at 3 o'clock (+X)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(1.56, 0.0, 0);
    crownGroup.rotation.z = -Math.PI / 2;

    const crownTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.16, 20),
      this.materials.steelPolished
    );
    crownTube.position.y = -0.07;
    const crownBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.165, 0.14, 24),
      this.materials.champagneGold
    );
    crownBody.position.y = 0.04;

    // Crown flutes
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const flute = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.135, 0.022),
        this.materials.champagneBrushed
      );
      flute.position.set(Math.cos(a) * 0.162, 0.04, Math.sin(a) * 0.162);
      flute.rotation.y = -a;
      crownGroup.add(flute);
    }
    crownGroup.add(crownTube, crownBody);
    g.add(crownGroup);

    // Rhodium Perlage Mainplate
    const mainplate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.19, 1.19, 0.07, 64),
      this.materials.rhodiumPerlage
    );
    mainplate.position.y = -0.055;
    g.add(mainplate);

    // Stepped Geneva-striped movement bridges (3/4 plate architecture)
    const bridgeShape = new THREE.Shape();
    bridgeShape.absarc(0, 0, 1.1, -Math.PI * 0.65, Math.PI * 0.55, false);
    bridgeShape.lineTo(0.25, 0.1);
    bridgeShape.lineTo(-0.35, -0.1);
    bridgeShape.closePath();

    const bridgeGeo = new THREE.ExtrudeGeometry(bridgeShape, {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 36,
    });
    bridgeGeo.rotateX(-Math.PI / 2);

    const upperBridge = new THREE.Mesh(bridgeGeo, this.materials.rhodiumGeneva);
    upperBridge.position.set(0, -0.02, 0);
    g.add(upperBridge);

    // Ruby bearings & blued screws across the mainplate & bridge
    const jewelCoords: [number, number][] = [
      [0, 0],
      [-0.52, 0.3],
      [0, 0.54],
      [0.46, 0.46],
      [-0.46, -0.34],
      [0.56, -0.2],
    ];
    for (const [jx, jz] of jewelCoords) {
      this.addRubyJewel(g, jx, 0.02, jz, 0.034);
    }

    const screwCoords: [number, number][] = [
      [-0.75, -0.15],
      [-0.25, -0.82],
      [0.38, -0.78],
      [0.86, 0.15],
      [0.24, 0.88],
      [-0.68, 0.62],
    ];
    for (const [sx, sz] of screwCoords) {
      this.addScrew(g, sx, 0.024, sz, 1.0);
    }
  }

  private buildGearTrain(): void {
    const g = this.layers.gearTrain;
    const yGear = 0.035;

    // 1. Center Wheel (60T)
    this.centerWheel.position.set(0, yGear, 0);
    const centerMesh = new THREE.Mesh(
      createGearGeometry({
        teeth: 48,
        outerRadius: 0.41,
        rootRadius: 0.37,
        rimInnerRadius: 0.31,
        hubRadius: 0.11,
        boreRadius: 0.035,
        thickness: 0.024,
        spokes: 5,
      }),
      this.materials.brassGear
    );
    const centerPinion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.09, 16),
      this.materials.steelPolished
    );
    this.centerWheel.add(centerMesh, centerPinion);
    g.add(this.centerWheel);

    // 2. Third Wheel (36T)
    this.thirdWheel.position.set(-0.52, yGear + 0.015, 0.3);
    const thirdMesh = new THREE.Mesh(
      createGearGeometry({
        teeth: 36,
        outerRadius: 0.29,
        rootRadius: 0.255,
        rimInnerRadius: 0.205,
        hubRadius: 0.08,
        boreRadius: 0.025,
        thickness: 0.022,
        spokes: 4,
      }),
      this.materials.champagneGold
    );
    const thirdPinion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.08, 16),
      this.materials.steelPolished
    );
    this.thirdWheel.add(thirdMesh, thirdPinion);
    g.add(this.thirdWheel);

    // 3. Fourth Wheel (Sweep Seconds Wheel, 32T)
    this.fourthWheel.position.set(0, yGear - 0.005, 0.54);
    const fourthMesh = new THREE.Mesh(
      createGearGeometry({
        teeth: 32,
        outerRadius: 0.25,
        rootRadius: 0.22,
        rimInnerRadius: 0.175,
        hubRadius: 0.068,
        boreRadius: 0.022,
        thickness: 0.02,
        spokes: 4,
      }),
      this.materials.brassGear
    );
    const fourthPinion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.08, 16),
      this.materials.steelPolished
    );
    this.fourthWheel.add(fourthMesh, fourthPinion);
    g.add(this.fourthWheel);

    // 4. Club-Toothed Escape Wheel (15T)
    this.escapeWheel.position.set(0.46, yGear + 0.01, 0.46);
    const escapeMesh = new THREE.Mesh(
      createEscapeWheelGeometry(15, 0.205, 0.145, 0.018),
      this.materials.steelPolished
    );
    const escapeCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.06, 16),
      this.materials.rubyJewel
    );
    this.escapeWheel.add(escapeMesh, escapeCap);
    g.add(this.escapeWheel);
  }

  private buildBalanceWheel(): void {
    const g = this.layers.balanceWheel;
    const bx = 0.56;
    const bz = -0.2;
    const yBase = 0.05;

    const unit = new THREE.Group();
    unit.position.set(bx, yBase, bz);
    g.add(unit);

    // Balance wheel pivot
    unit.add(this.balancePivot);

    // Glucydur / Champagne-gold balance rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.026, 16, 48),
      this.materials.champagneGold
    );
    rim.rotation.x = Math.PI / 2;
    this.balancePivot.add(rim);

    // 2 sculpted cross arms + 4 inertia weights
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.018, 0.034),
      this.materials.champagneBrushed
    );
    this.balancePivot.add(arm);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const weight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.036, 12),
        this.materials.steelPolished
      );
      weight.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
      this.balancePivot.add(weight);
    }

    // Balance staff + ruby Incabloc shock setting
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.11, 16),
      this.materials.steelPolished
    );
    this.balancePivot.add(staff);

    // Overcoil Hairspring
    this.hairspringMesh = new THREE.Mesh(
      createHairspringGeometry(5.5, 0.055, 0.21, 0.0065),
      this.materials.bluedSteel
    );
    this.hairspringMesh.position.y = 0.032;
    unit.add(this.hairspringMesh);

    // Sculpted Balance Cock Bridge anchored above
    const cockArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.024, 0.16),
      this.materials.rhodiumGeneva
    );
    cockArm.position.set(0.18, 0.068, -0.05);
    cockArm.rotation.y = -0.25;
    unit.add(cockArm);

    this.addRubyJewel(unit, 0, 0.075, 0, 0.042);
    this.addScrew(unit, 0.38, 0.084, -0.1, 0.9);
  }

  private buildMainspringBarrel(): void {
    const g = this.layers.mainspringBarrel;
    const mx = -0.46;
    const mz = -0.34;
    const yBase = 0.025;

    const unit = new THREE.Group();
    unit.position.set(mx, yBase, mz);
    g.add(unit);

    // Barrel drum (with outer gear teeth for center wheel drive)
    this.barrelDrum.add(
      new THREE.Mesh(
        createGearGeometry({
          teeth: 52,
          outerRadius: 0.48,
          rootRadius: 0.445,
          rimInnerRadius: 0.4,
          hubRadius: 0.4,
          boreRadius: 0,
          thickness: 0.065,
          spokes: 0,
          bevel: true,
        }),
        this.materials.champagneBrushed
      )
    );

    // Recessed chamber + visible Nivaflex coiled mainspring inside
    const chamberFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.41, 0.41, 0.015, 48),
      this.materials.darkChamber
    );
    chamberFloor.position.y = -0.02;
    this.barrelDrum.add(chamberFloor);

    const coilSpring = new THREE.Mesh(
      createHairspringGeometry(6.5, 0.11, 0.37, 0.011),
      this.materials.mainspringSteel
    );
    coilSpring.position.y = 0.012;
    this.barrelDrum.add(coilSpring);

    unit.add(this.barrelDrum);

    // Openworked Ratchet Wheel on top of the barrel arbor
    this.ratchetWheel.position.y = 0.065;
    const ratchetMesh = new THREE.Mesh(
      createGearGeometry({
        teeth: 36,
        outerRadius: 0.36,
        rootRadius: 0.32,
        rimInnerRadius: 0.255,
        hubRadius: 0.09,
        boreRadius: 0.032,
        thickness: 0.024,
        spokes: 3,
      }),
      this.materials.steelPolished
    );
    this.ratchetWheel.add(ratchetMesh);
    this.addScrew(this.ratchetWheel, 0, 0.018, 0, 1.35);
    unit.add(this.ratchetWheel);
  }

  private buildDial(): void {
    const g = this.layers.dial;
    const yBase = 0.115;

    // Main galvanic obsidian sunburst dial disc
    const dialDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.23, 1.23, 0.024, 72),
      this.materials.dialFace
    );
    // Align texture 12 o'clock along -Z
    dialDisc.rotation.y = Math.PI;
    dialDisc.position.y = yBase;
    g.add(dialDisc);

    // Outer sloped champagne chapter ring
    const chapterRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.018, 12, 72),
      this.materials.champagneGold
    );
    chapterRing.rotation.x = Math.PI / 2;
    chapterRing.position.y = yBase + 0.014;
    g.add(chapterRing);

    // 12 Applied faceted 18k champagne-gold baton indices
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 0.96;
      if (i === 0) {
        // Double baton at 12 o'clock (-Z)
        for (const xShift of [-0.026, 0.026]) {
          const baton = new THREE.Mesh(
            new THREE.BoxGeometry(0.028, 0.022, 0.19),
            this.materials.champagneGold
          );
          baton.position.set(xShift, yBase + 0.022, -r);
          g.add(baton);
        }
      } else {
        const isCardinal = i === 3 || i === 6 || i === 9;
        const len = i === 6 ? 0.11 : isCardinal ? 0.18 : 0.15;
        const baton = new THREE.Mesh(
          new THREE.BoxGeometry(isCardinal ? 0.034 : 0.024, 0.02, len),
          this.materials.champagneGold
        );
        const radius = i === 6 ? 1.06 : r;
        baton.position.set(Math.sin(a) * radius, yBase + 0.022, -Math.cos(a) * radius);
        baton.rotation.y = -a;
        g.add(baton);
      }
    }
  }

  private buildHands(): void {
    const g = this.layers.hands;

    // Hour Hand
    this.hourHand.position.y = 0.152;
    this.hourHand.add(
      new THREE.Mesh(
        createDauphineHandGeometry(0.68, 0.12, 0.048, 0.018),
        this.materials.champagneGold
      )
    );
    this.hourHand.rotation.y = -0.95; // ~10:10 aesthetic starting angle

    // Minute Hand
    this.minuteHand.position.y = 0.174;
    this.minuteHand.add(
      new THREE.Mesh(
        createDauphineHandGeometry(1.02, 0.14, 0.036, 0.016),
        this.materials.champagneGold
      )
    );
    this.minuteHand.rotation.y = 1.05;

    // Sweep Seconds Hand
    this.secondHand.position.y = 0.194;
    const secShaft = new THREE.Mesh(
      new THREE.BoxGeometry(0.011, 0.008, 1.32),
      this.materials.champagneGold
    );
    secShaft.position.z = -0.38;
    const counterweight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.01, 20),
      this.materials.champagneGold
    );
    counterweight.position.z = 0.28;
    this.secondHand.add(secShaft, counterweight);

    // Central Cannon Pinion Cap
    const centerCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.062, 0.068, 24),
      this.materials.champagneGold
    );
    centerCap.position.y = 0.172;

    g.add(this.hourHand, this.minuteHand, this.secondHand, centerCap);
  }

  private buildCrystalAndBezel(): void {
    const g = this.layers.crystal;

    // Mirror-polished stepped 904L bezel ring
    const bezelPts = [
      new THREE.Vector2(1.23, 0.155),
      new THREE.Vector2(1.44, 0.155),
      new THREE.Vector2(1.45, 0.21),
      new THREE.Vector2(1.36, 0.255),
      new THREE.Vector2(1.25, 0.255),
      new THREE.Vector2(1.23, 0.155),
    ];
    const bezel = new THREE.Mesh(
      new THREE.LatheGeometry(bezelPts, 72),
      this.materials.steelPolished
    );
    g.add(bezel);

    // Subtle champagne inner tension flange
    const tensionRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.245, 0.012, 12, 72),
      this.materials.champagneGold
    );
    tensionRing.rotation.x = Math.PI / 2;
    tensionRing.position.y = 0.19;
    g.add(tensionRing);

    // Domed Sapphire Crystal
    const dome = new THREE.Mesh(
      createDomedCrystalGeometry(1.26, 0.14),
      this.materials.sapphireCrystal
    );
    dome.position.y = 0.21;
    g.add(dome);
  }

  public applyScrollImpulse(velocity: number): void {
    this.rotorVel += velocity * 0.0028;
    this.rotorVel = THREE.MathUtils.clamp(this.rotorVel, -2.5, 2.5);
  }

  public setLayerYOffsets(offsets: Record<LayerKey, number>): void {
    for (const key of LAYER_ORDER) {
      this.layers[key].position.y = this.assembledY[key] + offsets[key];
    }
  }

  /**
   * Real-time horological kinematics: runs continuously even when layers are exploded.
   * Returns true on each 8 Hz escapement beat (can trigger subtle optional audio click).
   */
  public tick(dt: number, elapsed: number, reducedMotion: boolean): boolean {
    if (reducedMotion) {
      // Static calm inspection pose in reduced motion
      this.balancePivot.rotation.y = 0.18;
      this.hairspringMesh.scale.set(1, 1, 1);
      return false;
    }

    // 4 Hz Balance Wheel oscillation (28,800 vph = 8 half-oscillations / sec)
    const omega = Math.PI * 2 * 4.0;
    const balanceAngle = Math.sin(elapsed * omega) * 1.15;
    this.balancePivot.rotation.y = balanceAngle;

    // Hairspring breathes radially in phase with the balance wheel
    const springBreath = 1 + Math.sin(elapsed * omega) * 0.048;
    this.hairspringMesh.scale.set(springBreath, 1, springBreath);

    // 8 Hz Escape Wheel & Sweep Seconds stepping (smooth mechanical impulse)
    const beatPeriod = 1 / 8;
    this.tickAccumulator += dt;
    let stepped = false;
    while (this.tickAccumulator >= beatPeriod) {
      this.tickAccumulator -= beatPeriod;
      this.stepCount += 1;
      stepped = true;
    }

    // Smooth micro-interpolation on each 1/8s beat for crisp Swiss sweep feel
    const subPhase = THREE.MathUtils.clamp(this.tickAccumulator / beatPeriod, 0, 1);
    const smoothStep = this.stepCount + Math.pow(subPhase, 0.45);

    // Escape wheel (15 teeth, 2 beats per tooth -> 30 beats/rev)
    this.escapeWheel.rotation.y = -smoothStep * ((Math.PI * 2) / 30);

    // Going train intermeshing gear ratios (accelerated slightly for visual clarity while maintaining exact mesh direction)
    this.fourthWheel.rotation.y = smoothStep * ((Math.PI * 2) / 480) * 6;
    this.thirdWheel.rotation.y = -this.fourthWheel.rotation.y * 0.65;
    this.centerWheel.rotation.y = this.thirdWheel.rotation.y * 0.42;
    this.barrelDrum.rotation.y = -this.centerWheel.rotation.y * 0.35;
    this.ratchetWheel.rotation.y = this.barrelDrum.rotation.y;

    // Hands: Sweep seconds ticks at 8 beats/sec (60 sec = 480 beats)
    this.secondHand.rotation.y = -smoothStep * ((Math.PI * 2) / 480);
    this.minuteHand.rotation.y = 1.05 - elapsed * 0.0025;
    this.hourHand.rotation.y = -0.95 - elapsed * 0.00021;

    // Rotor gentle gravity pendulum + scroll inertia
    const gravityTorque = -Math.sin(this.rotorAngle) * 2.8;
    this.rotorVel += gravityTorque * dt;
    this.rotorVel *= Math.exp(-1.85 * dt);
    this.rotorAngle += this.rotorVel * dt;
    this.rotorPivot.rotation.y = this.rotorAngle;

    return stepped;
  }
}
