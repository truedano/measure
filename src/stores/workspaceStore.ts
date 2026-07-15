import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { ImageWorkspace, Line, ModalState, ToastState, Folder, Point } from '../types/workspace';
import { saveWorkspace, loadWorkspace } from '../services/db';

export const useWorkspaceStore = defineStore('workspace', () => {
  const locales = {
    zh: {
      // Toolbar
      calibrateScale: '校正比例尺：',
      drawReferenceLine: '繪製參考線',
      removeRef: '移除參考線',
      measureLabel: '測量：',
      addLine: '新增線段',
      clearLines: '清除線段',
      calibrateTooltip: '請先在步驟 1 校正比例尺',
      addLineTooltip: '新增測量線',
      
      // Sidebar
      filesAndGroups: '檔案與分組',
      upload: '上傳',
      clearAll: '全部清除',
      clearAllTooltip: '清除所有上傳的圖片與資料',
      newGroupNamePlaceholder: '新分組名稱...',
      uncategorized: '未分類',
      moveTo: '移動至...',
      moveUp: '上移',
      moveDown: '下移',
      noImagesClickUpload: '無圖片。點擊此處上傳',
      uploadToUncategorized: '上傳至未分類',
      uploadToGroup: '上傳至此分組',
      noImagesLoaded: '尚未載入圖片，點擊上傳開始。',
      deleteFolderTitle: '刪除分組「{name}」',
      deleteFolderMsg: '你想將此分組內的所有 {count} 張圖片一併刪除嗎？\n\n- 點擊「確認」刪除分組與其內所有檔案。\n- 點擊「取消」僅刪除分組，保留圖片（圖片將移至未分類）。',

      // CanvasArea
      measurementAndCalibration: '測量與校正',
      scaleCalibration: '比例尺校正',
      enterActualLengthTooltip: '輸入參考線真實長度',
      lengthPlaceholder: '長度',
      selectUnitTooltip: '選擇長度單位',
      deleteRefTooltip: '刪除參考線',
      noRefDrawn: '尚未繪製參考線',
      measurementLines: '測量線段',
      deleteLineTooltip: '刪除線段',
      noLinesDrawn: '尚未繪製測量線',

      // DataSheet
      measurementDataSheet: '測量數據表',
      groupLabel: '分組：',
      allGroups: '所有分組',
      copyData: '複製數據',
      imageNameCol: '圖片名稱',
      lineIdCol: '線段 ID',
      lengthCol: '長度',
      noteCol: '備註 / 標籤 (可編輯)',
      editNotePlaceholder: '雙擊編輯備註...',
      noLinesDrawnTable: '尚未繪製測量線。請載入圖片並新增線段。',
      copySuccessToast: '測量長度已複製到剪貼簿！',
      copyErrorToast: '複製到剪貼簿失敗，請重試。',

      // ConfirmModal & Toast
      cancel: '取消',
      confirm: '確認',
      clearAllConfirmTitle: '清除所有工作區資料',
      clearAllConfirmMsg: '確定要清除所有已載入的圖片與測量資料嗎？此操作將無法復原。',
      clearAllToast: '已清除所有工作區資料。',
      folderCreatedToast: '分組「{name}」已建立。',
      folderRenamedToast: '分組「{oldName}」已重新命名為「{name}」。',
      folderDeletedToast: '分組「{name}」已刪除。',
      settings: '系統設定',
      generalSettings: '一般設定',
      canvasSettings: '畫布偏好',
      dataManagement: '資料管理',
      resetWorkspace: '重設工作區資料',
      language: '顯示語言',
    },
    en: {
      // Toolbar
      calibrateScale: 'Calibrate Scale:',
      drawReferenceLine: 'Draw Reference Line',
      removeRef: 'Remove Ref',
      measureLabel: 'Measure:',
      addLine: 'Add Line',
      clearLines: 'Clear Lines',
      calibrateTooltip: 'Please calibrate scale in Step 1 first',
      addLineTooltip: 'Add measurement line',
      
      // Sidebar
      filesAndGroups: 'Files & Groups',
      upload: 'Upload',
      clearAll: 'Clear All',
      clearAllTooltip: 'Clear all uploaded images and data',
      newGroupNamePlaceholder: 'New group name...',
      uncategorized: 'Uncategorized',
      moveTo: 'Move to...',
      moveUp: 'Move up',
      moveDown: 'Move down',
      noImagesClickUpload: 'No images. Click to upload here',
      uploadToUncategorized: 'Upload to Uncategorized',
      uploadToGroup: 'Upload to this group',
      noImagesLoaded: 'No images loaded. Click Upload to start.',
      deleteFolderTitle: 'Delete Folder "{name}"',
      deleteFolderMsg: 'Would you like to delete the {count} images inside this folder as well?\n\n- Click CONFIRM to delete everything.\n- Click CANCEL to delete ONLY the folder and keep the images (they will move to Uncategorized).',

      // CanvasArea
      measurementAndCalibration: 'Measurement & Calibration',
      scaleCalibration: 'Scale Calibration',
      enterActualLengthTooltip: 'Enter the actual length of the reference line',
      lengthPlaceholder: 'Length',
      selectUnitTooltip: 'Select length unit',
      deleteRefTooltip: 'Delete reference line',
      noRefDrawn: 'No reference line drawn',
      measurementLines: 'Measurement Lines',
      deleteLineTooltip: 'Delete line',
      noLinesDrawn: 'No measurement lines drawn',

      // DataSheet
      measurementDataSheet: 'Measurement Data Sheet',
      groupLabel: 'Group:',
      allGroups: 'All Groups',
      copyData: 'Copy Data',
      imageNameCol: 'Image Name',
      lineIdCol: 'Line ID',
      lengthCol: 'Length',
      noteCol: 'Note / Label (editable)',
      editNotePlaceholder: 'Double click to edit note...',
      noLinesDrawnTable: 'No measurement lines drawn yet. Load images and add lines.',
      copySuccessToast: 'Measurement lengths copied to clipboard!',
      copyErrorToast: 'Failed to copy to clipboard. Please try again.',

      // ConfirmModal & Toast
      cancel: 'Cancel',
      confirm: 'Confirm',
      clearAllConfirmTitle: 'Clear All Workspace Data',
      clearAllConfirmMsg: 'Are you sure you want to clear all loaded images and measurement data? This action cannot be undone.',
      clearAllToast: 'All workspace data has been cleared.',
      folderCreatedToast: 'Folder "{name}" created.',
      folderRenamedToast: 'Folder "{oldName}" renamed to "{name}".',
      folderDeletedToast: 'Folder "{name}" deleted.',
      settings: 'Settings',
      generalSettings: 'General',
      canvasSettings: 'Canvas Preferences',
      dataManagement: 'Data Management',
      resetWorkspace: 'Reset Workspace Data',
      language: 'Language',
    }
  };

  const images = ref<ImageWorkspace[]>([]);
  const currentImageId = ref<string | null>(null);
  const folders = ref<Folder[]>([]);
  const mousePos = ref<Point | null>(null);
  const selectedFolderFilter = ref<string>('all');
  
  const language = ref<'zh' | 'en'>((localStorage.getItem('measure_lang') as 'zh' | 'en') || 'zh');

  function setLanguage(lang: 'zh' | 'en') {
    language.value = lang;
    localStorage.setItem('measure_lang', lang);
  }

  function t(key: string, args?: Record<string, string | number>): string {
    const lang = language.value;
    let text = (locales[lang] as any)[key] || (locales['en'] as any)[key] || key;
    if (args) {
      Object.entries(args).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v.toString());
      });
    }
    return text;
  }

  const isAddingLine = ref(false);
  const isAddingReferenceLine = ref(false);
  const triggerCanvasUpdate = ref(0);
  const hoveredLineIndex = ref<number | null>(null);

  let dbSyncTimeout: any = null;
  function triggerDBSync() {
    if (dbSyncTimeout) clearTimeout(dbSyncTimeout);
    dbSyncTimeout = setTimeout(() => {
      saveWorkspace(images.value, folders.value, currentImageId.value);
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

  // Watch currentImageId to lazy load HTMLImageElement (imgObject) from serializable DB data
  watch(currentImageId, (newId) => {
    if (!newId) return;
    const img = images.value.find((i) => i.id === newId);
    if (img && !img.imgObject) {
      const imgObj = new Image();
      imgObj.onload = () => {
        img.imgObject = imgObj;
        requestCanvasUpdate();
      };
      imgObj.src = img.src;
    }
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

  const rotation = computed({
    get: () => currentImage.value?.rotation ?? 0,
    set: (val: number) => {
      if (currentImage.value) {
        currentImage.value.rotation = val;
      }
    }
  });

  const tableData = computed(() => {
    const data: any[] = [];
    const filteredImages = images.value.filter((img) => {
      if (selectedFolderFilter.value === 'all') return true;
      if (selectedFolderFilter.value === 'uncategorized') return !img.folderId;
      return img.folderId === selectedFolderFilter.value;
    });

    filteredImages.forEach((img) => {
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
      t('clearAllConfirmTitle'),
      t('clearAllConfirmMsg'),
      () => {
        images.value = [];
        folders.value = []; // Also clear folders
        currentImageId.value = null;
        isAddingLine.value = false;
        isAddingReferenceLine.value = false;
        requestCanvasUpdate();
        showToast(t('clearAllToast'), "info");
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
    showToast(t('folderCreatedToast', { name }), "success");
    return newFolder.id;
  }

  function renameFolder(id: string, name: string) {
    const folder = folders.value.find((f) => f.id === id);
    if (folder) {
      const oldName = folder.name;
      folder.name = name;
      triggerDBSync();
      showToast(t('folderRenamedToast', { oldName, name }), "success");
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
      showToast(t('folderDeletedToast', { name: folderName }), "info");
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
      if (data.currentImageId && images.value.some((img) => img.id === data.currentImageId)) {
        currentImageId.value = data.currentImageId;
      } else if (images.value.length > 0) {
        currentImageId.value = images.value[0].id;
      }
      requestCanvasUpdate();
    }
  }

  function moveImageOrder(imageId: string, direction: 'up' | 'down') {
    const img = images.value.find((i) => i.id === imageId);
    if (!img) return;

    const folderId = img.folderId || null;
    const siblings = images.value.filter((i) => (i.folderId || null) === folderId);
    const siblingIndex = siblings.findIndex((i) => i.id === imageId);

    if (direction === 'up' && siblingIndex > 0) {
      const prevSibling = siblings[siblingIndex - 1];
      const indexCurrent = images.value.findIndex((i) => i.id === imageId);
      const indexPrev = images.value.findIndex((i) => i.id === prevSibling.id);
      
      const temp = images.value[indexCurrent];
      images.value[indexCurrent] = images.value[indexPrev];
      images.value[indexPrev] = temp;

      triggerDBSync();
      requestCanvasUpdate();
    } else if (direction === 'down' && siblingIndex < siblings.length - 1) {
      const nextSibling = siblings[siblingIndex + 1];
      const indexCurrent = images.value.findIndex((i) => i.id === imageId);
      const indexNext = images.value.findIndex((i) => i.id === nextSibling.id);

      const temp = images.value[indexCurrent];
      images.value[indexCurrent] = images.value[indexNext];
      images.value[indexNext] = temp;

      triggerDBSync();
      requestCanvasUpdate();
    }
  }

  return {
    images,
    currentImageId,
    folders,
    mousePos,
    selectedFolderFilter,
    language,
    setLanguage,
    t,
    isAddingLine,
    isAddingReferenceLine,
    triggerCanvasUpdate,
    hoveredLineIndex,
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
    rotation,
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
    initializeFromDB,
    moveImageOrder
  };
});
