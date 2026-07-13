import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ImageWorkspace, Line, ModalState, ToastState, Folder, Point } from '../types/workspace';
import { saveWorkspace, loadWorkspace } from '../services/db';

export const useWorkspaceStore = defineStore('workspace', () => {
  const images = ref<ImageWorkspace[]>([]);
  const currentImageId = ref<string | null>(null);
  const folders = ref<Folder[]>([]);
  const mousePos = ref<Point | null>(null);
  
  const isAddingLine = ref(false);
  const isAddingReferenceLine = ref(false);
  const triggerCanvasUpdate = ref(0);

  let dbSyncTimeout: any = null;
  function triggerDBSync() {
    if (dbSyncTimeout) clearTimeout(dbSyncTimeout);
    dbSyncTimeout = setTimeout(() => {
      saveWorkspace(images.value, folders.value);
    }, 300);
  }

  const modal = ref<ModalState>({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const toast = ref<ToastState>({
    show: false,
    message: '',
    type: 'info',
    timeoutId: null,
  });

  const currentImage = computed(() => {
    return images.value.find((img) => img.id === currentImageId.value) || null;
  });

  const lines = computed({
    get: () => currentImage.value?.lines || [],
    set: (val: Line[]) => {
      if (currentImage.value) {
        currentImage.value.lines = val;
      }
    }
  });

  const referenceLine = computed({
    get: () => currentImage.value?.referenceLine || null,
    set: (val: Line | null) => {
      if (currentImage.value) {
        currentImage.value.referenceLine = val;
      }
    }
  });

  const referenceLength = computed({
    get: () => currentImage.value?.referenceLength || 0,
    set: (val: number) => {
      if (currentImage.value) {
        currentImage.value.referenceLength = val;
      }
    }
  });

  const unit = computed({
    get: () => currentImage.value?.unit || 'mm',
    set: (val: string) => {
      if (currentImage.value) {
        currentImage.value.unit = val;
      }
    }
  });

  const scale = computed({
    get: () => currentImage.value?.scale || 1,
    set: (val: number) => {
      if (currentImage.value) {
        currentImage.value.scale = val;
      }
    }
  });

  const dpi = computed({
    get: () => currentImage.value?.dpi || '',
    set: (val: string) => {
      if (currentImage.value) {
        currentImage.value.dpi = val;
      }
    }
  });

  const zoomLevel = computed({
    get: () => currentImage.value?.zoomLevel || 1,
    set: (val: number) => {
      if (currentImage.value) {
        currentImage.value.zoomLevel = val;
      }
    }
  });

  const panX = computed({
    get: () => currentImage.value?.panX || 0,
    set: (val: number) => {
      if (currentImage.value) {
        currentImage.value.panX = val;
      }
    }
  });

  const panY = computed({
    get: () => currentImage.value?.panY || 0,
    set: (val: number) => {
      if (currentImage.value) {
        currentImage.value.panY = val;
      }
    }
  });

  const tableData = computed(() => {
    const data: any[] = [];
    images.value.forEach((img) => {
      img.lines.forEach((line, index) => {
        if (line.end) {
          const dx = line.end.x - line.start.x;
          const dy = line.end.y - line.start.y;
          const pxLength = Math.sqrt(dx * dx + dy * dy);
          const lengthStr = img.scale !== 1 
            ? `${(pxLength * img.scale).toFixed(2)} ${img.unit}` 
            : `${pxLength.toFixed(2)} px`;
          
          data.push({
            key: `${img.id}-${index}`,
            imageId: img.id,
            imageName: img.name,
            lineId: `Line ${index + 1}`,
            lengthStr,
            line
          });
        }
      });
    });
    return data;
  });

  const hasMeasurements = computed(() => tableData.value.length > 0);

  function requestCanvasUpdate() {
    triggerCanvasUpdate.value++;
    triggerDBSync();
  }

  function switchImage(id: string) {
    currentImageId.value = id;
    isAddingLine.value = false;
    isAddingReferenceLine.value = false;
    requestCanvasUpdate();
  }

  function deleteImage(id: string) {
    const index = images.value.findIndex((img) => img.id === id);
    if (index !== -1) {
      images.value.splice(index, 1);
      if (currentImageId.value === id) {
        if (images.value.length > 0) {
          switchImage(images.value[Math.max(0, index - 1)].id);
        } else {
          currentImageId.value = null;
          requestCanvasUpdate();
        }
      } else {
        requestCanvasUpdate();
      }
    }
  }

  function startDrawing(type: 'measurement' | 'reference') {
    if (!currentImageId.value) return;
    isAddingLine.value = type === 'measurement';
    isAddingReferenceLine.value = type === 'reference';
  }

  function removeAll() {
    if (!currentImageId.value) return;
    lines.value = [];
    referenceLine.value = null;
    updateScaleFromDPI();
  }

  function removeReferenceLine() {
    if (!currentImageId.value) return;
    referenceLine.value = null;
    updateScaleFromDPI();
  }

  function updateScaleFromDPI() {
    const parsedDpi = parseFloat(dpi.value);
    if (parsedDpi > 0 && (!referenceLine.value || !referenceLine.value.end)) {
      scale.value = 25.4 / parsedDpi;
    } else if (referenceLine.value && referenceLine.value.end) {
      updateMeasurementLabels();
    } else {
      scale.value = 1;
    }
    requestCanvasUpdate();
  }

  function updateMeasurementLabels() {
    if (referenceLine.value && referenceLine.value.end) {
      const refLen = parseFloat(referenceLength.value.toString()) || 0;
      if (refLen > 0) {
        const dx = referenceLine.value.end.x - referenceLine.value.start.x;
        const dy = referenceLine.value.end.y - referenceLine.value.start.y;
        const referencePxLength = Math.sqrt(dx * dx + dy * dy);
        scale.value = refLen / referencePxLength;
      } else {
        scale.value = 1;
      }
    } else {
      updateScaleFromDPI();
    }
    requestCanvasUpdate();
  }

  function showConfirm(title: string, message: string, onConfirm: () => void, onCancel: (() => void) | null = null) {
    modal.value.title = title;
    modal.value.message = message;
    modal.value.onConfirm = () => {
      closeModal();
      if (onConfirm) onConfirm();
    };
    modal.value.onCancel = () => {
      closeModal();
      if (onCancel) onCancel();
    };
    modal.value.show = true;
  }

  function closeModal() {
    modal.value.show = false;
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    if (toast.value.timeoutId) {
      clearTimeout(toast.value.timeoutId);
    }
    toast.value.message = message;
    toast.value.type = type;
    toast.value.show = true;
    toast.value.timeoutId = setTimeout(() => {
      toast.value.show = false;
      toast.value.timeoutId = null;
    }, duration);
  }

  function clearAllWorkspaceData() {
    showConfirm(
      "Clear All Workspace Data",
      "Are you sure you want to clear all loaded images and measurement data? This action cannot be undone.",
      () => {
        images.value = [];
        folders.value = []; // Also clear folders
        currentImageId.value = null;
        isAddingLine.value = false;
        isAddingReferenceLine.value = false;
        requestCanvasUpdate();
        showToast("All workspace data has been cleared.", "info");
      }
    );
  }

  function createFolder(name: string) {
    const newFolder: Folder = {
      id: 'folder-' + Math.random().toString(36).substr(2, 9),
      name
    };
    folders.value.push(newFolder);
    triggerDBSync();
    showToast(`Folder "${name}" created.`, "success");
    return newFolder.id;
  }

  function renameFolder(id: string, name: string) {
    const folder = folders.value.find((f) => f.id === id);
    if (folder) {
      const oldName = folder.name;
      folder.name = name;
      triggerDBSync();
      showToast(`Folder "${oldName}" renamed to "${name}".`, "success");
    }
  }

  function deleteFolder(id: string, keepContents = true) {
    const index = folders.value.findIndex((f) => f.id === id);
    if (index !== -1) {
      const folderName = folders.value[index].name;
      folders.value.splice(index, 1);

      if (keepContents) {
        images.value.forEach((img) => {
          if (img.folderId === id) {
            img.folderId = null;
          }
        });
      } else {
        images.value = images.value.filter((img) => {
          if (img.folderId === id) {
            if (currentImageId.value === img.id) {
              currentImageId.value = null;
            }
            return false;
          }
          return true;
        });
        if (!currentImageId.value && images.value.length > 0) {
          currentImageId.value = images.value[0].id;
        }
      }
      triggerDBSync();
      requestCanvasUpdate();
      showToast(`Folder "${folderName}" deleted.`, "info");
    }
  }

  function moveImageToFolder(imageId: string, folderId: string | null) {
    const img = images.value.find((i) => i.id === imageId);
    if (img) {
      img.folderId = folderId;
      triggerDBSync();
    }
  }

  async function initializeFromDB() {
    const data = await loadWorkspace();
    if (data) {
      folders.value = data.folders || [];
      images.value = data.images || [];
      if (images.value.length > 0) {
        // Find first image to switch to
        currentImageId.value = images.value[0].id;
      }
      requestCanvasUpdate();
    }
  }


  return {
    images,
    currentImageId,
    folders,
    mousePos,
    isAddingLine,
    isAddingReferenceLine,
    triggerCanvasUpdate,
    modal,
    toast,
    currentImage,
    lines,
    referenceLine,
    referenceLength,
    unit,
    scale,
    dpi,
    zoomLevel,
    panX,
    panY,
    tableData,
    hasMeasurements,
    requestCanvasUpdate,
    switchImage,
    deleteImage,
    startDrawing,
    removeAll,
    removeReferenceLine,
    updateScaleFromDPI,
    updateMeasurementLabels,
    showConfirm,
    closeModal,
    showToast,
    clearAllWorkspaceData,
    createFolder,
    renameFolder,
    deleteFolder,
    moveImageToFolder,
    initializeFromDB
  };
});
