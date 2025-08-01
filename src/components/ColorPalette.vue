<template>
  <BasePanel
    :visible="visible"
    title="颜色选择"
    position="left"
    transition="slide-left"
    :show-confirm-button="false"
    cancel-text="取消"
    @close="$emit('close')"
  >
    <!-- 预设颜色 -->
    <div class="color-section">
      <h4 class="section-title">预设颜色</h4>
      <div class="color-grid">
        <button
          v-for="color in presetColors"
          :key="color"
          class="color-item"
          :class="{ active: color === currentColor }"
          :style="{ backgroundColor: color }"
          :title="color"
          @click="selectColor(color)"
        />
      </div>
    </div>

    <!-- 自定义颜色 -->
    <div class="color-section">
      <h4 class="section-title">自定义颜色</h4>
      <div class="custom-color-container">
        <input
          v-model="customColor"
          type="color"
          class="color-picker"
          @input="selectColor(customColor)"
        >
        <input
          v-model="customColor"
          type="text"
          class="color-input"
          placeholder="#000000"
          @input="validateAndSelectColor"
        >
      </div>
    </div>

    <!-- 最近使用的颜色 -->
    <div v-if="recentColors.length > 0" class="color-section">
      <h4 class="section-title">最近使用</h4>
      <div class="color-grid">
        <button
          v-for="color in recentColors"
          :key="color"
          class="color-item"
          :class="{ active: color === currentColor }"
          :style="{ backgroundColor: color }"
          :title="color"
          @click="selectColor(color)"
        />
      </div>
    </div>
  </BasePanel>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BasePanel from '@/components/BasePanel.vue'
import { presetColors } from '@/utils/colorUtils'

interface Props {
  visible: boolean
  currentColor: string
}

interface Emits {
  (_e: 'colorChange', _color: string): void
  (_e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const customColor = ref(props.currentColor)
const recentColors = ref<string[]>([])

// 监听当前颜色变化
watch(() => props.currentColor, (newColor) => {
  customColor.value = newColor
})

// 选择颜色
const selectColor = (color: string) => {
  // 添加到最近使用的颜色
  if (!recentColors.value.includes(color)) {
    recentColors.value.unshift(color)
    // 限制最近使用的颜色数量
    if (recentColors.value.length > 12) {
      recentColors.value = recentColors.value.slice(0, 12)
    }
  }

  emit('colorChange', color)
}

// 验证并选择自定义颜色
const validateAndSelectColor = () => {
  const color = customColor.value
  // 简单的颜色格式验证
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    selectColor(color)
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.color-section {
  margin-bottom: variables.scaled(20);

  &:last-of-type {
    margin-bottom: 0;
  }
}

.section-title {
  color: var(--hint2-color);
  font-size: variables.scaled(14);
  font-weight: bold;
  margin: 0 0 variables.scaled(12) 0;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: variables.scaled(8);
}

.color-item {
  @include variables.square-size(0.6);
  @include variables.button-base;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
    border-color: var(--hint-color);
  }

  &.active {
    border-color: var(--hint-color);
    border-width: variables.scaled(3);

    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      text-shadow: 0 0 variables.scaled(2) rgba(0, 0, 0, 0.8);
    }
  }
}

.custom-color-container {
  display: flex;
  gap: variables.scaled(12);
  align-items: center;
}

.color-picker {
  @include variables.square-size(0.75);
  @include variables.button-base;
  cursor: pointer;
  background: none;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 0;
  }
}

.color-input {
  flex: 1;
  padding: variables.scaled(8) variables.scaled(12);
  border: variables.scaled(1) solid var(--foreground-color);
  border-radius: 0;
  background: var(--background-color);
  color: var(--foreground-color);
  font-family: monospace;
  font-size: variables.scaled(14);

  &:focus {
    outline: none;
    border-color: var(--hint-color);
  }
}

</style>
