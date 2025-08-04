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
  visible?: boolean
}

export type DrawingTool = 'brush' | 'magic-eraser' | 'circle-marker'

export interface DrawingState {
  currentTool: DrawingTool
  currentColor: string
  currentSize: number
  isDrawing: boolean
  paths: DrawingPath[]
  historyIndex: number
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
