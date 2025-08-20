<template>
  <table class="game-table">
    <thead>
      <tr>
        <th class="corner-cell">
          <template v-if="showBoardNameLabel">{{ boardName }}</template>
        </th>
        <th v-for="col in cols" :key="col" class="col-header">
          <template v-if="showRowColLabel">{{ col }}</template>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="row in rows" :key="row">
        <th class="row-header">
          <template v-if="showRowColLabel">{{ row }}</template>
        </th>

        <GameCell
          v-for="col in cols"
          :key="`${row}-${col}`"
          :row="row"
          :col="col"
          :cell-state="getCellState(row, col)"
          :cell-config="getCellConfig(row, col)"
          :board-name="boardName"
          :dye="getCellDye(row, col)"
          :mask="getCellMask(row, col)"
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
// Vue 的组合式 API 在此文件中通过编译指令使用，无需显式导入
import GameCell from '@/components/GameCell.vue'
import type { CellState, CellConfig } from '@/types/game'
import { Cell } from '@/types/cell'

interface Props {
  cellStates: Record<string, CellState>
  rows: number[]
  cols: string[]
  boardName: string
  cellConfigs?: Record<string, CellConfig>
  dye?: boolean[][]
  mask?: boolean[][]
  showRowColLabel?: boolean
  showBoardNameLabel?: boolean
}

interface Emits {
  (_e: 'cell-click', _row: number, _col: string, _boardName?: string): void
  (_e: 'cell-right-click', _row: number, _col: string, _boardName?: string): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// 不再使用动态样式元素，直接通过类名切换高亮

// 获取单元格状态
const getCellState = (row: number, col: string): CellState => {
  const key = Cell.CellCoordToKey(row, col)
  return props.cellStates[key]
}

// 获取单元格配置
const getCellConfig = (row: number, col: string): CellConfig | undefined => {
  if (!props.cellConfigs || !props.boardName) return undefined

  const { x, y } = Cell.displayCoordToIndex(row, col)
  const key = new Cell(props.boardName, x, y).boardKey

  return props.cellConfigs[key] || null
}

// 获取单元格染色
const getCellDye = (row: number, col: string): boolean | false => {
  if (!props.dye || !props.boardName) return false

  const { x, y } = Cell.displayCoordToIndex(row, col)
  return props.dye[x][y]
}

const getCellMask = (row: number, col: string): boolean | false => {
  if (!props.mask || !props.boardName) return false

  const { x, y } = Cell.displayCoordToIndex(row, col)
  return props.mask[x][y]
}

// 处理单元格鼠标进入事件
const handleCellMouseEnter = (
  _row: number,
  _col: string,
  _boardName?: string,
  cellConfig?: CellConfig | null
) => {
  if (cellConfig && cellConfig.highlight) {
    updateHighlight(cellConfig.highlight, true)
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
    updateHighlight(cellConfig.highlight, false)
  }
}

const updateHighlight = (
  highlight: Record<string, [number, number][]>,
  isHighlighted: boolean
) => {
  for (const [boardName, positions] of Object.entries(highlight)) {
    for (const [x, y] of positions) {
      // 转换0-based索引为1-based索引来匹配组件的行列
      const { row: displayRow, col: displayCol } = Cell.indexToDisplayCoord(x, y)

      const selector = `[data-board="${boardName}"][data-row="${displayRow}"][data-col="${displayCol}"]`

      const nodes = document.querySelectorAll<HTMLElement>(selector)
      nodes.forEach((el) => {
        if (isHighlighted) el.classList.add('highlighted')
        else el.classList.remove('highlighted')
      })
    }
  }
}

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

// 通用表头单元格样式
.header-cell {
  background: transparent;
  border: none;
  color: var(--foreground-color);
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  box-sizing: border-box;
  font-size: variables.vw-vh-min(2, 2.67);
}

// 左上角空白
.corner-cell {
  @extend .header-cell;
  @include variables.square-size(0.5);
}

// 列标题
.col-header {
  @extend .header-cell;
  @include variables.rect-size(1, 0.5);
}

// 行标题
.row-header {
  @extend .header-cell;
  @include variables.rect-size(0.5, 1);
}
</style>

/* 全局高亮类：使用 deep 选择器确保 scoped 样式能覆盖 GameCell 元素 */
<style scoped lang="scss">
:deep(.highlighted) {
  background: var(--pointer-color) !important;
}
</style>
