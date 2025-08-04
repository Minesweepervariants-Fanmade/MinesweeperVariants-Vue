import { fetchWithValidation, getApiEndpoint } from '@/utils/fetchUtils'
import type { ClickResponse, CellState, CellConfig, BoardMetadata } from '@/types/game'
import type { Ref } from 'vue'

export async function fetchHint(count = 1) {
  const endpoint = `${getApiEndpoint('hint')}?count=${count}`
  return fetchWithValidation(endpoint)
}

export interface HintProcessingParams {
  gameBoards: Ref<Record<string, Record<string, CellState>>>
  allCells: Ref<Record<string, CellConfig>>
  metadata: Ref<BoardMetadata | null>
  isGameOver: Ref<boolean>
  gameOverReason: Ref<string>
  showGameOverDialog: Ref<boolean>
}

export async function processHintResponse(
  setLoading: (_loading: boolean) => void,
  params: HintProcessingParams
): Promise<void> {
  const { gameBoards, allCells, metadata, isGameOver, gameOverReason, showGameOverDialog } = params

  try {
    // 开始加载
    setLoading(true)

    const endpoint = `${getApiEndpoint('hint')}?count=1`
    const { data, error } = await fetchWithValidation<ClickResponse>(endpoint)

    // 结束加载
    setLoading(false)

    if (error || !data) {
      window.alert(`获取提示失败: ${error || '未知错误'}`)
      return
    }

    const { cells, gameover, reason, count } = data as ClickResponse

    if (cells && Array.isArray(cells) && cells.length > 0) {
      // 更新游戏板状态
      for (const cellUpdate of cells) {
        const updateBoard = gameBoards.value[cellUpdate.position.boardname]
        if (updateBoard) {
          const updateKey = cellUpdate.position.boardKey
          const updateCell = updateBoard[updateKey]
          if (updateCell) {
            updateCell.type = 'revealed'
            updateCell.isRevealed = true
          }
        }
      }

      // 更新allCells Record
      for (const cellUpdate of cells) {
        const key = cellUpdate.position.boardKey
        allCells.value[key] = cellUpdate
      }
    }

    // 更新count信息
    if (count && metadata.value) {
      metadata.value.count = count
    }

    if (gameover) {
      isGameOver.value = true
      gameOverReason.value = reason || '游戏结束'
      window.setTimeout(() => {
        showGameOverDialog.value = true
      }, 0)
    }
  } catch (e) {
    // 确保在出错时也结束加载状态
    setLoading(false)
    window.alert(`获取提示失败: ${e instanceof Error ? e.message : e}`)
  }
}
