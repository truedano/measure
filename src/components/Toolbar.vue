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
    
    <span class="control-group">
      Measure:
      <button 
        @click="store.startDrawing('measurement')" 
        :class="{ active: store.isAddingLine }" 
        :disabled="!store.currentImageId"
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
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
        Clear Lines
      </button>
    </span>

    <span class="control-group">
      DPI: 
      <input 
        type="number" 
        v-model.number="store.dpi" 
        @input="store.updateScaleFromDPI" 
        :disabled="!store.currentImageId || !!(store.referenceLine && store.referenceLine.end)" 
        min="0" 
        step="1" 
        class="dpi-input"
      >
      or
      <button 
        @click="store.startDrawing('reference')" 
        :class="{ active: store.isAddingReferenceLine }" 
        :disabled="!store.currentImageId || !!(store.referenceLine && store.referenceLine.end)"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21.3 8.25a2.25 2.25 0 0 1 0 3.18l-9.87 9.87a2.25 2.25 0 0 1-3.18 0l-5-5a2.25 2.25 0 0 1 0-3.18l9.87-9.87a2.25 2.25 0 0 1 3.18 0l5 5z"></path>
          <path d="m6.75 8.75 2 2"></path>
          <path d="m9.25 11.25 2 2"></path>
          <path d="m11.75 13.75 2 2"></path>
          <path d="m14.25 16.25 2 2"></path>
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
        Remove Reference Line
      </button>
    </span>
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
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00f0ff;
  font-size: 15px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #aaa;
  font-size: 13px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding-left: 20px;
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
  background: #444444;
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
  border-color: #00f0ff;
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
</style>
