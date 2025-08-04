import { ref, reactive } from 'vue'
import type { BoardMetadata, CellConfig, CellState, ClickResponse } from '@/types/game'
import { getApiEndpoint } from '@/utils/endpointUtils'
import { fetchWithValidation } from '@/utils/fetchUtils'
import { newGame, getGameParams } from '@/utils/gameUtils'
import { useRules } from '@/utils/ruleUtils'

// 单例实例
let gameConfigInstance: ReturnType<typeof createGameConfig> | null = null

function createGameConfig() {
  const metadata = ref<BoardMetadata | null>(null)
  const additionalCells = ref<CellConfig[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const noFail = ref(true)
  const gameMode = ref<'normal' | 'expert' | 'ultimate'>('ultimate') // 游戏模式

  // 使用规则管理
  const { rules, processMetadataRules } = useRules()

  // 辅助函数：生成cellConfig的key
  const getCellKey = (boardName: string, x: number, y: number): string => {
    return `${boardName}-${x}-${y}`
  }

  // 加载元数据配置
  const loadMetadata = async (): Promise<BoardMetadata> => {
    try {
      const result = await fetchWithValidation<BoardMetadata>(getApiEndpoint('metadata'))
      if (result.error) {
        throw new Error(`Failed to load metadata: ${result.error}`)
      }

      // 检查返回的数据是否为空或无效
      const data = result.data!
      if (!data || !data.boards || Object.keys(data.boards).length === 0) {
        // 如果metadata为空，创建新游戏
        console.log('Metadata is empty, creating new game...')
        const newGameData = await newGame(getGameParams())
        processMetadataRules(newGameData?.rules)
        metadata.value = newGameData
        return newGameData
      }
      console.log('Loaded metadata:', data)
      processMetadataRules(data?.rules)
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
      const result = await fetchWithValidation<ClickResponse>(getApiEndpoint('click'), {
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
      if (result.error) {
        throw new Error(`Failed to post click: ${result.error}`)
      }
      const data = result.data!
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

      // 合并所有单元格配置并转换为Record
      const allCells: Record<string, CellConfig> = {}
      for (const cell of metadataResult.cells) {
        const key = getCellKey(cell.position.boardname, cell.position.x, cell.position.y)
        allCells[key] = cell
      }

      // 创建游戏板
      const boards = createGameBoards(metadataResult)

      // 应用单元格配置
      applyCellConfigs(boards, metadataResult.cells) // 这里仍然传递数组，因为applyCellConfigs可能需要数组

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
    rules,
    noFail,
    gameMode,
    loadMetadata,
    postClick,
    createGameBoards,
    applyCellConfigs,
    getCellHighlight,
    loadGameConfig,
  }
}

export function useGameConfig() {
  if (!gameConfigInstance) {
    gameConfigInstance = createGameConfig()
  }
  return gameConfigInstance
}
