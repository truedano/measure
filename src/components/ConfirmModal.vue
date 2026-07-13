<template>
  <div v-if="store.modal.show && store.modal.onCancel && store.modal.onConfirm" class="modal-overlay" @click.self="store.modal.onCancel">
    <div class="modal-card">
      <h3 class="modal-title">
        <svg class="ui-icon" style="color: #ef4444; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        {{ store.modal.title }}
      </h3>
      <div class="modal-message">{{ store.modal.message }}</div>
      <div class="modal-buttons">
        <button class="modal-btn cancel" @click="store.modal.onCancel">Cancel</button>
        <button class="modal-btn confirm" @click="store.modal.onConfirm">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspaceStore';
const store = useWorkspaceStore();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  animation: fadeIn 0.2s ease-out;
}

.modal-card {
  background: #202020;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  transform: scale(0.9);
  animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.modal-title {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ui-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.modal-message {
  font-size: 13px;
  color: #b0b0b0;
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: #333;
  color: #ccc;
  border: 1px solid #444;
}

.modal-btn.cancel:hover {
  background: #444;
  color: white;
}

.modal-btn.confirm {
  background: #ef4444;
  color: white;
}

.modal-btn.confirm:hover {
  background: #dc2626;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.35);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  to { transform: scale(1); }
}
</style>
