<template>
  <div class="drawing-toolbar-overlay">
    <!-- 左侧面板 -->
    <ColorPalette
      :visible="showColorPalette"
      :current-color="drawing.state.currentColor"
      @color-change="handleColorChange"
      @close="showColorPalette = false"
    />

    <BrushSizePanel
      :visible="showBrushSizePanel"
      :current-size="drawing.state.currentSize"
      :current-tool="drawing.state.currentTool"
      :brush-size="drawing.state.brushSize"
      :eraser-size="drawing.state.eraserSize"
      @size-change="handleSizeChange"
      @tool-change="handleToolChange"
      @close="showBrushSizePanel = false"
    />

    <!-- 右侧工具栏 -->
    <div class="drawing-toolbar">
      <!-- 颜色选择器 -->
      <BaseButton
        variant="square"
        :active="showColorPalette"
        tooltip="颜色"
        @click="toggleColorPalette"
      >
        <template #icon>
          <div
            class="color-preview"
            :style="{ backgroundColor: drawing.state.currentColor }"
          />
        </template>
      </BaseButton>

      <!-- 工具切换：只有三种基本工具 -->
      <BaseButton
        variant="square"
        :active="['brush'].includes(drawing.state.currentTool)"
        tooltip="画笔"
        @click="setBasicTool('brush')"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3z" />
            <path d="M20.71 4.63l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z" />
          </svg>
        </template>
      </BaseButton>

      <!-- 橡皮 -->
      <BaseButton
        variant="square"
        :active="['eraser', 'continuous-eraser'].includes(drawing.state.currentTool)"
        tooltip="橡皮"
        @click="setBasicTool('eraser')"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0" />
          </svg>
        </template>
      </BaseButton>

      <!-- 标记 -->
      <BaseButton
        variant="square"
        :active="drawing.state.currentTool === 'circle-marker'"
        tooltip="标记"
        @click="setBasicTool('circle-marker')"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </template>
      </BaseButton>

      <!-- 粗细调整 -->
      <BaseButton
        variant="square"
        :active="showBrushSizePanel"
        tooltip="粗细"
        @click="toggleBrushSizePanel"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <circle cx="6" cy="12" r="2" />
            <circle cx="12" cy="12" r="3" />
            <circle cx="18" cy="12" r="4" />
          </svg>
        </template>
      </BaseButton>

      <!-- 清空 -->
      <BaseButton
        variant="square"
        tooltip="清空"
        @click="drawing.clear"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </template>
      </BaseButton>

      <!-- 撤销 -->
      <BaseButton
        variant="square"
        tooltip="撤销"
        @click="drawing.undo"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
          </svg>
        </template>
      </BaseButton>

      <!-- 重做 -->
      <BaseButton
        variant="square"
        tooltip="重做"
        @click="drawing.redo"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
          </svg>
        </template>
      </BaseButton>

      <!-- 帮助按钮 -->
      <BaseButton
        variant="square"
        :active="showHelp"
        tooltip="快捷键帮助"
        @click="showHelp = !showHelp"
      >
        <template #icon>
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
          </svg>
        </template>
      </BaseButton>
    </div>

    <!-- 快捷键帮助面板 -->
    <div v-if="showHelp" class="help-panel">
      <h3>快捷键帮助</h3>
      <div class="help-content">
        <div class="help-section">
          <h4>工具切换</h4>
          <ul>
            <li><kbd>B</kbd> - 画笔</li>
            <li><kbd>E</kbd> - 橡皮</li>
            <li><kbd>R</kbd> - 魔术橡皮</li>
            <li><kbd>O</kbd> - O标记</li>
          </ul>
        </div>
        <div class="help-section">
          <h4>面板操作</h4>
          <ul>
            <li><kbd>Ctrl+C</kbd> - 调色板</li>
            <li><kbd>Ctrl+S</kbd> - 粗细调整</li>
            <li><kbd>C</kbd> - 清空画板</li>
          </ul>
        </div>
        <div class="help-section">
          <h4>历史操作</h4>
          <ul>
            <li><kbd>Ctrl+Z</kbd> - 撤销</li>
            <li><kbd>Ctrl+Shift+Z</kbd> - 重做</li>
            <li><kbd>Ctrl+Y</kbd> - 重做</li>
          </ul>
        </div>
      </div>
      <BaseButton variant="square" @click="showHelp = false">关闭</BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { DrawingTool } from '@/types/drawing'
import { useDrawing } from '@/composables/useDrawing'
import BaseButton from '@/components/BaseButton.vue'
import ColorPalette from '@/components/ColorPalette.vue'
import BrushSizePanel from '@/components/BrushSizePanel.vue'

// 直接使用绘画状态管理
const drawing = useDrawing()

// 状态管理
const showColorPalette = ref(false)
const showBrushSizePanel = ref(false)
const showHelp = ref(false)

// 绘画事件处理函数
const handleToolChange = (tool: DrawingTool) => {
  drawing.setTool(tool)
}

const handleColorChange = (color: string) => {
  drawing.setColor(color)
}

const handleSizeChange = (size: number) => {
  drawing.setSize(size)
}

// 键盘快捷键处理
const handleKeyDown = (event: globalThis.KeyboardEvent) => {
  // 防止在输入框中触发快捷键
  if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return

  switch (event.key.toLowerCase()) {
    case 'b':
      handleToolChange('brush')
      break
    case 'e':
      handleToolChange('eraser')
      break
    case 'r':
      handleToolChange('continuous-eraser')
      break
    case 'o':
      handleToolChange('circle-marker')
      break
    case 'c':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        toggleColorPalette()
      } else {
        drawing.clear()
      }
      break
    case 's':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        toggleBrushSizePanel()
      }
      break
    case 'z':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (event.shiftKey) {
          drawing.redo()
        } else {
          drawing.undo()
        }
      }
      break
    case 'y':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        drawing.redo()
      }
      break
  }
}

// 工具栏操作
const setBasicTool = (toolType: 'brush' | 'eraser' | 'circle-marker') => {
  // 根据基本工具类型设置具体工具
  if (toolType === 'brush') {
    handleToolChange('brush')
  } else if (toolType === 'eraser') {
    // 如果当前是橡皮类工具，保持，否则设为普通橡皮
    if (!['eraser', 'continuous-eraser'].includes(drawing.state.currentTool)) {
      handleToolChange('eraser')
    }
  } else if (toolType === 'circle-marker') {
    handleToolChange('circle-marker')
  }

  // 切换工具时关闭面板
  showColorPalette.value = false
  showBrushSizePanel.value = false
}

const toggleColorPalette = () => {
  showColorPalette.value = !showColorPalette.value
  showBrushSizePanel.value = false
}

const toggleBrushSizePanel = () => {
  showBrushSizePanel.value = !showBrushSizePanel.value
  showColorPalette.value = false
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.drawing-toolbar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* 让鼠标事件穿透空白区域 */
}

.drawing-toolbar {
  position: fixed;
  top: 50%;
  right: variables.scaled(20);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: variables.scaled(8);
  pointer-events: auto;
}

.color-preview {
  @include variables.svg-icon(variables.scaled(24));
}

.help-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--background-color);
  border: variables.scaled(2) solid var(--hint-color);
  border-radius: 0;
  padding: variables.scaled(24);
  max-width: variables.scaled(400);
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 variables.scaled(4) variables.scaled(12) rgba(0, 0, 0, 0.3);
  pointer-events: auto;

  h3 {
    margin: 0 0 variables.scaled(16);
    color: var(--hint-color);
    text-align: center;
    font-size: variables.scaled(20);
    font-weight: bold;
  }

  .help-content {
    display: grid;
    gap: variables.scaled(16);
  }

  .help-section {
    h4 {
      margin: 0 0 variables.scaled(8);
      color: var(--foreground-color);
      font-size: variables.scaled(16);
      font-weight: bold;
      border-bottom: variables.scaled(1) solid var(--foreground-color);
      padding-bottom: variables.scaled(4);
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: variables.scaled(4) 0;
        border-bottom: variables.scaled(1) solid rgba(255, 255, 255, 0.1);
        color: var(--foreground-color);

        &:last-child {
          border-bottom: none;
        }

        kbd {
          background: var(--hint-color);
          color: var(--background-color);
          padding: variables.scaled(2) variables.scaled(6);
          border-radius: 0;
          font-family: monospace;
          font-size: variables.scaled(12);
          font-weight: bold;
        }
      }
    }
  }
}
</style>
