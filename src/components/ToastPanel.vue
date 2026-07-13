<template>
  <div v-if="store.toast.show" :class="['toast-notification', store.toast.type]">
    <!-- Success icon -->
    <svg v-if="store.toast.type === 'success'" class="ui-icon" style="color: #10b981;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <!-- Error icon -->
    <svg v-if="store.toast.type === 'error'" class="ui-icon" style="color: #ef4444;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <!-- Info icon -->
    <svg v-if="store.toast.type === 'info'" class="ui-icon" style="color: #3b82f6;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
    <span>{{ store.toast.message }}</span>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspaceStore';
const store = useWorkspaceStore();
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 24px;
  right: 24px;
  background: #202020;
  border-left: 4px solid #00f0ff;
  border-radius: 6px;
  padding: 14px 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  z-index: 101;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #ffffff;
  transform: translateX(120%);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  max-width: 320px;
  pointer-events: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.03);
}

.toast-notification.success {
  border-left-color: #10b981;
}

.toast-notification.error {
  border-left-color: #ef4444;
}

.toast-notification.info {
  border-left-color: #3b82f6;
}

.ui-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  stroke-width: 2.2;
}

@keyframes slideIn {
  to { transform: translateX(0); }
}
</style>
