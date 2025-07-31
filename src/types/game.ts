// 单元格状态类型
export type CellType = 'empty' | 'revealed'

// 单元格状态
export interface CellState {
  type: CellType
  isRevealed: boolean
}

// JSON配置相关类型定义
export interface BoardMetadata {
  rules: string[]
  boards: Record<string, [number, number]>
  cells: CellConfig[]
  count: number
}

export interface CellConfig {
  type: string
  position: {
    boardname: string
    x: number
    y: number
  }
  component: ComponentConfig
  highlight?: Record<string, [number, number][]>
  clickable?: boolean
  rule?: string
}

export interface ComponentConfig {
  type: 'container' | 'text' | 'assets'
  value: ComponentConfig[] | string
  style: string
}

export type Theme = '' | 'theme-blue' | 'theme-amber'

// 信息提示组件配置
export interface InfoOverlayConfig {
  title?: string
  message: string
  confirmText?: string
  closeOnBackdrop?: boolean
}

export interface AssetTemplates {
  flag: SVGElement | null
  star: SVGElement | null
  circle: SVGElement | null
  cross: SVGElement | null
  arrow: SVGElement | null
  double_arrow: SVGElement | null
}

// API响应类型
export interface ClickResponse {
  success: boolean
  gameover: boolean
  reason: string
  cells: CellConfig[]
}
