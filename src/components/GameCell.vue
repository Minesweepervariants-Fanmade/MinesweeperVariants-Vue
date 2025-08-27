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
      <div v-if="dye" class="dye-overlay" />
      <template v-if="cellState?.type === 'revealed'">
        <div ref="container" class="container" />
      </template>

      <div v-if="cellState?.hint1" class="overlay hint1-overlay">!</div>
      <div v-if="cellState?.hint2" class="overlay hint2-overlay" />
      <div v-if="cellState?.error" class="overlay error-overlay">!</div>
      <div v-if="cellState?.errormine" class="overlay error-overlay mine-icon">
        <FlagIcon />
      </div>
      <LoadingSpinner :visible="cellState?.isLoading" />
    </div>
  </td>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { renderComponent } from '@/composables/componentRenderer'
import FlagIcon from '@/assets/icons/flag.svg?component'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { CellState, CellConfig } from '@/types/game'

interface Props {
  row: number
  col: string
  cellState: CellState
  cellConfig?: CellConfig
  boardName: string
  dye?: boolean
  mask?: boolean
}

interface Emits {
  (_e: 'click', _row: number, _col: string, _boardName: string): void
  (_e: 'right-click', _row: number, _col: string, _boardName: string): void
  (
    _e: 'mouse-enter',
    _row: number,
    _col: string,
    _boardName: string,
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

const props = withDefaults(defineProps<Props>(), {
  dye: false,
  mask: false
})
const emit = defineEmits<Emits>()

const container = ref<HTMLElement>()

const cellId = computed(() => `${props.boardName}-${props.row}-${props.col}`)

// 计算单元格样式类
const cellClasses = computed(() => {
  const classes: string[] = []

  if (props.cellState?.type === 'revealed') {
    classes.push('revealed')
  }

  if (props.mask) {
    classes.push('hole')
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
      if (props.cellConfig.overlayText) {
        const overlayDiv = document.createElement('div')
        overlayDiv.className = 'cell-overlay'
        overlayDiv.textContent = props.cellConfig.overlayText
        container.value!.appendChild(overlayDiv)
      }
    }
  }
}

// 监听单元格状态变化，重新渲染内容
watch(
  () => [
    props.cellState?.type,
    props.cellState?.isLoading,
    props.cellConfig
  ],
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
  border-style: solid;
  border-width: calc(variables.scaled(2));
  border-color: var(--foreground-color);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;

  &.highlighted, &:hover {
    background: var(--pointer-color);
  }

  &.hole {
    border-width: 0;
    cursor: inherit;
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

:deep(.container) {
  font-size: variables.scaled(30);
  font-weight: bold;
  color: var(--foreground-color);
}

:deep(.asset-placeholder) {
  font-size: variables.scaled(20);
  color: var(--secondary);
  font-style: italic;
}

:deep(.cell-overlay) {
  @include variables.absolute-position(null, variables.scaled(2), variables.scaled(1), null);
  font-size: variables.scaled(15);
  font-weight: bold;
  pointer-events: none;
  opacity: 0.5;
  line-height: 1;
}

// 叠加层基础样式
.overlay {
  @include variables.absolute-position(0, null, null, 0);
  @include variables.paint(var(--overlay-color), rgb(from var(--overlay-color) r g b / 40%));
  @include variables.flex-center;
  width: 100%;
  height: 100%;
  pointer-events: none;
  font-size: variables.scaled(40);
}

.dye-overlay {
  @include variables.absolute-position(0, null, null, 0);
  background-color: rgb(from var(--foreground-color) r g b / 29%);
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hint1-overlay {
  --overlay-color: var(--hint-color);
}

.hint2-overlay {
  --overlay-color: var(--hint2-color);
}

.error-overlay {
  --overlay-color: var(--error-color);
}

.mine-icon {
  :deep(.inner) {
    fill: currentColor;
  }

  :deep(.outer) {
    fill: none;
  }
}
</style>
