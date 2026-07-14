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

  it('translates canvas coordinates correctly under rotation', () => {
    const mockCanvas = {
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 200 })
    } as any;
    
    const canvasRef = ref<HTMLCanvasElement | null>(mockCanvas);
    const store = useWorkspaceStore();
    const { getCanvasCoordinates } = useCanvasDraw(canvasRef);

    const mockImg: any = {
      id: 'img-1',
      name: 'test.png',
      src: '',
      imgObject: { width: 100, height: 100 },
      lines: [],
      referenceLine: null,
      referenceLength: 0,
      unit: 'mm',
      scale: 1,
      dpi: '',
      zoomLevel: 2,
      panX: 30,
      panY: 40,
      rotation: 90
    };

    store.images.push(mockImg);
    store.switchImage('img-1');

    const coords = getCanvasCoordinates(40, 60);
    expect(coords.x).toBeCloseTo(0, 4);
    expect(coords.y).toBeCloseTo(100, 4);
  });
});
