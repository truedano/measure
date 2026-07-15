<template>
  <div id="sidebar">
    <div class="sidebar-header">
      <h3>{{ store.t('filesAndGroups') }}</h3>
      <div class="header-actions">
        <label class="upload-btn">
          <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          {{ store.t('upload') }}
          <input 
            type="file" 
            @change="handleImage" 
            accept="image/*" 
            multiple 
            style="display: none;"
          >
        </label>
        <button 
          @click="store.clearAllWorkspaceData" 
          :disabled="store.images.length === 0" 
          class="clear-all-btn"
          :title="store.t('clearAllTooltip')"
        >
          <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          {{ store.t('clearAll') }}
        </button>
      </div>
    </div>

    <!-- Folder Creation -->
    <div class="folder-creator">
      <input 
        type="text" 
        v-model="newFolderName" 
        :placeholder="store.t('newGroupNamePlaceholder')" 
        @keyup.enter="createNewFolder"
        class="folder-input"
      >
      <button @click="createNewFolder" class="btn-create-folder">
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
    
    <div class="image-list">
      <!-- Uncategorized Images Folder Section -->
      <div class="folder-section">
        <div class="folder-header uncategorized" @click="toggleFolder('uncategorized')">
          <span class="folder-title">
            <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            {{ store.t('uncategorized') }} ({{ uncategorizedImages.length }})
          </span>
          <svg 
            class="ui-icon arrow-icon" 
            :style="{ transform: collapsedFolders.has('uncategorized') ? 'rotate(-90deg)' : 'rotate(0deg)' }" 
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        
        <div v-show="!collapsedFolders.has('uncategorized')" class="folder-contents">
          <div 
            v-for="image in uncategorizedImages" 
            :key="image.id" 
            :class="['image-card', { active: image.id === store.currentImageId }]"
            @click="store.switchImage(image.id)"
          >
            <div class="thumb-container">
              <img :src="image.src" class="img-thumb" />
            </div>
            <div class="image-info">
              <div class="image-name" :title="image.name">{{ image.name }}</div>
              <div class="image-meta">
                <span>{{ image.lines.filter(l => l.end).length }} lines</span>
                <!-- Move dropdown -->
                <select 
                  :value="image.folderId || ''" 
                  @change="moveImage($event, image.id)" 
                  @click.stop
                  class="move-select"
                >
                  <option value="">{{ store.t('moveTo') }}</option>
                  <option v-for="f in store.folders" :key="f.id" :value="f.id">{{ f.name }}</option>
                </select>
              </div>
            </div>
            <div class="sorting-controls" @click.stop>
              <button 
                class="btn-sort-action" 
                :disabled="isFirstSibling(image.id, image.folderId)" 
                @click="store.moveImageOrder(image.id, 'up')"
                :title="store.t('moveUp')"
              >
                <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              <button 
                class="btn-sort-action" 
                :disabled="isLastSibling(image.id, image.folderId)" 
                @click="store.moveImageOrder(image.id, 'down')"
                :title="store.t('moveDown')"
              >
                <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            <button class="btn-delete-img" @click.stop="store.deleteImage(image.id)">
              <svg class="ui-icon" style="margin: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <label class="folder-upload-placeholder">
            <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>{{ uncategorizedImages.length === 0 ? store.t('noImagesClickUpload') : store.t('uploadToUncategorized') }}</span>
            <input 
              type="file" 
              @change="handleImage($event, null)" 
              accept="image/*" 
              multiple 
              style="display: none;"
            >
          </label>
        </div>
      </div>

      <!-- User Folders Section -->
      <div v-for="folder in store.folders" :key="folder.id" class="folder-section">
        <div class="folder-header" @click="toggleFolder(folder.id)">
          <span class="folder-title">
            <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <!-- Inline editing folder name -->
            <input 
              v-if="editingFolderId === folder.id" 
              type="text" 
              v-model="editingFolderName" 
              @keyup.enter="saveFolderRename(folder.id)"
              @blur="saveFolderRename(folder.id)"
              @click.stop
              class="folder-rename-input"
              ref="renameInputRef"
            >
            <span v-else class="folder-name-text" @dblclick.stop="startFolderRename(folder)">{{ folder.name }}</span>
            <span class="folder-count">({{ getFolderImages(folder.id).length }})</span>
          </span>
          
          <div class="folder-actions" @click.stop>
            <label class="btn-folder-action">
              <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <input 
                type="file" 
                @change="handleImage($event, folder.id)" 
                accept="image/*" 
                multiple 
                style="display: none;"
              >
            </label>
            <button class="btn-folder-action" @click="startFolderRename(folder)">
              <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-folder-action delete" @click="triggerDeleteFolder(folder.id, folder.name)">
              <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            <svg 
              class="ui-icon arrow-icon" 
              :style="{ transform: collapsedFolders.has(folder.id) ? 'rotate(-90deg)' : 'rotate(0deg)' }" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              @click="toggleFolder(folder.id)"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div v-show="!collapsedFolders.has(folder.id)" class="folder-contents">
          <div 
            v-for="image in getFolderImages(folder.id)" 
            :key="image.id" 
            :class="['image-card', { active: image.id === store.currentImageId }]"
            @click="store.switchImage(image.id)"
          >
            <div class="thumb-container">
              <img :src="image.src" class="img-thumb" />
            </div>
            <div class="image-info">
              <div class="image-name" :title="image.name">{{ image.name }}</div>
              <div class="image-meta">
                <span>{{ image.lines.filter(l => l.end).length }} lines</span>
                <!-- Move dropdown -->
                <select 
                  :value="image.folderId || ''" 
                  @change="moveImage($event, image.id)" 
                  @click.stop
                  class="move-select"
                >
                  <option value="">{{ store.t('moveTo') }}</option>
                  <option value="uncategorized">{{ store.t('uncategorized') }}</option>
                  <option v-for="f in store.folders.filter(x => x.id !== folder.id)" :key="f.id" :value="f.id">{{ f.name }}</option>
                </select>
              </div>
            </div>
            <div class="sorting-controls" @click.stop>
              <button 
                class="btn-sort-action" 
                :disabled="isFirstSibling(image.id, image.folderId)" 
                @click="store.moveImageOrder(image.id, 'up')"
                :title="store.t('moveUp')"
              >
                <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              <button 
                class="btn-sort-action" 
                :disabled="isLastSibling(image.id, image.folderId)" 
                @click="store.moveImageOrder(image.id, 'down')"
                :title="store.t('moveDown')"
              >
                <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            <button class="btn-delete-img" @click.stop="store.deleteImage(image.id)">
              <svg class="ui-icon" style="margin: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <label class="folder-upload-placeholder">
            <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>{{ getFolderImages(folder.id).length === 0 ? store.t('noImagesClickUpload') : store.t('uploadToGroup') }}</span>
            <input 
              type="file" 
              @change="handleImage($event, folder.id)" 
              accept="image/*" 
              multiple 
              style="display: none;"
            >
          </label>
        </div>
      </div>

      <div v-if="store.images.length === 0 && store.folders.length === 0" class="empty-list">
        {{ store.t('noImagesLoaded') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useWorkspaceStore } from '../stores/workspaceStore';
import type { ImageWorkspace, Folder } from '../types/workspace';

const store = useWorkspaceStore();
const newFolderName = ref('');
const editingFolderId = ref<string | null>(null);
const editingFolderName = ref('');
const renameInputRef = ref<HTMLInputElement | null>(null);

// Collapsed folders tracker
const collapsedFolders = ref<Set<string>>(new Set());

const uncategorizedImages = computed(() => {
  return store.images.filter(img => !img.folderId);
});

function getFolderImages(folderId: string) {
  return store.images.filter(img => img.folderId === folderId);
}

function toggleFolder(folderId: string) {
  if (collapsedFolders.value.has(folderId)) {
    collapsedFolders.value.delete(folderId);
  } else {
    collapsedFolders.value.add(folderId);
  }
}

function createNewFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;
  store.createFolder(name);
  newFolderName.value = '';
}

function startFolderRename(folder: Folder) {
  editingFolderId.value = folder.id;
  editingFolderName.value = folder.name;
  nextTick(() => {
    renameInputRef.value?.focus();
  });
}

function saveFolderRename(folderId: string) {
  const name = editingFolderName.value.trim();
  if (name && editingFolderId.value) {
    store.renameFolder(folderId, name);
  }
  editingFolderId.value = null;
}

function triggerDeleteFolder(folderId: string, folderName: string) {
  const imagesInFolder = getFolderImages(folderId);
  if (imagesInFolder.length > 0) {
    store.showConfirm(
      store.t('deleteFolderTitle', { name: folderName }),
      store.t('deleteFolderMsg', { count: imagesInFolder.length }),
      () => {
        // Confirm callback: Delete folder and its images
        store.deleteFolder(folderId, false);
      },
      () => {
        // Cancel callback: Delete folder, keep images
        store.deleteFolder(folderId, true);
      }
    );
  } else {
    store.deleteFolder(folderId, true);
  }
}

function isFirstSibling(imageId: string, folderId: string | null = null) {
  const key = folderId || null;
  const siblings = store.images.filter((img) => (img.folderId || null) === key);
  return siblings.length > 0 && siblings[0].id === imageId;
}

function isLastSibling(imageId: string, folderId: string | null = null) {
  const key = folderId || null;
  const siblings = store.images.filter((img) => (img.folderId || null) === key);
  return siblings.length > 0 && siblings[siblings.length - 1].id === imageId;
}

function moveImage(event: Event, imageId: string) {
  const target = event.target as HTMLSelectElement;
  const folderId = target.value === 'uncategorized' || target.value === '' ? null : target.value;
  store.moveImageToFolder(imageId, folderId);
  // Reset dropdown select text
  target.value = '';
}

function handleImage(event: Event, targetFolderId: string | null = null) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || !files.length) return;

  const promises = Array.from(files).map((file) => {
    return new Promise<ImageWorkspace>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgObj = new Image();
        imgObj.onload = () => {
          resolve({
            id: 'img-' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            src: e.target?.result as string,
            imgObject: imgObj,
            lines: [],
            referenceLine: null,
            referenceLength: 0,
            unit: 'mm',
            scale: 1,
            dpi: '',
            zoomLevel: 1,
            panX: 0,
            panY: 0,
            folderId: targetFolderId,
            rotation: 0
          });
        };
        imgObj.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(promises).then((newImages) => {
    store.images.push(...newImages);
    if (newImages.length > 0) {
      store.switchImage(newImages[0].id);
    } else {
      store.requestCanvasUpdate();
    }
    target.value = '';
  });
}
</script>

<style scoped>
#sidebar {
  grid-area: sidebar;
  background: rgba(25, 25, 25, 0.7);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.upload-btn {
  background: rgba(168, 85, 247, 0.08);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.3);
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: #a855f7;
  color: white;
  border-color: #a855f7;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
}

.clear-all-btn {
  background: #ef4444;
  color: white;
  border: 1px solid transparent;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.clear-all-btn:hover:not(:disabled) {
  background: #dc2626;
  border-color: transparent;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}

.clear-all-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: #333 !important;
  color: #666 !important;
  box-shadow: none !important;
}

.folder-creator {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.01);
  flex-shrink: 0;
}

.folder-input {
  flex-grow: 1;
  background: #1e1e1e;
  border: 1px solid #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.folder-input:focus {
  border-color: #a855f7;
}

.btn-create-folder {
  background: #2b2b2b;
  border: 1px solid #3c3c3c;
  color: #ccc;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-create-folder:hover {
  background: #3c3c3c;
  color: white;
  border-color: #555;
}

.image-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.folder-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #a855f7;
  cursor: pointer;
  transition: all 0.2s;
}

.folder-header:hover {
  background: rgba(255, 255, 255, 0.06);
}

.folder-header.uncategorized {
  border-left-color: #666;
}

.folder-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #d1d5db;
  min-width: 0;
}

.folder-name-text {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.folder-count {
  font-weight: 500;
  color: #6b7280;
  margin-left: 2px;
}

.folder-rename-input {
  background: #111;
  border: 1px solid #a855f7;
  color: white;
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 3px;
  width: 120px;
  outline: none;
}

.folder-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-folder-action {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-folder-action:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

.btn-folder-action.delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.arrow-icon {
  width: 12px;
  height: 12px;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.folder-contents {
  padding: 4px 4px 4px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 1px dashed rgba(255, 255, 255, 0.05);
  margin-left: 10px;
}

.image-card {
  background: rgba(40, 40, 40, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-card:hover {
  background: rgba(50, 50, 50, 0.8);
  border-color: rgba(255, 255, 255, 0.08);
}

.image-card.active {
  background: rgba(168, 85, 247, 0.15);
  border-color: rgba(168, 85, 247, 0.5);
}

.thumb-container {
  width: 42px;
  height: 42px;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.img-thumb {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.image-info {
  flex-grow: 1;
  min-width: 0;
}

.image-name {
  font-size: 12px;
  font-weight: 500;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.image-meta {
  font-size: 10px;
  color: #9ca3af;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.move-select {
  background: #1e1e1e;
  border: 1px solid #333;
  color: #aaa;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  max-width: 80px;
}

.move-select:hover {
  color: white;
  border-color: #555;
}

.btn-delete-img {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.image-card:hover .btn-delete-img {
  opacity: 1;
}

.sorting-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.image-card:hover .sorting-controls {
  opacity: 1;
}

.btn-sort-action {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 1px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-sort-action:hover:not(:disabled) {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.15);
}

.btn-sort-action:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.folder-upload-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.01);
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  user-select: none;
}

.folder-upload-placeholder:hover {
  background: rgba(168, 85, 247, 0.04);
  border-color: rgba(168, 85, 247, 0.4);
  color: #c084fc;
}

.folder-upload-placeholder .ui-icon {
  width: 12px;
  height: 12px;
}

.empty-list {
  text-align: center;
  color: #555;
  padding: 40px 10px;
  font-style: italic;
  font-size: 12px;
}

.ui-icon {
  width: 13px;
  height: 13px;
  stroke-width: 2.2;
  flex-shrink: 0;
}
</style>

