import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasDraw } from '../useCanvasDraw';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ref } from 'vue';

describe('useCanvasDraw', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('calculates Euclidean distance correctly', () => {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const { calculateLineLength } = useCanvasDraw(canvasRef);
    
    const mockLine = {
      start: { x: 0, y: 0 },
      end: { x: 3, y: 4 }, // 3-4-5 triangle
      handles: []
    };
    
    expect(calculateLineLength(mockLine)).toBe(5);
  });

  it('formats line length string correctly based on scales', () => {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const store = useWorkspaceStore();
    const { getLineLength } = useCanvasDraw(canvasRef);
    
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

    const mockLine = {
      start: { x: 0, y: 0 },
      end: { x: 30, y: 40 }, // length 50px
      handles: []
    };

    // Scale = 1 (pixel mode)
    store.scale = 1;
    expect(getLineLength(mockLine)).toBe('50.00 px');

    // Scale = 0.1, unit = cm
    store.scale = 0.1;
    store.unit = 'cm';
    expect(getLineLength(mockLine)).toBe('5.00 cm');
  });
});
