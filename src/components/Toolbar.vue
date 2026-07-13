<template>
  <div id="toolbar">
    <span class="app-logo">
      <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21.3 8.25a2.25 2.25 0 0 1 0 3.18l-9.87 9.87a2.25 2.25 0 0 1-3.18 0l-5-5a2.25 2.25 0 0 1 0-3.18l9.87-9.87a2.25 2.25 0 0 1 3.18 0l5 5z"></path>
        <path d="m6.75 8.75 2 2"></path>
        <path d="m9.25 11.25 2 2"></path>
        <path d="m11.75 13.75 2 2"></path>
        <path d="m14.25 16.25 2 2"></path>
      </svg>
      <b>Measure App</b>
    </span>
    
    <!-- Step 1: Calibration -->
    <div :class="['step-container', { 'step-active': store.currentImageId && store.scale === 1 }]">
      <span class="step-badge primary">1</span>
      <span class="step-label">Calibrate Scale:</span>
      <input 
        type="number" 
        v-model.number="store.dpi" 
        @input="store.updateScaleFromDPI" 
        :disabled="!store.currentImageId || !!(store.referenceLine && store.referenceLine.end)" 
        min="0" 
        step="1" 
        class="dpi-input"
        placeholder="DPI"
      >
      <span class="or-text">or</span>
      <button 
        @click="store.startDrawing('reference')" 
        :class="{ active: store.isAddingReferenceLine }" 
        :disabled="!store.currentImageId || !!(store.referenceLine && store.referenceLine.end)"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21.3 8.25a2.25 2.25 0 0 1 0 3.18l-9.87 9.87a2.25 2.25 0 0 1-3.18 0l-5-5a2.25 2.25 0 0 1 0-3.18l9.87-9.87a2.25 2.25 0 0 1 3.18 0l5 5z"></path>
        </svg>
        Draw Reference Line
      </button>
      <button 
        @click="store.removeReferenceLine" 
        :disabled="!store.currentImageId || !store.referenceLine"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Remove Ref
      </button>
    </div>

    <!-- Step 2: Measurement -->
    <div :class="['step-container', { 'step-active': store.currentImageId && store.scale !== 1, 'step-disabled': !store.currentImageId || store.scale === 1 }]">
      <span class="step-badge accent">2</span>
      <span class="step-label">Measure:</span>
      <button 
        @click="store.startDrawing('measurement')" 
        :class="{ active: store.isAddingLine }" 
        :disabled="!store.currentImageId || store.scale === 1"
        :title="store.scale === 1 ? 'Please calibrate scale in Step 1 first' : 'Add measurement line'"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        Add Line
      </button>
      <button 
        @click="store.removeAll" 
        :disabled="!store.currentImageId"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        </svg>
        Clear Lines
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspaceStore';
const store = useWorkspaceStore();
</script>

<style scoped>
#toolbar {
  grid-area: toolbar;
  background: #181818;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00f0ff;
  font-size: 15px;
  margin-right: 10px;
}

.step-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s ease;
}

.step-active {
  border-color: rgba(168, 85, 247, 0.4);
  background: rgba(168, 85, 247, 0.04);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.15);
  animation: breathe 2s infinite ease-in-out;
}

#step-2.step-active {
  border-color: rgba(0, 240, 255, 0.4);
  background: rgba(0, 240, 255, 0.03);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.1);
}

.step-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.step-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: #000;
}

.step-badge.primary {
  background: #a855f7;
  color: white;
}

.step-badge.accent {
  background: #00f0ff;
  color: black;
}

.step-label {
  font-size: 12px;
  font-weight: 600;
  color: #e0e0e0;
}

.or-text {
  font-size: 11px;
  color: #666;
  font-style: italic;
  margin: 0 2px;
}

button {
  background: #252525;
  border: 1px solid #444;
  color: #ccc;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #353535;
  border-color: #555555;
  color: #ffffff;
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button.active {
  background: rgba(0, 240, 255, 0.15);
  border-color: #00f0ff;
  color: #00f0ff;
}

.step-active button.active {
  background: rgba(168, 85, 247, 0.2);
  border-color: #a855f7;
  color: #c084fc;
}

.dpi-input {
  background: #252525;
  border: 1px solid #444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  width: 60px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.dpi-input:focus:not(:disabled) {
  border-color: #a855f7;
}

.dpi-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ui-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2.2;
  flex-shrink: 0;
}

@keyframes breathe {
  0% {
    box-shadow: 0 0 4px rgba(168, 85, 247, 0.1);
  }
  50% {
    box-shadow: 0 0 12px rgba(168, 85, 247, 0.25);
    border-color: rgba(168, 85, 247, 0.55);
  }
  100% {
    box-shadow: 0 0 4px rgba(168, 85, 247, 0.1);
  }
}
</style>
