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
  const allCells = ref<Record<string, CellConfig>>({})
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isGameOver = ref(false)
  const gameOverReason = ref<string>('')
  const showGameOverDialog = ref(false)

  // 辅助函数：生成cellConfig的key
  const getCellKey = (boardName: string, x: number, y: number): string => {
    return `${boardName}-${x}-${y}`
  }

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

  const handleCellClick = async (boardName: string, row: number, col: string, button: string = 'left') => {
    if (isGameOver.value || showGameOverDialog.value) {
      console.log('Game is over or dialog is shown, click ignored')
      return
    }

    const board = getGameBoard(boardName)
    const key = cellCoordToKey(row, col)
    const cellState = board[key]

    const { x, y } = displayCoordToIndex(row, col)

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
