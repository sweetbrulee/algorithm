// main.ts
import * as THREE from "three";
import { SceneManager } from "./scene";
import { ControlsManager } from "./controls";
import { SelectionManager } from "./selection";
import { BoundingBoxManager } from "./boundingBox";
import { computeCentroid } from "./utils";

// 初始化 SceneManager
const sceneManager = new SceneManager();

// 初始化 ControlsManager
const controlsManager = new ControlsManager(
  sceneManager.camera,
  sceneManager.renderer,
  sceneManager.scene
);

// 初始化点集合
const points: THREE.Mesh[] = [];

// 初始化 SelectionManager
const selectionManager = new SelectionManager(
  sceneManager.renderer,
  sceneManager.camera,
  sceneManager.scene,
  sceneManager.testPlane,
  points
);

// 初始化 BoundingBoxManager
const boundingBoxManager = new BoundingBoxManager(sceneManager.scene, points);

// 创建一个全局 Dummy 对象用于多点移动
const dummy = new THREE.Object3D();
sceneManager.scene.add(dummy);

// 设置 SelectionManager 的回调
selectionManager.setSelectionChangeCallback(() => {
  const selectedCount = selectionManager.selectedPoints.length;

  if (selectedCount === 1) {
    // 单点选择，附加到该点
    controlsManager.transformControls.attach(
      selectionManager.selectedPoints[0]
    );
  } else if (selectedCount > 1) {
    // 多点选择，附加到 Dummy 对象
    const centroid = computeCentroid(
      selectionManager.selectedPoints.map((p) => p.position)
    );
    dummy.position.copy(centroid);
    controlsManager.transformControls.attach(dummy);
  } else {
    // 无选择，分离 TransformControls
    controlsManager.transformControls.detach();
  }

  // 更新包围盒
  boundingBoxManager.updateBoundingBox();
});

// 管理 TransformControls 的 objectChange 事件
let previousDummyPosition = new THREE.Vector3();

controlsManager.transformControls.addEventListener("objectChange", () => {
  if (controlsManager.transformControls.object === dummy) {
    const currentPosition = dummy.position.clone();
    const delta = new THREE.Vector3().subVectors(
      currentPosition,
      previousDummyPosition
    );

    // 将增量应用到所有选中的点
    selectionManager.selectedPoints.forEach((point) => {
      point.position.add(delta);
    });

    // 更新 previousDummyPosition
    previousDummyPosition.copy(currentPosition);
  }
  // 更新包围盒
  boundingBoxManager.updateBoundingBox();
});

// 监听 TransformControls 的 dragging-changed 事件，启用/禁用 OrbitControls
controlsManager.transformControls.addEventListener(
  "dragging-changed",
  (event) => {
    controlsManager.orbitControls.enabled = !event.value;
  }
);

// 添加键盘事件监听器
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey) {
    document.addEventListener("click", onAddPoint);
  }

  // 删除选中点
  if (event.key === "Delete") {
    if (selectionManager.selectedPoints.length > 0) {
      selectionManager.selectedPoints.forEach((point) => {
        sceneManager.scene.remove(point);
        const index = points.indexOf(point);
        if (index > -1) points.splice(index, 1);
      });
      selectionManager.selectedPoints = [];
      controlsManager.transformControls.detach();
      boundingBoxManager.updateBoundingBox();
    }
  }
});

document.addEventListener("keyup", (event) => {
  if (!event.ctrlKey) {
    document.removeEventListener("click", onAddPoint);
  }
});

// 点击新增点的逻辑
function onAddPoint(event: MouseEvent) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, sceneManager.camera);

  // 使用已经存在的 testPlane 进行交叉检测
  const intersects = raycaster.intersectObject(sceneManager.testPlane);

  if (intersects.length > 0) {
    const intersectPoint = intersects[0].point;

    // 新增点
    const point = createPoint(intersectPoint);
    points.push(point);
    sceneManager.scene.add(point);
    boundingBoxManager.updateBoundingBox();
  }
}

function createPoint(position: THREE.Vector3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  mesh.position.copy(position);
  return mesh;
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  controlsManager.updateOrbitControls();
  sceneManager.updateTestPlane();
  sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
}

animate();
