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
      :brush-size="drawing.state.currentSize"
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

      <!-- 魔术橡皮 -->
      <BaseButton
        variant="square"
        :active="drawing.state.currentTool === 'magic-eraser'"
        tooltip="魔术橡皮"
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
            <circle
              :cx="12"
              :cy="12"
              :r="Math.max(2, 10 * drawing.state.currentSize / 50)"
            />
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
    </div>
  </div></template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { DrawingTool } from '@/types/drawing'
import { useDrawing } from '@/composables/useDrawing'
import BaseButton from '@/components/BaseButton.vue'
import ColorPalette from '@/components/ColorPalette.vue'
import BrushSizePanel from '@/components/BrushSizePanel.vue'

import {
  registerKeyboardShortcut,
  unregisterKeyboardShortcut
} from '@/composables/shortcutManager'

// 直接使用绘画状态管理
const drawing = useDrawing()

// 状态管理
const showColorPalette = ref(false)
const showBrushSizePanel = ref(false)

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

// 快捷键回调函数
const onBrushTool = (_event: KeyboardEvent): boolean => {
  handleToolChange('brush')
  return true
}

const onEraserTool = (_event: KeyboardEvent): boolean => {
  handleToolChange('magic-eraser')
  return true
}

const onMarkerTool = (_event: KeyboardEvent): boolean => {
  handleToolChange('circle-marker')
  return true
}

const onColorPalette = (_event: KeyboardEvent): boolean => {
  toggleColorPalette()
  return true
}

const onBrushPanel = (_event: KeyboardEvent): boolean => {
  toggleBrushSizePanel()
  return true
}

const onClearCanvas = (_event: KeyboardEvent): boolean => {
  drawing.clear()
  return true
}

const onUndo = (_event: KeyboardEvent): boolean => {
  drawing.undo()
  return true
}

const onRedo = (_event: KeyboardEvent): boolean => {
  drawing.redo()
  return true
}

// 注册快捷键回调（全局注册）
const registerShortcuts = () => {
  registerKeyboardShortcut('brushTool', onBrushTool)
  registerKeyboardShortcut('eraserTool', onEraserTool)
  registerKeyboardShortcut('markerTool', onMarkerTool)
  registerKeyboardShortcut('colorPalette', onColorPalette)
  registerKeyboardShortcut('brushPanel', onBrushPanel)
  registerKeyboardShortcut('clearCanvas', onClearCanvas)
  registerKeyboardShortcut('undo', onUndo)
  registerKeyboardShortcut('redo', onRedo)
}

const unregisterShortcuts = () => {
  unregisterKeyboardShortcut('brushTool')
  unregisterKeyboardShortcut('eraserTool')
  unregisterKeyboardShortcut('markerTool')
  unregisterKeyboardShortcut('colorPalette')
  unregisterKeyboardShortcut('brushPanel')
  unregisterKeyboardShortcut('clearCanvas')
  unregisterKeyboardShortcut('undo')
  unregisterKeyboardShortcut('redo')
}

// 工具栏操作
const setBasicTool = (toolType: 'brush' | 'eraser' | 'circle-marker') => {
  // 根据基本工具类型设置具体工具
  if (toolType === 'brush') {
    handleToolChange('brush')
  } else if (toolType === 'eraser') {
    // 直接设为魔术橡皮
    handleToolChange('magic-eraser')
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
  registerShortcuts()
})

onUnmounted(() => {
  unregisterShortcuts()
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

</style>
