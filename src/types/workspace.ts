export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point | null;
  note?: string;
  handles: Point[];
}

export interface ImageWorkspace {
  id: string;
  name: string;
  src: string;
  imgObject: HTMLImageElement | null;
  lines: Line[];
  referenceLine: Line | null;
  referenceLength: number;
  unit: string;
  scale: number;
  dpi: string;
  zoomLevel: number;
  panX: number;
  panY: number;
}

export interface ModalState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  timeoutId: any | null;
}
