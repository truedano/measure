import { useWorkspaceStore } from '../stores/workspaceStore';
import type { Line, Point } from '../types/workspace';

export function useCanvasDraw(canvasRef: { value: HTMLCanvasElement | null }) {
  const store = useWorkspaceStore();

  function getCanvasCoordinates(clientX: number, clientY: number): Point {
    const canvas = canvasRef.value;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - store.panX) / store.zoomLevel,
      y: (clientY - rect.top - store.panY) / store.zoomLevel,
    };
  }

  function calculateLineLength(line: Line): number {
    if (!line.end) return 0;
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getLineLength(line: Line): string {
    if (!line.start || !line.end) return '0 px';
    const length = calculateLineLength(line);
    return store.scale !== 1 
      ? `${(length * store.scale).toFixed(2)} ${store.unit}` 
      : `${length.toFixed(2)} px`;
  }

  function drawPerpendicularEnds(ctx: CanvasRenderingContext2D, line: Line) {
    if (!line.end) return;
    const endLength = 10;
    const angle = Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x);
    const sinAngle = Math.sin(angle);
    const cosAngle = Math.cos(angle);
    
    const startX = line.start.x - endLength * sinAngle;
    const startY = line.start.y + endLength * cosAngle;
    const endX1 = line.start.x + endLength * sinAngle;
    const endY1 = line.start.y - endLength * cosAngle;
    
    const startX2 = line.end.x - endLength * sinAngle;
    const startY2 = line.end.y + endLength * cosAngle;
    const endX2 = line.end.x + endLength * sinAngle;
    const endY2 = line.end.y - endLength * cosAngle;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX1, endY1);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(startX2, startY2);
    ctx.lineTo(endX2, endY2);
    ctx.stroke();
  }

  function drawLine(ctx: CanvasRenderingContext2D, line: Line, color: string) {
    if (!line.end) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / store.zoomLevel; // Keep line width visually consistent
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.stroke();
    drawPerpendicularEnds(ctx, line);
    
    // Sync handles positions
    line.handles[0].x = line.start.x;
    line.handles[0].y = line.start.y;
    line.handles[1].x = line.end.x;
    line.handles[1].y = line.end.y;
  }

  function updateCanvas() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions relative to layout size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    if (store.currentImageId) {
      ctx.scale(store.zoomLevel, store.zoomLevel);
      ctx.translate(store.panX / store.zoomLevel, store.panY / store.zoomLevel);
      
      // Draw background image
      if (store.currentImage && store.currentImage.imgObject) {
        ctx.drawImage(store.currentImage.imgObject, 0, 0);
      }
      
      // Draw reference line (purple / #a855f7)
      if (store.referenceLine && store.referenceLine.end) {
        drawLine(ctx, store.referenceLine, '#a855f7');
      }
      
      // Draw measurement lines (cyan / #00f0ff)
      store.lines.forEach((line) => {
        if (line.end) {
          drawLine(ctx, line, '#00f0ff');
        }
      });
    }
    
    ctx.restore();
  }

  return {
    getCanvasCoordinates,
    calculateLineLength,
    getLineLength,
    updateCanvas
  };
}
