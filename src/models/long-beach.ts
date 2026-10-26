import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { applySurfaceDetail } from "../visual/material-textures.js";
import {
  createLoftedHullGeometry,
  createSheerDeckGeometry,
  createWaterlineBandGeometry,
  type HullStation,
} from "./hull-geometry.js";
import {
  addModelStrut as addStrut,
  createChamferedBoxGeometry,
  createChamferedSlopedBoxGeometry,
  createHawsePipe,
  createSlopedBoxGeometry,
  type ModelWeaponHardpoint,
} from "./model-primitives.js";

export type LongBeachQuality = "ultra" | "high" | "standard";

const REAL_LENGTH = 219.8;
const REAL_BEAM = 22.3;
const MODEL_LENGTH = 59.5;
const MODEL_BEAM = MODEL_LENGTH / (REAL_LENGTH / REAL_BEAM);
const HALF_BEAM = MODEL_BEAM / 2;
const VERTICAL_SCALE = 0.66;

const HULL: readonly HullStation[] = [
  { x: -30, deckHalf: 2.58, shoulderHalf: 2.48, waterlineHalf: 2.18, keelHalf: 0.7, deckY: 5.7, shoulderY: 3.48, waterlineY: 0.34, keelY: -0.72 },
  { x: -29.2, deckHalf: 2.76, shoulderHalf: 2.65, waterlineHalf: 2.34, keelHalf: 0.78, deckY: 5.74, shoulderY: 3.45, waterlineY: 0.32, keelY: -0.8 },
  { x: -27, deckHalf: 2.94, shoulderHalf: 2.82, waterlineHalf: 2.5, keelHalf: 0.88, deckY: 5.82, shoulderY: 3.4, waterlineY: 0.3, keelY: -0.9 },
  { x: -20, deckHalf: HALF_BEAM, shoulderHalf: 2.89, waterlineHalf: 2.57, keelHalf: 0.96, deckY: 5.92, shoulderY: 3.38, waterlineY: 0.28, keelY: -0.98 },
  { x: -8, deckHalf: HALF_BEAM, shoulderHalf: 2.9, waterlineHalf: 2.58, keelHalf: 0.98, deckY: 6, shoulderY: 3.38, waterlineY: 0.28, keelY: -1 },
  { x: 5, deckHalf: HALF_BEAM, shoulderHalf: 2.9, waterlineHalf: 2.57, keelHalf: 0.98, deckY: 6.04, shoulderY: 3.4, waterlineY: 0.28, keelY: -0.98 },
  { x: 14, deckHalf: 2.96, shoulderHalf: 2.82, waterlineHalf: 2.46, keelHalf: 0.92, deckY: 6.12, shoulderY: 3.48, waterlineY: 0.3, keelY: -0.92 },
  { x: 20, deckHalf: 2.72, shoulderHalf: 2.54, waterlineHalf: 2.18, keelHalf: 0.78, deckY: 6.26, shoulderY: 3.66, waterlineY: 0.34, keelY: -0.75 },
  { x: 24.2, deckHalf: 2.18, shoulderHalf: 1.96, waterlineHalf: 1.6, keelHalf: 0.53, deckY: 6.48, shoulderY: 3.98, waterlineY: 0.41, keelY: -0.47 },
  { x: 26.5, deckHalf: 1.55, shoulderHalf: 1.3, waterlineHalf: 0.98, keelHalf: 0.31, deckY: 6.66, shoulderY: 4.22, waterlineY: 0.47, keelY: -0.22 },
  { x: 28.4, deckHalf: 0.7, shoulderHalf: 0.53, waterlineHalf: 0.3, keelHalf: 0.09, deckY: 6.94, shoulderY: 4.62, waterlineY: 0.55, keelY: 0.14 },
  { x: 29.5, deckHalf: 0.045, shoulderHalf: 0.035, waterlineHalf: 0.02, keelHalf: 0.008, deckY: 7.14, shoulderY: 4.9, waterlineY: 0.6, keelY: 0.35 },
];

type Materials = {
  hull: THREE.MeshStandardMaterial;
  deck: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  light: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  mark: THREE.MeshStandardMaterial;
  raft: THREE.MeshStandardMaterial;
  red: THREE.MeshStandardMaterial;
  blue: THREE.MeshStandardMaterial;
};

function createMaterials(color: number): Materials {
  const hull = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.5 });
  const deck = new THREE.MeshStandardMaterial({ color: 0x657371, metalness: 0.12, roughness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x253336, metalness: 0.5, roughness: 0.44 });
  hull.name = "hull-grey"; deck.name = "weather-deck"; dark.name = "dark-equipment";
  applySurfaceDetail(hull, "painted-metal", 0.3);
  applySurfaceDetail(deck, "weather-deck", 0.44);
  applySurfaceDetail(dark, "dark-metal", 0.3);
  const light = new THREE.MeshStandardMaterial({ color: 0xc7cec7, metalness: 0.32, roughness: 0.46 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x6faaa9, emissive: 0x102c2d, emissiveIntensity: 0.65, metalness: 0.3, roughness: 0.25 });
  const mark = new THREE.MeshStandardMaterial({ color: 0xe5e5d7, roughness: 0.68 });
  const raft = new THREE.MeshStandardMaterial({ color: 0xd8d2bd, roughness: 0.72 });
  const red = new THREE.MeshStandardMaterial({ color: 0x9e3034, roughness: 0.72 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x293c5a, roughness: 0.72 });
  light.name = "equipment-light"; glass.name = "bridge-glass"; mark.name = "deck-markings";
  raft.name = "raft-canisters"; red.name = "flag-red"; blue.name = "flag-blue";
  return { hull, deck, dark, light, glass, mark, raft, red, blue };
}

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  name: string,
  position?: readonly [number, number, number],
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  if (position) mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addBox(parent: THREE.Object3D, size: readonly [number, number, number], position: readonly [number, number, number], material: THREE.Material, name = "box") {
  return addMesh(parent, new THREE.BoxGeometry(...size), material, name, position);
}

function addCylinder(parent: THREE.Object3D, radiusTop: number, radiusBottom: number, height: number, segments: number, position: readonly [number, number, number], material: THREE.Material, name = "cylinder") {
  return addMesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, name, position);
}

/** Batch only direct static meshes; nested animated groups retain their handles. */
function batchStatic(group: THREE.Group) {
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const originals = new Set<THREE.BufferGeometry>();
  for (const child of [...group.children]) {
    if (!(child instanceof THREE.Mesh) || child.userData.keepSeparate) continue;
    child.updateMatrix();
    const geometry = (child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()).applyMatrix4(child.matrix);
    // Custom loft/deck geometry has no UV set; static batches use the common
    // position/normal contract so primitive and lofted parts can share a draw.
    geometry.deleteAttribute("uv");
    geometry.deleteAttribute("tangent");
    const material = child.material as THREE.Material;
    const batch = batches.get(material) ?? [];
    batch.push(geometry); batches.set(material, batch);
    originals.add(child.geometry); group.remove(child);
  }
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    if (!merged) throw new Error(`Unable to batch ${group.name}`);
    addMesh(group, merged, material, `${group.name}-${material.name || "material"}`);
    geometries.forEach((geometry) => geometry.dispose());
  }
  originals.forEach((geometry) => geometry.dispose());
}

function createSectorGeometry(radius: number, halfAngle: number, segments = 20) {
  const vertices = [0, 0, 0];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index++) {
    const angle = -halfAngle + (halfAngle * 2 * index) / segments;
    vertices.push(Math.cos(angle) * radius, 0, -Math.sin(angle) * radius);
  }
  for (let index = 1; index <= segments; index++) indices.push(0, index, index + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function createMk10(materials: Materials, segments: number) {
  const launcher = new THREE.Group();
  launcher.name = "mk10-launcher";
  launcher.userData.arms = [] as THREE.Group[];
  const fixed = new THREE.Group(); fixed.name = "mk10-fixed";
  addCylinder(fixed, 2.65, 3.05, 0.5, segments, [0, 0.25, 0], materials.dark, "slewing-ring");
  addCylinder(fixed, 2.35, 2.35, 0.16, segments, [0, 0.58, 0], materials.light, "race");
  addMesh(fixed, createChamferedSlopedBoxGeometry(4.6, 1.25, 4.1, 0.28, 0.52, 0.2), materials.hull, "launcher-house", [-0.3, 1.18, 0]);
  addBox(fixed, [1.35, 1.1, 3.5], [-2.15, 1.18, 0], materials.dark, "loader-cab");
  const shaft = addCylinder(fixed, 0.3, 0.3, 4.15, segments, [-0.15, 2, 0], materials.dark, "trunnion-shaft");
  shaft.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    addBox(fixed, [5.2, 0.12, 0.12], [-0.2, 0.72, side * 2.3], materials.light, "service-rail");
    addBox(fixed, [2.4, 0.16, 0.34], [-2.65, 0.7, side * 1.7], materials.dark, "loader-guide");
    const hydraulic = addCylinder(fixed, 0.11, 0.15, 2.2, 8, [0.55, 1.45, side * 1.7], materials.light, "hydraulic");
    hydraulic.rotation.z = Math.PI / 2;
  }
  addBox(fixed, [1.7, 0.1, 3.55], [-3.12, 0.67, 0], materials.dark, "loader-door");
  batchStatic(fixed); launcher.add(fixed);

  for (const z of [-1.72, 1.72]) {
    const arm = new THREE.Group(); arm.name = "launcherArm"; arm.position.set(-0.15, 2, z);
    addBox(arm, [7.7, 0.3, 0.4], [2.4, 0, 0], materials.hull, "arm-spine");
    for (const railOffset of [-0.22, 0.22]) addBox(arm, [7.4, 0.12, 0.09], [2.5, 0.27, railOffset], materials.dark, "guide-rail");
    addBox(arm, [1.1, 0.46, 0.72], [0.3, 0.15, 0], materials.dark, "shoe");
    const trunnion = addCylinder(arm, 0.56, 0.56, 0.44, segments, [0, 0, 0], materials.dark, "trunnion");
    trunnion.rotation.x = Math.PI / 2;
    const readyRound = new THREE.Group(); readyRound.name = "readyRound";
    const body = addCylinder(readyRound, 0.22, 0.25, 5.45, segments, [0, 0, 0], materials.light, "missile-body");
    body.rotation.z = Math.PI / 2;
    const nose = addMesh(readyRound, new THREE.ConeGeometry(0.22, 0.72, segments), materials.light, "missile-nose", [3.08, 0, 0]);
    nose.rotation.z = -Math.PI / 2;
    for (const side of [-1, 1]) {
      addBox(readyRound, [0.62, 0.055, 0.5], [-2.35, 0, side * 0.32], materials.dark, "rear-fin");
      addBox(readyRound, [0.46, 0.5, 0.055], [-2.35, side * 0.32, 0], materials.dark, "rear-fin");
    }
    readyRound.position.set(3.15, 0.42, 0); arm.add(readyRound);
    batchStatic(arm); launcher.userData.arms.push(arm); launcher.add(arm);
  }
  return launcher;
}

function createMk143(materials: Materials) {
  const group = new THREE.Group(); group.name = "mk143-abl";
  addMesh(group, createChamferedSlopedBoxGeometry(4.15, 1.55, 1.48, 0.16, 0.2), materials.hull, "armored-housing", [0, 0.78, 0]);
  const face = addBox(group, [0.12, 1.34, 1.25], [2.03, 0.83, 0], materials.dark, "muzzle-face");
  face.rotation.z = -0.085;
  for (const z of [-0.42, 0, 0.42]) {
    const rib = addBox(group, [3.92, 0.055, 0.045], [-0.03, 0.94, z], materials.light, "cover-divider");
    rib.rotation.z = -0.085;
  }
  for (const x of [-1.28, 0, 1.28]) {
    const rib = addBox(group, [0.06, 1.62, 1.56], [x, 0.75, 0], materials.dark, "external-rib");
    rib.rotation.z = -0.085;
  }
  batchStatic(group); return group;
}

function createHarpoonBank(materials: Materials, idPrefix: string, segments: number) {
  const group = new THREE.Group(); group.name = idPrefix;
  const hardpoints: ModelWeaponHardpoint[] = [];
  addBox(group, [3.8, 0.24, 2.15], [0, 0.18, 0], materials.dark, "cradle");
  let index = 0;
  for (const y of [0.58, 1.18]) for (const z of [-0.52, 0.52]) {
    const tube = addCylinder(group, 0.38, 0.42, 3.5, segments, [0, y, z], materials.hull, "launch-tube");
    tube.rotation.z = Math.PI / 2;
    const cover = addMesh(group, new THREE.CircleGeometry(0.34, segments), materials.dark, "frangible-cover", [1.76, y, z]);
    cover.rotation.y = Math.PI / 2;
    cover.userData.keepSeparate = true;
    const mount = new THREE.Object3D(); mount.position.set(1.95, y, z); group.add(mount);
    hardpoints.push({ id: `${idPrefix}-${++index}`, mount, localDirection: new THREE.Vector3(1, 0.08, 0).normalize(), cover });
  }
  group.userData.weaponHardpoints = hardpoints;
  batchStatic(group); return group;
}

function createSps48(materials: Materials, dense: boolean) {
  const radar = new THREE.Group(); radar.name = "AN-SPS-48E";
  const array = new THREE.Group(); array.name = "sps48-array";
  addBox(array, [3.85, 0.14, 0.16], [0, -1.36, 0], materials.dark, "array-frame");
  addBox(array, [3.85, 0.14, 0.16], [0, 1.36, 0], materials.dark, "array-frame");
  addBox(array, [0.14, 2.85, 0.16], [-1.85, 0, 0], materials.dark, "array-frame");
  addBox(array, [0.14, 2.85, 0.16], [1.85, 0, 0], materials.dark, "array-frame");
  const columns = dense ? 9 : 5;
  const rows = dense ? 7 : 4;
  for (let column = 0; column < columns; column++) {
    const x = THREE.MathUtils.lerp(-1.72, 1.72, column / (columns - 1));
    addBox(array, [0.055, 2.58, 0.09], [x, 0, 0.13], materials.light, "vertical-element");
  }
  for (let row = 0; row < rows; row++) {
    const y = THREE.MathUtils.lerp(-1.22, 1.22, row / (rows - 1));
    addBox(array, [3.55, 0.05, 0.09], [0, y, 0.14], materials.light, "horizontal-element");
  }
  addBox(array, [2.35, 1.7, 0.6], [0, 0, -0.42], materials.dark, "array-backing");
  const feed = addCylinder(array, 0.12, 0.12, 2.6, 8, [0, 0, 1.05], materials.dark, "feed");
  feed.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    addStrut(array, new THREE.Vector3(side * 1.65, -1.18, -0.12), new THREE.Vector3(side * 0.55, -0.7, -0.9), 0.07, materials.light);
    addStrut(array, new THREE.Vector3(side * 1.65, 1.18, -0.12), new THREE.Vector3(side * 0.55, 0.7, -0.9), 0.07, materials.light);
  }
  batchStatic(array); radar.add(array);
  addCylinder(radar, 0.46, 0.62, 1.35, 12, [0, -1.78, -0.3], materials.dark, "gearbox");
  const searchBeam = addMesh(radar, createSectorGeometry(105, THREE.MathUtils.degToRad(8)), new THREE.MeshBasicMaterial({ color: 0x5ee9df, transparent: true, opacity: 0.035, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), "search-beam", [0, 0.15, 0]);
  searchBeam.userData.temporalReactive = true; radar.userData.searchBeam = searchBeam;
  return radar;
}

function createSps49(materials: Materials, dense: boolean) {
  const radar = new THREE.Group(); radar.name = "AN-SPS-49";
  addBox(radar, [5.5, 0.16, 0.16], [0, -1.12, 0], materials.light, "lower-frame");
  addBox(radar, [5.5, 0.16, 0.16], [0, 1.12, 0], materials.light, "upper-frame");
  const columns = dense ? 13 : 7;
  for (let column = 0; column < columns; column++) {
    const x = THREE.MathUtils.lerp(-2.65, 2.65, column / (columns - 1));
    addBox(radar, [0.055, 2.25, 0.08], [x, 0, 0], materials.light, "vertical-element");
  }
  for (const y of [-0.56, 0, 0.56]) addBox(radar, [5.4, 0.05, 0.08], [0, y, 0], materials.light, "horizontal-element");
  const feed = addCylinder(radar, 0.08, 0.08, 2.6, 7, [0, 0, 1.05], materials.dark, "feed");
  feed.rotation.x = Math.PI / 2;
  batchStatic(radar); return radar;
}

function createDirector(materials: Materials, segments: number) {
  const director = new THREE.Group(); director.name = "AN-SPG-55";
  addCylinder(director, 0.72, 1.02, 1.35, segments, [0, 0, 0], materials.dark, "pedestal");
  addBox(director, [0.55, 1.4, 2.1], [0, 0.78, 0], materials.dark, "yoke");
  const elevationPivot = new THREE.Group(); elevationPivot.name = "spg55-elevation"; elevationPivot.position.y = 0.82;
  const dishBack = addCylinder(elevationPivot, 1.45, 1.2, 0.34, segments, [0.82, 0, 0], materials.dark, "dish-back");
  dishBack.rotation.z = Math.PI / 2;
  const dish = addMesh(elevationPivot, new THREE.SphereGeometry(1.55, segments, Math.max(6, segments / 2), 0, Math.PI * 2, 0, Math.PI * 0.48), materials.light, "dish", [1.05, 0, 0]);
  dish.rotation.z = -Math.PI / 2;
  (dish.material as THREE.Material).side = THREE.DoubleSide;
  const horn = addCylinder(elevationPivot, 0.08, 0.16, 1.9, 8, [2, 0, 0], materials.dark, "feed-horn");
  horn.rotation.z = Math.PI / 2;
  batchStatic(elevationPivot); director.add(elevationPivot);
  const feedTip = new THREE.Object3D(); feedTip.position.set(3, 0, 0); elevationPivot.add(feedTip);
  director.userData.elevationPivot = elevationPivot; director.userData.feedTip = feedTip;
  batchStatic(director); return director;
}

function createCiws(materials: Materials, name: string) {
  const ciws = new THREE.Group(); ciws.name = name;
  addCylinder(ciws, 0.8, 1.05, 0.8, 14, [0, 0, 0], materials.hull, "ciws-base");
  addMesh(ciws, createChamferedBoxGeometry(1.15, 1.15, 1, 0.16), materials.light, "ciws-turret", [0, 1, 0]);
  const radome = addMesh(ciws, new THREE.SphereGeometry(0.48, 16, 10), materials.light, "ciws-radome", [-0.2, 1.85, 0]);
  radome.scale.set(0.9, 1.25, 0.9);
  const elevationPivot = new THREE.Group(); elevationPivot.position.set(0, 1.18, 0);
  for (let barrel = 0; barrel < 6; barrel++) {
    const angle = (barrel / 6) * Math.PI * 2;
    const tube = addCylinder(elevationPivot, 0.038, 0.038, 2.35, 6, [1.42, Math.cos(angle) * 0.13, Math.sin(angle) * 0.13], materials.dark, "m61-barrel");
    tube.rotation.z = Math.PI / 2;
  }
  batchStatic(elevationPivot); ciws.add(elevationPivot); ciws.userData.elevationPivot = elevationPivot;
  batchStatic(ciws); return ciws;
}

function createMainMast(materials: Materials, dense: boolean) {
  const mast = new THREE.Group(); mast.name = "forward-lattice-mast";
  const feet = [new THREE.Vector3(-1.4, 14.1, -2.25), new THREE.Vector3(-1.4, 14.1, 2.25), new THREE.Vector3(3.2, 14.1, 0)];
  const crown = [new THREE.Vector3(0.45, 22, -0.62), new THREE.Vector3(0.45, 22, 0.62), new THREE.Vector3(1.55, 22, 0)];
  feet.forEach((foot, index) => addStrut(mast, foot, crown[index], 0.18, materials.dark, dense ? 8 : 5));
  const levels = dense ? 6 : 3;
  for (let level = 0; level < levels; level++) {
    const fraction = (level + 0.7) / levels;
    const y = THREE.MathUtils.lerp(14.1, 22, fraction);
    const port = new THREE.Vector3(THREE.MathUtils.lerp(-1.4, 0.45, fraction), y, THREE.MathUtils.lerp(-2.25, -0.62, fraction));
    const starboard = new THREE.Vector3(port.x, y, -port.z);
    addStrut(mast, port, starboard, 0.07, materials.dark, 5);
    if (dense) addStrut(mast, port, new THREE.Vector3(THREE.MathUtils.lerp(3.2, 1.55, fraction), y + 0.75, 0), 0.055, materials.dark, 5);
  }
  addCylinder(mast, 2.2, 2.55, 0.3, dense ? 16 : 8, [1, 22, 0], materials.dark, "mast-platform");
  addCylinder(mast, 0.18, 0.28, 7.2, dense ? 10 : 6, [1, 25.5, 0], materials.dark, "upper-mast");
  addBox(mast, [8.8, 0.18, 0.18], [1, 27.1, 0], materials.dark, "yardarm");
  if (dense) for (const side of [-1, 1]) for (const x of [-2.5, 0, 2.5]) {
    addCylinder(mast, 0.025, 0.025, 1.3, 5, [1 + x, 27.75, side * 0.1], materials.light, "yard-antenna");
  }
  batchStatic(mast); return mast;
}

function createAftMast(materials: Materials, dense: boolean) {
  const mast = new THREE.Group(); mast.name = "aft-lattice-mast";
  for (const side of [-1, 1]) {
    addStrut(mast, new THREE.Vector3(0, 0, side * 1.7), new THREE.Vector3(0, 10.8, side * 0.5), 0.15, materials.dark, dense ? 8 : 5);
    if (dense) addStrut(mast, new THREE.Vector3(0, 0, side * 1.7), new THREE.Vector3(0, 10.8, -side * 0.5), 0.065, materials.dark, 5);
  }
  for (let y = 1; y <= 10; y += dense ? 1.5 : 3) addBox(mast, [0.16, 0.16, 3.1 - y * 0.18], [0, y, 0], materials.dark, "mast-brace");
  batchStatic(mast); return mast;
}

function addRailings(group: THREE.Group, materials: Materials, dense: boolean) {
  const step = dense ? 1.55 : 3.1;
  for (const side of [-1, 1]) {
    for (const y of [6.72, 7.08]) addBox(group, [51.5, 0.045, 0.045], [-1, y, side * 2.95], materials.light, "deck-rail");
    for (let x = -26; x <= 24; x += step) addCylinder(group, 0.032, 0.032, 0.78, 5, [x, 6.72, side * 2.95], materials.dark, "stanchion");
    for (const y of [13.25, 13.55]) addBox(group, [13.8, 0.04, 0.04], [2.8, y, side * 3.02], materials.light, "catwalk-rail");
    for (let x = -3.6; x <= 9.4; x += step) addCylinder(group, 0.028, 0.028, 0.62, 5, [x, 13.25, side * 3.02], materials.dark, "catwalk-post");
  }
}

function addHullNumber(group: THREE.Group, materials: Materials, side: number) {
  const number = new THREE.Group(); number.position.set(23.7, 3.95, side * 2.35); number.scale.setScalar(0.82);
  // Geometric seven-segment 9 remains readable without a canvas/font runtime.
  addBox(number, [0.9, 0.14, 0.07], [0, 0.62, 0], materials.mark, "hull-number-top");
  addBox(number, [0.9, 0.14, 0.07], [0, 0.02, 0], materials.mark, "hull-number-middle");
  addBox(number, [0.9, 0.14, 0.07], [0, -0.92, 0], materials.mark, "hull-number-bottom");
  addBox(number, [0.14, 0.65, 0.07], [-0.45, 0.32, 0], materials.mark, "hull-number-upper-left");
  addBox(number, [0.14, 1.55, 0.07], [0.45, -0.15, 0], materials.mark, "hull-number-right");
  if (side < 0) number.rotation.y = Math.PI;
  batchStatic(number); group.add(number);
}

function addFlag(group: THREE.Group, materials: Materials) {
  const flag = new THREE.Group(); flag.name = "ensign"; flag.position.set(-8.9, 22.4, 0);
  for (let stripe = 0; stripe < 13; stripe++) addBox(flag, [3.6, 0.15, 0.025], [-1.8, 0.9 - stripe * 0.15, 0], stripe % 2 === 0 ? materials.red : materials.mark, "flag-stripe");
  addBox(flag, [1.45, 0.75, 0.035], [-2.88, 0.53, 0.02], materials.blue, "flag-canton");
  batchStatic(flag); group.add(flag); return flag;
}

export function applyLongBeachQuality(model: THREE.Group, quality: LongBeachQuality) {
  const high = model.userData.highDetail as THREE.Object3D;
  const medium = model.userData.mediumDetail as THREE.Object3D;
  const low = model.userData.lowDetail as THREE.Object3D;
  high.visible = quality === "ultra";
  medium.visible = quality === "high";
  low.visible = quality === "standard";
  (model.userData.detail as THREE.Object3D[]).forEach((object) => { object.visible = quality !== "standard"; });
  model.userData.activeQuality = quality;
}

export function buildLongBeach(color = 0x7a8583, scale = 1) {
  const root = new THREE.Group(); root.name = "USS Long Beach CGN-9 refined NTU";
  root.scale.set(scale, scale * VERTICAL_SCALE, scale);
  const materials = createMaterials(color);
  const structure = new THREE.Group(); structure.name = "hull-and-superstructure";
  const hull = addMesh(structure, createLoftedHullGeometry(HULL), materials.hull, "lofted-hull");
  hull.userData.keepSeparate = true;
  addMesh(structure, createSheerDeckGeometry(HULL), materials.deck, "sheer-weather-deck");
  addMesh(structure, createWaterlineBandGeometry(HULL), materials.dark, "boot-top");
  addMesh(structure, createChamferedBoxGeometry(16.8, 0.4, 5.62, 0.3), materials.deck, "aft-flight-deck", [-21.25, 6.02, 0]);
  addMesh(structure, createChamferedBoxGeometry(19.4, 1.15, 5.55, 0.24), materials.deck, "bridge-skirt", [3.7, 6.7, 0]);
  const bridge = addMesh(structure, createChamferedBoxGeometry(17.2, 6.7, 5.18, 0.24), materials.hull, "ntu-command-box", [4.25, 10.03, 0]);
  bridge.userData.keepSeparate = true;
  addMesh(structure, createChamferedBoxGeometry(17.65, 0.38, 5.42, 0.2), materials.dark, "bridge-roof", [4.15, 13.5, 0]);
  addMesh(structure, createChamferedSlopedBoxGeometry(6.5, 2.3, 4.35, 0.22, 0.62), materials.hull, "pilot-house", [8.75, 14.76, 0]);
  addMesh(structure, createChamferedSlopedBoxGeometry(8.6, 3, 4.55, 0.2, 0.32, 0.28), materials.hull, "aft-deckhouse", [-8.85, 8.04, 0]);
  for (const side of [-1, 1]) {
    addMesh(structure, createChamferedSlopedBoxGeometry(4.8, 1.3, 0.9, 0.14, 0.38), materials.hull, "gun-sponson", [-7.35, 6.65, side * 2.55]);
    addBox(structure, [4.1, 0.22, 1.5], [10, 13.7, side * 2.22], materials.deck, "bridge-wing");
    addBox(structure, [4.1, 0.52, 0.11], [10, 14.02, side * 2.94], materials.dark, "wing-bulwark");
  }
  for (const z of [-0.72, 0.72]) addMesh(structure, createSlopedBoxGeometry(1.4, 2.2, 0.7, 0.15), materials.dark, "auxiliary-vent-trunk", [-1.8, 14.72, z]);
  batchStatic(structure); root.add(structure);

  const highDetail = new THREE.Group(); highDetail.name = "Long Beach Ultra details";
  const mediumDetail = new THREE.Group(); mediumDetail.name = "Long Beach High details";
  const lowDetail = new THREE.Group(); lowDetail.name = "Long Beach Standard proxies";

  const windows = new THREE.Group(); windows.name = "bridge-windows";
  for (let z = -1.9; z <= 1.91; z += 0.76) addBox(windows, [0.14, 0.46, 0.58], [12.94, 12.25, z], materials.glass, "front-window");
  for (const side of [-1, 1]) for (let x = 8.1; x <= 11.8; x += 0.93) addBox(windows, [0.7, 0.46, 0.12], [x, 12.25, side * 2.64], materials.glass, "side-window");
  addBox(windows, [0.3, 0.16, 4.9], [13.02, 12.7, 0], materials.dark, "window-brow");
  batchStatic(windows); root.add(windows);

  const mast = createMainMast(materials, true); root.add(mast);
  const radar = createSps48(materials, true); radar.position.set(1, 24, 0); radar.rotation.y = Math.PI; root.add(radar);
  const aftMast = createAftMast(materials, true); aftMast.position.set(-8.9, 10.1, 0); root.add(aftMast);
  const sps49 = createSps49(materials, true); sps49.position.y = 11; aftMast.add(sps49);
  const fireControl = new THREE.Group(); fireControl.name = "fire-control-reference"; fireControl.position.set(8, 13, 0); fireControl.userData.static = true; root.add(fireControl);

  const launcher = createMk10(materials, 18); launcher.position.set(16.9, 6.3, 0); launcher.rotation.y = Math.PI; launcher.scale.setScalar(0.5); root.add(launcher);
  const forwardLauncher = createMk10(materials, 18); forwardLauncher.position.set(23.45, 6.55, 0); forwardLauncher.rotation.y = Math.PI; forwardLauncher.scale.setScalar(0.5); root.add(forwardLauncher);

  const surfaceStrikeHardpoints: ModelWeaponHardpoint[] = [];
  const surfaceStrikeLaunchers: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const harpoon = createHarpoonBank(materials, `mk141-${side > 0 ? "port" : "starboard"}`, 12);
    harpoon.position.set(-12.4, 6.34, side * 1.62); harpoon.scale.setScalar(0.72); harpoon.rotation.y = -side * 0.4;
    surfaceStrikeHardpoints.push(...(harpoon.userData.weaponHardpoints as ModelWeaponHardpoint[]));
    surfaceStrikeLaunchers.push(harpoon); root.add(harpoon);
  }
  const ablLaunchers: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const abl = createMk143(materials); abl.name = `mk143-${side > 0 ? "port" : "starboard"}`;
    abl.position.set(-19.05, 6.2, side * 1.63); abl.rotation.y = side * 0.055;
    ablLaunchers.push(abl); root.add(abl);
  }

  const gunMounts: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const gun = new THREE.Group(); gun.name = "mk42-five-inch"; gun.position.set(-7.35, 6.85, side * 2.55); gun.rotation.y = side * 0.18; gun.scale.setScalar(0.38);
    addCylinder(gun, 1.35, 1.8, 1.25, 14, [0, 0, 0], materials.hull, "gun-house");
    addMesh(gun, createChamferedSlopedBoxGeometry(2.3, 1.25, 2.2, 0.3, 0.5), materials.hull, "gun-shield", [0.45, 0.65, 0]);
    const barrel = addCylinder(gun, 0.15, 0.23, 6, 10, [3, 1, 0], materials.dark, "gun-barrel"); barrel.rotation.z = Math.PI / 2;
    batchStatic(gun); gunMounts.push(gun); root.add(gun);
  }

  const visualDirectors: THREE.Group[] = [];
  const directorSupports: THREE.Mesh[] = [];
  for (const [x, z, heading, y] of [[10.25, -2.52, -0.42, 14.55], [10.25, 2.52, 0.42, 14.55], [-2.35, -2.52, Math.PI + 0.42, 14.45], [-2.35, 2.52, Math.PI - 0.42, 14.45]] as const) {
    const support = addCylinder(root, 0.52, 0.68, 1.35, 12, [x, y - 0.72, z], materials.hull, "spg55-support"); directorSupports.push(support);
    const director = createDirector(materials, 18); director.position.set(x, y, z); director.rotation.y = heading; director.scale.setScalar(0.48); director.userData.stowHeading = heading;
    visualDirectors.push(director); root.add(director);
  }
  const directors = [visualDirectors[0], visualDirectors[2]].filter((director): director is THREE.Group => Boolean(director));

  const ciwsMounts: THREE.Group[] = [];
  for (const [name, z, heading] of [["ciwsFore", -2.15, 0], ["ciwsAft", 2.15, Math.PI]] as const) {
    const ciws = createCiws(materials, name); ciws.position.set(-13.25, 6.78, z); ciws.rotation.y = heading; ciws.scale.setScalar(0.5);
    ciwsMounts.push(ciws); root.add(ciws);
  }

  const landingCircle = addMesh(root, new THREE.TorusGeometry(2.35, 0.075, 6, 48), materials.mark, "landing-circle", [-25.55, 6.25, 0]); landingCircle.rotation.x = Math.PI / 2;
  const landingLine = addBox(root, [5.8, 0.025, 0.11], [-25.55, 6.26, 0], materials.mark, "landing-line");
  const landingCross = addBox(root, [0.11, 0.025, 4.35], [-25.55, 6.26, 0], materials.mark, "landing-cross");

  addRailings(highDetail, materials, true);
  for (const side of [-1, 1]) {
    for (const x of [-3.6, -0.6, 2.4, 5.4, 8.4, 11.4]) addBox(highDetail, [0.035, 5.65, 0.025], [x, 10.03, side * 2.605], materials.dark, "plating-seam");
    for (const y of [7.25, 10.55, 13.2]) addBox(highDetail, [16.35, 0.04, 0.03], [4.25, y, side * 2.615], materials.dark, "plating-belt");
    addBox(highDetail, [13.8, 0.13, 0.55], [2.8, 12.95, side * 2.84], materials.deck, "side-catwalk");
    addBox(highDetail, [1.05, 2.05, 0.045], [-2.9, 8.1, side * 2.63], materials.dark, "access-door");
    for (let x = -2.8; x <= 9.6; x += 1.55) addBox(highDetail, [0.7, 0.52, 0.07], [x, 8.15, side * 2.64], materials.dark, "ventilation-grille");
    for (const x of [-11.3, -5.8]) {
      const boat = addMesh(highDetail, new THREE.CapsuleGeometry(0.52, 2.5, 4, 12), materials.raft, "ship-boat", [x, 9.02, side * 2.66]); boat.rotation.z = Math.PI / 2;
      addBox(highDetail, [3.7, 0.12, 0.12], [x, 8.58, side * 2.63], materials.dark, "boat-davit");
    }
    for (const x of [-17, -11, -5, 1, 7, 13, 19]) addBox(highDetail, [0.52, 0.15, 0.04], [x, 5.52, side * 2.94], materials.dark, "scupper");
    for (const x of [-18, -11, 2, 11]) {
      const reel = addMesh(highDetail, new THREE.TorusGeometry(0.46, 0.09, 6, 16), materials.dark, "hose-reel", [x, 6.65, side * 2.35]); reel.rotation.y = Math.PI / 2;
    }
    addHullNumber(highDetail, materials, side);
    const anchor = createHawsePipe(0.43, 0.11, materials.dark); anchor.position.set(24.1, 3.45, side * 2.02); anchor.rotation.x = Math.PI / 2; highDetail.add(anchor);
  }
  for (const [x, z] of [[-15, 0], [-10, 0], [10, 0]] as const) addBox(highDetail, [2.1, 0.14, 1.35], [x, 6.28, z], materials.dark, "deck-hatch");
  const breakwater = addMesh(highDetail, createSlopedBoxGeometry(0.7, 1.15, 5.2, 0.16), materials.dark, "breakwater", [18.5, 6.75, 0]); breakwater.rotation.z = -0.18;
  const flag = addFlag(highDetail, materials);
  batchStatic(highDetail); root.add(highDetail);

  addRailings(mediumDetail, materials, false);
  for (const side of [-1, 1]) {
    addBox(mediumDetail, [13.8, 0.13, 0.55], [2.8, 12.95, side * 2.84], materials.deck, "side-catwalk");
    for (const x of [-11.3, -5.8]) {
      const raft = addMesh(mediumDetail, new THREE.CapsuleGeometry(0.45, 2.1, 3, 8), materials.raft, "liferaft", [x, 9.02, side * 2.66]); raft.rotation.z = Math.PI / 2;
    }
    addHullNumber(mediumDetail, materials, side);
  }
  batchStatic(mediumDetail); root.add(mediumDetail);

  const lowMat = materials.hull;
  const lowMast = createMainMast(materials, false); lowDetail.add(lowMast);
  const lowRadar = createSps48(materials, false); lowRadar.position.set(1, 24, 0); lowRadar.rotation.y = Math.PI; (lowRadar.userData.searchBeam as THREE.Object3D).visible = false; lowDetail.add(lowRadar);
  const lowAftMast = createAftMast(materials, false); lowAftMast.position.set(-8.9, 10.1, 0); lowDetail.add(lowAftMast);
  const lowSps49 = createSps49(materials, false); lowSps49.position.y = 11; lowAftMast.add(lowSps49);
  for (const [x, y] of [[16.9, 6.3], [23.45, 6.55]] as const) {
    const proxy = new THREE.Group(); proxy.position.set(x, y, 0); proxy.scale.setScalar(0.5); proxy.rotation.y = Math.PI;
    addCylinder(proxy, 2.6, 3, 0.5, 8, [0, 0.25, 0], materials.dark, "low-mk10-base");
    addMesh(proxy, createSlopedBoxGeometry(4.4, 1.2, 4, 0.45), lowMat, "low-mk10-house", [-0.25, 1.15, 0]);
    for (const z of [-1.7, 1.7]) addBox(proxy, [7.5, 0.3, 0.35], [2.25, 2, z], lowMat, "low-mk10-arm");
    batchStatic(proxy); lowDetail.add(proxy);
  }
  for (const side of [-1, 1]) {
    const abl = createMk143(materials); abl.position.set(-19.05, 6.2, side * 1.63); lowDetail.add(abl);
    addMesh(lowDetail, createSlopedBoxGeometry(3.8, 1.35, 1.8, 0.2), lowMat, "low-harpoon", [-12.4, 7, side * 1.62]);
    addCylinder(lowDetail, 0.7, 0.9, 1.1, 8, [-7.35, 7.2, side * 2.55], lowMat, "low-gun");
    addCylinder(lowDetail, 0.5, 0.65, 1.3, 8, [-13.25, 7.25, side * 2.15], materials.light, "low-ciws");
  }
  for (const [x, z, y] of [[10.25, -2.52, 14.55], [10.25, 2.52, 14.45], [-2.35, -2.52, 14.45], [-2.35, 2.52, 14.45]] as const) {
    addCylinder(lowDetail, 0.3, 0.42, 0.7, 8, [x, y - 0.25, z], materials.dark, "low-spg55-base");
    const dish = addMesh(lowDetail, new THREE.SphereGeometry(0.68, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.48), materials.light, "low-spg55-dish", [x + 0.28, y + 0.25, z]);
    dish.rotation.z = -Math.PI / 2;
  }
  const lowCircle = addMesh(lowDetail, new THREE.TorusGeometry(2.32, 0.1, 5, 24), materials.mark, "low-landing-circle", [-25.55, 6.26, 0]); lowCircle.rotation.x = Math.PI / 2;
  addBox(lowDetail, [5.8, 0.025, 0.13], [-25.55, 6.26, 0], materials.mark, "low-landing-line");
  addBox(lowDetail, [0.13, 0.025, 4.35], [-25.55, 6.26, 0], materials.mark, "low-landing-cross");
  batchStatic(lowDetail); lowDetail.visible = false; mediumDetail.visible = false; root.add(lowDetail);

  const navigationLights: THREE.PointLight[] = [];
  const lightBulbs: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const color = side < 0 ? 0x36ff78 : 0xff3a32;
    const light = new THREE.PointLight(color, 2.2, 16); light.position.set(7.2, 14.2, side * 2.78);
    const bulb = addMesh(root, new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color }), "navigation-bulb", [7.2, 14.2, side * 2.78]);
    navigationLights.push(light); lightBulbs.push(bulb); root.add(light);
  }
  const ewPulse = new THREE.Group(); ewPulse.name = "ew-pulse";
  for (let index = 0; index < 3; index++) {
    const ring = addMesh(ewPulse, new THREE.TorusGeometry(12 + index * 8, 0.08, 5, 48), new THREE.MeshBasicMaterial({ color: 0x66e5dc, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), "ew-ring", [0, 18, 0]); ring.rotation.x = Math.PI / 2;
  }
  ewPulse.visible = false; root.add(ewPulse);

  root.userData = {
    hullStations: HULL.length, hullSectionPoints: 8, hullLength: MODEL_LENGTH, hullBeam: MODEL_BEAM,
    realLengthMeters: REAL_LENGTH, realBeamMeters: REAL_BEAM, modelMetersPerUnit: REAL_LENGTH / MODEL_LENGTH,
    verticalScale: VERTICAL_SCALE, modelAssetVersion: "cgn9-ntu-refined-1",
    surfaceStrikeHardpoints, radar, secondaryRadar: sps49, fireControl, launcher, forwardLauncher, directors,
    highDetail, mediumDetail, lowDetail, smokePuffs: [] as THREE.Mesh[], flag, hullMat: materials.hull, ewPulse,
    navigationLights, lightBulbs,
    detail: [mast, radar, aftMast, fireControl, launcher, forwardLauncher, windows, ...gunMounts, ...directorSupports, ...surfaceStrikeLaunchers, ...ablLaunchers, landingCircle, landingLine, landingCross, ...visualDirectors, ...ciwsMounts],
  };
  applyLongBeachQuality(root, "ultra");
  return root;
}
