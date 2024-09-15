// boundingBox.ts
import * as THREE from "three";
import { computeMinimumBoundingBox } from "./algorithm";

export class BoundingBoxManager {
  private scene: THREE.Scene;
  private points: THREE.Mesh[];
  private boundingBoxLines: THREE.LineSegments | null = null;

  constructor(scene: THREE.Scene, points: THREE.Mesh[]) {
    this.scene = scene;
    this.points = points;
  }

  /**
   * 更新包围盒
   */
  public updateBoundingBox() {
    // 移除现有的包围盒
    if (this.boundingBoxLines) {
      this.scene.remove(this.boundingBoxLines);
      this.boundingBoxLines.geometry.dispose();
      (this.boundingBoxLines.material as THREE.LineDashedMaterial).dispose();
      this.boundingBoxLines = null;
    }

    if (this.points.length === 0) {
      return;
    }

    // 计算最小包围盒顶点
    const boundingBoxVertices = computeMinimumBoundingBox(
      this.points.map((p) => p.position)
    );

    if (boundingBoxVertices.length !== 8) {
      return;
    }

    // 定义包围盒的边
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0], // Bottom
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4], // Top
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7], // Sides
    ];

    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    edges.forEach((edge) => {
      vertices.push(
        boundingBoxVertices[edge[0]].x,
        boundingBoxVertices[edge[0]].y,
        boundingBoxVertices[edge[0]].z,
        boundingBoxVertices[edge[1]].x,
        boundingBoxVertices[edge[1]].y,
        boundingBoxVertices[edge[1]].z
      );
    });

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.LineDashedMaterial({
      color: 0xbbff00,
      dashSize: 0.2,
      gapSize: 0.1,
    });

    this.boundingBoxLines = new THREE.LineSegments(geometry, material);
    this.boundingBoxLines.computeLineDistances();
    this.scene.add(this.boundingBoxLines);
  }
}
