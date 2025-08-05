<template>
  <div class="app-container" @click="handleContainerClick">
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
        :GameTable="boardConfig!.gameBoard"
        :rows="boardConfig!.labels.rows"
        :cols="boardConfig!.labels.cols"
        :board-name="boardConfig!.name"
        :cell-configs="allCells"
        :show-row-col-label="gameSettings.showRowColLabel"
        @cell-click="(row, col, boardName) => handleCellClick(boardName!, row, col, 'left')"
        @cell-right-click="(row, col, boardName) => handleCellClick(boardName!, row, col, 'right')"
      />
    </div>

    <!-- 绘画覆盖层 -->
    <DrawingCanvas
      :style="{ opacity: gameSettings.drawTransparent ? (showDrawingToolbar ? '100%' : '50%') : '100%' }"
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
      confirm-text="重新开始"
      @confirm="handleGameOverConfirm"
    />

    <!-- 设置对话框 -->
    <SettingsOverlay
      ref="settingsOverlayRef"
      v-model:visible="showSettingsDialog"
      :settings="gameSettings"
      @save="handleSettingsSave"
      @close="handleSettingsClose"
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
import { useAssets } from '@/composables/useAssets'
import { useSettings } from '@/composables/useSettings'
import BaseButton from '@/components/BaseButton.vue'
import GameTable from '@/components/GameTable.vue'
import Overlay from '@/components/Overlay.vue'
import InfoOverlay from '@/components/InfoOverlay.vue'
import SettingsOverlay from '@/components/SettingsOverlay.vue'
import DrawingCanvas from '@/components/DrawingCanvas.vue'
import DrawingToolbar from '@/components/DrawingToolbar.vue'
import { getGameParams, newGame } from '@/utils/gameUtils'

// 组件引用
const settingsOverlayRef = ref<InstanceType<typeof SettingsOverlay>>()

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
  initializeGame,
  handleCellClick,
  resetGame,
  handleGameOverConfirm,
  getAllBoardConfigs,
} = useGameConfig()

// 使用设置

const { waitForAssets } = useAssets()
const { setTheme, toggleTheme } = useTheme()

const gameOverTitle = computed(() => {
  if (!isGameOver.value) return ''
  return '游戏结束'
})

const gameOverMessage = computed(() => {
  return gameOverReason.value || '游戏已结束'
})

// 使用持久化设置
const { settings: gameSettings, updateSettings } = useSettings()

// 设置相关状态
const showSettingsDialog = ref(false)
const showDrawingToolbar = ref(false)

// 游戏状态数据
const levelCount = computed(() => {
  return '10/10'
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

const handleCheckClick = async (setLoading: (_loading: boolean) => void) => {
  setLoading(true)
  try {
    await newGame(getGameParams())
    resetGame()
  } finally {
    setLoading(false)
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

// 设置处理方法
const handleSettingsSave = (newSettings: typeof gameSettings.value) => {
  const oldServerUrl = gameSettings.value.serverUrl

  // 使用 updateSettings 来更新设置，这会自动触发 localStorage 保存
  updateSettings(newSettings)
  // 不自动关闭设置对话框，让用户可以继续调整

  // 如果服务器地址改变了，重新初始化游戏
  if (oldServerUrl !== newSettings.serverUrl) {
    initializeGame()
  }
}

const handleSettingsClose = () => {
  showSettingsDialog.value = false
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

onMounted(async () => {
  // 预加载素材
  await waitForAssets()

  // 从设置中初始化主题
  setTheme(gameSettings.value.theme)

  // 初始化游戏
  await initializeGame()

  // 注册主题切换快捷键
  registerKeyboardShortcut('themeToggle', onThemeToggle)
  registerMouseShortcut('themeToggle', onThemeToggleMouse)
  // 注册绘图覆盖层切换快捷键
  registerKeyboardShortcut('toggleDrawingToolbar', ontoggleDrawingToolbar)
  registerMouseShortcut('toggleDrawingToolbar', ontogglemouseDrawingToolbar)

  // 禁用右键菜单
  const contextMenuHandler = (e: MouseEvent) => e.preventDefault()
  document.addEventListener('contextmenu', contextMenuHandler)
  cleanupContextMenu = () => document.removeEventListener('contextmenu', contextMenuHandler)

  // 设置全局快捷键监听
  setShortcuts(gameSettings.value.keyboardShortcuts, gameSettings.value.mouseShortcuts)
  document.addEventListener('keyup', handleGlobalKeyUp)
  document.addEventListener('mousedown', handleGlobalMouse)
  document.addEventListener('mouseup', handleGlobalMouse)
  document.addEventListener('wheel', handleGlobalWheel, { passive: false })
})

onUnmounted(() => {
  // 清理事件监听器
  unregisterKeyboardShortcut('themeToggle', onThemeToggle)
  unregisterKeyboardShortcut('toggleDrawingToolbar', ontoggleDrawingToolbar)
  if (cleanupContextMenu) cleanupContextMenu()
  document.removeEventListener('keyup', handleGlobalKeyUp)
  document.removeEventListener('mousedown', handleGlobalMouse)
  document.removeEventListener('mouseup', handleGlobalMouse)
  document.removeEventListener('wheel', handleGlobalWheel)
})
</script>

<style scoped>
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
  padding: calc(20 * var(--scale));
  color: var(--foreground-color);
  font-size: calc(16 * var(--scale));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(15 * var(--scale));
}

.error button,
.loading button {
  padding: calc(10 * var(--scale)) calc(20 * var(--scale));
  background: var(--foreground-color);
  color: var(--background-color);
  border: none;
  border-radius: calc(100 * var(--scale));
  font-size: calc(14 * var(--scale));
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: calc(5 * var(--scale));
}

.game-container {
  /* 保持原有的游戏板布局样式 */
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: calc(40 * var(--scale));
  padding: calc(20 * var(--scale));
  position: relative;
}

</style>
