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
      <!-- Lines Overlay (Handles only, length UI moved to top-right panel) -->
      <div v-for="(line, index) in store.lines" :key="'line-' + index">
        <div 
          v-for="(handle, handleIndex) in line.handles" 
          :key="'handle-' + index + '-' + handleIndex" 
          class="handle" 
          :style="[
            getHandleStyle(handle),
            {
              backgroundColor: store.hoveredLineIndex === index ? getColorForLine(index) : 'rgba(0, 240, 255, 0.5)',
              boxShadow: store.hoveredLineIndex === index ? `0 0 8px ${getColorForLine(index)}` : '0 0 6px rgba(0, 240, 255, 0.8)'
            }
          ]"
          @mousedown="startDraggingHandle($event, line, handleIndex + 1)"
          @mouseenter="store.hoveredLineIndex = index; store.requestCanvasUpdate()"
          @mouseleave="store.hoveredLineIndex = null; store.requestCanvasUpdate()"
        ></div>
      </div>

      <!-- Reference Line Overlay (Handles only, settings UI moved to top-right panel) -->
      <div v-if="store.referenceLine && store.referenceLine.end">
        <div 
          v-for="(handle, handleIndex) in store.referenceLine.handles" 
          :key="'ref-handle-' + handleIndex" 
          class="handle reference-handle" 
          :style="[
            getHandleStyle(handle),
            {
              backgroundColor: store.hoveredLineIndex === -1 ? '#a855f7' : 'rgba(168, 85, 247, 0.5)',
              boxShadow: store.hoveredLineIndex === -1 ? '0 0 8px #a855f7' : '0 0 6px rgba(168, 85, 247, 0.8)'
            }
          ]"
          @mousedown="startDraggingHandle($event, store.referenceLine, handleIndex + 1)"
          @mouseenter="store.hoveredLineIndex = -1; store.requestCanvasUpdate()"
          @mouseleave="store.hoveredLineIndex = null; store.requestCanvasUpdate()"
        ></div>
      </div>
    </div>

    <!-- Measurements and Calibration Panel (Top Right Floating Panel) -->
    <div v-if="store.currentImageId" class="measurements-panel" :class="{ 'is-collapsed': isPanelCollapsed }">
      <!-- Panel Header -->
      <div class="panel-header" @click="isPanelCollapsed = !isPanelCollapsed">
        <span class="panel-header-title">
          <svg class="ui-icon" style="color: #00f0ff; width: 14px; height: 14px; margin-right: 6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect>
            <line x1="6" y1="7" x2="6" y2="12"></line>
            <line x1="10" y1="7" x2="10" y2="12"></line>
            <line x1="14" y1="7" x2="14" y2="12"></line>
            <line x1="18" y1="7" x2="18" y2="12"></line>
          </svg>
          Measurement & Calibration {{ store.lines.filter(l => l.end).length ? `(${store.lines.filter(l => l.end).length})` : '' }}
        </span>
        <span class="toggle-collapse-btn">
          <svg class="ui-icon" :style="{ transform: isPanelCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </span>
      </div>

      <!-- Panel Content (Hidden when collapsed) -->
      <div v-show="!isPanelCollapsed" class="panel-content">
        <!-- Calibration Section -->
        <div class="panel-section">
          <div class="section-title">Scale Calibration</div>
          <div 
            v-if="store.referenceLine && store.referenceLine.end" 
            class="calibration-box"
            :style="{ 
              borderColor: store.hoveredLineIndex === -1 ? '#a855f7' : 'rgba(168, 85, 247, 0.2)',
              boxShadow: store.hoveredLineIndex === -1 ? '0 0 6px rgba(168, 85, 247, 0.25)' : 'none'
            }"
            @mouseenter="store.hoveredLineIndex = -1; store.requestCanvasUpdate()"
            @mouseleave="store.hoveredLineIndex = null; store.requestCanvasUpdate()"
          >
            <input 
              type="number" 
              v-model.number="store.referenceLength" 
              @input="store.updateMeasurementLabels" 
              min="0" 
              step="0.1"
              class="ref-len-input"
              title="Enter the actual length of the reference line"
              placeholder="Length"
            >
            <select v-model="store.unit" @change="store.updateMeasurementLabels" class="unit-select" title="Select length unit">
              <option value="">none</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
            </select>
            <button class="delete-btn" @click="store.removeReferenceLine" title="Delete reference line">
              <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div v-else class="placeholder-text">
            No reference line drawn
          </div>
        </div>

        <!-- Measurements Section -->
        <div class="panel-section">
          <div class="section-title">Measurement Lines</div>
          <div v-if="store.lines.some(l => l.end)" class="measure-list">
            <template v-for="(line, index) in store.lines" :key="'measure-list-' + index">
              <div 
                v-if="line.end" 
                class="measure-item"
                :class="{ 'is-hovered': store.hoveredLineIndex === index }"
                :style="{ 
                  borderColor: store.hoveredLineIndex === index ? getColorForLine(index) : 'rgba(255, 255, 255, 0.06)',
                  boxShadow: store.hoveredLineIndex === index ? `0 0 6px ${getColorForLine(index)}40` : 'none'
                }"
                @mouseenter="store.hoveredLineIndex = index; store.requestCanvasUpdate()"
                @mouseleave="store.hoveredLineIndex = null; store.requestCanvasUpdate()"
              >
                <span class="measure-label" :style="{ color: getColorForLine(index) }">L{{ index + 1 }}</span>
                <span class="measure-val">{{ getLineLength(line) }}</span>
                <button class="delete-btn" @click="store.lines.splice(index, 1); store.requestCanvasUpdate()" title="Delete line">
                  <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </template>
          </div>
          <div v-else class="placeholder-text">
            No measurement lines drawn
          </div>
        </div>
      </div>
    </div>

    <canvas 
      ref="canvasRef" 
      @click="placeLine" 
      @mousemove="trackMouse"
      @mouseleave="clearMouse"
      :style="{ cursor: store.isAddingLine || store.isAddingReferenceLine ? 'crosshair' : (store.hoveredLineIndex !== null ? 'move' : (isPanning ? 'grabbing' : 'default')) }"
      @mousedown="handleMouseDown" 
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
const isDraggingLine = ref(false);
const dragStartMouse = ref<Point | null>(null);
const dragStartLinePoints = ref<{ start: Point; end: Point } | null>(null);
const draggingLineRef = ref<Line | null>(null);
const isPanelCollapsed = ref(false);

// Composables
const { getCanvasCoordinates, getLineLength, getColorForLine, updateCanvas, getDistanceToSegment } = useCanvasDraw(canvasRef);
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
  const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
  
  if (store.isAddingLine || store.isAddingReferenceLine) {
    store.mousePos = { x, y };
    store.requestCanvasUpdate();
    return;
  }
  
  if (currentHandle.value || isDraggingLine.value) return;

  let foundHoveredIndex: number | null = null;
  const threshold = 8 / store.zoomLevel;

  // Check reference line
  if (store.referenceLine && store.referenceLine.end) {
    const dist = getDistanceToSegment({ x, y }, store.referenceLine.start, store.referenceLine.end);
    if (dist <= threshold) {
      foundHoveredIndex = -1;
    }
  }

  // Check measurement lines
  if (foundHoveredIndex === null) {
    for (let i = store.lines.length - 1; i >= 0; i--) {
      const line = store.lines[i];
      if (line.end) {
        const dist = getDistanceToSegment({ x, y }, line.start, line.end);
        if (dist <= threshold) {
          foundHoveredIndex = i;
          break;
        }
      }
    }
  }

  if (store.hoveredLineIndex !== foundHoveredIndex) {
    store.hoveredLineIndex = foundHoveredIndex;
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
  
  const target = e.target as HTMLElement;
  if (target.classList.contains('handle') || target.closest('.measurements-panel')) {
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

function handleMouseDown(e: MouseEvent) {
  if (!store.currentImageId) return;
  if (store.isAddingLine || store.isAddingReferenceLine) return;
  
  if (store.hoveredLineIndex !== null) {
    startDraggingLine(e);
  } else {
    startPan(e);
  }
}

function startDraggingLine(e: MouseEvent) {
  if (store.hoveredLineIndex === null) return;
  e.stopPropagation();
  e.preventDefault();

  const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
  dragStartMouse.value = { x, y };

  const line = store.hoveredLineIndex === -1 
    ? store.referenceLine 
    : store.lines[store.hoveredLineIndex];

  if (line && line.start && line.end) {
    draggingLineRef.value = line;
    dragStartLinePoints.value = {
      start: { ...line.start },
      end: { ...line.end }
    };
    isDraggingLine.value = true;

    document.addEventListener('mousemove', dragLine);
    document.addEventListener('mouseup', endDraggingLine);
  }
}

function dragLine(e: MouseEvent) {
  if (!isDraggingLine.value || !draggingLineRef.value || !dragStartMouse.value || !dragStartLinePoints.value) return;
  
  const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
  const dx = x - dragStartMouse.value.x;
  const dy = y - dragStartMouse.value.y;

  // Apply delta to line start and end
  draggingLineRef.value.start.x = dragStartLinePoints.value.start.x + dx;
  draggingLineRef.value.start.y = dragStartLinePoints.value.start.y + dy;
  
  if (draggingLineRef.value.end && dragStartLinePoints.value.end) {
    draggingLineRef.value.end.x = dragStartLinePoints.value.end.x + dx;
    draggingLineRef.value.end.y = dragStartLinePoints.value.end.y + dy;
  }

  // Update handles
  if (draggingLineRef.value.handles[0]) {
    draggingLineRef.value.handles[0].x = draggingLineRef.value.start.x;
    draggingLineRef.value.handles[0].y = draggingLineRef.value.start.y;
  }
  if (draggingLineRef.value.handles[1] && draggingLineRef.value.end) {
    draggingLineRef.value.handles[1].x = draggingLineRef.value.end.x;
    draggingLineRef.value.handles[1].y = draggingLineRef.value.end.y;
  }

  store.updateMeasurementLabels();
  updateCanvas();
}

function endDraggingLine() {
  isDraggingLine.value = false;
  draggingLineRef.value = null;
  dragStartMouse.value = null;
  dragStartLinePoints.value = null;

  document.removeEventListener('mousemove', dragLine);
  document.removeEventListener('mouseup', endDraggingLine);
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

.measurements-panel {
  position: absolute;
  top: 75px;
  right: 20px;
  width: 220px;
  max-height: calc(100% - 120px);
  overflow: hidden; /* Prevent scrollbar in header when collapsed */
  z-index: 20;
  background: rgba(20, 20, 20, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: #fff;
  font-family: 'Outfit', sans-serif;
  pointer-events: auto; /* Allow interaction */
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.measurements-panel.is-collapsed {
  max-height: 34px; /* Height of header only */
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s;
}

.panel-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.panel-header * {
  pointer-events: none;
}

.panel-header-title {
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  color: #ccc;
  letter-spacing: 0.5px;
}

.toggle-collapse-btn {
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-collapse-btn .ui-icon {
  width: 12px;
  height: 12px;
  transition: transform 0.25s ease;
}

.panel-content {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 2px;
}

.calibration-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.2);
  padding: 4px 6px;
  border-radius: 4px;
  justify-content: space-between;
}

.calibration-label {
  font-size: 10px;
  color: #a855f7;
  font-weight: 500;
}

.placeholder-text {
  font-size: 10px;
  color: #555;
  font-style: italic;
  padding: 2px 0;
}

.measure-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.measure-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.measure-item:hover {
  background: rgba(0, 240, 255, 0.05);
  border-color: rgba(0, 240, 255, 0.15);
}

.measure-label {
  font-size: 10px;
  color: #00f0ff;
  font-weight: 500;
}

.measure-val {
  font-size: 11px;
  font-family: monospace;
  color: #ccc;
  margin-left: auto;
  margin-right: 6px;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.12s, background-color 0.12s;
}

.delete-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.08);
}

.delete-btn .ui-icon {
  width: 12px;
  height: 12px;
}

.ref-len-input {
  background: #181818;
  border: 1px solid #444;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  width: 50px;
  font-size: 11px;
  outline: none;
}

.unit-select {
  background: #181818;
  border: 1px solid #444;
  color: white;
  padding: 1px 2px;
  border-radius: 3px;
  font-size: 11px;
  outline: none;
  width: 60px;
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
