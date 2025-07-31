import { ref, reactive } from 'vue'
import type { BoardMetadata, CellConfig, CellState, ClickResponse } from '@/types/game'

export function useGameConfig() {
  const metadata = ref<BoardMetadata | null>(null)
  const additionalCells = ref<CellConfig[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 加载元数据配置
  const loadMetadata = async (): Promise<BoardMetadata> => {
    try {
      const response = await fetch('/api/metadata')
      if (!response.ok) {
        throw new Error(`Failed to load metadata: ${response.statusText}`)
      }
      const data = await response.json()
      metadata.value = data
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading metadata'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  // 处理点击事件
  const postClick = async (
    boardName: string,
    x: number,
    y: number,
    button: string
  ): Promise<ClickResponse> => {
    try {
      const response = await fetch('/api/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardName,
          x,
          y,
          button,
        }),
      })
      if (!response.ok) {
        throw new Error(`Failed to post click: ${response.statusText}`)
      }
      const data: ClickResponse = await response.json()
      additionalCells.value = data.cells
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error posting click'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  // 根据配置创建游戏板
  const createGameBoards = (metadata: BoardMetadata) => {
    const boards: Record<string, Record<string, CellState>> = {}

    for (const [boardName, [rows, cols]] of Object.entries(metadata.boards)) {
      const board = reactive<Record<string, CellState>>({})

      // 初始化所有单元格为空状态
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const key = `${row}-${col}`
          board[key] = {
            type: 'empty',
            isRevealed: false,
          }
        }
      }

      boards[boardName] = board
    }

    return boards
  }

  // 应用单元格配置到游戏板
  const applyCellConfigs = (
    boards: Record<string, Record<string, CellState>>,
    cellConfigs: CellConfig[]
  ) => {
    for (const cellConfig of cellConfigs) {
      const position = cellConfig.position
      const board = boards[position.boardname]

      if (!board) {
        console.warn(`Board ${position.boardname} not found`)
        continue
      }

      const key = `${position.x}-${position.y}`
      const cell = board[key]

      if (!cell) {
        console.warn(`Cell ${key} not found in board ${position.boardname}`)
        continue
      }

      // 根据组件配置设置单元格
      cell.type = 'revealed'
      cell.isRevealed = true
    }
  }

  // 获取单元格的高亮信息
  const getCellHighlight = (
    cellConfigs: CellConfig[],
    boardName: string,
    x: number,
    y: number
  ): boolean => {
    return cellConfigs.some(config => {
      if (!config.highlight || !config.highlight[boardName]) {
        return false
      }
      return config.highlight[boardName].some(([hx, hy]) => hx === x && hy === y)
    })
  }

  // 完整的游戏配置加载流程
  const loadGameConfig = async () => {
    isLoading.value = true
    error.value = null

    try {
      const metadataResult = await loadMetadata()

      // 合并所有单元格配置
      const allCells = [...metadataResult.cells] // 暂时只使用元数据中的单元格

      // 创建游戏板
      const boards = createGameBoards(metadataResult)

      // 应用单元格配置
      applyCellConfigs(boards, allCells)

      return {
        metadata: metadataResult,
        boards,
        allCells,
      }
    } catch (err) {
      console.error('Failed to load game config:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    metadata,
    additionalCells,
    isLoading,
    error,
    loadMetadata,
    postClick,
    createGameBoards,
    applyCellConfigs,
    getCellHighlight,
    loadGameConfig,
  }
}
