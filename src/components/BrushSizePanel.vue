<template>
  <BasePanel
    :visible="visible"
    :title="panelTitle"
    position="left"
    transition="slide-left"
    :show-confirm-button="false"
    cancel-text="完成"
    @close="$emit('close')"
  >
    <!-- 粗细预览 -->
    <div class="size-preview">
      <div
        class="preview-circle"
        :style="{
          width: `${Math.max(4, currentSize)}px`,
          height: `${Math.max(4, currentSize)}px`
        }"
      />
      <span class="size-value">{{ currentSize }}px</span>
    </div>

    <!-- 不同工具的尺寸信息 -->
    <div class="size-info">
      <div class="tool-size-item">
        <span class="tool-label">画笔:</span>
        <span class="tool-size">{{ brushSize }}px</span>
      </div>
      <div class="tool-size-item">
        <span class="tool-label">橡皮:</span>
        <span class="tool-size">{{ eraserSize }}px</span>
      </div>
    </div>

    <!-- 滑动条 -->
    <div class="slider-container">
      <input
        v-model.number="localSize"
        type="range"
        min="1"
        max="50"
        step="1"
        class="size-slider"
        @input="updateSize"
      >
      <div class="slider-labels">
        <span>1</span>
        <span>25</span>
        <span>50</span>
      </div>
    </div>

    <!-- 快速选择 -->
    <div class="quick-sizes">
      <h4 class="section-title">快速选择</h4>
      <div class="size-buttons">
        <BaseButton
          v-for="size in quickSizes"
          :key="size"
          :active="size === currentSize"
          :tooltip="`${size}px`"
          @click="selectSize(size)"
        >
          <template #icon>
            <div
              class="size-dot"
              :style="{
                width: `${Math.max(4, size * 0.8)}px`,
                height: `${Math.max(4, size * 0.8)}px`
              }"
            />
          </template>
          <template #secondary>{{ size }}</template>
        </BaseButton>
      </div>
    </div>

    <!-- 工具类型选择 -->
    <div class="tool-types">
      <h4 class="section-title">工具类型</h4>
      <div class="tool-buttons">
        <!-- 画笔工具 -->
        <BaseButton
          :active="currentTool === 'brush'"
          tooltip="标准画笔"
          @click="selectTool('brush')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3z" />
              <path d="M20.71 4.63l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z" />
            </svg>
          </template>
          标准画笔
        </BaseButton>

        <!-- 普通橡皮 -->
        <BaseButton
          :active="currentTool === 'eraser'"
          tooltip="普通橡皮"
          @click="selectTool('eraser')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0" />
            </svg>
          </template>
          普通橡皮
        </BaseButton>


        <BaseButton
          :active="currentTool === 'continuous-eraser'"
          @click="selectTool('continuous-eraser')"
        >
          <template #icon>
            <svg viewBox="0 0 24 24">
              <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0" />
              <circle cx="18" cy="6" r="2" fill="currentColor" />
            </svg>
          </template>
          魔术橡皮
        </BaseButton>

        <!-- 圆形标记 -->
        <BaseButton
          :active="currentTool === 'circle-marker'"
          tooltip="圆形标记"
          @click="selectTool('circle-marker')"
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
          圆形标记
        </BaseButton>
      </div>
    </div>
  </BasePanel>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BasePanel from '@/components/BasePanel.vue'
import BaseButton from '@/components/BaseButton.vue'
import type { DrawingTool } from '@/types/drawing'

interface Props {
  visible: boolean
  currentSize: number
  currentTool: DrawingTool
  brushSize: number
  eraserSize: number
}

interface Emits {
  (_e: 'sizeChange', _size: number): void
  (_e: 'toolChange', _tool: DrawingTool): void
  (_e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localSize = ref(props.currentSize)

// 快速选择的尺寸
const quickSizes = [1, 3, 5, 8, 12, 16, 20, 25, 30, 40, 50]

// 计算面板标题
const panelTitle = computed(() => {
  if (props.currentTool === 'brush' || props.currentTool === 'circle-marker') {
    return '画笔粗细'
  } else if (props.currentTool === 'eraser' || props.currentTool === 'continuous-eraser') {
    return '橡皮粗细'
  }
  return '工具粗细'
})

// 监听当前尺寸变化
watch(() => props.currentSize, (newSize) => {
  localSize.value = newSize
})

// 更新尺寸
const updateSize = () => {
  emit('sizeChange', localSize.value)
}

// 选择尺寸
const selectSize = (size: number) => {
  localSize.value = size
  emit('sizeChange', size)
}

// 选择工具
const selectTool = (tool: DrawingTool) => {
  emit('toolChange', tool)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.size-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: variables.scaled(16);
  margin-bottom: variables.scaled(20);
  padding: variables.scaled(16);
  background: var(--background-color);
  border-radius: 0;
  border: variables.scaled(1) solid var(--foreground-color);
}

.preview-circle {
  background: var(--foreground-color);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.size-value {
  color: var(--foreground-color);
  font-weight: bold;
  font-size: variables.scaled(14);
}

.size-info {
  display: flex;
  justify-content: space-between;
  gap: variables.scaled(16);
  margin-bottom: variables.scaled(20);
  padding: variables.scaled(12);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  border: variables.scaled(1) solid var(--hint2-color);
}

.tool-size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: variables.scaled(4);
}

.tool-label {
  color: var(--hint2-color);
  font-size: variables.scaled(12);
  font-weight: bold;
}

.tool-size {
  color: var(--foreground-color);
  font-size: variables.scaled(14);
  font-weight: bold;
}

.slider-container {
  margin-bottom: variables.scaled(20);
}

.size-slider {
  width: 100%;
  height: variables.scaled(4);
  border-radius: variables.scaled(2);
  background: var(--background-color);
  outline: none;
  cursor: pointer;
  appearance: none;
  border: variables.scaled(1) solid var(--foreground-color);

  &::-webkit-slider-thumb {
    appearance: none;
    width: variables.scaled(20);
    height: variables.scaled(20);
    border-radius: 50%;
    background: var(--hint-color);
    cursor: pointer;
    border: variables.scaled(2) solid var(--foreground-color);
  }

  &::-moz-range-thumb {
    width: variables.scaled(20);
    height: variables.scaled(20);
    border-radius: 50%;
    background: var(--hint-color);
    cursor: pointer;
    border: variables.scaled(2) solid var(--foreground-color);
  }
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: variables.scaled(8);
  color: var(--hint2-color);
  font-size: variables.scaled(12);
}

.quick-sizes {
  margin-bottom: variables.scaled(20);
}

.section-title {
  color: var(--hint2-color);
  font-size: variables.scaled(14);
  font-weight: bold;
  margin: 0 0 variables.scaled(12) 0;
}

.size-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: variables.scaled(8);
}

.size-buttons > * {
  width: 100%;
  max-width: 100%;
}

.size-dot {
  background: currentColor;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.tool-types {
  margin-bottom: variables.scaled(20);
}

.tool-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: variables.scaled(8);
}
.tool-buttons > * {

  height: 100%;
}
</style>
