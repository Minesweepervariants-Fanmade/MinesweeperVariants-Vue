import { ref, watch } from 'vue'

// 游戏模式类型
export type GameMode = 'normal' | 'expert' | 'ultimate' | 'puzzle'

// 快捷键配置类型
export interface KeyboardShortcuts {
  [key: string]: string
  toggleDrawingToolbar: string // 切换绘图覆盖层
  useCurrentTool: string     // 使用当前绘画工具
  brushTool: string          // 画笔工具
  eraserTool: string         // 魔术橡皮
  markerTool: string         // 标记工具
  colorPalette: string       // 颜色面板
  brushPanel: string         // 笔刷面板
  clearCanvas: string        // 清空画布
  undo: string              // 撤销
  redo: string              // 重做
  resetGame: string         // 重置游戏
  themeToggle: string       // 主题切换
}

// 鼠标快捷键配置类型
export interface MouseShortcuts {
  [key: string]: string
  toggleDrawingToolbar: string // 切换绘图覆盖层
  brushTool: string          // 画笔工具
  eraserTool: string         // 魔术橡皮
  markerTool: string         // 标记工具
  colorPalette: string       // 颜色面板
  brushPanel: string         // 笔刷面板
  clearCanvas: string        // 清空画布
  undo: string              // 撤销
  redo: string              // 重做
  resetGame: string         // 重置游戏
}

// 终极模式子选项
export interface UltimateModeOptions {
  autoHint: boolean      // +A: 自动按下提示按钮
  forceFlag: boolean     // +F: 必须标出所有可确定的雷格
  showMineCount: boolean // +R: 不隐藏总雷数
  forceSide: boolean     // +S: 必须标出所有可确定的副板格
  hideRemaining: boolean // +!: 不显示剩余可断定格数信息
}

export interface GameSettings {
  gridWidth: number
  gridHeight: number
  mineCount: number
  enabledRules: string[]  // 启用的规则代号数组
  gameMode: GameMode      // 游戏模式
  ultimateModeOptions: UltimateModeOptions // 终极模式子选项
  theme: string
  showNumbers: boolean
  showHints: boolean
  rightClickFlag: boolean
  doubleClickReveal: boolean
  serverUrl: string
  drawTransparent: boolean // 画图透明度
  showRowColLabel: boolean // 显示行列标号
  touchMode: boolean // 触屏模式
  swapMouseButtons: boolean // 交换鼠标左右键
  loadingSpinnerDelay: number // 加载动画延迟时间(毫秒)
  keyboardShortcuts: KeyboardShortcuts // 键盘快捷键配置
  mouseShortcuts: MouseShortcuts // 鼠标快捷键配置
  seed?: string // 随机种子
  showDescription: boolean
  backgroundImage?: string // base64图片数据
  backgroundImageCss?: string // 背景图片自定义CSS
}

// 默认设置
export const defaultSettings: GameSettings = {
  gridWidth: 5,
  gridHeight: 5,
  mineCount: 10,
  enabledRules: [],
  gameMode: 'expert',  // 默认推荐专家模式
  ultimateModeOptions: {
    autoHint: false,
    forceFlag: false,
    showMineCount: false,
    forceSide: false,
    hideRemaining: false
  },
  theme: 'dark',
  showNumbers: true,
  showHints: true,
  rightClickFlag: true,
  doubleClickReveal: true,
  serverUrl: 'http://localhost:5050/api/',
  drawTransparent: false,
  showRowColLabel: false,
  touchMode: false,
  swapMouseButtons: false,
  loadingSpinnerDelay: 300, // 默认延迟300毫秒
  keyboardShortcuts: {
    toggleDrawingToolbar: 'd',
    useCurrentTool: '',
    brushTool: 'b',
    eraserTool: 'e',
    markerTool: '',
    colorPalette: '',
    brushPanel: '',
    clearCanvas: 'c',
    undo: 'z',
    redo: 'y',
    resetGame: 'r',
    themeToggle: 't'
  },
  mouseShortcuts: {
    toggleDrawingToolbar: '',
    brushTool: 'left',
    eraserTool: 'right',
    markerTool: '',
    colorPalette: 'wheel',
    brushPanel: 'ctrl+wheel',
    clearCanvas: 'middle',
    undo: 'mb4',
    redo: 'mb5',
    resetGame: ''
  },
  seed: '',
  showDescription: true,
  backgroundImage: '',
  backgroundImageCss: 'opacity:0.2; filter:blur(2px);'
}

const STORAGE_KEY = 'minesweeper-game-settings'

// 游戏模式描述
export const gameModeDescriptions = {
  normal: {
    title: '普通模式',
    description: '所有谜题不需要猜测,但不禁止猜测。玩家猜测时,如果恰好猜对则不会失败。'
  },
  expert: {
    title: '专家模式(推荐)',
    description: '所有谜题不需要且不允许猜测。玩家猜测时,所有剩余雷将会自动重排,使得玩家的猜测永远是错的。注意:"题目仅有唯一解"不能作为推理条件使用。'
  },
  ultimate: {
    title: '终极模式',
    description: '终极的逻辑挑战。新翻开的线索格都会显示为星号,直到场上没有任何新非雷格可以无猜推出。此时你需要点击提示按钮。如果场上的确没有格子可以无猜推出时,星号格会变成线索,游戏继续。否则,游戏会提示一组可以继续推理的格子。注意:该模式下难度控制将不再适用,你将会在原本的简单题组里遇到极其困难的推理。此模式下,游戏前期将隐藏总雷数(部分机制除外)。'
  },
  puzzle: {
    title: '纸笔模式',
    description: '所有线索在一开始即给出,不需要猜测.允许修改答案,并且没有答案校验.'
  }
} as const

// 终极模式子选项描述
export const ultimateModeOptionDescriptions = {
  autoHint: {
    symbol: '+A',
    description: '如果勾选,则提示按钮在剩余可推格数显示为0时会被自动按下。'
  },
  forceFlag: {
    symbol: '+F',
    description: '如果勾选,则玩家必须也标出所有可以确定的雷格。'
  },
  showMineCount: {
    symbol: '+R',
    description: '如果勾选,总雷数不会被隐藏,游戏可能会强迫玩家在游戏前期进行总雷数相关的复杂推理。'
  },
  forceSide: {
    symbol: '+S',
    description: '如果勾选,则玩家必须也标出所有可以确定的副板格。'
  },
  hideRemaining: {
    symbol: '+!',
    description: '如果勾选,游戏界面中不会给出剩余的可断定格数的信息。'
  }
} as const


// 快捷键功能描述
export const shortcutDescriptions = {
  toggleDrawingToolbar: {
    name: '切换绘图覆盖层',
    category: '界面操作'
  },
  useCurrentTool: {
    name: '使用当前绘画工具',
    category: '绘图工具'
  },
  brushTool: {
    name: '选择画笔工具',
    category: '绘图工具'
  },
  eraserTool: {
    name: '选择魔术橡皮',
    category: '绘图工具'
  },
  markerTool: {
    name: '选择标记工具',
    category: '绘图工具'
  },
  colorPalette: {
    name: '打开颜色面板',
    category: '绘图工具'
  },
  brushPanel: {
    name: '打开笔刷面板',
    category: '绘图工具'
  },
  clearCanvas: {
    name: '清空画布',
    category: '绘图工具'
  },
  undo: {
    name: '撤销',
    category: '绘图工具'
  },
  redo: {
    name: '重做',
    category: '绘图工具'
  },
  resetGame: {
    name: '重置游戏',
    category: '游戏操作'
  },
  themeToggle: {
    name: '切换主题',
    category: '界面操作'
  }
} as const

// 从 localStorage 加载设置
const loadSettings = (): GameSettings => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...defaultSettings }
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 合并默认设置，确保新增的字段有默认值
      return { ...defaultSettings, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error)
  }
  return { ...defaultSettings }
}

// 保存设置到 localStorage
const saveSettings = (settings: GameSettings): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error)
  }
}

// 单例实例
let settingsInstance: ReturnType<typeof createSettingsInstance> | null = null

// 创建设置实例的工厂函数
function createSettingsInstance() {
  // 从 localStorage 加载初始设置
  const settings = ref<GameSettings>(loadSettings())

  // 监听设置变化，自动保存到 localStorage
  watch(
    settings,
    (newSettings) => {
      saveSettings(newSettings)
    },
    { deep: true }
  )

  // 重置为默认设置
  const resetSettings = () => {
    settings.value = { ...defaultSettings }
  }

  // 更新特定设置项
  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    settings.value[key] = value
  }

  // 批量更新设置
  const updateSettings = (newSettings: Partial<GameSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  // 设置游戏模式
  const setGameMode = (mode: GameMode) => {
    settings.value.gameMode = mode
    // 如果不是终极模式，重置终极模式选项
    if (mode !== 'ultimate') {
      settings.value.ultimateModeOptions = { ...defaultSettings.ultimateModeOptions }
    }
  }

  // 更新终极模式选项
  const updateUltimateOption = <K extends keyof UltimateModeOptions>(
    key: K,
    value: UltimateModeOptions[K]
  ) => {
    settings.value.ultimateModeOptions[key] = value
  }

  // 检查是否启用了特定的终极模式选项
  const isUltimateOptionEnabled = (option: keyof UltimateModeOptions): boolean => {
    return settings.value.gameMode === 'ultimate' && settings.value.ultimateModeOptions[option]
  }

  return {
    settings,
    defaultSettings,
    resetSettings,
    updateSetting,
    updateSettings,
    setGameMode,
    updateUltimateOption,
    isUltimateOptionEnabled,
    loadSettings,
    saveSettings,
  }
}

// 单例模式的 useSettings 函数
export function useSettings() {
  if (!settingsInstance) {
    settingsInstance = createSettingsInstance()
  }
  return settingsInstance
}
