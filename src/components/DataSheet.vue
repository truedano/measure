<template>
  <div id="table-panel">
    <div class="panel-header">
      <h4>
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
          <line x1="9" y1="3" x2="9" y2="21"></line>
          <line x1="15" y1="3" x2="15" y2="21"></line>
        </svg>
        Measurement Data Sheet
      </h4>
      <div class="panel-actions">
        <button 
          @click="copyTableData" 
          :disabled="!store.hasMeasurements" 
          class="action-btn accent"
        >
          <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="stroke: #000;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy Data (TSV)
        </button>
        <button 
          @click="store.clearAllWorkspaceData" 
          :disabled="store.images.length === 0" 
          class="action-btn warn"
        >
          <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          Clear All
        </button>
      </div>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Image Name</th>
            <th>Line ID</th>
            <th>Length</th>
            <th>Note / Label (editable)</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="row in store.tableData" 
            :key="row.key" 
            :class="{ 'active-image-row': row.imageId === store.currentImageId }"
          >
            <td class="cell-filename" :title="row.imageName">{{ row.imageName }}</td>
            <td>{{ row.lineId }}</td>
            <td class="cell-length">{{ row.lengthStr }}</td>
            <td class="cell-note">
              <input 
                type="text" 
                v-model="row.line.note" 
                placeholder="Double click to edit note..." 
                class="table-note-input"
              >
            </td>
          </tr>
          <tr v-if="store.tableData.length === 0">
            <td colspan="4" class="empty-row">
              No measurement lines drawn yet. Load images and add lines.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspaceStore';
const store = useWorkspaceStore();

function copyTableData() {
  const data = store.tableData;
  if (data.length === 0) return;

  let tsvContent = "Image Name\tLine ID\tLength\tNote\n";
  data.forEach((row) => {
    tsvContent += `${row.imageName}\t${row.lineId}\t${row.lengthStr}\t${row.line.note || ''}\n`;
  });

  navigator.clipboard.writeText(tsvContent)
    .then(() => {
      store.showToast("Measurement data copied to clipboard in TSV format!", "success");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
      store.showToast("Failed to copy to clipboard. Please try again.", "error");
    });
}
</script>

<style scoped>
#table-panel {
  grid-area: table;
  background: #181818;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.panel-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn.accent {
  background: #00f0ff;
  color: #000;
}

.action-btn.accent:hover:not(:disabled) {
  background: #00c8d6;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.action-btn.warn {
  background: #ef4444;
  color: white;
}

.action-btn.warn:hover:not(:disabled) {
  background: #dc2626;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: #333 !important;
  color: #666 !important;
  box-shadow: none !important;
}

.table-container {
  flex-grow: 1;
  overflow: auto;
  padding: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.data-table th {
  background: #202020;
  color: #aaa;
  font-weight: 500;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table td {
  padding: 6px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: #ccc;
}

.data-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.active-image-row {
  background: rgba(0, 240, 255, 0.03);
}

.cell-filename {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #e0e0e0;
}

.cell-length {
  font-family: monospace;
  color: #00f0ff;
  font-weight: 500;
}

.cell-note {
  padding: 3px 16px !important;
}

.table-note-input {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  transition: all 0.2s;
  outline: none;
}

.table-note-input:hover {
  background: #252525;
  border-color: #444;
}

.table-note-input:focus {
  background: #252525;
  border-color: #a855f7;
}

.empty-row {
  text-align: center;
  color: #666;
  padding: 40px !important;
  font-style: italic;
}

.ui-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2.2;
  flex-shrink: 0;
}
</style>
