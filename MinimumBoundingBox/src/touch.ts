// 初始化变量
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let longPressTimer: any = null;
const LONG_PRESS_DURATION = 500; // 长按时间，单位毫秒

export function addTouchEventListener(
  longPressCallback: (event: TouchEvent) => void
) {
  // 支援触摸事件
  document.addEventListener("touchstart", (event) => {
    // 如果有多个触摸点，则取消长按检测
    if (event.touches.length > 1) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      return;
    }

    // 记录触摸的起始位置和时间
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();

    // 设置一个计时器，检测长按
    longPressTimer = setTimeout(() => {
      // 在这里可以触发长按的相关逻辑
      longPressCallback(event);
    }, LONG_PRESS_DURATION);
  });

  // touchend 事件处理
  document.addEventListener("touchend", (event) => {
    // 如果触摸点数减少到0或1，可能需要重新判断
    if (event.touches.length === 0 || event.touches.length === 1) {
      // 触摸结束时清除计时器
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  // touchmove 事件处理
  document.addEventListener("touchmove", (event) => {
    // 如果有多个触摸点，则取消长按检测
    if (event.touches.length > 1) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      return;
    }

    // 检查触摸点是否有移动
    const touch = event.touches[0];
    const moveX = touch.clientX;
    const moveY = touch.clientY;

    // 如果移动超过一定范围，认为不是长按
    if (
      Math.abs(moveX - touchStartX) > 10 ||
      Math.abs(moveY - touchStartY) > 10
    ) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  document.addEventListener("touchcancel", () => {
    // 触摸被中断时，清除计时器
    clearTimeout(longPressTimer);
    longPressTimer = null;
  });
}
