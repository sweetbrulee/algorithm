// algorithm.ts
import * as THREE from "three";

/**
 * 计算最小包围盒的八个顶点
 * @param points 三维点列表
 * @returns 包围盒的八个顶点
 */
export function computeMinimumBoundingBox(
  points: THREE.Vector3[]
): THREE.Vector3[] {
  if (points.length === 0) {
    return [];
  }

  // 计算点云的质心
  const centroid = new THREE.Vector3();
  points.forEach((p) => centroid.add(p));
  centroid.divideScalar(points.length);

  // 计算协方差矩阵
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  points.forEach((p) => {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    const dz = p.z - centroid.z;
    cov[0][0] += dx * dx;
    cov[0][1] += dx * dy;
    cov[0][2] += dx * dz;
    cov[1][1] += dy * dy;
    cov[1][2] += dy * dz;
    cov[2][2] += dz * dz;
  });

  // 对称化协方差矩阵
  cov[1][0] = cov[0][1];
  cov[2][0] = cov[0][2];
  cov[2][1] = cov[1][2];

  // 求协方差矩阵的特征向量（使用简化的 Jacobi 方法）
  const eigen = computeEigenvectors(cov);

  if (!eigen) {
    // 如果无法计算特征向量，返回轴对齐的包围盒
    const box = new THREE.Box3().setFromPoints(points);
    return getBoxVertices(box);
  }

  // 正交化特征向量（确保它们彼此正交）
  const orthogonalized = orthogonalize(eigen.x, eigen.y, eigen.z);
  const { x: eigenX, y: eigenY, z: eigenZ } = orthogonalized;

  const rotation = new THREE.Matrix4();
  rotation.makeBasis(eigenX, eigenY, eigenZ);
  const inverseRotation = new THREE.Matrix4();
  inverseRotation.copy(rotation).invert();

  // 旋转点云
  const rotatedPoints = points.map((p) =>
    p.clone().sub(centroid).applyMatrix4(rotation)
  );

  // 计算旋转后的轴对齐包围盒
  const rotatedBox = new THREE.Box3().setFromPoints(rotatedPoints);

  // 获取包围盒的八个顶点
  const rotatedVertices = getBoxVertices(rotatedBox);

  // 将包围盒顶点旋转回原始坐标系
  const originalVertices = rotatedVertices.map((v) =>
    v.applyMatrix4(inverseRotation).add(centroid)
  );

  return originalVertices;
}

/**
 * 获取 Box3 的八个顶点
 * @param box THREE.Box3 对象
 * @returns 八个顶点
 */
function getBoxVertices(box: THREE.Box3): THREE.Vector3[] {
  const min = box.min;
  const max = box.max;

  return [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, max.z),
    new THREE.Vector3(min.x, max.y, max.z),
  ];
}

/**
 * 计算协方差矩阵的特征向量（3x3矩阵）
 * @param cov 3x3 协方差矩阵
 * @returns 特征向量 {x, y, z} 或 null
 */
function computeEigenvectors(
  cov: number[][]
): { x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3 } | null {
  // 使用 Jacobi 方法进行特征值分解
  const EPSILON = 1e-10;
  const maxIterations = 100;
  let a = [
    [cov[0][0], cov[0][1], cov[0][2]],
    [cov[1][0], cov[1][1], cov[1][2]],
    [cov[2][0], cov[2][1], cov[2][2]],
  ];
  let v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  for (let iter = 0; iter < maxIterations; iter++) {
    // 找到最大的非对角元素
    let max = 0;
    let p = 0;
    let q = 1;
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        if (Math.abs(a[i][j]) > max) {
          max = Math.abs(a[i][j]);
          p = i;
          q = j;
        }
      }
    }

    if (max < EPSILON) {
      break;
    }

    // 计算旋转角度
    const phi = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);

    const c = Math.cos(phi);
    const s = Math.sin(phi);

    // 执行旋转
    for (let k = 0; k < 3; k++) {
      const tempP = a[p][k];
      const tempQ = a[q][k];
      a[p][k] = c * tempP - s * tempQ;
      a[q][k] = s * tempP + c * tempQ;
    }

    for (let k = 0; k < 3; k++) {
      const tempP = a[k][p];
      const tempQ = a[k][q];
      a[k][p] = c * tempP - s * tempQ;
      a[k][q] = s * tempP + c * tempQ;
    }

    for (let k = 0; k < 3; k++) {
      const tempV = v[k][p];
      v[k][p] = c * tempV - s * v[k][q];
      v[k][q] = s * tempV + c * v[k][q];
    }
  }

  // 提取特征向量
  let eigenX = new THREE.Vector3(v[0][0], v[1][0], v[2][0]).normalize();
  let eigenY = new THREE.Vector3(v[0][1], v[1][1], v[2][1]).normalize();
  let eigenZ = new THREE.Vector3(v[0][2], v[1][2], v[2][2]).normalize();

  // 确保特征向量正交
  const orthogonalized = orthogonalize(eigenX, eigenY, eigenZ);
  eigenX = orthogonalized.x;
  eigenY = orthogonalized.y;
  eigenZ = orthogonalized.z;

  return { x: eigenX, y: eigenY, z: eigenZ };
}

/**
 * 使用 Gram-Schmidt 方法正交化特征向量
 * @param x THREE.Vector3
 * @param y THREE.Vector3
 * @param z THREE.Vector3
 * @returns 正交化后的特征向量 {x, y, z}
 */
function orthogonalize(
  x: THREE.Vector3,
  y: THREE.Vector3,
  z: THREE.Vector3
): { x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3 } {
  // 正交化 y
  y = y
    .clone()
    .sub(x.clone().multiplyScalar(y.dot(x)))
    .normalize();

  // 正交化 z
  z = z
    .clone()
    .sub(x.clone().multiplyScalar(z.dot(x)))
    .sub(y.clone().multiplyScalar(z.dot(y)))
    .normalize();

  return { x, y, z };
}
