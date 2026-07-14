<template>
  <div id="main-workspace" ref="workspaceRef" class="workspace-container">
    <!-- Zoom, Pan and Rotate Controls -->
    <div id="controls">
      <button @click="zoomIn" :disabled="!store.currentImageId">+</button>
      <span id="zoom-level">{{ store.currentImageId ? (store.zoomLevel * 100).toFixed(0) : 100 }}%</span>
      <button @click="zoomOut" :disabled="!store.currentImageId">-</button>

      <button @click="resetZoom" :disabled="!store.currentImageId">100%</button>
      <button @click="fitToWindow" :disabled="!store.currentImageId">Fit</button>

      <!-- Divider & Rotation Controls -->
      <div v-if="store.currentImageId" class="control-divider"></div>
      <div v-if="store.currentImageId" class="rotate-control-group">
        <span class="control-label">Rotate:</span>
        <input 
          type="range" 
          v-model.number="store.rotation" 
          @input="store.requestCanvasUpdate" 
          min="-180" 
          max="180" 
          step="0.1"
          class="rotation-slider"
          title="Fine-tune rotation"
        >
        <input 
          type="number" 
          v-model.number="store.rotation" 
          @input="store.requestCanvasUpdate" 
          min="-180" 
          max="180" 
          step="0.1"
          class="rotation-input"
        >
        <span class="deg-unit">°</span>
        <button 
          @click="store.rotation = 0; store.requestCanvasUpdate()" 
          :disabled="store.rotation === 0"
          title="Reset rotation"
          class="reset-btn"
        >
          <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Overlay Container: aligns overlays exactly over the Canvas coordinates -->
    <div v-if="store.currentImageId" class="overlay-container">
      <!-- Lines Overlay -->
      <div v-for="(line, index) in store.lines" :key="'line-' + index">
        <div v-if="line.end" class="line-length" :style="getLineStyle(line)">
          {{ getLineLength(line) }}
          <span class="delete-line" @click="store.lines.splice(index, 1); store.requestCanvasUpdate()">
            <svg class="ui-icon" style="margin: 0; width: 10px; height: 10px; vertical-align: baseline;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </div>
        <div 
          v-for="(handle, handleIndex) in line.handles" 
          :key="'handle-' + index + '-' + handleIndex" 
          class="handle" 
          :style="getHandleStyle(handle)"
          @mousedown="startDraggingHandle($event, line, handleIndex + 1)"
        ></div>
      </div>

      <!-- Reference Line Overlay -->
      <div v-if="store.referenceLine && store.referenceLine.end">
        <div class="reference-length" :style="getLineStyle(store.referenceLine)">
          <input 
            type="number" 
            v-model.number="store.referenceLength" 
            @input="store.updateMeasurementLabels" 
            size="4" 
            min="0" 
            step="0.1"
            class="ref-len-input"
          >
          <select v-model="store.unit" @change="store.updateMeasurementLabels" class="unit-select">
            <option value="">none</option>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
            <option value="in">in</option>
          </select>
          <span class="delete-line" @click="store.removeReferenceLine" title="Delete Reference Line">
            <svg class="ui-icon" style="margin-left: 2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </div>
        <div 
          v-for="(handle, handleIndex) in store.referenceLine.handles" 
          :key="'ref-handle-' + handleIndex" 
          class="handle reference-handle" 
          :style="getHandleStyle(handle)"
          @mousedown="startDraggingHandle($event, store.referenceLine, handleIndex + 1)"
        ></div>
      </div>
    </div>

    <canvas 
      ref="canvasRef" 
      @click="placeLine" 
      @mousemove="trackMouse"
      @mouseleave="clearMouse"
      :style="{ cursor: store.isAddingLine || store.isAddingReferenceLine ? 'crosshair' : (isPanning ? 'grabbing' : 'default') }"
      @mousedown="startPan" 
      @touchstart="startTouchPan" 
      @touchmove="handleTouchMove" 
      @touchend="endTouchPan"
      class="canvas-element"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useZoomPan } from '../composables/useZoomPan';
import { useCanvasDraw } from '../composables/useCanvasDraw';
import type { Line, Point } from '../types/workspace';

const store = useWorkspaceStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const currentHandle = ref<{ line: Line; handleIndex: number } | null>(null);

// Composables
const { getCanvasCoordinates, getLineLength, updateCanvas } = useCanvasDraw(canvasRef);
const {
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
  handleKeyPan
} = useZoomPan(canvasRef, updateCanvas);

// Watch stores data changes to update canvas
watch(() => store.triggerCanvasUpdate, () => {
  updateCanvas();
});

// Update canvas resize offset
function handleResize() {
  updateCanvas();
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyPan);
  
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.addEventListener('wheel', handleZoomAndPan, { passive: false });
  }

  // Initial draw
  setTimeout(() => {
    updateCanvas();
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyPan);
  
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('wheel', handleZoomAndPan);
  }
});

function trackMouse(e: MouseEvent) {
  if (!store.currentImageId) return;
  if (store.isAddingLine || store.isAddingReferenceLine) {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    store.mousePos = { x, y };
    store.requestCanvasUpdate();
  }
}

function clearMouse() {
  if (store.mousePos) {
    store.mousePos = null;
    store.requestCanvasUpdate();
  }
}

// Click to draw line
function placeLine(e: MouseEvent) {
  if (!store.currentImageId) return;
  
  // If we clicked a handle, don't draw new lines
  const target = e.target as HTMLElement;
  if (target.classList.contains('handle') || target.closest('.line-length') || target.closest('.reference-length')) {
    return;
  }

  const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
  
  if (store.isAddingLine) {
    if (!store.lines.length || store.lines[store.lines.length - 1].end) {
      // Start a new line
      store.lines.push({
        start: { x, y },
        end: null,
        handles: [{ x, y }],
        note: ''
      });
    } else {
      // End current line
      const currentLine = store.lines[store.lines.length - 1];
      currentLine.end = { x, y };
      currentLine.handles.push({ x, y });
      store.isAddingLine = false;
      store.mousePos = null; // Clear preview
      store.requestCanvasUpdate();
    }
  } else if (store.isAddingReferenceLine) {
    if (!store.referenceLine) {
      // Start a new reference line
      store.referenceLine = {
        start: { x, y },
        end: null,
        handles: [{ x, y }]
      };
    } else if (!store.referenceLine.end) {
      // End reference line
      store.referenceLine.end = { x, y };
      store.referenceLine.handles.push({ x, y });
      store.isAddingReferenceLine = false;
      store.mousePos = null; // Clear preview
      store.referenceLength = 1;
      store.updateMeasurementLabels();
    }
  }
}

// Drag Handles
function startDraggingHandle(e: MouseEvent, line: Line, handleIndex: number) {
  e.stopPropagation();
  e.preventDefault();
  currentHandle.value = { line, handleIndex };
  document.addEventListener('mousemove', dragHandle);
  document.addEventListener('mouseup', endDraggingHandle);
}

function dragHandle(e: MouseEvent) {
  if (!currentHandle.value) return;
  const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
  const handle = currentHandle.value.line.handles[currentHandle.value.handleIndex - 1];
  
  handle.x = x;
  handle.y = y;
  
  if (currentHandle.value.handleIndex === 1) {
    currentHandle.value.line.start = { x, y };
  } else {
    currentHandle.value.line.end = { x, y };
  }
  
  store.updateMeasurementLabels();
  updateCanvas();
}

function endDraggingHandle() {
  currentHandle.value = null;
  document.removeEventListener('mousemove', dragHandle);
  document.removeEventListener('mouseup', endDraggingHandle);
}

// Positioning CSS computation
function getRotatedPosition(pt: Point): Point {
  const img = store.currentImage?.imgObject;
  const rotationDeg = store.rotation;
  
  if (img && rotationDeg) {
    const angleRad = (rotationDeg * Math.PI) / 180;
    const cx = img.width / 2;
    const cy = img.height / 2;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const dx = pt.x - cx;
    const dy = pt.y - cy;

    return {
      x: cx + dx * cosA - dy * sinA,
      y: cy + dx * sinA + dy * cosA
    };
  }
  return pt;
}

function getLineStyle(line: Line) {
  if (!line.end) return {};
  const midPoint = {
    x: (line.start.x + line.end.x) / 2,
    y: (line.start.y + line.end.y) / 2
  };
  const rotated = getRotatedPosition(midPoint);
  const left = rotated.x * store.zoomLevel + store.panX;
  const top = rotated.y * store.zoomLevel + store.panY;
  return {
    left: `${left}px`,
    top: `${top}px`,
  };
}

function getHandleStyle(handle: Point) {
  const rotated = getRotatedPosition(handle);
  const left = rotated.x * store.zoomLevel + store.panX;
  const top = rotated.y * store.zoomLevel + store.panY;
  return {
    left: `${left}px`,
    top: `${top}px`,
  };
}
</script>

<style scoped>
.workspace-container {
  grid-area: main;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #141414;
}

.canvas-element {
  display: block;
  width: 100%;
  height: 100%;
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let canvas capture drag start */
  z-index: 10;
}

#controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
  display: flex;
  gap: 8px;
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(10px);
  padding: 6px;
  border-radius: 6px;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

#controls button {
  width: 32px;
  height: 32px;
  font-size: 14px;
  cursor: pointer;
  background: #252525;
  border: 1px solid #444;
  color: white;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

#controls button:hover:not(:disabled) {
  background: #353535;
}

#controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

#zoom-level {
  font-size: 12px;
  font-family: monospace;
  padding: 0 8px;
  color: #ccc;
}

.handle {
  width: 8px;
  height: 8px;
  background: rgba(0, 240, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: auto; /* Allow drag capture */
  z-index: 30;
  box-shadow: 0 0 6px rgba(0, 240, 255, 0.8);
  transition: transform 0.15s, background-color 0.15s;
}

.handle:hover {
  transform: translate(-50%, -50%) scale(1.3);
  background-color: rgba(0, 240, 255, 0.85);
}

.reference-handle {
  background: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 6px rgba(168, 85, 247, 0.8);
}

.reference-handle:hover {
  background-color: rgba(168, 85, 247, 0.85);
}

.line-length, .reference-length {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(15, 15, 15, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #00f0ff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Outfit', sans-serif;
  white-space: nowrap;
  pointer-events: auto; /* Allow mouse interaction for delete button */
  z-index: 25;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  border: 1px solid rgba(0, 240, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -10px;
}

.reference-length {
  color: #a855f7;
  border-color: rgba(168, 85, 247, 0.2);
}

.delete-line {
  cursor: pointer;
  color: #aaa;
  display: flex;
  align-items: center;
  transition: color 0.1s;
}

.delete-line:hover {
  color: #ef4444;
}

.ref-len-input {
  background: #181818;
  border: 1px solid #444;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  width: 45px;
  font-size: 11px;
  outline: none;
}

.unit-select {
  background: #181818;
  border: 1px solid #444;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 11px;
  outline: none;
}

.ui-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2.2;
  flex-shrink: 0;
}

.control-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 8px;
}

.rotate-control-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 11px;
  color: #aaa;
  font-weight: 500;
  margin-right: 2px;
}

.rotation-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: #333;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.rotation-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #00f0ff;
  cursor: pointer;
  transition: transform 0.1s;
}

.rotation-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.rotation-input {
  background: #252525;
  border: 1px solid #444;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  width: 48px;
  font-size: 11px;
  outline: none;
  text-align: center;
  transition: border-color 0.2s;
}

.rotation-input:focus {
  border-color: #00f0ff;
}

.deg-unit {
  font-size: 11px;
  color: #888;
  margin-left: -4px;
  margin-right: 4px;
}

#controls .reset-btn {
  padding: 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #252525;
  border: 1px solid #444;
  color: white;
  min-width: unset;
}

#controls .reset-btn:hover:not(:disabled) {
  background: #353535;
  color: white;
}
</style>
