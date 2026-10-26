import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { registerAssetDetailLod } from "../visual/asset-detail-lod.js";
import { applySurfaceDetail } from "../visual/material-textures.js";
import {
  addThreatRadialFinSet,
  attachThreatEffects,
} from "./model-helpers.js";

interface Kh22TierConfig {
  name: "Ultra" | "High" | "Standard";
  segments: number;
  radialSegments: number;
  bevelSegments: number;
  seams: readonly number[];
  hatches: number;
  rivets: boolean;
  nozzleBands: number;
}

const TIERS: readonly Kh22TierConfig[] = [
  {
    name: "Ultra",
    segments: 64,
    radialSegments: 10,
    bevelSegments: 2,
    seams: [-3.95, -2.15, 0.15, 2.55, 4.65],
    hatches: 8,
    rivets: true,
    nozzleBands: 3,
  },
  {
    name: "High",
    segments: 40,
    radialSegments: 8,
    bevelSegments: 1,
    seams: [-3.95, -1.05, 1.65, 4.65],
    hatches: 4,
    rivets: false,
    nozzleBands: 2,
  },
  {
    name: "Standard",
    segments: 20,
    radialSegments: 6,
    bevelSegments: 0,
    seams: [-3.95, 2.55],
    hatches: 0,
    rivets: false,
    nozzleBands: 1,
  },
];

function surface(
  color: number,
  metalness: number,
  roughness: number,
  finish: "missile-skin" | "dark-metal" = "missile-skin",
) {
  return applySurfaceDetail(
    new THREE.MeshStandardMaterial({ color, metalness, roughness }),
    finish,
    0.22,
  );
}

function lathe(
  profile: readonly (readonly [number, number])[],
  segments: number,
) {
  const geometry = new THREE.LatheGeometry(
    profile.map(([radius, axial]) => new THREE.Vector2(radius, axial)),
    segments,
  );
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function wingGeometry(side: -1 | 1, bevelSegments: number) {
  const shape = new THREE.Shape();
  const points: readonly [number, number][] = [
    [0.45, -1.05],
    [1.78, 0.25],
    [1.64, 1.42],
    [0.45, 2.15],
  ];
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(side * x, z);
    else shape.lineTo(side * x, z);
  });
  shape.closePath();
  const bevel = bevelSegments > 0;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09,
    bevelEnabled: bevel,
    bevelSegments,
    bevelSize: bevel ? 0.025 : 0,
    bevelThickness: bevel ? 0.025 : 0,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -0.045);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function starGeometry() {
  const shape = new THREE.Shape();
  for (let index = 0; index < 10; index++) {
    const angle = Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 === 0 ? 0.27 : 0.115;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function addMesh(
  parent: THREE.Group,
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function batchMeshes(group: THREE.Group) {
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const originals = new Set<THREE.BufferGeometry>();
  for (const child of [...group.children]) {
    if (!(child instanceof THREE.Mesh)) continue;
    child.updateMatrix();
    const geometry = (child.geometry.index
      ? child.geometry.toNonIndexed()
      : child.geometry.clone()
    ).applyMatrix4(child.matrix);
    const material = child.material as THREE.Material;
    const batch = batches.get(material) ?? [];
    batch.push(geometry);
    batches.set(material, batch);
    originals.add(child.geometry);
    group.remove(child);
  }
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    if (!merged) throw new Error(`Unable to batch ${group.name}`);
    addMesh(group, `${group.name}-batch`, merged, material);
    geometries.forEach((geometry) => geometry.dispose());
  }
  originals.forEach((geometry) => geometry.dispose());
}

function buildTier(config: Kh22TierConfig) {
  const tier = new THREE.Group();
  tier.name = `Kh-22 ${config.name}`;
  const titanium = surface(0xb7b9ad, 0.62, 0.38);
  const radome = surface(0x92978f, 0.28, 0.52);
  const dark = surface(0x303839, 0.68, 0.43, "dark-metal");
  const seam = surface(0x596260, 0.45, 0.52, "dark-metal");
  const marking = surface(0xa53b32, 0.25, 0.55);
  const stencil = surface(0xd8d9cf, 0.35, 0.5);
  const nozzleInterior = surface(0x111616, 0.4, 0.72, "dark-metal");

  addMesh(
    tier,
    "airframe-body",
    lathe(
      [
        [0, -5.5],
        [0.48, -5.5],
        [0.57, -4.85],
        [0.63, -3.6],
        [0.66, -2.1],
        [0.66, 0],
        [0.64, 2.1],
        [0.61, 3.35],
        [0.59, 4.0],
      ],
      config.segments,
    ),
    titanium,
  );
  addMesh(
    tier,
    "radar-radome",
    lathe(
      [
        [0.59, 4.0],
        [0.57, 4.65],
        [0.5, 5.45],
        [0.39, 6.25],
        [0.25, 7.05],
        [0.11, 7.72],
        [0.018, 8.16],
        [0, 8.2],
      ],
      config.segments,
    ),
    radome,
  );

  const wings = new THREE.Group();
  wings.name = "main-wings";
  for (const side of [-1, 1] as const) {
    addMesh(
      wings,
      side < 0 ? "port-main-wing" : "starboard-main-wing",
      wingGeometry(side, config.bevelSegments),
      titanium,
    );
    const fairing = addMesh(
      wings,
      "wing-root-fairing",
      new THREE.SphereGeometry(1, config.segments, config.radialSegments),
      titanium,
    );
    fairing.scale.set(0.24, 0.19, 1.65);
    fairing.position.set(side * 0.46, 0, 0.45);

    const star = addMesh(
      wings,
      "wing-insignia",
      starGeometry(),
      marking,
    );
    star.position.set(side * 1.05, 0.075, 0.92);
    star.rotation.y = side < 0 ? Math.PI : 0;
  }
  batchMeshes(wings);
  tier.add(wings);

  const controlFins = new THREE.Group();
  controlFins.name = "control-fins";
  addThreatRadialFinSet(controlFins, {
    z: 3.85,
    radius: 0.58,
    span: 0.7,
    chord: 2.2,
    thickness: 0.11,
    material: dark,
    swept: true,
  });
  batchMeshes(controlFins);
  tier.add(controlFins);

  let surfaceDetailCount = 0;
  const seams = new THREE.Group();
  seams.name = "airframe-seams";
  for (const z of config.seams) {
    addMesh(
      seams,
      "airframe-seam",
      new THREE.TorusGeometry(0.625, 0.014, 4, config.segments),
      seam,
    ).position.z = z;
    surfaceDetailCount++;
  }
  batchMeshes(seams);
  tier.add(seams);

  const servicePanels = new THREE.Group();
  servicePanels.name = "service-panels";
  for (const side of [-1, 1]) {
    const panel = addMesh(
      servicePanels,
      "service-panel",
      new THREE.BoxGeometry(0.025, 0.24, 0.62),
      seam,
    );
    panel.position.set(side * 0.645, 0, -1.1);
    surfaceDetailCount++;
  }
  batchMeshes(servicePanels);
  tier.add(servicePanels);

  const hatches = new THREE.Group();
  hatches.name = "access-hatches";
  const latches = new THREE.Group();
  latches.name = "hatch-latches";
  for (let index = 0; index < config.hatches; index++) {
    const angle = (index / config.hatches) * Math.PI * 2;
    const hatch = addMesh(
      hatches,
      "access-hatch",
      new THREE.BoxGeometry(0.17, 0.025, 0.34),
      dark,
    );
    hatch.position.set(
      Math.cos(angle) * 0.635,
      Math.sin(angle) * 0.635,
      index % 2 === 0 ? -2.65 : 1.25,
    );
    hatch.rotation.z = angle - Math.PI / 2;
    surfaceDetailCount++;

    const latch = addMesh(
      latches,
      "hatch-latch",
      new THREE.BoxGeometry(0.055, 0.035, 0.09),
      stencil,
    );
    latch.position.copy(hatch.position);
    latch.position.z += 0.1;
    latch.rotation.z = hatch.rotation.z;
  }

  batchMeshes(hatches);
  batchMeshes(latches);
  tier.add(hatches, latches);

  if (config.rivets) {
    const rivets = new THREE.Group();
    rivets.name = "flush-rivets";
    for (let index = 0; index < 24; index++) {
      const angle = (index % 12) * Math.PI / 6;
      const rivet = addMesh(
        rivets,
        "flush-rivet",
        new THREE.SphereGeometry(0.024, 5, 3),
        stencil,
      );
      rivet.position.set(
        Math.cos(angle) * 0.655,
        Math.sin(angle) * 0.655,
        index < 12 ? -3.7 : 2.8,
      );
      surfaceDetailCount++;
    }
    batchMeshes(rivets);
    tier.add(rivets);
  }

  addMesh(
    tier,
    "engine-nozzle",
    new THREE.CylinderGeometry(0.49, 0.54, 0.56, config.segments, 1, true),
    dark,
  ).rotation.x = Math.PI / 2;
  const nozzle = tier.getObjectByName("engine-nozzle")!;
  nozzle.position.z = 5.5;
  addMesh(
    tier,
    "nozzle-interior",
    new THREE.CircleGeometry(0.44, config.segments),
    nozzleInterior,
  ).position.z = 5.79;
  addMesh(
    tier,
    "nozzle-lip",
    new THREE.TorusGeometry(0.49, 0.035, 5, config.segments),
    dark,
  ).position.z = 5.77;

  const nozzleBands = new THREE.Group();
  nozzleBands.name = "nozzle-bands";
  for (let index = 0; index < config.nozzleBands; index++) {
    addMesh(
      nozzleBands,
      "nozzle-band",
      new THREE.TorusGeometry(0.525, 0.018, 4, config.segments),
      stencil,
    ).position.z = 5.3 + index * 0.19;
    surfaceDetailCount++;
  }
  batchMeshes(nozzleBands);
  tier.add(nozzleBands);

  tier.userData.surfaceDetailCount = surfaceDetailCount;
  return tier;
}

export function createKh22RefinedModel() {
  const root = new THREE.Group();
  root.name = "Kh-22 refined procedural model";
  const [ultra, high, standard] = TIERS.map(buildTier);
  root.add(ultra, high, standard);
  high.visible = false;
  standard.visible = false;

  registerAssetDetailLod(root, {
    nearDistance: 72,
    mediumDistance: 190,
    high: [ultra],
    medium: [high],
    low: [standard],
    exclusiveTiers: true,
    qualityAware: true,
  });
  attachThreatEffects(root, {
    length: 11,
    radius: 0.55,
    exhaustLength: 6,
    exhaustColor: 0xffd37a,
    mistRadius: 1.45,
    mistLength: 9,
    seekerRadius: 8,
    seekerLength: 30,
    shockCone: true,
    glow: { intensity: 7, distance: 35 },
  });
  root.userData.weaponVisualId = "Kh-22";
  root.userData.forwardAxis = "-Z";
  root.userData.surfaceDetailCount = standard.userData.surfaceDetailCount;
  return root;
}
