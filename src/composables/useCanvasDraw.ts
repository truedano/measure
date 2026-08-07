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

  function getColorForLine(index: number, line?: Line): string {
    if (line && line.color) return line.color;
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
    const prec = store.lengthPrecision ?? 3;
    if (line.type === 'rectangle') {
      const pxLength = calculateLineLength(line);
      return store.scale !== 1
        ? `${(pxLength * store.scale).toFixed(prec)} ${store.unit}`
        : `${pxLength.toFixed(prec)} px`;
    }
    const length = calculateLineLength(line);
    return store.scale !== 1 
      ? `${(length * store.scale).toFixed(prec)} ${store.unit}` 
      : `${length.toFixed(prec)} px`;
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

  function getRectangleCorners(start: Point, end: Point, height: number) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const baseLen = Math.sqrt(dx * dx + dy * dy);
    if (baseLen === 0) {
      return [
        { x: start.x, y: start.y },
        { x: end.x, y: end.y },
        { x: end.x, y: end.y },
        { x: start.x, y: start.y }
      ];
    }
    // Perpendicular unit vector (-dy/baseLen, dx/baseLen)
    const ux = -dy / baseLen;
    const uy = dx / baseLen;

    const p1 = { x: start.x, y: start.y };
    const p2 = { x: end.x, y: end.y };
    const p3 = { x: end.x + ux * height, y: end.y + uy * height };
    const p4 = { x: start.x + ux * height, y: start.y + uy * height };

    return [p1, p2, p3, p4];
  }

  function drawRectangle(ctx: CanvasRenderingContext2D, line: Line, color: string, isHovered = false) {
    if (!line.end) return;
    const height = line.height || 0;
    const corners = getRectangleCorners(line.start, line.end, height);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = (isHovered ? 4 : 2) / store.zoomLevel;

    if (isHovered) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 / store.zoomLevel;
    }

    // Fill transparent background
    ctx.fillStyle = color.startsWith('#') 
      ? `${color}22` 
      : 'rgba(0, 240, 255, 0.15)';

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Compute 4 corner handles and 4 edge midpoint handles (total 8 handles)
    const m1 = { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 };
    const m2 = { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2 };
    const m3 = { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2 };
    const m4 = { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2 };

    const handlesList = [corners[0], corners[1], corners[2], corners[3], m1, m2, m3, m4];

    if (line.handles.length < 8) {
      line.handles = handlesList.map(p => ({ ...p }));
    } else {
      for (let i = 0; i < 8; i++) {
        line.handles[i].x = handlesList[i].x;
        line.handles[i].y = handlesList[i].y;
      }
    }
  }

  function drawLine(ctx: CanvasRenderingContext2D, line: Line, color: string, isHovered = false) {
    if (!line.end) return;
    if (line.type === 'rectangle') {
      drawRectangle(ctx, line, color, isHovered);
      return;
    }
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
    if (line.handles.length < 2) {
      line.handles = [{ ...line.start }, { ...line.end }];
    } else {
      line.handles[0].x = line.start.x;
      line.handles[0].y = line.start.y;
      line.handles[1].x = line.end.x;
      line.handles[1].y = line.end.y;
    }
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

  function drawPreviewRectangle(ctx: CanvasRenderingContext2D, start: Point, end: Point, height: number, color: string) {
    const corners = getRectangleCorners(start, end, height);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / store.zoomLevel;
    ctx.setLineDash([5 / store.zoomLevel, 5 / store.zoomLevel]);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
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
          const color = getColorForLine(index, line);
          const isHovered = store.hoveredLineIndex === index;
          drawLine(ctx, line, color, isHovered);
        }
      });

      // Draw preview line or rectangle if currently adding
      if (store.mousePos) {
        if (store.isAddingLine && store.lines.length > 0 && !store.lines[store.lines.length - 1].end) {
          const activeLine = store.lines[store.lines.length - 1];
          drawPreviewLine(ctx, activeLine.start, store.mousePos, '#00f0ff');
        } else if (store.isAddingRectangle && store.lines.length > 0) {
          const activeLine = store.lines[store.lines.length - 1];
          if (!activeLine.end) {
            drawPreviewLine(ctx, activeLine.start, store.mousePos, '#00f0ff');
          } else if (store.rectangleStep === 2) {
            const dx = activeLine.end.x - activeLine.start.x;
            const dy = activeLine.end.y - activeLine.start.y;
            const baseLen = Math.sqrt(dx * dx + dy * dy);
            if (baseLen > 0) {
              const ux = -dy / baseLen;
              const uy = dx / baseLen;
              const vx = store.mousePos.x - activeLine.start.x;
              const vy = store.mousePos.y - activeLine.start.y;
              const height = vx * ux + vy * uy;
              drawPreviewRectangle(ctx, activeLine.start, activeLine.end, height, '#00f0ff');
            }
          }
        } else if (store.isAddingReferenceLine && store.referenceLine && !store.referenceLine.end) {
          drawPreviewLine(ctx, store.referenceLine.start, store.mousePos, '#a855f7');
        }
      }
    }
    
    ctx.restore();
  }

  function getDistanceToSegment(p: Point, p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
    
    let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;
    
    return Math.sqrt((p.x - closestX) ** 2 + (p.y - closestY) ** 2);
  }

  function getDistanceToRectangle(p: Point, line: Line): number {
    if (!line.end) return Infinity;
    const corners = getRectangleCorners(line.start, line.end, line.height || 0);
    const d1 = getDistanceToSegment(p, corners[0], corners[1]);
    const d2 = getDistanceToSegment(p, corners[1], corners[2]);
    const d3 = getDistanceToSegment(p, corners[2], corners[3]);
    const d4 = getDistanceToSegment(p, corners[3], corners[0]);
    return Math.min(d1, d2, d3, d4);
  }

  function drawLabelBox(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    color: string,
    zoomLevel: number,
    rotationRad = 0
  ) {
    ctx.save();
    // 反轉旋轉使標籤永遠水平顯示
    if (rotationRad !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate(-rotationRad);
      ctx.translate(-centerX, -centerY);
    }
    const fontSize = 12 / zoomLevel;
    ctx.font = `bold ${fontSize}px Outfit, Inter, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const paddingX = 6 / zoomLevel;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 18 / zoomLevel;

    const rectX = centerX - boxWidth / 2;
    const rectY = centerY - boxHeight / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / zoomLevel;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rectX, rectY, boxWidth, boxHeight, 4 / zoomLevel);
    } else {
      ctx.rect(rectX, rectY, boxWidth, boxHeight);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, centerX, centerY);
    ctx.restore();
  }

  function exportViewportImage(customFilename?: string) {
    const canvas = canvasRef.value;
    if (!canvas || !store.currentImage) return;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.clientWidth || canvas.width || 800;
    offCanvas.height = canvas.clientHeight || canvas.height || 600;

    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    ctx.save();

    // Zoom, Pan & Rotation transforms
    ctx.scale(store.zoomLevel, store.zoomLevel);
    ctx.translate(store.panX / store.zoomLevel, store.panY / store.zoomLevel);

    const img = store.currentImage.imgObject;
    const rotationDeg = store.rotation;
    const exportAngleRad = rotationDeg ? (rotationDeg * Math.PI) / 180 : 0;
    if (img && rotationDeg) {
      const cx = img.width / 2;
      const cy = img.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(exportAngleRad);
      ctx.translate(-cx, -cy);
    }

    if (img) {
      ctx.drawImage(img, 0, 0);
    }

    // Reference line
    if (store.referenceLine && store.referenceLine.end) {
      drawLine(ctx, store.referenceLine, '#a855f7', false);
      const midX = (store.referenceLine.start.x + store.referenceLine.end.x) / 2;
      const midY = (store.referenceLine.start.y + store.referenceLine.end.y) / 2;
      const refText = `Ref: ${getLineLength(store.referenceLine)}`;
      drawLabelBox(ctx, refText, midX, midY, '#a855f7', store.zoomLevel, exportAngleRad);
    }

    // Measurement lines & rectangles
    store.lines.forEach((line, index) => {
      if (line.end) {
        const color = getColorForLine(index, line);
        drawLine(ctx, line, color, false);

        let midX = (line.start.x + line.end.x) / 2;
        let midY = (line.start.y + line.end.y) / 2;

        if (line.type === 'rectangle') {
          const corners = getRectangleCorners(line.start, line.end, line.height || 0);
          midX = (corners[0].x + corners[2].x) / 2;
          midY = (corners[0].y + corners[2].y) / 2;
        }

        const noteStr = line.note ? ` (${line.note})` : '';
        const prefix = line.type === 'rectangle' ? 'R' : 'L';
        const labelText = `${prefix}${index + 1}${noteStr}: ${getLineLength(line)}`;
        drawLabelBox(ctx, labelText, midX, midY, color, store.zoomLevel, exportAngleRad);
      }
    });

    ctx.restore();

    const dataUrl = offCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    const baseName = store.currentImage.name ? store.currentImage.name.replace(/\.[^/.]+$/, '') : 'canvas';
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    link.download = customFilename || `${baseName}_annotated_${timestamp}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    store.showToast(store.t('exportSuccessToast'), 'info');
  }

  return {
    getCanvasCoordinates,
    calculateLineLength,
    getLineLength,
    getColorForLine,
    LINE_COLORS,
    updateCanvas,
    exportViewportImage,
    getDistanceToSegment,
    getDistanceToRectangle,
    getRectangleCorners
  };
}


