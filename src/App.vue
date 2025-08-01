<template>
  <div class="app-container">
    <div v-if="isLoading" class="loading">
      正在加载游戏配置...
      <button class="settings-btn" @click="showSettingsDialog = true">设置
      </button>
    </div>

    <div v-else-if="error" class="error">
      加载失败: {{ error }}
      <button @click="initializeGame">重试</button>
      <button class="settings-btn" @click="showSettingsDialog = true">
        设置
      </button>
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
        @cell-click="(row, col, boardName) => handleCellClick(boardName!, row, col, 'left')"
        @cell-right-click="(row, col, boardName) => handleCellClick(boardName!, row, col, 'right')"
      />
    </div>

    <!-- 游戏覆盖层组件 -->
    <Overlay
      v-if="isInitialized"
      :levelCount="levelCount"
      :mine-count="totalMines"
      :remaining-mines="remainingMines"
      :remaining-cells="remainingCells"
      @flag-click="handleFlagClick"
      @circle-click="handleCircleClick"
      @double-arrow-click="handleDoubleArrowClick"
      @arrow-click="handleArrowClick"
      @cross-click="handleCrossClick"
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
      v-model:visible="showSettingsDialog"
      :settings="gameSettings"
      @save="handleSettingsSave"
      @close="handleSettingsClose"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useGameLogic } from '@/composables/useGameLogic'
import { useAssets } from '@/composables/useAssets'
import { useTheme } from '@/composables/useTheme'
import { useSettings } from '@/composables/useSettings'
import GameTable from '@/components/GameTable.vue'
import Overlay from '@/components/Overlay.vue'
import InfoOverlay from '@/components/InfoOverlay.vue'
import SettingsOverlay from '@/components/SettingsOverlay.vue'

// 使用游戏逻辑
const {
  isInitialized,
  isLoading,
  error,
  allCells,
  isGameOver,
  gameOverReason,
  showGameOverDialog,
  initializeGame,
  handleCellClick,
  resetGame,
  handleGameOverConfirm,
  getAllBoardConfigs,
} = useGameLogic()

const { waitForAssets } = useAssets()
const { setupThemeToggle, setTheme } = useTheme()

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

// 游戏状态数据
const levelCount = computed(() => '10/10')
const totalMines = computed(() => undefined)
const remainingMines = computed(() => undefined)
const remainingCells = computed(() => 21)

// 控制按钮事件处理
const handleFlagClick = () => {
  // 实现旗帜功能
}

const handleCircleClick = () => {
  // 实现圆圈功能
}

const handleDoubleArrowClick = () => {
  // 实现双箭头功能
}

const handleArrowClick = () => {
  // 实现箭头功能
}

const handleCrossClick = () => {
  // 实现关闭功能
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

// 键盘快捷键
function setupKeyboardShortcuts() {
  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'r':
        // 重置游戏
        resetGame()
        break
    }
  }

  document.addEventListener('keydown', handleKeydown)
  return () => document.removeEventListener('keydown', handleKeydown)
}

let cleanupThemeToggle: (() => void) | null = null
let cleanupKeyboardShortcuts: (() => void) | null = null

onMounted(async () => {
  // 预加载素材
  await waitForAssets()

  // 从设置中初始化主题
  setTheme(gameSettings.value.theme)

  // 初始化游戏
  await initializeGame()

  // 设置主题切换
  cleanupThemeToggle = setupThemeToggle()

  // 设置键盘快捷键
  cleanupKeyboardShortcuts = setupKeyboardShortcuts()
})

onUnmounted(() => {
  // 清理事件监听器
  if (cleanupThemeToggle) cleanupThemeToggle()
  if (cleanupKeyboardShortcuts) cleanupKeyboardShortcuts()
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
.loading .settings-btn,
.error .settings-btn {
  padding: calc(10 * var(--scale)) calc(20 * var(--scale));
  background: var(--foreground-color);
  color: var(--background-color);
  border: none;
  border-radius: calc(6 * var(--scale));
  cursor: pointer;
  font-size: calc(14 * var(--scale));
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: calc(5 * var(--scale));
}

.error button:hover,
.loading .settings-btn:hover,
.error .settings-btn:hover {
  opacity: 0.8;
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
  z-index: 1;
}
</style>
