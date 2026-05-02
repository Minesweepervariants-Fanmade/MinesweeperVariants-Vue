<template>
  <div class="app-container" @click="handleContainerClick">
    <div class="background-image" :style="backgroundImageStyle" />
    <div v-if="isLoading" class="loading">
      正在加载游戏配置...
      <BaseButton @click="showSettingsDialog = true">设置</BaseButton>
    </div>

    <div v-else-if="error" class="error">
      加载失败: {{ error }}
      <BaseButton @click="initializeGame">重试</BaseButton>
      <BaseButton @click="showSettingsDialog = true">设置</BaseButton>
    </div>

    <div v-else-if="isInitialized" class="game-container">
      <!-- 动态渲染所有游戏板 -->
      <GameTable
        v-for="boardConfig in getAllBoardConfigs().filter(config => config !== null)"
        :key="boardConfig!.name"
        :cellStates="boardConfig!.cellStates"
        :rows="boardConfig!.labels.rows"
        :cols="boardConfig!.labels.cols"
        :board-name="boardConfig!.name"
        :cell-configs="allCells"
        :dye="boardConfig!.board.dye"
        :mask="boardConfig!.board.mask"
        :show-row-col-label="settings.showRowColLabel && boardConfig!.board.showLabel"
        :show-board-name-label="boardConfig!.board.showName"
        :puzzle-mode="settings.gameMode === 'puzzle'"
        @cell-click="(row, col, boardName) => handleCellClick(boardName!, row, col, 'left')"
        @cell-right-click="(row, col, boardName) => handleCellClick(boardName!, row, col, 'right')"
        @cell-middle-click="handleCellMiddleClick"
        @mouse-enter="handleCellMouseEnter"
        @mouse-leave="handleCellMouseLeave"
      />
    </div>

    <!-- 绘画覆盖层 -->
    <DrawingCanvas
      :style="{ opacity: settings.drawTransparent ? (showDrawingToolbar ? '100%' : '50%') : '100%' }"
      :pointer-events-enabled="showDrawingToolbar"
    />

    <!-- 游戏覆盖层组件 -->
    <Overlay
      v-if="isInitialized"
      :levelCount="levelCount"
      :mine-count="totalMines"
      :known-mines="knownMines"
      :remaining-mines="remainingMines"
      :remaining-cells="remainingCells"
      :show-drawing-toolbar="showDrawingToolbar"
      @brush-click="handleBrushClick"
      @check-click="handleCheckClick"
      @reset-click="handleResetClick"
      @menu-click="handleMenuClick"
    />

    <!-- 绘画工具栏 -->
    <DrawingToolbar
      v-show="showDrawingToolbar"
      :visible="showDrawingToolbar"
    />

    <!-- 游戏结束信息提示 -->
    <InfoOverlay
      v-model:visible="showGameOverDialog"
      :title="gameOverTitle"
      :message="gameOverMessage"
    >
      <template #actions>
        <BaseButton variant="simple" @click="handleGameOverExample">我不信</BaseButton>
        <BaseButton variant="simple" @click="handleGameOverHint">提示</BaseButton>
        <BaseButton variant="simple" @click="handleGameOverReset">重置</BaseButton>
        <BaseButton variant="simple" @click="handleGameOverUndo">撤销</BaseButton>
      </template>
    </InfoOverlay>

    <!-- 游戏胜利信息提示 -->
    <InfoOverlay
      v-model:visible="showGameWinDialog"
      :title="gameWinTitle"
      :message="gameWinMessage"
    >
      <template #actions>
        <BaseButton variant="simple" @click="handleGameWinConfirm">下一关</BaseButton>
        <BaseButton variant="simple" @click="handleGameWinReset">重置</BaseButton>
        <BaseButton variant="simple" @click="handleGameWinBack">返回</BaseButton>
      </template>
    </InfoOverlay>

    <!-- 设置对话框 -->
    <SettingsOverlay
      ref="settingsOverlayRef"
      v-model:visible="showSettingsDialog"
      :settings="settings"
      @close="handleSettingsClose"
    />

    <!-- 纸笔模式单元格编辑器 -->
    <CellEditorOverlay
      v-model:visible="showCellEditorDialog"
      :title="cellEditorTitle"
      :cell-label="cellEditorLabel"
      :cell-config="editingCellConfig"
      :cell-state="editingCellState"
      @save="handleCellEditorSave"
      @close="handleCellEditorClose"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { hideHints } from '@/utils/hintUtils'

import {
  setShortcuts,
  handleGlobalKeyUp,
  handleGlobalMouse,
  handleGlobalWheel,
  registerKeyboardShortcut,
  unregisterKeyboardShortcut,
  registerMouseShortcut
} from '@/composables/shortcutManager'
import { useTheme } from '@/composables/useTheme'
import { useGameConfig } from '@/composables/useGameConfig'
import { waitForAssets } from '@/composables/useAssets'
import { useSettings } from '@/composables/useSettings'
import BaseButton from '@/components/BaseButton.vue'
import GameTable from '@/components/GameTable.vue'
import Overlay from '@/components/Overlay.vue'
import InfoOverlay from '@/components/InfoOverlay.vue'
import SettingsOverlay from '@/components/SettingsOverlay.vue'
import CellEditorOverlay from '@/components/CellEditorOverlay.vue'
import DrawingCanvas from '@/components/DrawingCanvas.vue'
import DrawingToolbar from '@/components/DrawingToolbar.vue'
import { getGameParams, newGame } from '@/utils/gameUtils'
import { startAutoFit } from './utils/fitter'
import { Cell } from '@/types/cell'
import type { CellConfig, CellState } from '@/types/game'

// 组件引用
const settingsOverlayRef = ref<InstanceType<typeof SettingsOverlay>>()

// 游戏胜利弹窗相关状态
const gameWinTitle = computed(() => '恭喜通关！')
const gameWinMessage = computed(() => '你已成功完成本局游戏！')

const handleGameWinConfirm = async () => {
  await newGame(getGameParams())
  showGameWinDialog.value = false
}

const handleGameWinReset = () => {
  showGameWinDialog.value = false
  resetGame()
}

const handleGameWinBack = () => {
  showGameWinDialog.value = false
}

// 使用游戏逻辑
const {
  isInitialized,
  isLoading,
  error,
  allCells,
  metadata,
  isGameOver,
  gameOverReason,
  showGameOverDialog,
  showGameWinDialog,
  gameBoards,
  initializeGame,
  handleCellClick,
  resetGame,
  handleGameOverExample,
  handleGameOverHint,
  handleGameOverReset,
  handleGameOverUndo,
  getAllBoardConfigs,
  getCellConfig,
  setCellConfig,
  createBlankCellConfig,
} = useGameConfig()

// 使用设置
const { setTheme, toggleTheme } = useTheme()

const gameOverTitle = computed(() => {
  if (!isGameOver.value) return ''
  return '游戏结束'
})

const gameOverMessage = computed(() => {
  return gameOverReason.value || '游戏已结束'
})

// 使用持久化设置
const { settings } = useSettings()

const backgroundImageStyle = computed(() => {
  const img = settings.value.backgroundImage
  const css = settings.value.backgroundImageCss || ''
  const style: Record<string, string> = img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}
  if (css && img) {
    css.split(';').forEach(pair => {
      const [key, value] = pair.split(':').map(s => s && s.trim())
      if (key && value) style[key] = value
    })
  }
  return style
})

// 设置相关状态
const showSettingsDialog = ref(false)
const showDrawingToolbar = ref(false)
const showCellEditorDialog = ref(false)
const activeCellTarget = ref<{ boardName: string; row: number; col: string } | null>(null)
const editingCellTarget = ref<{ boardName: string; row: number; col: string } | null>(null)
const editingCellConfig = ref<CellConfig | null>(null)
const editingCellState = ref<CellState | null>(null)

const cellEditorTitle = computed(() => '编辑纸笔单元格')
const cellEditorLabel = computed(() => {
  const target = editingCellTarget.value || activeCellTarget.value
  if (!target) return ''
  return `${target.boardName} / ${target.row} / ${target.col}`
})

// 游戏状态数据
const levelCount = computed(() => {
  return '100/10'
})

const totalMines = computed(() => {
  return metadata.value?.count?.total ?? 0
})

const knownMines = computed(() => {
  return metadata.value?.count?.known ?? undefined
})

const remainingMines = computed(() => {
  return metadata.value?.count?.remains ?? undefined
})

const remainingCells = computed(() => {
  return metadata.value?.count?.unknown ?? 0
})

// 控制按钮事件处理
const handleBrushClick = () => {
  // 切换绘画覆盖层显示
  showDrawingToolbar.value = !showDrawingToolbar.value
}

const handleCheckClick = async (setLoading: (_loading: boolean, _progress?: number) => void) => {
  setLoading(true)
  try {
    await newGame(getGameParams(), (progress) => {
      setLoading(true, progress)
    })
  } finally {
    setLoading(false, undefined)
  }
}

const handleResetClick = () => {
  // 重置游戏
  resetGame()
}

const handleMenuClick = () => {
  // 显示设置菜单
  showSettingsDialog.value = true
}

const handleSettingsClose = () => {
  showSettingsDialog.value = false
}

const syncActiveCell = (row: number, col: string, boardName: string, cellConfig?: CellConfig | null) => {
  activeCellTarget.value = { row, col, boardName }
  if (cellConfig) {
    editingCellConfig.value = JSON.parse(JSON.stringify(cellConfig)) as CellConfig
  } else {
    const { x, y } = Cell.displayCoordToIndex(row, col)
    editingCellConfig.value = createBlankCellConfig(boardName, x, y)
  }

  // 获取对应的 CellState
  const board = gameBoards.value[boardName]
  if (board) {
    const key = `${Cell.displayCoordToIndex(row, col).x}-${Cell.displayCoordToIndex(row, col).y}`
    editingCellState.value = board[key] || null
  } else {
    editingCellState.value = null
  }
}

const handleCellMouseEnter = (
  row: number,
  col: string,
  boardName?: string,
  cellConfig?: CellConfig | null
) => {
  if (!boardName) return
  syncActiveCell(row, col, boardName, cellConfig)
}

const handleCellMouseLeave = (
  row: number,
  col: string,
  boardName?: string,
  _cellConfig?: CellConfig | null
) => {
  const target = activeCellTarget.value
  if (!target || target.row !== row || target.col !== col || target.boardName !== boardName) {
    return
  }
  activeCellTarget.value = null
}

const handleCellMiddleClick = (
  row: number,
  col: string,
  boardName?: string,
  cellConfig?: CellConfig | null
) => {
  if (!boardName || settings.value.gameMode !== 'puzzle') return

  const { x, y } = Cell.displayCoordToIndex(row, col)
  const nextConfig = cellConfig
    ? JSON.parse(JSON.stringify(cellConfig)) as CellConfig
    : createBlankCellConfig(boardName, x, y)

  nextConfig.overlayText = ''
  nextConfig.component = {
    type: 'text',
    value: '',
    style: '',
    class: ''
  }

  setCellConfig(nextConfig)
}

const handleCellEditorSave = (cellConfig: CellConfig, cellState: CellState) => {
  const { boardname, x, y } = cellConfig.position

  setCellConfig(cellConfig)

  // 在纸笔模式下更新 CellState
  if (settings.value.gameMode === 'puzzle') {
    const board = gameBoards.value[boardname]
    if (board) {
      const key = `${x}-${y}`
      board[key] = JSON.parse(JSON.stringify(cellState)) as CellState
    }
  }

  showCellEditorDialog.value = false
  editingCellTarget.value = null
}

const handleCellEditorClose = () => {
  showCellEditorDialog.value = false
  editingCellTarget.value = null
}

// 处理容器点击事件
const handleContainerClick = (event: MouseEvent) => {
  // 只有当点击的是容器本身时才隐藏提示（不是子元素）
  if (event.target === event.currentTarget) {
    hideHints()
  }
}




let cleanupContextMenu: (() => void) | null = null
// 主题切换快捷键回调
const onThemeToggle = (_event: KeyboardEvent): boolean => {
  toggleTheme()
  return true
}

const onThemeToggleMouse = (event: MouseEvent | WheelEvent): boolean => {
  if (event instanceof MouseEvent && event.type === 'mouseup') {
    toggleTheme()
    return true
  }
  return false
}

// 切换绘图覆盖层快捷键回调
const ontoggleDrawingToolbar = (_event: KeyboardEvent): boolean => {
  showDrawingToolbar.value = !showDrawingToolbar.value
  return true
}

const ontogglemouseDrawingToolbar = (event: MouseEvent | WheelEvent): boolean => {
  if (event instanceof MouseEvent && event.type === 'mouseup') {
    showDrawingToolbar.value = !showDrawingToolbar.value
    return true
  }
  return false
}

const onEditCell = (_event: KeyboardEvent): boolean => {
  if (settings.value.gameMode !== 'puzzle') {
    return false
  }

  const target = activeCellTarget.value
  if (!target) {
    return true
  }

  const { x, y } = Cell.displayCoordToIndex(target.row, target.col)
  const currentCellConfig = getCellConfig(target.boardName, x, y)
  editingCellTarget.value = { ...target }
  editingCellConfig.value = currentCellConfig
    ? JSON.parse(JSON.stringify(currentCellConfig)) as CellConfig
    : createBlankCellConfig(target.boardName, x, y)
  showCellEditorDialog.value = true
  return true
}

onMounted(async () => {
  // 预加载素材
  await waitForAssets()

  // 从设置中初始化主题
  setTheme(settings.value.theme)

  // 初始化游戏
  await initializeGame()

  // 监听空格键按下，调用handleCellClick
  document.addEventListener('keydown', onSpaceKeyDown)

  // 注册主题切换快捷键
  registerKeyboardShortcut('themeToggle', onThemeToggle)
  registerMouseShortcut('themeToggle', onThemeToggleMouse)
  // 注册绘图覆盖层切换快捷键
  registerKeyboardShortcut('toggleDrawingToolbar', ontoggleDrawingToolbar)
  registerMouseShortcut('toggleDrawingToolbar', ontogglemouseDrawingToolbar)
  registerKeyboardShortcut('editCell', onEditCell, 10)

  // 禁用右键菜单
  const contextMenuHandler = (e: MouseEvent) => e.preventDefault()
  document.addEventListener('contextmenu', contextMenuHandler)
  cleanupContextMenu = () => document.removeEventListener('contextmenu', contextMenuHandler)

  // 设置全局快捷键监听
  setShortcuts(settings.value.keyboardShortcuts, settings.value.mouseShortcuts)
  document.addEventListener('keyup', handleGlobalKeyUp)
  document.addEventListener('mousedown', handleGlobalMouse)
  document.addEventListener('mouseup', handleGlobalMouse)
  document.addEventListener('wheel', handleGlobalWheel, { passive: false })

  // 启动自动适应
  startAutoFit()
})

onUnmounted(() => {
  // 清理事件监听器
  unregisterKeyboardShortcut('themeToggle', onThemeToggle)
  unregisterKeyboardShortcut('toggleDrawingToolbar', ontoggleDrawingToolbar)
  unregisterKeyboardShortcut('editCell', onEditCell)
  if (cleanupContextMenu) cleanupContextMenu()
  document.removeEventListener('keyup', handleGlobalKeyUp)
  document.removeEventListener('mousedown', handleGlobalMouse)
  document.removeEventListener('mouseup', handleGlobalMouse)
  document.removeEventListener('wheel', handleGlobalWheel)
  document.removeEventListener('keydown', onSpaceKeyDown)
})
// 监听空格键按下，调用handleCellClick
function onSpaceKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
    handleCellClick('', -1, '', 'space')
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.app-container {
  /* 合并了原来的 .game-container 和 .game-board 样式 */
  min-width: 100vw;
  min-height: 100vh;
  width: 100vw;
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: var(--background-color);
}

.loading,
.error {
  text-align: center;
  padding: calc(variables.scaled(20));
  color: var(--foreground-color);
  font-size: calc(variables.scaled(16));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(variables.scaled(15));
}

.error button,
.loading button {
  padding: calc(variables.scaled(10)) calc(variables.scaled(20));
  background: var(--foreground-color);
  color: var(--background-color);
  border: none;
  border-radius: calc(variables.scaled(100));
  font-size: calc(variables.scaled(14));
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: calc(variables.scaled(5));
}

.game-container {
  /* 保持原有的游戏板布局样式 */
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: calc(variables.scaled(40));
  padding: calc(variables.scaled(20));
  position: relative;
}

/* 背景图片覆盖层 */
.background-image {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

/* 深色主题时稍微提高对比度 */
:root[data-theme='dark'] .background-image {
  opacity: 0.14;
  filter: blur(2px) saturate(1.05) brightness(0.9);
}

/* 当需要隐藏背景（例如专注模式）时可加上 .hidden */
.background-image.hidden {
  opacity: 0 !important;
  transform: scale(1);
}

</style>
