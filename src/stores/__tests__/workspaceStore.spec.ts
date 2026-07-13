import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../workspaceStore';

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default states', () => {
    const store = useWorkspaceStore();
    expect(store.images).toEqual([]);
    expect(store.currentImageId).toBeNull();
    expect(store.isAddingLine).toBe(false);
    expect(store.isAddingReferenceLine).toBe(false);
    expect(store.modal.show).toBe(false);
    expect(store.toast.show).toBe(false);
  });

  it('can upload, switch and delete images', () => {
    const store = useWorkspaceStore();
    const mockImg: any = {
      id: 'img-1',
      name: 'test.png',
      src: 'data:image/png;base64,abc',
      imgObject: null,
      lines: [],
      referenceLine: null,
      referenceLength: 0,
      unit: 'mm',
      scale: 1,
      dpi: '',
      zoomLevel: 1,
      panX: 0,
      panY: 0
    };

    store.images.push(mockImg);
    expect(store.images.length).toBe(1);

    store.switchImage('img-1');
    expect(store.currentImageId).toBe('img-1');
    expect(store.currentImage).toEqual(mockImg);

    store.deleteImage('img-1');
    expect(store.images.length).toBe(0);
    expect(store.currentImageId).toBeNull();
  });

  it('calibrates scale correctly from DPI settings', () => {
    const store = useWorkspaceStore();
    const mockImg: any = {
      id: 'img-1',
      name: 'test.png',
      src: '',
      imgObject: null,
      lines: [],
      referenceLine: null,
      referenceLength: 0,
      unit: 'mm',
      scale: 1,
      dpi: '',
      zoomLevel: 1,
      panX: 0,
      panY: 0
    };

    store.images.push(mockImg);
    store.switchImage('img-1');

    store.dpi = '100';
    store.updateScaleFromDPI();
    expect(store.scale).toBeCloseTo(0.254, 4);

    store.dpi = '0';
    store.updateScaleFromDPI();
    expect(store.scale).toBe(1);
  });

  it('calibrates scale correctly from reference line length', () => {
    const store = useWorkspaceStore();
    const mockImg: any = {
      id: 'img-1',
      name: 'test.png',
      src: '',
      imgObject: null,
      lines: [],
      referenceLine: {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 }, // 100px reference line
        handles: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      },
      referenceLength: 10,
      unit: 'cm',
      scale: 1,
      dpi: '',
      zoomLevel: 1,
      panX: 0,
      panY: 0
    };

    store.images.push(mockImg);
    store.switchImage('img-1');

    store.updateMeasurementLabels();
    expect(store.scale).toBe(0.1); // 10 / 100 = 0.1
  });

  it('computes tableData correctly for drawing lines', () => {
    const store = useWorkspaceStore();
    const mockImg: any = {
      id: 'img-1',
      name: 'test.png',
      src: '',
      imgObject: null,
      lines: [
        {
          start: { x: 0, y: 0 },
          end: { x: 30, y: 40 }, // length 50px
          handles: [{ x: 0, y: 0 }, { x: 30, y: 40 }],
          note: 'Width'
        }
      ],
      referenceLine: null,
      referenceLength: 0,
      unit: 'mm',
      scale: 1,
      dpi: '',
      zoomLevel: 1,
      panX: 0,
      panY: 0
    };

    store.images.push(mockImg);
    expect(store.tableData.length).toBe(1);
    expect(store.tableData[0].lengthStr).toBe('50.00 px');
    expect(store.tableData[0].lineId).toBe('Line 1');
    expect(store.tableData[0].line.note).toBe('Width');
    expect(store.hasMeasurements).toBe(true);

    // Test scaling formatting in tableData
    store.images[0].scale = 2; // 50px * 2 = 100mm
    expect(store.tableData[0].lengthStr).toBe('100.00 mm');
  });

  it('handles custom Modal prompts and Toast auto-dismisses', () => {
    const store = useWorkspaceStore();
    let confirmed = false;
    store.showConfirm("Test Title", "Test Message", () => {
      confirmed = true;
    });

    expect(store.modal.show).toBe(true);
    expect(store.modal.title).toBe("Test Title");
    expect(store.modal.message).toBe("Test Message");
    
    // Trigger Confirm callback
    if (store.modal.onConfirm) store.modal.onConfirm();
    expect(store.modal.show).toBe(false);
    expect(confirmed).toBe(true);

    // Test Toast message
    store.showToast("Copied!", "success", 100);
    expect(store.toast.show).toBe(true);
    expect(store.toast.message).toBe("Copied!");
    expect(store.toast.type).toBe("success");
  });

  it('can manage folders and group images', () => {
    const store = useWorkspaceStore();
    
    // Create folders
    const f1Id = store.createFolder('Group A');
    const f2Id = store.createFolder('Group B');
    expect(store.folders.length).toBe(2);
    expect(store.folders[0].name).toBe('Group A');

    // Rename folder
    store.renameFolder(f1Id, 'Renamed Group A');
    expect(store.folders[0].name).toBe('Renamed Group A');

    // Load mock images
    const mockImg1: any = { id: 'img-1', name: 'img1.png', lines: [], folderId: null };
    const mockImg2: any = { id: 'img-2', name: 'img2.png', lines: [], folderId: null };
    store.images.push(mockImg1, mockImg2);

    // Relocate image
    store.moveImageToFolder('img-1', f1Id);
    expect(store.images[0].folderId).toBe(f1Id);

    // Delete folder, keep contents (move to Uncategorized)
    store.deleteFolder(f1Id, true);
    expect(store.folders.length).toBe(1);
    expect(store.images[0].folderId).toBeNull(); // Reverted to uncategorized

    // Relocate to folder B
    store.moveImageToFolder('img-1', f2Id);
    expect(store.images[0].folderId).toBe(f2Id);

    // Delete folder, delete contents
    store.deleteFolder(f2Id, false);
    expect(store.folders.length).toBe(0);
    expect(store.images.length).toBe(1); // img-1 inside f2Id was deleted, only img-2 remains
  });

  it('supports image sorting and Data Sheet filtering', () => {
    const store = useWorkspaceStore();
    const fId = store.createFolder('Group C');
    
    // Add 3 mock images in Group C
    const img1: any = { id: 'img-1', name: 'A.png', lines: [{ start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, handles: [] }], folderId: fId, scale: 1 };
    const img2: any = { id: 'img-2', name: 'B.png', lines: [{ start: { x: 0, y: 0 }, end: { x: 20, y: 0 }, handles: [] }], folderId: fId, scale: 1 };
    const img3: any = { id: 'img-3', name: 'C.png', lines: [], folderId: null, scale: 1 }; // Uncategorized
    store.images.push(img1, img2, img3);

    // Test Sorting
    expect(store.images[0].id).toBe('img-1');
    expect(store.images[1].id).toBe('img-2');
    
    // Swap img-1 down
    store.moveImageOrder('img-1', 'down');
    expect(store.images[0].id).toBe('img-2');
    expect(store.images[1].id).toBe('img-1');

    // Test Filtering
    expect(store.tableData.length).toBe(2); // img-1 (1 line) + img-2 (1 line)

    // Filter to Uncategorized (img-3 has no lines, so tableData should be empty)
    store.selectedFolderFilter = 'uncategorized';
    expect(store.tableData.length).toBe(0);

    // Filter to Group C
    store.selectedFolderFilter = fId;
    expect(store.tableData.length).toBe(2);
  });
});
