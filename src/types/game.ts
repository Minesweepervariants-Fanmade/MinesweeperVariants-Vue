// 单元格状态类型
export type CellType = 'empty' | 'revealed'

// 单元格状态
export interface CellState {
  type: CellType
  isRevealed: boolean
  isLoading?: boolean
}

// JSON配置相关类型定义
export interface BoardMetadata {
  rules: string[]
  boards: Record<string, [number, number]>
  cells: CellConfig[]
  count: CountInfo
}

// 计数信息类型
export interface CountInfo {
  total: number      // 题板总雷数
  known: number | null   // 雷数(可未知)
  unknown: number    // 格数
  remains: number | null // 剩余雷数(可未知)
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
  flag?: SVGElement
  star?: SVGElement
  circle?: SVGElement
  cross?: SVGElement
  arrow?: SVGElement
  double_arrow?: SVGElement
  brush?: SVGElement
  hint?: SVGElement
  check?: SVGElement
  reset?: SVGElement
  menu?: SVGElement
}

// API响应类型
export interface ClickResponse {
  success: boolean
  gameover: boolean
  reason: string
  cells: CellConfig[]
  count?: CountInfo  // 新增count字段
}
