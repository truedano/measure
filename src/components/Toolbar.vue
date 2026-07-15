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
      <span class="app-version">v{{ version }}</span>
    </span>
    
    <!-- Step 1: Calibration -->
    <div :class="['step-container', { 'step-active': store.currentImageId && store.scale === 1 }]">
      <span class="step-badge primary">1</span>
      <span class="step-label">{{ store.t('calibrateScale') }}</span>
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
        {{ store.t('drawReferenceLine') }}
      </button>
      <button 
        @click="store.removeReferenceLine" 
        :disabled="!store.currentImageId || !store.referenceLine"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        {{ store.t('removeRef') }}
      </button>
    </div>

    <!-- Step 2: Measurement -->
    <div :class="['step-container', { 'step-active': store.currentImageId && store.scale !== 1, 'step-disabled': !store.currentImageId || store.scale === 1 }]">
      <span class="step-badge accent">2</span>
      <span class="step-label">{{ store.t('measureLabel') }}</span>
      <button 
        @click="store.startDrawing('measurement')" 
        :class="{ active: store.isAddingLine }" 
        :disabled="!store.currentImageId || store.scale === 1"
        :title="store.scale === 1 ? store.t('calibrateTooltip') : store.t('addLineTooltip')"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        {{ store.t('addLine') }}
      </button>
      <button 
        @click="store.removeAll" 
        :disabled="!store.currentImageId"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        </svg>
        {{ store.t('clearLines') }}
      </button>
    </div>

    <!-- Settings Panel -->
    <div class="settings-container" ref="settingsRef">
      <button 
        class="settings-btn" 
        @click="isDropdownOpen = !isDropdownOpen" 
        :title="store.t('settings')"
      >
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      
      <div v-if="isDropdownOpen" class="settings-dropdown">
        <div class="settings-title">{{ store.t('settings') }}</div>
        
        <!-- Section: General -->
        <div class="settings-section">
          <div class="settings-section-title">
            <svg class="ui-icon section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            {{ store.t('generalSettings') }}
          </div>
          <div class="settings-row">
            <span class="settings-label">{{ store.t('language') }}</span>
            <select :value="store.language" @change="changeLanguage" class="settings-select">
              <option value="zh">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <!-- Section: Canvas Preferences (Placeholder) -->
        <div class="settings-section disabled">
          <div class="settings-section-title">
            <svg class="ui-icon section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            {{ store.t('canvasSettings') }}
          </div>
          <div class="settings-row">
            <span class="settings-label">Line Width</span>
            <span class="coming-soon">Soon</span>
          </div>
        </div>

        <!-- Section: Data Management -->
        <div class="settings-section danger-zone">
          <div class="settings-section-title">
            <svg class="ui-icon section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
            {{ store.t('dataManagement') }}
          </div>
          <div class="settings-row">
            <button class="danger-action-btn" @click="triggerResetAll">
              {{ store.t('resetWorkspace') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useWorkspaceStore } from '../stores/workspaceStore';
import pkg from '../../package.json';

const store = useWorkspaceStore();
const version = pkg.version;

const isDropdownOpen = ref(false);
const settingsRef = ref<HTMLElement | null>(null);

function handleClickOutside(event: MouseEvent) {
  if (settingsRef.value && !settingsRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function changeLanguage(event: Event) {
  const target = event.target as HTMLSelectElement;
  store.setLanguage(target.value as 'zh' | 'en');
}

function triggerResetAll() {
  isDropdownOpen.value = false;
  store.clearAllWorkspaceData();
}
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
  position: relative;
  z-index: 50;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00f0ff;
  font-size: 15px;
  margin-right: 10px;
}

.app-version {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
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

.settings-container {
  margin-left: auto;
  position: relative;
}

.settings-btn {
  background: transparent;
  border: none;
  color: #888;
  padding: 6px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.settings-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.04);
}

.settings-btn svg {
  width: 18px;
  height: 18px;
}

.settings-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #181818;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  width: 240px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-section.disabled {
  opacity: 0.45;
  pointer-events: none;
}

.settings-section-title {
  font-size: 10px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.settings-section-title .section-icon {
  width: 12px;
  height: 12px;
  color: #888;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.settings-label {
  font-size: 12px;
  color: #ccc;
}

.settings-select {
  background: #252525;
  border: 1px solid #444;
  color: #eee;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-select:hover {
  border-color: #00f0ff;
  color: #fff;
}

.coming-soon {
  font-size: 9px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: #666;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
}

.danger-action-btn {
  width: 100%;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  justify-content: center;
  display: flex;
  align-items: center;
}

.danger-action-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}
</style>
