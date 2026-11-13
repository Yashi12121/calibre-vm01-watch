export type LayerKey =
  | 'strap'
  | 'caseBack'
  | 'rotor'
  | 'movementPlate'
  | 'gearTrain'
  | 'balanceWheel'
  | 'mainspringBarrel'
  | 'dial'
  | 'hands'
  | 'crystal';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  aperture: number;
}

export interface WatchStageSpec {
  stageIndex: number;
  id: string;
  layerKey?: LayerKey;
  stepLabel: string;
  shortName: string;
  tag: string;
  name: string;
  fn: string;
  specLabel: string;
  specValue: string;
  explodedY: number;
  panelSide: 'left' | 'right';
  desktopCamera: CameraPose;
  mobileCamera: CameraPose;
}

export const LAYER_ORDER: LayerKey[] = [
  'strap',
  'caseBack',
  'rotor',
  'movementPlate',
  'gearTrain',
  'balanceWheel',
  'mainspringBarrel',
  'dial',
  'hands',
  'crystal',
];

export const LAYER_EXPLODED_Y: Record<LayerKey, number> = {
  strap: -2.55,
  caseBack: -1.85,
  rotor: -1.25,
  movementPlate: -0.62,
  gearTrain: 0.02,
  balanceWheel: 0.65,
  mainspringBarrel: 1.28,
  dial: 1.9,
  hands: 2.42,
  crystal: 3.02,
};

export const WATCH_STAGES: WatchStageSpec[] = [
  {
    stageIndex: 0,
    id: 'stage-hero',
    stepLabel: '00',
    shortName: 'Overview',
    tag: 'Assembled',
    name: 'Calibre VM-01',
    fn: 'Self-winding manufacture chronometer in 904L steel and 18k champagne gold.',
    specLabel: 'Power Reserve',
    specValue: '72 Hours · 28,800 vph',
    explodedY: 0,
    panelSide: 'left',
    desktopCamera: {
      position: [2.1, 2.55, 4.9],
      target: [-0.42, -0.1, 0.05],
      fov: 35,
      aperture: 0.00014,
    },
    mobileCamera: {
      position: [0.2, 3.25, 6.45],
      target: [0, -0.82, 0],
      fov: 44,
      aperture: 0.00012,
    },
  },
  {
    stageIndex: 1,
    id: 'stage-1',
    layerKey: 'strap',
    stepLabel: '01 / 10',
    shortName: 'Strap',
    tag: 'Exterior',
    name: 'Hand-Stitched Strap',
    fn: 'Full-grain midnight calfskin lined in supple Nubuck with a twin-trigger 904L deployant clasp.',
    specLabel: 'Lug Architecture',
    specValue: '20 mm Taper · Quick-Release Spring Bars',
    explodedY: LAYER_EXPLODED_Y.strap,
    panelSide: 'left',
    desktopCamera: {
      position: [2.35, -1.65, 3.85],
      target: [-0.55, -2.55, 0.25],
      fov: 34,
      aperture: 0.00028,
    },
    mobileCamera: {
      position: [0.35, -1.25, 4.8],
      target: [0, -2.8, 0],
      fov: 40,
      aperture: 0.00015,
    },
  },
  {
    stageIndex: 2,
    id: 'stage-2',
    layerKey: 'caseBack',
    stepLabel: '02 / 10',
    shortName: 'Case Back',
    tag: 'Enclosure',
    name: 'Exhibition Case Back',
    fn: 'Screw-down 904L steel bezel framing a flat sapphire aperture for unobstructed movement inspection.',
    specLabel: 'Water Resistance',
    specValue: '100 m (10 ATM) · Viton O-Ring Seal',
    explodedY: LAYER_EXPLODED_Y.caseBack,
    panelSide: 'right',
    desktopCamera: {
      position: [-1.85, -2.95, 2.55],
      target: [0.48, -1.85, 0],
      fov: 32,
      aperture: 0.00032,
    },
    mobileCamera: {
      position: [0.0, -3.35, 3.35],
      target: [0, -2.15, 0],
      fov: 38,
      aperture: 0.00015,
    },
  },
  {
    stageIndex: 3,
    id: 'stage-3',
    layerKey: 'rotor',
    stepLabel: '03 / 10',
    shortName: 'Rotor',
    tag: 'Winding',
    name: 'Oscillating Weight',
    fn: 'Bidirectional 18k champagne-gold peripheral rotor converting wrist motion into mainspring torque.',
    specLabel: 'Bearing System',
    specValue: '7 Ceramic Micro-Balls · 22k Mass Rim',
    explodedY: LAYER_EXPLODED_Y.rotor,
    panelSide: 'left',
    desktopCamera: {
      position: [1.75, -0.35, 2.65],
      target: [-0.45, -1.25, 0],
      fov: 32,
      aperture: 0.00034,
    },
    mobileCamera: {
      position: [0.0, 0.15, 3.55],
      target: [0, -1.55, 0],
      fov: 38,
      aperture: 0.00015,
    },
  },
  {
    stageIndex: 4,
    id: 'stage-4',
    layerKey: 'movementPlate',
    stepLabel: '04 / 10',
    shortName: 'Movement Plate',
    tag: 'Chassis',
    name: 'Mainplate & Bridges',
    fn: 'Rhodium-plated German silver mainplate finished with circular perlage and Geneva-striped bridges.',
    specLabel: 'Jewel Count',
    specValue: '31 Synthetic Rubies · Blued Steel Screws',
    explodedY: LAYER_EXPLODED_Y.movementPlate,
    panelSide: 'right',
    desktopCamera: {
      position: [-1.95, 0.45, 2.85],
      target: [0.45, -0.62, 0],
      fov: 32,
      aperture: 0.00032,
    },
    mobileCamera: {
      position: [0.0, 0.85, 3.8],
      target: [0, -0.92, 0],
      fov: 38,
      aperture: 0.00015,
    },
  },
  {
    stageIndex: 5,
    id: 'stage-5',
    layerKey: 'gearTrain',
    stepLabel: '05 / 10',
    shortName: 'Gear Train',
    tag: 'Transmission',
    name: 'Going Gear Train',
    fn: 'Epicycloidal brass-and-gold wheel train stepping mainspring torque down to the escapement.',
    specLabel: 'Train Ratio',
    specValue: '1 : 480 Reduction · Diamond-Cut Pinions',
    explodedY: LAYER_EXPLODED_Y.gearTrain,
    panelSide: 'left',
    desktopCamera: {
      position: [1.55, 1.02, 2.15],
      target: [-0.36, 0.02, 0],
      fov: 30,
      aperture: 0.00038,
    },
    mobileCamera: {
      position: [0.0, 1.38, 3.1],
      target: [0, -0.25, 0],
      fov: 36,
      aperture: 0.00016,
    },
  },
  {
    stageIndex: 6,
    id: 'stage-6',
    layerKey: 'balanceWheel',
    stepLabel: '06 / 10',
    shortName: 'Balance Wheel',
    tag: 'Regulation',
    name: 'Free-Sprung Balance',
    fn: 'Variable-inertia Glucydur balance oscillating with an overcoil hairspring to govern timekeeping.',
    specLabel: 'Frequency',
    specValue: '28,800 vph (4 Hz) · ±1 s/day',
    explodedY: LAYER_EXPLODED_Y.balanceWheel,
    panelSide: 'right',
    desktopCamera: {
      position: [-1.25, 1.38, 1.75],
      target: [0.48, 0.65, 0.12],
      fov: 28,
      aperture: 0.00042,
    },
    mobileCamera: {
      position: [0.42, 1.72, 2.55],
      target: [0.35, 0.42, 0.1],
      fov: 35,
      aperture: 0.00016,
    },
  },
  {
    stageIndex: 7,
    id: 'stage-7',
    layerKey: 'mainspringBarrel',
    stepLabel: '07 / 10',
    shortName: 'Mainspring Barrel',
    tag: 'Energy',
    name: 'Mainspring Barrel',
    fn: 'Snailing-finished drum housing a Nivaflex alloy mainspring wound via an openworked ratchet wheel.',
    specLabel: 'Stored Torque',
    specValue: '72-Hour Autonomy · Constant-Force Slip',
    explodedY: LAYER_EXPLODED_Y.mainspringBarrel,
    panelSide: 'left',
    desktopCamera: {
      position: [1.32, 2.02, 1.92],
      target: [-0.52, 1.28, -0.1],
      fov: 29,
      aperture: 0.0004,
    },
    mobileCamera: {
      position: [-0.32, 2.3, 2.65],
      target: [-0.28, 1.05, -0.1],
      fov: 35,
      aperture: 0.00016,
    },
  },
  {
    stageIndex: 8,
    id: 'stage-8',
    layerKey: 'dial',
    stepLabel: '08 / 10',
    shortName: 'Dial',
    tag: 'Interface',
    name: 'Sunburst Guilloché Dial',
    fn: 'Galvanic obsidian brass plate featuring diamond-faceted 18k champagne-gold applied baton indices.',
    specLabel: 'Surface Finish',
    specValue: '120-Facet Radial Sunray · PVD Lacquer',
    explodedY: LAYER_EXPLODED_Y.dial,
    panelSide: 'right',
    desktopCamera: {
      position: [-1.72, 2.52, 2.38],
      target: [0.58, 1.88, 0],
      fov: 32,
      aperture: 0.00028,
    },
    mobileCamera: {
      position: [0.0, 3.35, 3.1],
      target: [0, 1.62, 0],
      fov: 38,
      aperture: 0.00015,
    },
  },
  {
    stageIndex: 9,
    id: 'stage-9',
    layerKey: 'hands',
    stepLabel: '09 / 10',
    shortName: 'Hands',
    tag: 'Indication',
    name: 'Dauphine Hand Set',
    fn: 'Mirror-chamfered 18k gold hour and minute hands paired with a counterweighted sweep seconds needle.',
    specLabel: 'Tolerance',
    specValue: '0.18 mm Axial Clearance · 8 Beats/Sec',
    explodedY: LAYER_EXPLODED_Y.hands,
    panelSide: 'left',
    desktopCamera: {
      position: [1.45, 3.25, 2.05],
      target: [-0.38, 2.42, 0.05],
      fov: 30,
      aperture: 0.00036,
    },
    mobileCamera: {
      position: [0.0, 3.7, 2.85],
      target: [0, 2.18, 0.05],
      fov: 36,
      aperture: 0.00015,
    },
  },
  {
    stageIndex: 10,
    id: 'stage-10',
    layerKey: 'crystal',
    stepLabel: '10 / 10',
    shortName: 'Crystal',
    tag: 'Optics',
    name: 'Domed Sapphire Crystal',
    fn: 'Box-domed corundum crystal seated inside a mirror-polished stepped bezel with dual anti-reflective coating.',
    specLabel: 'Hardness',
    specValue: 'Mohs 9 Corundum · 1.77 Refractive Index',
    explodedY: LAYER_EXPLODED_Y.crystal,
    panelSide: 'right',
    desktopCamera: {
      position: [-1.75, 3.92, 2.38],
      target: [0.42, 3.02, 0],
      fov: 32,
      aperture: 0.00032,
    },
    mobileCamera: {
      position: [0.0, 4.35, 3.15],
      target: [0, 2.74, 0],
      fov: 38,
      aperture: 0.00015,
    },
  },
  {
    stageIndex: 11,
    id: 'stage-11',
    stepLabel: '11',
    shortName: 'Assembly',
    tag: 'Complete',
    name: 'Zero-Tolerance Harmony',
    fn: 'All ten architectural layers seated back to operating tolerances.',
    specLabel: 'Final State',
    specValue: 'Calibre Locked · 0.002 mm Tolerance',
    explodedY: 0,
    panelSide: 'left',
    desktopCamera: {
      position: [2.15, 2.58, 4.95],
      target: [-0.52, -0.1, 0.05],
      fov: 35,
      aperture: 0.00014,
    },
    mobileCamera: {
      position: [0.15, 3.2, 6.35],
      target: [0, -0.82, 0],
      fov: 44,
      aperture: 0.00012,
    },
  },
];
