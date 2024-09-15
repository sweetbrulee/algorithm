// controls.ts
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import * as THREE from "three";

export class ControlsManager {
  public orbitControls: OrbitControls;
  public transformControls: TransformControls;

  constructor(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene
  ) {
    // 初始化 OrbitControls
    this.orbitControls = new OrbitControls(camera, renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.enablePan = true;
    this.orbitControls.mouseButtons = {
      LEFT: undefined, // 禁用左键拖拽
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    // 初始化 TransformControls
    this.transformControls = new TransformControls(camera, renderer.domElement);
    scene.add(this.transformControls);
  }

  /**
   * 更新 OrbitControls
   */
  public updateOrbitControls() {
    this.orbitControls.update();
  }
}
