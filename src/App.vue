<template>
  <div id="app-container">
    <Toolbar />
    <Sidebar />
    <CanvasArea />
    <DataSheet />
    
    <ConfirmModal />
    <ToastPanel />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Toolbar from './components/Toolbar.vue';
import Sidebar from './components/Sidebar.vue';
import CanvasArea from './components/CanvasArea.vue';
import DataSheet from './components/DataSheet.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import ToastPanel from './components/ToastPanel.vue';
import { useWorkspaceStore } from './stores/workspaceStore';

const store = useWorkspaceStore();

onMounted(() => {
  store.initializeFromDB();
});
</script>

<style>
/* Reset and Global Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #121212;
  color: #e0e0e0;
  overflow: hidden;
  height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 52px 1fr var(--table-height, 240px);
  grid-template-areas:
    "toolbar toolbar"
    "sidebar main"
    "sidebar table";
  height: 100vh;
  width: 100vw;
  background: radial-gradient(circle at top right, rgba(168, 85, 247, 0.08), transparent 40%),
              radial-gradient(circle at bottom left, rgba(0, 240, 255, 0.05), transparent 40%),
              #121212;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
