export interface DrawingPoint {
  x: number
  y: number
}

export interface DrawingPath {
  points: DrawingPoint[]
  color: string
  size: number
  tool: DrawingTool
  timestamp: number
}

export type DrawingTool = 'brush' | 'magic-eraser' | 'circle-marker'

export interface DrawingState {
  currentTool: DrawingTool
  currentColor: string
  currentSize: number  // 向后兼容，表示当前工具的尺寸
  brushSize: number    // 画笔尺寸
  eraserSize: number   // 橡皮尺寸
  isDrawing: boolean
  paths: DrawingPath[]
  historyIndex: number
}

export interface CanvasSize {
  logical: { width: number; height: number }  // 逻辑尺寸（固定320x240比例）
  display: { width: number; height: number }  // 显示尺寸（实际Canvas尺寸）
  scale: { x: number; y: number }             // 坐标转换比例
}

export interface ColorPaletteProps {
  visible: boolean
  currentColor: string
  onColorChange: (_color: string) => void
  onClose: () => void
}

export interface BrushSizePanelProps {
  visible: boolean
  currentSize: number
  onSizeChange: (_size: number) => void
  onClose: () => void
}

export interface DrawingCanvasEvents {
  onPathComplete: (_path: DrawingPath) => void
  onClear: (_partial?: boolean) => void
  onUndo: () => void
  onRedo: () => void
}
