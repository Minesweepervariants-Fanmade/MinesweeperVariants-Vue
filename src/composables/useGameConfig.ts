import { ref, reactive } from 'vue'
import type { BoardMetadata, CellConfig, CellState, ClickResponse } from '@/types/game'
import { fetchWithoutValidation, getApiEndpoint } from '@/utils/fetchUtils'
import { newGame, getGameParams } from '@/utils/gameUtils'
import { useRules } from '@/utils/ruleUtils'
import { Cell } from '@/types/cell'
import { clearHints, type Hint } from '@/utils/hintUtils'
import typia from 'typia'
import { fetchReset } from '@/composables/reset'

// 单例实例
let gameConfigInstance: ReturnType<typeof createGameConfig> | null = null

function createGameConfig() {
  const metadata = ref<BoardMetadata | null>(null)
  const gameBoards = ref<Record<string, Record<string, CellState>>>({})
  const allCells = ref<Record<string, CellConfig>>({})
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isGameOver = ref(false)
  const gameOverReason = ref<string>('')
  const showGameOverDialog = ref(false)

  const noFail = ref(true)

  // 提示相关状态
  const hints = ref<Hint[] | null>(null)
  const hintIndex = ref<number>(-1)

  // 使用规则管理
  const { rules, processMetadataRules } = useRules()

  // 辅助函数：生成cellConfig的key
  const getCellKey = (boardName: string, x: number, y: number): string => {
    return `${boardName}-${x}-${y}`
  }

  // 加载元数据配置
  const loadMetadata = async (): Promise<BoardMetadata> => {
    try {
      const result = await fetchWithoutValidation(getApiEndpoint('metadata'))

      if (result.error) {
        throw new Error(`Failed to load metadata: ${result.error}`)
      }
      if (typeof result.data !== 'object' || !(result.data as {cells: unknown}).cells) {
        // 如果metadata为空，创建新游戏
        await newGame(getGameParams())
        return await loadMetadata()
      }
      console.log('Loaded metadata:', result.data)
      const data = typia.assert<BoardMetadata>(result.data)
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
      const result = await fetchWithoutValidation(getApiEndpoint('click'), {
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
      const data = typia.assert<ClickResponse>(result.data)
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

    for (const [boardName, { size: [rows, cols] }] of Object.entries(metadata.boards)) {
      const board = reactive<Record<string, CellState>>({})

      // 初始化所有单元格为空状态
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const key = `${row}-${col}`
          board[key] = {
            type: 'empty',
            isRevealed: false,
            isLoading: false,
            hint1: false,
            hint2: false,
            error: false,
            errormine: false,
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
      const allCellsRecord: Record<string, CellConfig> = {}
      for (const cell of metadataResult.cells) {
        const key = getCellKey(cell.position.boardname, cell.position.x, cell.position.y)
        allCellsRecord[key] = cell
      }

      // 创建游戏板
      const boards = createGameBoards(metadataResult)

      // 应用单元格配置
      applyCellConfigs(boards, metadataResult.cells)

      // 更新状态
      gameBoards.value = boards
      allCells.value = allCellsRecord
      isInitialized.value = true

      return {
        metadata: metadataResult,
        boards,
        allCells: allCellsRecord,
      }
    } catch (err) {
      console.error('Failed to load game config:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 初始化游戏
  const initializeGame = async () => {
    isLoading.value = true
    error.value = null
    isGameOver.value = false
    gameOverReason.value = ''
    showGameOverDialog.value = false

    clearHints()

    try {
      await loadGameConfig()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game'
      error.value = errorMessage
      console.error('Game initialization failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 获取游戏板
  const getGameBoard = (boardName: string) => {
    return gameBoards.value[boardName] || reactive<Record<string, CellState>>({})
  }

  // 获取游戏板标签
  const getBoardLabels = (boardName: string) => {
    if (!metadata.value) return { rows: [], cols: [] }

    const boardSize = metadata.value.boards[boardName].size
    if (!boardSize) return { rows: [], cols: [] }

    return {
      rows: Cell.generateRowLabels(boardSize[0]),
      cols: Cell.generateColumnLabels(boardSize[1]),
    }
  }

  // 处理单元格点击
  const handleCellClick = async (boardName: string, row: number, col: string, button: string = 'left') => {
    clearHints()
    if (isGameOver.value || showGameOverDialog.value) {
      console.log('Game is over or dialog is shown, click ignored')
      return
    }

    const board = getGameBoard(boardName)
    const key = Cell.CellCoordToKey(row, col)
    const cellState = board[key]

    const { x, y } = Cell.displayCoordToIndex(row, col)

    if (cellState) {
      try {
        // 设置加载状态
        cellState.isLoading = true

        // 调用postClick API发送点击事件到服务器
        const response: ClickResponse = await postClick(boardName, x, y, button)

        // 清除加载状态
        cellState.isLoading = false

        // 检查响应状态
        if (!response.success) {
          console.error('Click failed:', response.reason)
          return
        }

        // 处理服务器返回的单元格更新
        if (response.cells) {
          // 应用服务器返回的单元格配置更新
          for (const cellUpdate of response.cells) {
            const updateBoard = gameBoards.value[cellUpdate.position.boardname]
            if (updateBoard) {
              const updateKey = `${cellUpdate.position.x}-${cellUpdate.position.y}`
              const updateCell = updateBoard[updateKey]
              if (updateCell) {
                updateCell.type = 'revealed'
                updateCell.isRevealed = true
              }
            }
          }

          // 更新allCells Record
          for (const cellUpdate of response.cells) {
            const key = getCellKey(cellUpdate.position.boardname, cellUpdate.position.x, cellUpdate.position.y)
            allCells.value[key] = cellUpdate
          }
        }

        // 更新count信息
        if (response.count && metadata.value) {
          metadata.value.count = response.count
        }

        // 检查游戏是否结束
        if (response.gameover) {
          isGameOver.value = true
          gameOverReason.value = response.reason

          // 显示游戏结束对话框
          window.setTimeout(() => {
            showGameOverDialog.value = true
          }, 0)
        }
      } catch (error) {
        // 清除加载状态
        cellState.isLoading = false
        console.error('Failed to post click:', error)
      }
    }
  }

  // 获取单元格配置
  const getCellConfig = (boardName: string, x: number, y: number): CellConfig | null => {
    if (!allCells.value) return null

    const key = getCellKey(boardName, x, y)
    return allCells.value[key] || null
  }

  // 重置游戏
  const resetGame = async () => {
    await fetchReset()
    await initializeGame()
  }

  // 关闭游戏结束对话框并重置游戏
  const handleGameOverConfirm = async () => {
    showGameOverDialog.value = false
    await resetGame()
  }

  // 获取游戏规则
  const getGameRules = () => {
    return metadata.value?.rules || []
  }

  // 获取所有游戏板名称
  const getBoardNames = () => {
    return metadata.value ? Object.keys(metadata.value.boards) : []
  }

  // 获取指定游戏板的配置
  const getBoardConfig = (boardName: string) => {
    if (!metadata.value) return null
    return {
      name: boardName,
      size: metadata.value.boards[boardName],
      gameBoard: getGameBoard(boardName),
      labels: getBoardLabels(boardName),
    }
  }

  // 获取所有游戏板配置
  const getAllBoardConfigs = () => {
    return getBoardNames()
      .map(boardName => getBoardConfig(boardName))
      .filter(Boolean)
  }

  return {
    // 状态
    metadata,
    gameBoards,
    allCells,
    isInitialized,
    isLoading,
    error,
    rules,
    noFail,
    isGameOver,
    gameOverReason,
    showGameOverDialog,
    hints,
    hintIndex,

    // 方法
    loadMetadata,
    postClick,
    createGameBoards,
    applyCellConfigs,
    getCellHighlight,
    loadGameConfig,
    initializeGame,
    getGameBoard,
    getBoardLabels,
    handleCellClick,
    getCellConfig,
    resetGame,
    handleGameOverConfirm,
    getGameRules,
    getBoardNames,
    getBoardConfig,
    getAllBoardConfigs,
  }
}

export function useGameConfig() {
  if (!gameConfigInstance) {
    gameConfigInstance = createGameConfig()
  }
  return gameConfigInstance
}
