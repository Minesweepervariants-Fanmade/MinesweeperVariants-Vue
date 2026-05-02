<template>
  <BaseModal
    :visible="visible"
    confirm-text="保存"
    :close-on-backdrop="true"
    @confirm="onSave"
    @close="onClose"
    @update:visible="$emit('update:visible', $event)"
  >
    <h3 class="editor-title">{{ title }}</h3>
    <div class="editor-meta">
      <span>当前单元格：{{ cellLabel }}</span>
    </div>

    <div class="editor-container">
      <!-- 左侧面板 - CellConfig 编辑 -->
      <div class="editor-panel left-panel">
        <h4 class="panel-title">单元格配置</h4>

        <div class="editor-section">
          <label class="editor-label">覆盖文本 (overlayText)</label>
          <input
            v-model="overlayText"
            type="text"
            class="editor-input"
            placeholder="输入覆盖文本或留空"
          >
        </div>

        <div class="editor-section">
          <label class="editor-label">组件配置 (component JSON)</label>
          <textarea
            v-model="componentText"
            class="editor-textarea"
            spellcheck="false"
            placeholder="输入有效的 JSON 对象"
          />
        </div>
      </div>

      <!-- 右侧面板 - CellState 编辑 -->
      <div class="editor-panel right-panel">
        <h4 class="panel-title">状态配置</h4>

        <div class="editor-section">

          <div class="editor-section">
            <label class="editor-label checkbox-label">
              <input
                v-model="isRevealed"
                type="checkbox"
              >
              已翻开 (isRevealed)
            </label>
          </div>

          <div class="editor-section">
            <label class="editor-label checkbox-label">
              <input
                v-model="isLoading"
                type="checkbox"
              >
              加载中 (isLoading)
            </label>
          </div>

          <div class="editor-section">
            <label class="editor-label checkbox-label">
              <input
                v-model="hint1"
                type="checkbox"
              >
              提示1 (hint1)
            </label>
          </div>

          <div class="editor-section">
            <label class="editor-label checkbox-label">
              <input
                v-model="hint2"
                type="checkbox"
              >
              提示2 (hint2)
            </label>
          </div>

          <div class="editor-section">
            <label class="editor-label checkbox-label">
              <input
                v-model="error"
                type="checkbox"
              >
              错误 (error)
            </label>
          </div>

          <div class="editor-section">
            <label class="editor-label checkbox-label">
              <input
                v-model="errormine"
                type="checkbox"
              >
              错误雷 (errormine)
            </label>
          </div>
        </div>
      </div>

      <p v-if="errorMessage" class="editor-error">{{ errorMessage }}</p>
    </div></BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import type { CellConfig, CellState } from '@/types/game'

interface Props {
  visible?: boolean
  title?: string
  cellLabel?: string
  cellConfig?: CellConfig | null
  cellState?: CellState | null
}

interface Emits {
  (_e: 'save', _cellConfig: CellConfig, _cellState: CellState): void
  (_e: 'close'): void
  (_e: 'update:visible', _value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '编辑纸笔单元格',
  cellLabel: '',
  cellConfig: null,
  cellState: null,
})

const emit = defineEmits<Emits>()

// CellConfig 相关状态
const overlayText = ref('')
const componentText = ref('')

// CellState 相关状态
const cellType = ref<'empty' | 'revealed'>('empty')
const isRevealed = ref(false)
const isLoading = ref(false)
const hint1 = ref(false)
const hint2 = ref(false)
const error = ref(false)
const errormine = ref(false)

const errorMessage = ref('')

const cloneCellConfig = (cellConfig: CellConfig | null): CellConfig | null => {
  if (!cellConfig) return null
  return JSON.parse(JSON.stringify(cellConfig)) as CellConfig
}

const syncEditorText = () => {
  // 同步 CellConfig
  const cloned = cloneCellConfig(props.cellConfig)
  if (cloned) {
    overlayText.value = cloned.overlayText || ''
    componentText.value = JSON.stringify(cloned.component, null, 2)
  } else {
    overlayText.value = ''
    componentText.value = ''
  }

  // 同步 CellState
  if (props.cellState) {
    cellType.value = props.cellState.type
    isRevealed.value = props.cellState.isRevealed
    isLoading.value = props.cellState.isLoading
    hint1.value = props.cellState.hint1
    hint2.value = props.cellState.hint2
    error.value = props.cellState.error
    errormine.value = props.cellState.errormine
  } else {
    cellType.value = 'empty'
    isRevealed.value = false
    isLoading.value = false
    hint1.value = false
    hint2.value = false
    error.value = false
    errormine.value = false
  }

  errorMessage.value = ''
}

watch(
  () => [props.visible, props.cellConfig, props.cellState],
  () => {
    if (props.visible) {
      syncEditorText()
    }
  },
  { immediate: true, deep: true }
)

const cellLabel = computed(() => props.cellLabel || '未选择')

const onSave = () => {
  try {
    // 解析 component JSON
    const componentConfig = JSON.parse(componentText.value)

    const current = props.cellConfig
    if (!current) {
      errorMessage.value = '当前没有可编辑的单元格内容。'
      return
    }

    const nextConfig: CellConfig = {
      overlayText: overlayText.value,
      component: componentConfig,
      position: current.position,
    }

    const nextState: CellState = {
      type: cellType.value,
      isRevealed: isRevealed.value,
      isLoading: isLoading.value,
      hint1: hint1.value,
      hint2: hint2.value,
      error: error.value,
      errormine: errormine.value,
    }

    emit('save', nextConfig, nextState)
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'JSON 解析失败'
  }
}

const onClose = () => {
  errorMessage.value = ''
  emit('close')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.editor-title {
  margin: 0 0 variables.scaled(8);
  color: white;
  font-size: variables.scaled(20);
}

.editor-meta {
  margin-bottom: variables.scaled(12);
  color: #ddd;
  font-size: variables.scaled(14);
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: variables.scaled(16);
  margin-bottom: variables.scaled(12);
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: variables.scaled(12);
  padding: variables.scaled(12);
  border: variables.scaled(1) solid rgba(255, 255, 255, 0.15);
  border-radius: variables.scaled(6);
  background: rgba(0, 0, 0, 0.2);

  &.left-panel {
    .editor-textarea {
      min-height: variables.scaled(150);
    }
  }

  &.right-panel {
    .editor-section {
      margin-bottom: 0;
    }
  }
}

.panel-title {
  margin: 0 0 variables.scaled(8);
  color: #e0e0e0;
  font-size: variables.scaled(15);
  font-weight: 600;
  border-bottom: variables.scaled(1) solid rgba(255, 255, 255, 0.15);
  padding-bottom: variables.scaled(8);
}

.editor-section {
  margin-bottom: variables.scaled(10);
  display: flex;
  flex-direction: column;
  gap: variables.scaled(6);
}

.editor-label {
  color: #e0e0e0;
  font-size: variables.scaled(13);
  font-weight: 500;

  &.checkbox-label {
    display: flex;
    align-items: center;
    gap: variables.scaled(8);
    font-weight: normal;
    cursor: pointer;
    margin: 0;

    input[type="checkbox"] {
      cursor: pointer;
      width: variables.scaled(16);
      height: variables.scaled(16);
    }
  }
}

.editor-input {
  padding: variables.scaled(8) variables.scaled(12);
  border: variables.scaled(1) solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.45);
  color: white;
  font-size: variables.scaled(14);
  border-radius: variables.scaled(4);

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.6);
  }
}

.editor-textarea {
  width: 100%;
  min-height: variables.scaled(200);
  box-sizing: border-box;
  resize: vertical;
  padding: variables.scaled(12);
  border: variables.scaled(1) solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.45);
  color: white;
  font-family: monospace;
  font-size: variables.scaled(13);
  line-height: 1.5;
  border-radius: variables.scaled(4);

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.6);
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: variables.scaled(6);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: variables.scaled(8);
  color: #e0e0e0;
  font-size: variables.scaled(13);
  cursor: pointer;
  margin: 0;

  input[type="radio"] {
    cursor: pointer;
    width: variables.scaled(16);
    height: variables.scaled(16);
  }
}

.editor-error {
  margin-top: variables.scaled(10);
  color: #ffb4b4;
  font-size: variables.scaled(14);
}
</style>
