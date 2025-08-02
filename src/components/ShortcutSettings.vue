<template>
  <div class="shortcut-settings">
    <div class="section-header">
      <h4 class="section-title">快捷键设置</h4>
      <BaseButton variant="simple" @click="resetShortcuts">
        重置默认
      </BaseButton>
    </div>

    <div class="shortcut-table">
      <div class="shortcut-header">
        <div class="shortcut-col">功能</div>
        <div class="shortcut-col">键盘快捷键</div>
        <div class="shortcut-col">鼠标快捷键</div>
      </div>

      <div class="shortcut-body">
        <div
          v-for="key in Object.keys(keyboardShortcuts)"
          :key="key"
          class="shortcut-row"
        >
          <div class="shortcut-col">
            {{ shortcutDescriptions[key as keyof typeof shortcutDescriptions]?.name || key }}
          </div>

          <!-- 键盘快捷键列 -->
          <div class="shortcut-col shortcut-editable" @click="startEditingShortcut(key)">
            <template v-if="editingShortcut === key">
              <input
                ref="shortcutInputRef"
                v-model="shortcutInput"
                type="text"
                class="shortcut-input"
                placeholder="按下新的快捷键..."
                readonly
                @keydown="handleShortcutKeyDown"
                @blur="cancelEditShortcut"
              >
            </template>
            <template v-else>
              <div class="shortcut-content">
                <div class="shortcut-display">
                  <template v-if="keyboardShortcuts[key as keyof KeyboardShortcuts]">
                    <template v-for="(part, partIndex) in keyboardShortcuts[key as keyof KeyboardShortcuts].split('+')" :key="partIndex">
                      <span v-if="partIndex > 0" class="shortcut-separator">+</span>
                      <kbd>{{ formatKeyName(part) }}</kbd>
                    </template>
                  </template>
                  <span v-else class="shortcut-empty">点击设置</span>
                </div>
                <button
                  class="reset-shortcut-btn"
                  title="恢复默认键盘快捷键"
                  @click.stop="restoreDefaultKeyboardShortcut(key)"
                >
                  <div
                    :ref="(el) => setResetBtnRef(el as HTMLElement, `kb-${key}`)"
                    class="reset-icon-container"
                  />
                </button>
              </div>
            </template>
          </div>

          <!-- 鼠标快捷键列 -->
          <div class="shortcut-col shortcut-editable" @click="startEditingMouseShortcut(key)">
            <template v-if="editingMouseShortcut === key">
              <input
                ref="mouseShortcutInputRef"
                v-model="mouseShortcutInput"
                type="text"
                class="shortcut-input"
                placeholder="按下鼠标按键或滚轮..."
                readonly
                @mousedown="handleMouseShortcutDown"
                @wheel="handleMouseWheel"
                @blur="cancelEditMouseShortcut"
              >
            </template>
            <template v-else>
              <div class="shortcut-content">
                <span class="mouse-shortcut">{{ formatMouseShortcut(mouseShortcuts[key as keyof MouseShortcuts]) }}</span>
                <button
                  class="reset-shortcut-btn"
                  title="恢复默认鼠标快捷键"
                  @click.stop="restoreDefaultMouseShortcut(key)"
                >
                  <div
                    :ref="(el) => setResetBtnRef(el as HTMLElement, `mouse-${key}`)"
                    class="reset-icon-container"
                  />
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="shortcut-note">
      <p><small>游戏操作的鼠标快捷键：左键点击格子 = 揭示格子，右键点击格子 = 标记/取消标记</small></p>
      <p><small>绘图工具的鼠标快捷键：在画布上滚动鼠标滚轮 = 切换颜色</small></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import BaseButton from './BaseButton.vue'
import { useAssets } from '@/composables/useAssets'
import type { KeyboardShortcuts, MouseShortcuts } from '@/composables/useSettings'
import { defaultSettings, shortcutDescriptions } from '@/composables/useSettings'

interface Props {
  keyboardShortcuts: KeyboardShortcuts
  mouseShortcuts: MouseShortcuts
}

interface Emits {
  (_e: 'update:keyboardShortcuts', _shortcuts: KeyboardShortcuts): void
  (_e: 'update:mouseShortcuts', _shortcuts: MouseShortcuts): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { cloneAsset } = useAssets()

// 编辑状态
const editingShortcut = ref<string | null>(null)
const shortcutInput = ref<string>('')
const editingMouseShortcut = ref<string | null>(null)
const mouseShortcutInput = ref<string>('')

// 重置按钮refs
const resetBtnRefs = ref<Record<string, HTMLElement>>({})

// 设置ref
const setResetBtnRef = (el: HTMLElement | null, key: string) => {
  if (el) {
    resetBtnRefs.value[key] = el
  }
}

// 渲染重置图标
const renderResetIcon = async (container: HTMLElement) => {
  if (!container) return

  const iconSvg = await cloneAsset('reset')
  if (iconSvg) {
    // 清空容器
    container.innerHTML = ''

    // 设置SVG样式
    iconSvg.style.width = '14px'
    iconSvg.style.height = '14px'
    iconSvg.style.fill = 'currentColor'

    // 添加到容器
    container.appendChild(iconSvg)
  }
}

// 键盘快捷键编辑相关函数
const startEditingShortcut = async (key: string) => {
  editingShortcut.value = key
  shortcutInput.value = props.keyboardShortcuts[key as keyof KeyboardShortcuts]

  // 等待DOM更新后聚焦输入框
  await nextTick()
  const inputElement = document.querySelector('.shortcut-input') as HTMLInputElement
  if (inputElement) {
    inputElement.focus()
    inputElement.select()
  }
}

const cancelEditShortcut = () => {
  editingShortcut.value = null
  shortcutInput.value = ''
}

const handleShortcutKeyDown = (event: KeyboardEvent) => {
  event.preventDefault()

  // 如果按下Escape键，清除快捷键
  if (event.key === 'Escape') {
    if (editingShortcut.value) {
      const newShortcuts = { ...props.keyboardShortcuts }
      newShortcuts[editingShortcut.value as keyof KeyboardShortcuts] = ''
      emit('update:keyboardShortcuts', newShortcuts)
      editingShortcut.value = null
      shortcutInput.value = ''
    }
    return
  }

  // 构建快捷键字符串
  const parts: string[] = []
  if (event.ctrlKey) parts.push('ctrl')
  if (event.altKey) parts.push('alt')
  if (event.shiftKey) parts.push('shift')
  if (event.metaKey) parts.push('meta')

  // 添加主键
  const key = event.key.toLowerCase()
  if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
    parts.push(key)
  }

  if (parts.length > 0) {
    const newShortcut = parts.join('+')
    shortcutInput.value = newShortcut

    // 更新快捷键
    if (editingShortcut.value) {
      const newShortcuts = { ...props.keyboardShortcuts }
      newShortcuts[editingShortcut.value as keyof KeyboardShortcuts] = newShortcut.toLowerCase()
      emit('update:keyboardShortcuts', newShortcuts)
      editingShortcut.value = null
      shortcutInput.value = ''
    }
  }
}

// 鼠标快捷键编辑相关函数
const startEditingMouseShortcut = async (key: string) => {
  editingMouseShortcut.value = key
  mouseShortcutInput.value = props.mouseShortcuts[key as keyof MouseShortcuts]

  // 等待DOM更新后聚焦输入框
  await nextTick()
  const inputElement = document.querySelector('.shortcut-input') as HTMLInputElement
  if (inputElement) {
    inputElement.focus()
    inputElement.select()
  }
}

const cancelEditMouseShortcut = () => {
  editingMouseShortcut.value = null
  mouseShortcutInput.value = ''
}

const handleMouseShortcutDown = (event: MouseEvent) => {
  event.preventDefault()

  let mouseAction = ''

  // 根据按下的鼠标按键生成快捷键字符串
  if (event.button === 0) { // 左键
    mouseAction = 'left'
  } else if (event.button === 1) { // 中键
    mouseAction = 'middle'
  } else if (event.button === 2) { // 右键
    mouseAction = 'right'
  } else if (event.button === 3) { // 侧键
    mouseAction = 'mb4'
  } else if (event.button === 4) { // 侧键
    mouseAction = 'mb5'
  }

  if (mouseAction) {
    mouseShortcutInput.value = mouseAction
    if (editingMouseShortcut.value) {
      const newShortcuts = { ...props.mouseShortcuts }
      newShortcuts[editingMouseShortcut.value as keyof MouseShortcuts] = mouseAction
      emit('update:mouseShortcuts', newShortcuts)
      editingMouseShortcut.value = null
      mouseShortcutInput.value = ''
    }
  }
}

const handleMouseWheel = (event: WheelEvent) => {
  event.preventDefault()

  const wheelAction = 'wheel'
  mouseShortcutInput.value = wheelAction

  if (editingMouseShortcut.value) {
    const newShortcuts = { ...props.mouseShortcuts }
    newShortcuts[editingMouseShortcut.value as keyof MouseShortcuts] = wheelAction
    emit('update:mouseShortcuts', newShortcuts)
    editingMouseShortcut.value = null
    mouseShortcutInput.value = ''
  }
}

// 恢复默认快捷键
const restoreDefaultKeyboardShortcut = (key: string) => {
  const newShortcuts = { ...props.keyboardShortcuts }
  newShortcuts[key as keyof KeyboardShortcuts] = defaultSettings.keyboardShortcuts[key as keyof KeyboardShortcuts]
  emit('update:keyboardShortcuts', newShortcuts)
}

const restoreDefaultMouseShortcut = (key: string) => {
  const newShortcuts = { ...props.mouseShortcuts }
  newShortcuts[key as keyof MouseShortcuts] = defaultSettings.mouseShortcuts[key as keyof MouseShortcuts]
  emit('update:mouseShortcuts', newShortcuts)
}

// 重置所有快捷键
const resetShortcuts = () => {
  emit('update:keyboardShortcuts', { ...defaultSettings.keyboardShortcuts })
  emit('update:mouseShortcuts', { ...defaultSettings.mouseShortcuts })
}

// 格式化键名显示
const formatKeyName = (key: string): string => {
  const keyMap: Record<string, string> = {
    'ctrl': 'Ctrl',
    'alt': 'Alt',
    'shift': 'Shift',
    'meta': 'Meta',
    'enter': 'Enter',
    'escape': 'Esc',
    'space': 'Space',
    'tab': 'Tab',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→'
  }

  return keyMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1)
}

// 格式化鼠标快捷键显示
const formatMouseShortcut = (shortcut: string) => {
  if (!shortcut) return '点击设置'

  const mouseKeyMap: Record<string, string> = {
    'left': '鼠标左键',
    'right': '鼠标右键',
    'middle': '鼠标中键',
    'wheel': '鼠标滚轮'
  }

  return mouseKeyMap[shortcut] || shortcut
}

// 组件挂载后渲染图标
onMounted(() => {
  // 使用nextTick确保DOM已经渲染
  nextTick(() => {
    // 渲染所有重置按钮的图标
    Object.entries(resetBtnRefs.value).forEach(([_key, container]) => {
      if (container) {
        renderResetIcon(container)
      }
    })
  })
})

// 监听快捷键变化，重新渲染图标
watch(() => [props.keyboardShortcuts, props.mouseShortcuts], () => {
  nextTick(() => {
    // 渲染所有重置按钮的图标
    Object.entries(resetBtnRefs.value).forEach(([_key, container]) => {
      if (container) {
        renderResetIcon(container)
      }
    })
  })
}, { deep: true })

// 监听resetBtnRefs变化，为新添加的按钮渲染图标
watch(() => resetBtnRefs.value, () => {
  nextTick(() => {
    Object.entries(resetBtnRefs.value).forEach(([_key, container]) => {
      if (container && !container.querySelector('svg')) {
        renderResetIcon(container)
      }
    })
  })
}, { deep: true })

// 监听编辑状态变化，重新渲染图标
watch(() => [editingShortcut.value, editingMouseShortcut.value], () => {
  nextTick(() => {
    Object.entries(resetBtnRefs.value).forEach(([_key, container]) => {
      if (container && !container.querySelector('svg')) {
        renderResetIcon(container)
      }
    })
  })
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.shortcut-settings {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: variables.scaled(15);
}

.section-title {
  margin: 0;
  font-size: variables.scaled(16);
  font-weight: 600;
  color: var(--text-color);
}

.shortcut-table {
  background: rgba(#333, 0.6);
  border-radius: calc(8 * var(--scale));
  overflow: hidden;
  border: calc(1 * var(--scale)) solid rgba(#555, 0.4);
  margin-bottom: variables.scaled(15);
}

.shortcut-header,
.shortcut-row {
  display: flex;
  min-height: variables.scaled(44);
  align-items: center;

  &:not(:last-child) {
    border-bottom: calc(1 * var(--scale)) solid rgba(#555, 0.4);
  }

  &:hover {
    background: rgba(#555, 0.3);
  }
}

.shortcut-header {
  background: rgba(#444, 0.8);
  font-weight: 600;

  &:hover {
    background: rgba(#444, 0.8);
  }
}

.shortcut-col {
  flex: 1;
  padding: variables.scaled(12) variables.scaled(16);
  font-size: variables.scaled(13);
  color: #ddd;
  display: flex;
  align-items: center;
  border-right: calc(1 * var(--scale)) solid rgba(#555, 0.4);

  &:last-child {
    border-right: none;
  }

  &:first-child {
    font-weight: 500;
    color: #fff;
  }

  // 确保每列等宽
  min-width: 0;
  word-wrap: break-word;
}

// 可编辑快捷键列样式
.shortcut-editable {
  cursor: pointer;
  padding: variables.scaled(8) variables.scaled(12);
  border-radius: calc(4 * var(--scale));
  border: calc(1 * var(--scale)) solid transparent;
  transition: all 0.2s ease;
  position: relative;
  min-height: variables.scaled(20);
  display: flex;
  align-items: center;
  margin: calc(-1 * variables.scaled(4));

  &:hover {
    background-color: rgba(#555, 0.3);
    border-color: rgba(#777, 0.5);
  }
}

// 快捷键内容容器样式
.shortcut-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: variables.scaled(8);
}

.shortcut-editable {
  &:hover {
    border-color: rgba(#666, 0.6);
  }

  &.editing {
    background-color: rgba(#333, 0.9);
    border-color: var(--accent-color);
    outline: none;
  }
}

// 鼠标快捷键样式
.mouse-shortcut {
  color: #aaa;
  font-style: italic;
  font-size: variables.scaled(12);
}

// 键盘按键样式
kbd {
  display: inline-block;
  padding: variables.scaled(2) variables.scaled(6);
  margin: 0 variables.scaled(2);
  font-size: variables.scaled(11);
  font-family: monospace;
  color: #fff;
  background: rgba(#555, 0.8);
  border: calc(1 * var(--scale)) solid rgba(#777, 0.6);
  border-radius: calc(3 * var(--scale));
  box-shadow: 0 calc(1 * var(--scale)) calc(2 * var(--scale)) rgba(#000, 0.3);
}

// 快捷键编辑相关样式
.shortcut-input {
  width: 100%;
  background: rgba(#333, 0.9);
  border: calc(1 * var(--scale)) solid rgba(#555, 0.8);
  color: white;
  padding: variables.scaled(6) variables.scaled(10);
  font-size: variables.scaled(12);
  border-radius: calc(2 * var(--scale));
  outline: none;

  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 calc(4 * var(--scale)) rgba(var(--accent-color-rgb), 0.3);
  }
}

.shortcut-display {
  display: flex;
  align-items: center;
  gap: variables.scaled(4);
}

.shortcut-separator {
  color: #888;
  font-weight: bold;
  margin: 0 variables.scaled(2);
}

.shortcut-empty {
  color: #888;
  font-style: italic;
}

// 重置按钮样式
.reset-shortcut-btn {
  background: none;
  border: none;
  padding: variables.scaled(4);
  cursor: pointer;
  border-radius: calc(4 * var(--scale));
  color: #ddd;
  opacity: 0.7;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background-color: rgba(#555, 0.5);
  }

  .reset-icon-container {
    width: variables.scaled(16);
    height: variables.scaled(16);
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  }
}

.shortcut-note {
  margin-top: variables.scaled(10);

  p {
    margin: variables.scaled(4) 0;
    color: #aaa;
  }
}
</style>
