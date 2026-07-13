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
});
