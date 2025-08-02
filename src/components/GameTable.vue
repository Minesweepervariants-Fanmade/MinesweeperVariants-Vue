<template>
  <table class="game-table">
    <thead>
      <tr>
        <th class="corner-cell">{{ boardName }}</th>
        <th v-for="col in cols" :key="col" class="col-header">
          <template v-if="showRowColLabel !== false">{{ col }}</template>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="row in rows" :key="row">
        <th class="row-header">
          <template v-if="showRowColLabel !== false">{{ row }}</template>
        </th>

        <GameCell
          v-for="col in cols"
          :key="`${row}-${col}`"
          :row="row"
          :col="col"
          :cell-state="getCellState(row, col)"
          :cell-config="getCellConfig(row, col)"
          :board-name="boardName"
          :is-highlighted="_isCellHighlighted(row, col)"
          @click="(row, col, boardName) => $emit('cell-click', row, col, boardName)"
          @right-click="(row, col, boardName) => $emit('cell-right-click', row, col, boardName)"
          @mouse-enter="handleCellMouseEnter"
          @mouse-leave="handleCellMouseLeave"
        />
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GameCell from './GameCell.vue'
import type { CellState, CellConfig } from '@/types/game'
import { cellCoordToKey, displayCoordToIndex, indexToDisplayCoord } from '@/utils/columnUtils'

interface Props {
  GameTable: Record<string, CellState>
  rows: number[]
  cols: string[]
  boardName?: string
  cellConfigs?: CellConfig[]
  showRowColLabel?: boolean
}

interface Emits {
  (_e: 'cell-click', _row: number, _col: string, _boardName?: string): void
  (_e: 'cell-right-click', _row: number, _col: string, _boardName?: string): void
}

const props = defineProps<Props>()
const showRowColLabel = props.showRowColLabel
defineEmits<Emits>()

// 动态样式元素引用
const dynamicStyleRef = ref<HTMLStyleElement>()

// 获取单元格状态
const getCellState = (row: number, col: string): CellState | null => {
  const key = cellCoordToKey(row, col)
  return props.GameTable[key] || null
}

// 获取单元格配置
const getCellConfig = (row: number, col: string): CellConfig | null => {
  if (!props.cellConfigs || !props.boardName) return null

  const { x, y } = displayCoordToIndex(row, col)

  return (
    props.cellConfigs.find(
      config =>
        config.position.boardname === props.boardName &&
        config.position.x === x &&
        config.position.y === y
    ) || null
  )
}

// 检查单元格是否高亮（现在通过CSS动态控制高亮）
const _isCellHighlighted = (_row: number, _col: string): boolean => {
  return false // 现在通过CSS动态控制高亮
}

// 处理单元格鼠标进入事件
const handleCellMouseEnter = (
  _row: number,
  _col: string,
  _boardName?: string,
  cellConfig?: CellConfig | null
) => {
  if (cellConfig && cellConfig.highlight) {
    updateHighlightCSS(cellConfig.highlight, true)
  }
}

// 处理单元格鼠标离开事件
const handleCellMouseLeave = (
  _row: number,
  _col: string,
  _boardName?: string,
  cellConfig?: CellConfig | null
) => {
  if (cellConfig && cellConfig.highlight) {
    updateHighlightCSS(cellConfig.highlight, false)
  }
}

// 更新高亮CSS
const updateHighlightCSS = (
  highlight: Record<string, [number, number][]>,
  isHighlighted: boolean
) => {
  if (!dynamicStyleRef.value) return

  let cssRules = ''

  for (const [boardName, positions] of Object.entries(highlight)) {
    for (const [x, y] of positions) {
      // 转换0-based索引为1-based索引来匹配组件的行列
      const { row: displayRow, col: displayCol } = indexToDisplayCoord(x, y)

      const selector = `[data-board="${boardName}"][data-row="${displayRow}"][data-col="${displayCol}"]`

      if (isHighlighted) {
        cssRules += `
          ${selector} {
            background: var(--pointer-color, rgba(255, 255, 0, 0.3));
          }
        `
      }
    }
  }

  dynamicStyleRef.value.textContent = cssRules
}

// 组件挂载时创建动态样式元素
onMounted(() => {
  dynamicStyleRef.value = document.createElement('style')
  dynamicStyleRef.value.type = 'text/css'
  document.head.appendChild(dynamicStyleRef.value)
})

// 组件卸载时清理动态样式元素
onUnmounted(() => {
  if (dynamicStyleRef.value && dynamicStyleRef.value.parentNode) {
    dynamicStyleRef.value.parentNode.removeChild(dynamicStyleRef.value)
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.game-table {
  border-collapse: collapse;
  background: transparent;
  margin: 0 0;
  table-layout: fixed;
  min-width: auto;
  min-height: auto;
  width: auto;
  height: auto;

  font-family: var(--table-font-family);

  th,
  td {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
  }

  // 表头单元格无边框
  thead th,
  tbody th {
    border: none;
  }
}

// 表格标题单元格（左上角空白）
.corner-cell {
  @include variables.square-size(0.5);
  background: transparent;
  border: none;
  text-align: center;
  font-weight: bold;
  font-size: variables.vw-vh-min(2, 2.67);
  color: var(--foreground-color);
  vertical-align: middle;
  box-sizing: border-box;
}

// 列标题
.col-header {
  @include variables.rect-size(1, 0.5);
  background: transparent;
  border: none;
  color: var(--foreground-color);
  font-size: variables.vw-vh-min(2.5, 3.33);
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  box-sizing: border-box;
}

// 行标题
.row-header {
  @include variables.rect-size(0.5, 1);
  background: transparent;
  border: none;
  color: var(--foreground-color);
  font-size: variables.vw-vh-min(2.5, 3.33);
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  box-sizing: border-box;
}
</style>
