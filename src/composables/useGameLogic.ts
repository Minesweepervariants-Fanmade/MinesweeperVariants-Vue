import { ref, reactive } from 'vue'
import type { CellState, BoardMetadata, CellConfig, ClickResponse } from '@/types/game'
import { useGameConfig } from './useGameConfig'
import {
  generateRowLabels,
  generateColumnLabels,
  cellCoordToKey,
  displayCoordToIndex,
} from '@/utils/columnUtils'

export function useGameLogic() {
  const { loadGameConfig, postClick } = useGameConfig()

  const gameBoards = ref<Record<string, Record<string, CellState>>>({})
  const metadata = ref<BoardMetadata | null>(null)
  const allCells = ref<CellConfig[]>([])
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isGameOver = ref(false)
  const gameOverReason = ref<string>('')
  const showGameOverDialog = ref(false)

  const initializeGame = async () => {
    isLoading.value = true
    error.value = null
    isGameOver.value = false
    gameOverReason.value = ''
    showGameOverDialog.value = false

    try {
      const config = await loadGameConfig()

      gameBoards.value = config.boards
      metadata.value = config.metadata
      allCells.value = config.allCells
      isInitialized.value = true

      console.log('Game initialized with config:', {
        metadata: config.metadata,
        boards: Object.keys(config.boards),
        cellCount: config.allCells.length,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game'
      error.value = errorMessage
      console.error('Game initialization failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getGameBoard = (boardName: string) => {
    return gameBoards.value[boardName] || reactive<Record<string, CellState>>({})
  }

  const getBoardLabels = (boardName: string) => {
    if (!metadata.value) return { rows: [], cols: [] }

    const boardSize = metadata.value.boards[boardName]
    if (!boardSize) return { rows: [], cols: [] }

    return {
      rows: generateRowLabels(boardSize[0]),
      cols: generateColumnLabels(boardSize[1]),
    }
  }

  const handleCellClick = async (boardName: string, row: number, col: string) => {
    if (isGameOver.value || showGameOverDialog.value) {
      console.log('Game is over or dialog is shown, click ignored')
      return
    }

    const board = getGameBoard(boardName)
    const key = cellCoordToKey(row, col)
    const cellState = board[key]

    console.log(
      `Cell clicked: Board ${boardName}, Position ${key} (row: ${row}, col: ${col})`,
      cellState
    )

    // 检查单元格配置中的clickable属性
    const { x, y } = displayCoordToIndex(row, col)
    const cellConfig = getCellConfig(boardName, x, y)
    if (cellConfig && cellConfig.clickable === false) {
      console.log('Cell is not clickable according to configuration')
      return
    }

    // 只有空单元格且未揭开的才能点击
    if (cellState && cellState.type === 'empty' && !cellState.isRevealed) {
      try {
        // 调用postClick API发送点击事件到服务器
        const response: ClickResponse = await postClick(boardName, x, y, 'left')

        // 检查响应状态
        if (!response.success) {
          console.error('Click failed:', response.reason)
          return
        }

        // 处理服务器返回的单元格更新
        if (response.cells && response.cells.length > 0) {
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

          // 更新allCells数组
          allCells.value = [...allCells.value, ...response.cells]
        }

        // 检查游戏是否结束
        if (response.gameover) {
          isGameOver.value = true
          gameOverReason.value = response.reason
          console.log('Game over:', response.reason)

          // 游戏结束处理逻辑 - 主动显示 InfoOverlay
          // 延迟显示对话框，给用户一点时间看到最后的操作结果
          window.setTimeout(() => {
            showGameOverDialog.value = true
          }, 500)

          // 禁用进一步的游戏交互（通过 isGameOver 状态在 handleCellClick 开头已经检查）

          // 可以在这里添加游戏结束的额外逻辑，比如：
          // - 记录游戏统计数据
          // - 播放游戏结束音效
          // - 发送游戏结果到服务器等
        }
      } catch (error) {
        console.error('Failed to post click:', error)
      }
    }
  }

  // 获取单元格配置
  const getCellConfig = (boardName: string, x: number, y: number): CellConfig | null => {
    if (!allCells.value) return null

    return (
      allCells.value.find(
        config =>
          config.position.boardname === boardName &&
          config.position.x === x &&
          config.position.y === y
      ) || null
    )
  }

  // 重置游戏
  const resetGame = async () => {
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
    gameBoards,
    metadata,
    allCells,
    isInitialized,
    isLoading,
    error,
    isGameOver,
    gameOverReason,
    showGameOverDialog,

    // 方法
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
