import { fetchWithValidation, getApiEndpoint } from '@/utils/fetchUtils'
import { Cell } from '@/types/cell'
import { useGameConfig } from '@/composables/useGameConfig'
import { watch } from 'vue'

const { hints, hintIndex, gameBoards } = useGameConfig()

export interface rullHint {
  rule: string
  index?: number
}

export interface Hint {
  condition: (Cell | rullHint)[]
  conclusion: Cell[]
}

export async function postHint(
  setLoading: (_loading: boolean) => void
): Promise<void> {

  try {
    setLoading(true)
    const { data, error } = await fetchWithValidation<{hints: Hint[]}>(getApiEndpoint('hint'))

    setLoading(false)

    if (error || !data) {
      throw error
    }

    hints.value = data.hints
    hintIndex.value = 0

  } catch (e) {
    // 确保在出错时也结束加载状态
    setLoading(false)
    window.alert(`获取提示失败: ${e instanceof Error ? e.message : e}`)
  }
}

export function clearHints() {
  hints.value = null
  hintIndex.value = -1
}

export function hideHints() {
  hintIndex.value = -1
}

export function showNextHint() {
  if (hints.value) {
    hintIndex.value = (hintIndex.value + 1)
  }
  if (hintIndex.value >= (hints.value?.length || 0)) {
    hintIndex.value = -1
  }
}

// 监听 hintIndex 变化，更新单元格的提示状态
watch(hintIndex, (newIndex) => {
  // 重置所有格子的 hint1 和 hint2
  if (gameBoards.value) {
    Object.values(gameBoards.value).forEach(board => {
      Object.values(board).forEach(cellState => {
        if (cellState) {
          cellState.hint1 = false
          cellState.hint2 = false
        }
      })
    })
  }

  // 如果 hintIndex 为 -1 或没有提示，直接返回
  if (newIndex === -1 || !hints.value || !hints.value[newIndex]) {
    return
  }

  const currentHint = hints.value[newIndex]
  // 处理 condiction（条件），设置 hint2 为 true
  currentHint.condition.forEach(item => {
    // 判断是否为 Cell（没有 rule 键）
    if (!('rule' in item)) {
      const cell = item as Cell
      const cellKey = `${cell.x}-${cell.y}`
      const board = gameBoards.value[cell.boardname]
      if (board && board[cellKey]) {
        board[cellKey].hint2 = true
      }
    }
    // 对于 ruleHint 暂时不做处理
  })

  // 处理 conclusion（结论），设置 hint1 为 true
  currentHint.conclusion.forEach(cell => {
    const cellKey = `${cell.x}-${cell.y}`
    const board = gameBoards.value[cell.boardname]
    if (board && board[cellKey]) {
      board[cellKey].hint1 = true
    }
  })
}, { immediate: true })
