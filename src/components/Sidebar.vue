<template>
  <div id="sidebar">
    <div class="sidebar-header">
      <h3>Images ({{ store.images.length }})</h3>
      <label class="upload-btn">
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Upload
        <input 
          type="file" 
          @change="handleImage" 
          accept="image/*" 
          multiple 
          style="display: none;"
        >
      </label>
    </div>
    
    <div class="image-list">
      <div 
        v-for="image in store.images" 
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
            <span>
              <svg class="ui-icon" style="margin-right: 2px; width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <circle cx="5" cy="12" r="1.5"></circle>
                <circle cx="19" cy="12" r="1.5"></circle>
              </svg>
              {{ image.lines.filter(l => l.end).length }} lines
            </span>
          </div>
        </div>
        <button class="btn-delete-img" @click.stop="store.deleteImage(image.id)">
          <svg class="ui-icon" style="margin: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div v-if="store.images.length === 0" class="empty-list">
        No images loaded. Click Upload to start.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspaceStore';
import type { ImageWorkspace } from '../types/workspace';

const store = useWorkspaceStore();

function handleImage(event: Event) {
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
          });
        };
        imgObj.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(promises).then((newImages) => {
    store.images.push(...newImages);
    if (!store.currentImageId && store.images.length > 0) {
      store.switchImage(store.images[store.images.length - newImages.length].id);
    } else {
      store.requestCanvasUpdate();
    }
    // Reset file input
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
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.upload-btn {
  background: #a855f7;
  color: white;
  border: none;
  padding: 6px 12px;
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
  background: #9333ea;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
}

.image-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-card {
  background: #282828;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-card:hover {
  background: #323232;
  border-color: rgba(255, 255, 255, 0.1);
}

.image-card.active {
  background: rgba(168, 85, 247, 0.15);
  border-color: #a855f7;
}

.thumb-container {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.1);
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
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.image-meta {
  font-size: 11px;
  color: #999;
  display: flex;
  gap: 8px;
}

.btn-delete-img {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-card:hover .btn-delete-img {
  opacity: 1;
}

.empty-list {
  text-align: center;
  color: #666;
  padding: 40px 10px;
  font-style: italic;
  font-size: 12px;
}

.ui-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2.2;
  flex-shrink: 0;
}
</style>
