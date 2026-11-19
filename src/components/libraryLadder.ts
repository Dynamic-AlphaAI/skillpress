import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ladderSlope } from "@/lib/roomLadder";

/** Two moving meshes for the timber and brasswork, plus a tilted picking volume. */
export function buildLadder(top: number, foot: number, wood: T.Material, brass: T.Material, unit: T.BoxGeometry, geometries: Set<T.BufferGeometry>) {
  const carriage = new T.Group();
  const timber: T.BufferGeometry[] = [], metal: T.BufferGeometry[] = [];
  const wheel = new T.CylinderGeometry(0.115, 0.115, 0.08, 16);
  const part = new T.Object3D();
  function add(pieces: T.BufferGeometry[], source: T.BufferGeometry, x: number, y: number, z: number, w: number, h: number, d: number, tilt = 0) {
    part.position.set(x, y, z);
    part.rotation.x = tilt;
    part.scale.set(w, h, d);
    part.updateMatrix();
    pieces.push(source.clone().applyMatrix4(part.matrix));
  }
  const length = top * Math.hypot(1, ladderSlope);
  const tilt = -Math.atan(ladderSlope);
  for (const x of [-0.31, 0.31]) {
    add(timber, unit, x, top / 2, foot - top * ladderSlope / 2, 0.085, length, 0.105, tilt);
    add(metal, unit, x, top - 0.14, 0.76 + 0.14 * ladderSlope, 0.096, 0.27, 0.12, tilt);
    add(metal, wheel, x, 0.12, foot, 1, 1, 1, Math.PI / 2);
    add(metal, wheel, x, top - 0.05, 0.71, 0.85, 1, 0.85, Math.PI / 2);
  }
  for (let y = 0.34; y < top - 0.20; y += 0.31) {
    add(timber, unit, 0, y, foot - y * ladderSlope, 0.62, 0.06, 0.15);
    add(metal, unit, 0, y + 0.025, foot - y * ladderSlope + 0.053, 0.59, 0.018, 0.033);
  }
  wheel.dispose();
  for (const [pieces, material] of [[timber, wood], [metal, brass]] as const) {
    const merged = mergeGeometries(pieces)!;
    geometries.add(merged);
    carriage.add(new T.Mesh(merged, material));
    pieces.forEach((g) => g.dispose());
  }
  const hit = new T.Mesh(unit, wood);
  hit.position.set(0, top / 2, foot - top * ladderSlope / 2);
  hit.rotation.x = tilt;
  hit.scale.set(0.72, length, 0.19);
  hit.visible = false;
  carriage.add(hit);
  return { carriage, hit };
}
