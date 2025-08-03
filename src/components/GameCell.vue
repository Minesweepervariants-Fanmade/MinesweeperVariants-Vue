<template>
  <td
    class="cell"
    :class="cellClasses"
    :data-row="row"
    :data-col="col"
    :data-board="boardName"
    :data-cell-id="cellId"
    @click="handleClick"
    @contextmenu="handleRightClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="cell-content">
      <LoadingSpinner :visible="cellState?.isLoading" :delay="0" />
      <template v-if="cellState?.type === 'revealed'">
        <div ref="container" class="container" />
      </template>
    </div>
  </td>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useComponentRenderer } from '@/composables/useComponentRenderer'
import LoadingSpinner from './LoadingSpinner.vue'
import type { CellState, CellConfig } from '@/types/game'

interface Props {
  row: number
  col: string
  cellState: CellState | null
  cellConfig?: CellConfig | null
  boardName?: string
  isHighlighted?: boolean
}

interface Emits {
  (_e: 'click', _row: number, _col: string, _boardName?: string): void
  (_e: 'right-click', _row: number, _col: string, _boardName?: string): void
  (
    _e: 'mouse-enter',
    _row: number,
    _col: string,
    _boardName?: string,
    _cellConfig?: CellConfig | null
  ): void
  (
    _e: 'mouse-leave',
    _row: number,
    _col: string,
    _boardName?: string,
    _cellConfig?: CellConfig | null
  ): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { renderComponent } = useComponentRenderer()
const container = ref<HTMLElement>()

const cellId = computed(() => `${props.boardName}-${props.row}-${props.col}`)

// 计算单元格样式类
const cellClasses = computed(() => {
  const classes: string[] = []

  if (props.cellState?.type === 'revealed') {
    classes.push('revealed')
  }

  if (props.isHighlighted) {
    classes.push('highlighted')
  }

  return classes
})

// 单元格事件

const handleClick = () => {
  emit('click', props.row, props.col, props.boardName)
}

const handleRightClick = () => {
  emit('right-click', props.row, props.col, props.boardName)
}

const handleMouseEnter = () => {
  emit('mouse-enter', props.row, props.col, props.boardName, props.cellConfig)
}

const handleMouseLeave = () => {
  emit('mouse-leave', props.row, props.col, props.boardName, props.cellConfig)
}

const renderCell = async () => {
  if (props.cellState?.type === 'revealed' && container.value) {
    if (props.cellConfig && props.cellConfig.component) {
      await renderComponent(container.value, props.cellConfig.component, true)
      if (props.cellConfig.rule) {
        const overlayDiv = document.createElement('div')
        overlayDiv.className = 'cell-overlay'
        overlayDiv.textContent = props.cellConfig.rule
        container.value!.appendChild(overlayDiv)
      }
    }
  }
}

// 监听单元格状态变化，重新渲染内容
watch(
  () => [props.cellState?.type, props.cellState?.isLoading, props.cellConfig, props.isHighlighted],
  async () => {
    try {
      if (props.cellState?.type === 'revealed' && !props.cellState?.isLoading) {
        await nextTick()
        await renderCell()
      }
    } catch (error) {
      console.error('Error in GameCell watcher:', error)
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@use '@/styles/variables';

// 游戏单元格
.cell {
  @include variables.square-size(1);
  border: variables.$border-width solid var(--foreground-color);
  background: transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;

  &:hover {
    background: var(--pointer-color);
  }

  &.highlighted {
    background: var(--pointer-color);
  }
}

// 单元格内容
.cell-content {
  @include variables.absolute-position(0, null, null, 0);
  width: 100%;
  height: 100%;
  @include variables.flex-center;
  overflow: hidden;
  box-sizing: border-box;
  pointer-events: none; // 防止干扰点击事件
}

.container {
  width: 100%;
  height: 100%;
  @include variables.flex-center;
  position: relative;
}

/* 为动态创建的元素定义全局样式 */
:deep(.cell-number) {
  font-size: variables.vw-vh-min(4, 5.33);
  font-weight: bold;
  color: var(--foreground-color);
}

:deep(.component-text) {
  font-size: variables.vw-vh-min(4, 5.33);
  font-weight: bold;
  color: var(--foreground-color);
}

:deep(.asset-placeholder) {
  font-size: variables.vw-vh-min(2, 2.67);
  color: var(--secondary);
  font-style: italic;
}

:deep(.cell-overlay) {
  @include variables.absolute-position(null, variables.scaled(2), variables.scaled(1), null);
  font-size: variables.vw-vh-min(1.5, 2);
  color: color-mix(var(--background-color), var(--foreground-color), 50%);
  font-weight: bold;
  pointer-events: none;
}
</style>
