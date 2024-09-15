// selection.ts
import * as THREE from "three";

type SelectionChangeCallback = () => void;

export class SelectionManager {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private testPlane: THREE.Mesh;

  public points: THREE.Mesh[];
  public selectedPoints: THREE.Mesh[] = [];

  // Selection Box
  private selectionBox: HTMLDivElement;
  private isSelecting: boolean = false;
  private startPoint: { x: number; y: number } = { x: 0, y: 0 };

  // Callback for selection changes
  private selectionChangeCallback: SelectionChangeCallback | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    testPlane: THREE.Mesh,
    points: THREE.Mesh[]
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.testPlane = testPlane;
    this.points = points;

    // 创建选择框的 HTML 元素
    this.selectionBox = document.createElement("div");
    this.selectionBox.style.position = "absolute";
    this.selectionBox.style.border = "2px dashed #00f";
    this.selectionBox.style.backgroundColor = "rgba(0, 0, 255, 0.1)";
    this.selectionBox.style.pointerEvents = "none";
    this.selectionBox.style.display = "none";
    document.body.appendChild(this.selectionBox);

    // 添加事件监听
    this.addEventListeners();
  }

  /**
   * 设置选择变化的回调
   * @param callback 回调函数
   */
  public setSelectionChangeCallback(callback: SelectionChangeCallback) {
    this.selectionChangeCallback = callback;
  }

  private addEventListeners() {
    // 鼠标右键单击选择
    this.renderer.domElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const selectedPoint = this.selectPoint(event);
      if (selectedPoint) {
        // 清除之前的选择（如果没有按住 Shift）
        if (!event.shiftKey) {
          this.clearSelection();
        }
        // 添加到选中集合（如果未被选中）
        if (!this.selectedPoints.includes(selectedPoint)) {
          this.selectedPoints.push(selectedPoint);
          this.highlightSelection();
          this.notifySelectionChange();
        }
      }
    });

    // 框选
    this.renderer.domElement.addEventListener("mousedown", (event) => {
      if (event.button === 0 && event.shiftKey) {
        // Shift + 左键
        this.isSelecting = true;
        this.startPoint = { x: event.clientX, y: event.clientY };
        this.selectionBox.style.left = `${this.startPoint.x}px`;
        this.selectionBox.style.top = `${this.startPoint.y}px`;
        this.selectionBox.style.width = "0px";
        this.selectionBox.style.height = "0px";
        this.selectionBox.style.display = "block";
      }
    });

    this.renderer.domElement.addEventListener("mousemove", (event) => {
      if (this.isSelecting) {
        const currentX = event.clientX;
        const currentY = event.clientY;

        const x = Math.min(currentX, this.startPoint.x);
        const y = Math.min(currentY, this.startPoint.y);
        const width = Math.abs(currentX - this.startPoint.x);
        const height = Math.abs(currentY - this.startPoint.y);

        this.selectionBox.style.left = `${x}px`;
        this.selectionBox.style.top = `${y}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
      }
    });

    this.renderer.domElement.addEventListener("mouseup", (event) => {
      if (this.isSelecting) {
        this.isSelecting = false;
        this.selectionBox.style.display = "none";

        const endPoint = { x: event.clientX, y: event.clientY };
        const rect = {
          left: Math.min(this.startPoint.x, endPoint.x),
          top: Math.min(this.startPoint.y, endPoint.y),
          right: Math.max(this.startPoint.x, endPoint.x),
          bottom: Math.max(this.startPoint.y, endPoint.y),
        };

        // 清除之前的选择
        this.clearSelection();

        // 选择在矩形内的点
        this.points.forEach((point) => {
          const screenPos = point.position.clone();
          screenPos.project(this.camera);

          const x = ((screenPos.x + 1) / 2) * window.innerWidth;
          const y = ((-screenPos.y + 1) / 2) * window.innerHeight;

          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            this.selectedPoints.push(point);
          }
        });

        // 高亮选中的点
        this.highlightSelection();
        this.notifySelectionChange();
      }
    });
  }

  /**
   * 选择单个点
   * @param event 鼠标事件
   * @returns 选中的点或 null
   */
  private selectPoint(event: MouseEvent): THREE.Mesh | null {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.points);
    if (intersects.length > 0) {
      return intersects[0].object as THREE.Mesh;
    }
    return null;
  }

  /**
   * 清除所有选中的点
   */
  public clearSelection() {
    this.selectedPoints.forEach((point) => {
      (point.material as THREE.MeshBasicMaterial).color.set(0xff0000);
    });
    this.selectedPoints = [];
    this.notifySelectionChange();
  }

  /**
   * 高亮选中的点
   */
  private highlightSelection() {
    this.selectedPoints.forEach((point) => {
      (point.material as THREE.MeshBasicMaterial).color.set(0x0000ff);
    });
  }

  /**
   * 通知选择变化
   */
  private notifySelectionChange() {
    if (this.selectionChangeCallback) {
      this.selectionChangeCallback();
    }
  }
}
