// utils.ts
import * as THREE from "three";

/**
 * 计算质心
 * @param points 三维点列表
 * @returns 质心向量
 */
export function computeCentroid(points: THREE.Vector3[]): THREE.Vector3 {
  const centroid = new THREE.Vector3();
  points.forEach((p) => centroid.add(p));
  centroid.divideScalar(points.length);
  return centroid;
}
