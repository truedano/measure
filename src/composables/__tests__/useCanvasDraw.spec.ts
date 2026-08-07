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

    // Default lengthPrecision = 3
    store.scale = 1;
    expect(getLineLength(mockLine)).toBe('50.000 px');

    // Scale = 0.1, unit = cm
    store.scale = 0.1;
    store.unit = 'cm';
    expect(getLineLength(mockLine)).toBe('5.000 cm');

    // Set lengthPrecision = 2
    store.setLengthPrecision(2);
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

  it('handles exportViewportImage safely without crashing when no image loaded', () => {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const { exportViewportImage } = useCanvasDraw(canvasRef);
    expect(() => exportViewportImage()).not.toThrow();
  });

  it('exports viewport image safely with mock canvas and image loaded', () => {
    const mockCtx: any = {
      fillRect: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {},
      drawImage: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      closePath: () => {},
      measureText: () => ({ width: 40 }),
      fillText: () => {},
      rect: () => {},
      roundRect: () => {},
      setLineDash: () => {},
    };
    HTMLCanvasElement.prototype.getContext = (() => mockCtx) as any;
    HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/png;base64,mock') as any;

    const mockCanvas = document.createElement('canvas');
    mockCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 } as any);
    Object.defineProperty(mockCanvas, 'clientWidth', { value: 800 });
    Object.defineProperty(mockCanvas, 'clientHeight', { value: 600 });

    const canvasRef = ref<HTMLCanvasElement | null>(mockCanvas);
    const store = useWorkspaceStore();
    const { exportViewportImage } = useCanvasDraw(canvasRef);

    const mockImg: any = {
      id: 'img-1',
      name: 'test_photo.png',
      src: 'data:image/png;base64,',
      imgObject: document.createElement('img'),
      lines: [
        { start: { x: 10, y: 10 }, end: { x: 50, y: 50 }, handles: [], type: 'line' },
        { start: { x: 20, y: 20 }, end: { x: 60, y: 60 }, height: 30, handles: [], type: 'rectangle' }
      ],
      referenceLine: { start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, handles: [] },
      referenceLength: 10,
      unit: 'mm',
      scale: 0.1,
      dpi: '100',
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      rotation: 0
    };

    store.images.push(mockImg);
    store.switchImage('img-1');

    expect(() => exportViewportImage('test_output.png')).not.toThrow();
    expect(store.toast.show).toBe(true);
  });

  it('calculates distance from point to segment correctly', () => {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const { getDistanceToSegment } = useCanvasDraw(canvasRef);

    const p1 = { x: 0, y: 0 };
    const p2 = { x: 10, y: 0 };

    // Point projecting inside segment (perpendicular distance)
    expect(getDistanceToSegment({ x: 5, y: 5 }, p1, p2)).toBeCloseTo(5, 4);

    // Point projecting to start point
    expect(getDistanceToSegment({ x: -3, y: 4 }, p1, p2)).toBeCloseTo(5, 4);

    // Point projecting to end point
    expect(getDistanceToSegment({ x: 13, y: 4 }, p1, p2)).toBeCloseTo(5, 4);

    // Point directly on segment
    expect(getDistanceToSegment({ x: 7, y: 0 }, p1, p2)).toBeCloseTo(0, 4);
  });

  it('supports custom color for lines and rectangles and falls back to default palette', () => {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const { getColorForLine, LINE_COLORS } = useCanvasDraw(canvasRef);

    const defaultLine = {
      start: { x: 0, y: 0 },
      end: { x: 10, y: 10 },
      handles: [],
      type: 'line' as const
    };

    const customLine = {
      start: { x: 0, y: 0 },
      end: { x: 10, y: 10 },
      handles: [],
      type: 'rectangle' as const,
      color: '#ff00ff'
    };

    expect(getColorForLine(0, defaultLine)).toBe(LINE_COLORS[0]);
    expect(getColorForLine(1, defaultLine)).toBe(LINE_COLORS[1]);
    expect(getColorForLine(0, customLine)).toBe('#ff00ff');
    expect(getColorForLine(3, customLine)).toBe('#ff00ff');
  });
});

