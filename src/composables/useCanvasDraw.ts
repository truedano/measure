import { useWorkspaceStore } from '../stores/workspaceStore';
import type { Line, Point } from '../types/workspace';

export function useCanvasDraw(canvasRef: { value: HTMLCanvasElement | null }) {
  const store = useWorkspaceStore();

  const LINE_COLORS = [
    '#00f0ff', // Neon Cyan
    '#10b981', // Neon Emerald Green
    '#fbbf24', // Neon Amber Yellow
    '#f97316', // Neon Orange
    '#ec4899', // Neon Pink
    '#3b82f6'  // Neon Blue
  ];

  function getColorForLine(index: number): string {
    return LINE_COLORS[index % LINE_COLORS.length];
  }

  function getCanvasCoordinates(clientX: number, clientY: number): Point {
    const canvas = canvasRef.value;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const xZp = (clientX - rect.left - store.panX) / store.zoomLevel;
    const yZp = (clientY - rect.top - store.panY) / store.zoomLevel;

    const img = store.currentImage?.imgObject;
    const rotationDeg = store.rotation;
    if (img && rotationDeg) {
      const angleRad = (rotationDeg * Math.PI) / 180;
      const cx = img.width / 2;
      const cy = img.height / 2;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      return {
        x: cx + (xZp - cx) * cosA + (yZp - cy) * sinA,
        y: cy - (xZp - cx) * sinA + (yZp - cy) * cosA,
      };
    }

    return { x: xZp, y: yZp };
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

  function drawPerpendicularEnds(ctx: CanvasRenderingContext2D, line: Line, isHovered = false) {
    if (!line.end) return;
    const endLength = isHovered ? 14 : 10;
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

  function drawLine(ctx: CanvasRenderingContext2D, line: Line, color: string, isHovered = false) {
    if (!line.end) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = (isHovered ? 4 : 2) / store.zoomLevel; // Keep line width visually consistent
    
    if (isHovered) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 / store.zoomLevel;
    }
    
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.stroke();
    drawPerpendicularEnds(ctx, line, isHovered);
    ctx.restore();
    
    // Sync handles positions
    line.handles[0].x = line.start.x;
    line.handles[0].y = line.start.y;
    line.handles[1].x = line.end.x;
    line.handles[1].y = line.end.y;
  }

  function drawPreviewLine(ctx: CanvasRenderingContext2D, start: Point, end: Point, color: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / store.zoomLevel;
    ctx.setLineDash([5 / store.zoomLevel, 5 / store.zoomLevel]);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    const endLength = 6;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const sinAngle = Math.sin(angle);
    const cosAngle = Math.cos(angle);
    
    ctx.beginPath();
    ctx.moveTo(start.x - endLength * sinAngle, start.y + endLength * cosAngle);
    ctx.lineTo(start.x + endLength * sinAngle, start.y - endLength * cosAngle);
    ctx.moveTo(end.x - endLength * sinAngle, end.y + endLength * cosAngle);
    ctx.lineTo(end.x + endLength * sinAngle, end.y - endLength * cosAngle);
    ctx.stroke();
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const lengthStr = store.scale !== 1 
      ? `${(length * store.scale).toFixed(2)} ${store.unit}` 
      : `${length.toFixed(2)} px`;
      
    ctx.save();
    ctx.font = `${10 / store.zoomLevel}px Outfit, Inter, sans-serif`;
    const textWidth = ctx.measureText(lengthStr).width;
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2 - 8 / store.zoomLevel;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(
      midX - textWidth / 2 - 4 / store.zoomLevel,
      midY - 8 / store.zoomLevel,
      textWidth + 8 / store.zoomLevel,
      12 / store.zoomLevel
    );
    
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(lengthStr, midX, midY);
    ctx.restore();
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
      
      const img = store.currentImage?.imgObject;
      const rotationDeg = store.rotation;
      if (img && rotationDeg) {
        const angleRad = (rotationDeg * Math.PI) / 180;
        const cx = img.width / 2;
        const cy = img.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(angleRad);
        ctx.translate(-cx, -cy);
      }

      // Draw background image
      if (store.currentImage && store.currentImage.imgObject) {
        ctx.drawImage(store.currentImage.imgObject, 0, 0);
      }
      
      // Draw reference line (purple / #a855f7)
      if (store.referenceLine && store.referenceLine.end) {
        const isRefHovered = store.hoveredLineIndex === -1;
        drawLine(ctx, store.referenceLine, '#a855f7', isRefHovered);
      }
      
      // Draw measurement lines with distinct colors and hover highlighting
      store.lines.forEach((line, index) => {
        if (line.end) {
          const color = getColorForLine(index);
          const isHovered = store.hoveredLineIndex === index;
          drawLine(ctx, line, color, isHovered);
        }
      });

      // Draw preview dashed line if currently adding a line
      if (store.mousePos) {
        if (store.isAddingLine && store.lines.length > 0 && !store.lines[store.lines.length - 1].end) {
          const activeLine = store.lines[store.lines.length - 1];
          drawPreviewLine(ctx, activeLine.start, store.mousePos, '#00f0ff');
        } else if (store.isAddingReferenceLine && store.referenceLine && !store.referenceLine.end) {
          drawPreviewLine(ctx, store.referenceLine.start, store.mousePos, '#a855f7');
        }
      }
    }
    
    ctx.restore();
  }

  return {
    getCanvasCoordinates,
    calculateLineLength,
    getLineLength,
    getColorForLine,
    LINE_COLORS,
    updateCanvas
  };
}
