import { ref } from 'vue';
import { useWorkspaceStore } from '../stores/workspaceStore';

export function useZoomPan(
  canvasRef: { value: HTMLCanvasElement | null },
  updateCanvas: () => void
) {
  const store = useWorkspaceStore();
  
  const isPanning = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const isTouchPanning = ref(false);
  const lastPinchDistance = ref(0);
  const lastMoveEventTime = ref(0);

  function zoomIn() {
    if (!store.currentImageId) return;
    store.zoomLevel = Math.min(store.zoomLevel * 1.2, 10);
    updateCanvas();
  }

  function zoomOut() {
    if (!store.currentImageId) return;
    store.zoomLevel = Math.max(store.zoomLevel / 1.2, 0.1);
    updateCanvas();
  }

  function resetZoom() {
    if (!store.currentImageId) return;
    store.zoomLevel = 1;
    store.panX = 0;
    store.panY = 0;
    updateCanvas();
  }

  function fitToWindow() {
    const canvas = canvasRef.value;
    const img = store.currentImage?.imgObject;
    if (!canvas || !img) return;

    const rotationDeg = store.rotation;
    let imgWidth = img.width;
    let imgHeight = img.height;

    if (rotationDeg) {
      const angleRad = (rotationDeg * Math.PI) / 180;
      const cosA = Math.abs(Math.cos(angleRad));
      const sinA = Math.abs(Math.sin(angleRad));
      imgWidth = img.width * cosA + img.height * sinA;
      imgHeight = img.width * sinA + img.height * cosA;
    }

    const widthScale = canvas.clientWidth / imgWidth;
    const heightScale = canvas.clientHeight / imgHeight;
    const newScale = Math.min(widthScale, heightScale, 1) * 0.95;

    store.zoomLevel = newScale;
    store.panX = (canvas.clientWidth - img.width * newScale) / 2;
    store.panY = (canvas.clientHeight - img.height * newScale) / 2;
    updateCanvas();
  }

  function handleZoomAndPan(e: WheelEvent) {
    if (!store.currentImageId) return;
    e.preventDefault();
    const canvas = canvasRef.value;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;
    let newZoom = store.zoomLevel;

    if (e.deltaY < 0) {
      newZoom = Math.min(store.zoomLevel * zoomFactor, 10);
    } else {
      newZoom = Math.max(store.zoomLevel / zoomFactor, 0.1);
    }

    const mouseXOnImage = (mouseX - store.panX) / store.zoomLevel;
    const mouseYOnImage = (mouseY - store.panY) / store.zoomLevel;

    store.panX = mouseX - mouseXOnImage * newZoom;
    store.panY = mouseY - mouseYOnImage * newZoom;
    store.zoomLevel = newZoom;

    updateCanvas();
  }

  function startPan(e: MouseEvent) {
    if (!store.currentImageId || (e.button !== 1 && e.button !== 0)) return; // Middle or Left click
    isPanning.value = true;
    startX.value = e.clientX - store.panX;
    startY.value = e.clientY - store.panY;
    
    document.addEventListener('mousemove', handlePan);
    document.addEventListener('mouseup', endPan);
  }

  function handlePan(e: MouseEvent) {
    if (!isPanning.value) return;
    store.panX = e.clientX - startX.value;
    store.panY = e.clientY - startY.value;
    updateCanvas();
  }

  function endPan() {
    isPanning.value = false;
    document.removeEventListener('mousemove', handlePan);
    document.removeEventListener('mouseup', endPan);
  }

  // Touch Panning and Pinch zooming
  function startTouchPan(e: TouchEvent) {
    if (!store.currentImageId) return;
    if (e.touches.length === 1) {
      isTouchPanning.value = true;
      startX.value = e.touches[0].clientX - store.panX;
      startY.value = e.touches[0].clientY - store.panY;
    } else if (e.touches.length === 2) {
      isTouchPanning.value = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.value = Math.sqrt(dx * dx + dy * dy);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (!store.currentImageId) return;
    const now = Date.now();
    if (now - lastMoveEventTime.value < 16) return; // throttle 60fps
    lastMoveEventTime.value = now;

    if (e.touches.length === 1 && isTouchPanning.value) {
      store.panX = e.touches[0].clientX - startX.value;
      store.panY = e.touches[0].clientY - startY.value;
      updateCanvas();
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const canvas = canvasRef.value;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      const pinchScale = dist / lastPinchDistance.value;
      let newZoom = store.zoomLevel * pinchScale;
      newZoom = Math.max(Math.min(newZoom, 10), 0.1);

      const midXOnImage = (midX - store.panX) / store.zoomLevel;
      const midYOnImage = (midY - store.panY) / store.zoomLevel;

      store.panX = midX - midXOnImage * newZoom;
      store.panY = midY - midYOnImage * newZoom;
      store.zoomLevel = newZoom;
      
      lastPinchDistance.value = dist;
      updateCanvas();
    }
  }

  function endTouchPan() {
    isTouchPanning.value = false;
  }

  function handleKeyPan(e: KeyboardEvent) {
    if (!store.currentImageId) return;
    const panStep = 20;
    if (e.key === 'ArrowUp') store.panY += panStep;
    else if (e.key === 'ArrowDown') store.panY -= panStep;
    else if (e.key === 'ArrowLeft') store.panX += panStep;
    else if (e.key === 'ArrowRight') store.panX -= panStep;
    else return;
    
    e.preventDefault();
    updateCanvas();
  }

  return {
    isPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWindow,
    handleZoomAndPan,
    startPan,
    startTouchPan,
    handleTouchMove,
    endTouchPan,
    handleKeyPan,
  };
}
