import * as THREE from 'three';
import {
  createDialTextures,
  createGenevaStripesMap,
  createLeatherTextures,
  createPerlageMap,
  createRadialBrushMap,
} from './textures';

export interface WatchMaterials {
  steelPolished: THREE.MeshStandardMaterial;
  steelBrushed: THREE.MeshStandardMaterial;
  champagneGold: THREE.MeshStandardMaterial;
  champagneBrushed: THREE.MeshStandardMaterial;
  rhodiumPerlage: THREE.MeshStandardMaterial;
  rhodiumGeneva: THREE.MeshStandardMaterial;
  brassGear: THREE.MeshStandardMaterial;
  bluedSteel: THREE.MeshStandardMaterial;
  rubyJewel: THREE.MeshPhysicalMaterial;
  sapphireCrystal: THREE.MeshPhysicalMaterial;
  sapphireBack: THREE.MeshPhysicalMaterial;
  dialFace: THREE.MeshStandardMaterial;
  mainspringSteel: THREE.MeshStandardMaterial;
  leatherStrap: THREE.MeshStandardMaterial;
  darkChamber: THREE.MeshStandardMaterial;
}

export function createWatchMaterials(): WatchMaterials {
  const dialTex = createDialTextures();
  const genevaMap = createGenevaStripesMap();
  const perlageMap = createPerlageMap();
  const radialMap = createRadialBrushMap();
  const leatherTex = createLeatherTextures();

  return {
    steelPolished: new THREE.MeshStandardMaterial({
      color: '#dfe3e8',
      metalness: 0.97,
      roughness: 0.11,
      envMapIntensity: 1.55,
    }),
    steelBrushed: new THREE.MeshStandardMaterial({
      color: '#c9cfd6',
      metalness: 0.94,
      roughness: 0.3,
      roughnessMap: radialMap,
      bumpMap: radialMap,
      bumpScale: 0.004,
      envMapIntensity: 1.25,
    }),
    champagneGold: new THREE.MeshStandardMaterial({
      color: '#d8b774',
      metalness: 0.95,
      roughness: 0.16,
      envMapIntensity: 1.5,
    }),
    champagneBrushed: new THREE.MeshStandardMaterial({
      color: '#cfa961',
      metalness: 0.92,
      roughness: 0.28,
      roughnessMap: radialMap,
      bumpMap: radialMap,
      bumpScale: 0.005,
      envMapIntensity: 1.35,
    }),
    rhodiumPerlage: new THREE.MeshStandardMaterial({
      color: '#bcbec4',
      metalness: 0.92,
      roughness: 0.34,
      bumpMap: perlageMap,
      bumpScale: 0.012,
      roughnessMap: perlageMap,
      envMapIntensity: 1.15,
    }),
    rhodiumGeneva: new THREE.MeshStandardMaterial({
      color: '#d1d4da',
      metalness: 0.94,
      roughness: 0.26,
      bumpMap: genevaMap,
      bumpScale: 0.01,
      roughnessMap: genevaMap,
      envMapIntensity: 1.3,
    }),
    brassGear: new THREE.MeshStandardMaterial({
      color: '#dcb970',
      metalness: 0.93,
      roughness: 0.22,
      envMapIntensity: 1.4,
    }),
    bluedSteel: new THREE.MeshStandardMaterial({
      color: '#1b4188',
      metalness: 0.92,
      roughness: 0.14,
      envMapIntensity: 1.45,
    }),
    rubyJewel: new THREE.MeshPhysicalMaterial({
      color: '#b8143b',
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.55,
      ior: 1.76,
      thickness: 0.12,
      clearcoat: 1.0,
      envMapIntensity: 1.6,
    }),
    sapphireCrystal: new THREE.MeshPhysicalMaterial({
      color: '#f2f6fb',
      metalness: 0.0,
      roughness: 0.012,
      transmission: 0.97,
      ior: 1.77,
      thickness: 0.08,
      reflectivity: 0.9,
      specularIntensity: 0.65,
      clearcoat: 0.55,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 1,
      attenuationColor: new THREE.Color('#dce8f4'),
      attenuationDistance: 2.8,
      envMapIntensity: 0.88,
    }),
    sapphireBack: new THREE.MeshPhysicalMaterial({
      color: '#eef2f7',
      metalness: 0.0,
      roughness: 0.02,
      transmission: 0.94,
      ior: 1.77,
      thickness: 0.08,
      clearcoat: 0.5,
      transparent: true,
      envMapIntensity: 1.0,
    }),
    dialFace: new THREE.MeshStandardMaterial({
      map: dialTex.colorMap,
      roughnessMap: dialTex.roughnessMap,
      metalness: 0.38,
      roughness: 0.52,
      envMapIntensity: 0.82,
    }),
    mainspringSteel: new THREE.MeshStandardMaterial({
      color: '#4b515c',
      metalness: 0.94,
      roughness: 0.22,
      envMapIntensity: 1.2,
    }),
    leatherStrap: new THREE.MeshStandardMaterial({
      map: leatherTex.colorMap,
      bumpMap: leatherTex.bumpMap,
      bumpScale: 0.018,
      metalness: 0.05,
      roughness: 0.78,
      envMapIntensity: 0.65,
    }),
    darkChamber: new THREE.MeshStandardMaterial({
      color: '#16161a',
      metalness: 0.65,
      roughness: 0.55,
      envMapIntensity: 0.7,
    }),
  };
}
