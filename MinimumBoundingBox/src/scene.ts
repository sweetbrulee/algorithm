// scene.ts
import * as THREE from "three";

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public gridHelper: THREE.GridHelper;
  public testPlane: THREE.Mesh;

  constructor() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75, // 视场角
      window.innerWidth / window.innerHeight, // 纵横比
      0.1, // 近裁剪面
      1000 // 远裁剪面
    );
    this.camera.position.set(0, 2, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);

    // 添加网格平面
    this.gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(this.gridHelper);

    // 创建虚拟平面
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      depthTest: true, // 允许被其他物体遮挡
    });
    this.testPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.scene.add(this.testPlane);

    // 响应窗口大小变化
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.updatePlaneSize();
    });

    // 初始计算平面大小
    this.updatePlaneSize();
  }

  /**
   * 计算并更新平面的大小，使其覆盖整个视口
   */
  public updatePlaneSize() {
    const distance = 5; // 平面距离相机的距离
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov); // 垂直视场角转换为弧度
    const height = 2 * distance * Math.tan(vFOV / 2); // 计算平面的高度
    const width = height * this.camera.aspect; // 计算平面的宽度

    this.testPlane.scale.set(width, height, 1); // 缩放平面以匹配视口
  }

  /**
   * 将平面置于相机前方
   */
  public updateTestPlane() {
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    this.testPlane.position
      .copy(this.camera.position)
      .addScaledVector(cameraDirection, 5); // 前方5单位
    this.testPlane.quaternion.copy(this.camera.quaternion); // 与相机旋转一致
  }
}
