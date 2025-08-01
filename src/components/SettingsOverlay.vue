<template>
  <BaseModal
    :visible="visible"
    confirm-text="保存"
    :close-on-backdrop="closeOnBackdrop"
    @confirm="onSave"
    @close="onClose"
    @update:visible="$emit('update:visible', $event)"
  >
    <h3 class="settings-title">游戏设置</h3>
    <div class="settings-content">

      <div class="setting-section">
        <h4 class="section-title">盘面设置</h4>
        <div class="setting-item">
          <label class="setting-label">网格大小：</label>
          <div class="grid-size-container">
            <input
              v-model.number="localSettings.gridWidth"
              type="number"
              class="setting-input grid-size-input"
              :min="minWidth"
              :max="200"
            >
            <span class="grid-separator">×</span>
            <input
              v-model.number="localSettings.gridHeight"
              type="number"
              class="setting-input grid-size-input"
              :min="minHeight"
              :max="200"
            >
          </div>
        </div>
        <div class="setting-item">
          <label class="setting-label">地雷数量：</label>
          <input
            v-model.number="localSettings.mineCount"
            type="number"
            class="setting-input"
            :min="0"
            :max="maxMines"
          >
        </div>
      </div>


      <div class="setting-section">
        <h4 class="section-title">游戏规则</h4>
        <div class="rules-container">
          <!-- 启用的规则 -->
          <div class="rules-column">
            <h5 class="rules-column-title">已启用</h5>
            <div class="rules-list">
              <div
                v-for="rule in enabledRules"
                :key="rule.code"
                class="rule-item enabled"
                @click="disableRule(rule.code)"
              >
                <span class="rule-code">[{{ rule.code }}]</span>
                <span class="rule-name">{{ rule.name }}</span>
                <span class="rule-type">{{ rule.type }}</span>
              </div>
              <div v-if="enabledRules.length === 0" class="rules-empty">
                点击右侧规则来启用
              </div>
            </div>
          </div>

          <!-- 未启用的规则 -->
          <div class="rules-column">
            <h5 class="rules-column-title">可用规则</h5>
            <div class="rules-list">
              <div
                v-for="rule in availableRules"
                :key="rule.code"
                class="rule-item available"
                @click="enableRule(rule.code)"
              >
                <span class="rule-code">[{{ rule.code }}]</span>
                <span class="rule-name">{{ rule.name }}</span>
                <span class="rule-type">{{ rule.type }}</span>
              </div>
              <div v-if="availableRules.length === 0" class="rules-empty">
                无可用规则
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 服务器设置 -->
      <div class="setting-section">
        <h4 class="section-title">服务器设置</h4>
        <div class="setting-item">
          <label class="setting-label">服务器地址：</label>
          <input
            v-model="localSettings.serverUrl"
            type="url"
            class="setting-input server-url-input"
          >
        </div>
        <div class="setting-note">
          <small>更改服务器地址后需要重新加载游戏</small>
        </div>
      </div>

      <!-- 模式设置 -->
      <div class="setting-section">
        <h4 class="section-title">模式设置</h4>
        <div class="setting-item">
          <div class="game-mode-container">
            <div
              v-for="mode in (['normal', 'expert', 'ultimate'] as const)"
              :key="mode"
              class="game-mode-item"
              :class="{ active: localSettings.gameMode === mode }"
              @click="selectGameMode(mode)"
            >
              <div class="game-mode-header">
                <input
                  :id="`mode-${mode}`"
                  v-model="localSettings.gameMode"
                  type="radio"
                  :value="mode"
                  class="game-mode-radio"
                >
                <label :for="`mode-${mode}`" class="game-mode-title">
                  {{ gameModeDescriptions[mode].title }}
                </label>
              </div>
              <div class="game-mode-description">
                {{ gameModeDescriptions[mode].description }}
              </div>

              <!-- 终极模式子选项 -->
              <div v-if="mode === 'ultimate' && localSettings.gameMode === 'ultimate'" class="ultimate-options">
                <div
                  v-for="(option, key) in ultimateModeOptionDescriptions"
                  :key="key"
                  class="ultimate-option-item"
                >
                  <label class="setting-checkbox ultimate-checkbox">
                    <input
                      v-model="localSettings.ultimateModeOptions[key as keyof UltimateModeOptions]"
                      type="checkbox"
                    >
                    <span class="checkmark" />
                    <span class="ultimate-option-symbol">{{ option.symbol }}</span>
                    <span class="ultimate-option-desc">{{ option.description }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 显示设置 -->
      <div class="setting-section">
        <h4 class="section-title">显示设置</h4>
        <div class="setting-item">
          <label class="setting-label">主题：</label>
          <select v-model="localSettings.theme" class="setting-select">
            <option value="dark">深色</option>
            <option value="blue">蓝色</option>
            <option value="amber">琥珀色</option>
          </select>
        </div>
        <div class="setting-item">
          <label class="setting-checkbox">
            <input v-model="localSettings.drawTransparent" type="checkbox">
            <span class="checkmark" />
            画图透明度
          </label>
          <span class="setting-note">选中时,你的绘图会在解题时变为透明</span>
        </div>
        <div class="setting-item">
          <label class="setting-checkbox">
            <input v-model="localSettings.showRowColLabel" type="checkbox">
            <span class="checkmark" />
            显示行列标号
          </label>
        </div>
      </div>

      <!-- 控制设置 -->
      <div class="setting-section">
        <h4 class="section-title">控制设置</h4>
        <div class="setting-item">
          <label class="setting-checkbox">
            <input v-model="localSettings.touchMode" type="checkbox">
            <span class="checkmark" />
            触屏模式
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-checkbox">
            <input v-model="localSettings.swapMouseButtons" type="checkbox">
            <span class="checkmark" />
            交换鼠标左右键
          </label>
        </div>
      </div>

      <!-- 快捷键设置 -->
      <div class="setting-section">
        <div class="section-header">
          <h4 class="section-title">快捷键设置</h4>
          <BaseButton variant="simple" @click="resetShortcuts">
            重置默认
          </BaseButton>
        </div>
        <div class="shortcut-table">
          <div class="shortcut-body">
            <div
              v-for="key in Object.keys(localSettings.keyboardShortcuts)"
              :key="key"
              class="shortcut-row"
            >
              <div class="shortcut-col">
                {{ shortcutDescriptions[key as keyof typeof shortcutDescriptions]?.name || key }}
              </div>
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
                      <template v-if="localSettings.keyboardShortcuts[key as keyof KeyboardShortcuts]">
                        <template v-for="(part, partIndex) in localSettings.keyboardShortcuts[key as keyof KeyboardShortcuts].split('+')" :key="partIndex">
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
                    <span class="mouse-shortcut">{{ formatMouseShortcut(localSettings.mouseShortcuts[key as keyof MouseShortcuts]) }}</span>
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
    </div>

    <template #actions>
      <BaseButton variant="simple" @click="onReset">重置默认</BaseButton>
      <BaseButton variant="simple" @click="onSave">保存</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import type { GameSettings, GameMode, KeyboardShortcuts, MouseShortcuts, UltimateModeOptions } from '@/composables/useSettings'
import { defaultSettings, gameModeDescriptions, ultimateModeOptionDescriptions, shortcutDescriptions } from '@/composables/useSettings'
import { useTheme } from '@/composables/useTheme'
import { useAssets } from '@/composables/useAssets'

// 主题管理
const { setTheme } = useTheme()

// 资源管理
const { cloneAsset } = useAssets()

// 重置按钮容器的引用
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

// 规则类型定义
type RuleType = 'lRule' | 'mRule' | 'rRule' | 'oRule'

// 规则映射定义
const RULE_DEFINITIONS: Record<string, [RuleType, string, string]> = {
  'Q': ['lRule', '无方', '每个2x2区域内都至少有一个雷'],
  'R': ['mRule', '总雷数', '有时你会需要用到总雷数来推理'],
  'V': ['rRule', '普通', '无特殊规则']
}

interface Props {
  visible?: boolean
  settings?: GameSettings
  closeOnBackdrop?: boolean
}

interface Emits {
  (_e: 'save', _settings: GameSettings): void
  (_e: 'close'): void
  (_e: 'update:visible', _value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  closeOnBackdrop: true,
  settings: () => (defaultSettings),
})

const emit = defineEmits<Emits>()

// 本地设置副本
const localSettings = ref<GameSettings>({ ...props.settings })

// 快捷键编辑状态
const editingShortcut = ref<string | null>(null)
const shortcutInput = ref<string>('')
const editingMouseShortcut = ref<string | null>(null)
const mouseShortcutInput = ref<string>('')

// 监听主题变化并应用到系统
watch(
  () => localSettings.value.theme,
  (newTheme) => {
    if (newTheme) {
      setTheme(newTheme)
    }
  }
)

// 根据网格大小计算最大地雷数
const maxMines = computed(() => {
  const width = localSettings.value.gridWidth
  const height = localSettings.value.gridHeight
  return width * height // 最大值为宽*高
})

// 计算宽度的最小值
const minWidth = computed(() => {
  return localSettings.value.gridHeight <= 2 ? 3 : 1
})

// 计算高度的最小值
const minHeight = computed(() => {
  return localSettings.value.gridWidth <= 2 ? 3 : 1
})

// 启用的规则列表
const enabledRules = computed(() => {
  return localSettings.value.enabledRules.map(code => ({
    code,
    ...RULE_DEFINITIONS[code] ? {
      type: RULE_DEFINITIONS[code][0],
      name: RULE_DEFINITIONS[code][1],
      description: RULE_DEFINITIONS[code][2]
    } : {
      type: 'unknown' as RuleType,
      name: '未知规则',
      description: '未定义的规则'
    }
  }))
})

// 未启用的规则列表
const availableRules = computed(() => {
  return Object.entries(RULE_DEFINITIONS)
    .filter(([code]) => !localSettings.value.enabledRules.includes(code))
    .map(([code, [type, name, description]]) => ({
      code,
      type,
      name,
      description
    }))
})

// 移动规则到启用列表
const enableRule = (code: string) => {
  if (!localSettings.value.enabledRules.includes(code)) {
    localSettings.value.enabledRules.push(code)
  }
}

// 移动规则到未启用列表
const disableRule = (code: string) => {
  const index = localSettings.value.enabledRules.indexOf(code)
  if (index > -1) {
    localSettings.value.enabledRules.splice(index, 1)
  }
}

// 监听外部设置变化
watch(
  () => props.settings,
  newSettings => {
    // 确保快捷键配置存在，如果不存在则使用默认配置
    const settingsWithShortcuts = {
      ...newSettings,
      keyboardShortcuts: newSettings.keyboardShortcuts || defaultSettings.keyboardShortcuts
    }
    localSettings.value = { ...settingsWithShortcuts }
  },
  { deep: true }
)

// 监听网格宽度变化，确保约束条件并调整雷数
watch(
  () => localSettings.value.gridWidth,
  (newWidth) => {
    if (newWidth <= 2 && localSettings.value.gridHeight <= 2) {
      localSettings.value.gridHeight = 3
    }

    // 检查雷数是否在合法范围内
    const maxMines = newWidth * localSettings.value.gridHeight
    if (localSettings.value.mineCount > maxMines) {
      localSettings.value.mineCount = maxMines
    }
    if (localSettings.value.mineCount < 1) {
      localSettings.value.mineCount = 1
    }
  }
)

// 监听网格高度变化，确保约束条件并调整雷数
watch(
  () => localSettings.value.gridHeight,
  (newHeight) => {
    if (newHeight <= 2 && localSettings.value.gridWidth <= 2) {
      localSettings.value.gridWidth = 3
    }

    // 检查雷数是否在合法范围内
    const maxMines = localSettings.value.gridWidth * newHeight
    if (localSettings.value.mineCount > maxMines) {
      localSettings.value.mineCount = maxMines
    }
    if (localSettings.value.mineCount < 1) {
      localSettings.value.mineCount = 1
    }
  }
)

const onSave = () => {
  emit('save', { ...localSettings.value })
}

const onClose = () => {
  // 恢复到原始设置
  localSettings.value = { ...props.settings }
  emit('close')
}

const selectGameMode = (mode: GameMode) => {
  localSettings.value.gameMode = mode
  // 如果不是终极模式，重置终极模式选项
  if (mode !== 'ultimate') {
    localSettings.value.ultimateModeOptions = { ...defaultSettings.ultimateModeOptions }
  }
}

// 快捷键编辑相关函数
const startEditingShortcut = async (key: string) => {
  editingShortcut.value = key
  shortcutInput.value = localSettings.value.keyboardShortcuts[key as keyof KeyboardShortcuts]

  // 等待DOM更新后聚焦输入框
  await nextTick()
  const inputElement = document.querySelector('.shortcut-input') as HTMLInputElement
  if (inputElement) {
    inputElement.focus()
    inputElement.select()
  }
}

const restoreDefaultKeyboardShortcut = (key: string) => {
  localSettings.value.keyboardShortcuts[key as keyof KeyboardShortcuts] = defaultSettings.keyboardShortcuts[key as keyof KeyboardShortcuts]
}

const restoreDefaultMouseShortcut = (key: string) => {
  localSettings.value.mouseShortcuts[key as keyof MouseShortcuts] = defaultSettings.mouseShortcuts[key as keyof MouseShortcuts]
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
      localSettings.value.keyboardShortcuts[editingShortcut.value as keyof KeyboardShortcuts] = ''
      editingShortcut.value = null
      shortcutInput.value = ''
    }
    return
  }

  const parts: string[] = []
  if (event.ctrlKey) parts.push('ctrl')
  if (event.shiftKey) parts.push('shift')
  if (event.altKey) parts.push('alt')
  if (event.metaKey) parts.push('meta')

  const keyName = event.key.toLowerCase()
  if (!['control', 'shift', 'alt', 'meta'].includes(keyName)) {
    parts.push(keyName)
    const newShortcut = parts.join('+')
    shortcutInput.value = newShortcut

    // 自动保存快捷键
    if (editingShortcut.value) {
      localSettings.value.keyboardShortcuts[editingShortcut.value as keyof KeyboardShortcuts] = newShortcut.toLowerCase()
      editingShortcut.value = null
      shortcutInput.value = ''
    }
  }
}

const resetShortcuts = () => {
  localSettings.value.keyboardShortcuts = { ...defaultSettings.keyboardShortcuts }
}

// 格式化按键名称显示
const formatKeyName = (key: string) => {
  const keyMap: Record<string, string> = {
    'ctrl': 'Ctrl',
    'shift': 'Shift',
    'alt': 'Alt',
    'meta': 'Meta',
    ' ': 'Space',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'enter': 'Enter',
    'escape': 'Esc',
    'backspace': 'Backspace',
    'tab': 'Tab',
    'delete': 'Delete',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PgUp',
    'pagedown': 'PgDn'
  }

  return keyMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1)
}

// 鼠标快捷键编辑相关函数
const startEditingMouseShortcut = async (key: string) => {
  editingMouseShortcut.value = key
  mouseShortcutInput.value = localSettings.value.mouseShortcuts[key as keyof MouseShortcuts]

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
  }

  if (mouseAction) {
    mouseShortcutInput.value = mouseAction
    if (editingMouseShortcut.value) {
      localSettings.value.mouseShortcuts[editingMouseShortcut.value as keyof MouseShortcuts] = mouseAction
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
    localSettings.value.mouseShortcuts[editingMouseShortcut.value as keyof MouseShortcuts] = wheelAction
    editingMouseShortcut.value = null
    mouseShortcutInput.value = ''
  }
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
watch(() => [localSettings.value.keyboardShortcuts, localSettings.value.mouseShortcuts], () => {
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

const onReset = () => {
  localSettings.value = defaultSettings
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.settings-title {
  margin: 0 0 variables.scaled(20) 0;
  font-size: variables.scaled(24);
  font-weight: bold;
  color: white;
  text-align: center;
}

.settings-content {
  max-height: calc(100% - #{variables.scaled(60)});
  overflow-y: auto;
}

.setting-section {
  margin-bottom: variables.scaled(25);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  margin: 0 0 variables.scaled(15) 0;
  font-size: variables.scaled(18);
  font-weight: bold;
  color: #fff;
  border-bottom: calc(1 * var(--scale)) solid rgba(#666, 0.6);
  padding-bottom: variables.scaled(5);
}

.setting-item {
  margin-bottom: variables.scaled(12);
  display: flex;
  align-items: center;

  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  color: #ddd;
  font-size: variables.scaled(14);
  min-width: variables.scaled(120);
  margin-right: variables.scaled(10);
}

.setting-input,
.setting-select {
  background: rgba(#444, 0.8);
  border: calc(1 * var(--scale)) solid rgba(#666, 0.6);
  color: white;
  padding: variables.scaled(6) variables.scaled(10);
  font-size: variables.scaled(14);
  border-radius: calc(2 * var(--scale));
  min-width: variables.scaled(80);

}

.server-url-input {
  min-width: variables.scaled(200);
}

.grid-size-input {
  min-width: variables.scaled(60);
  max-width: variables.scaled(80);
  text-align: center;
}

.setting-note {
  margin-top: variables.scaled(5);
  margin-left: variables.scaled(130);

  small {
    color: #aaa;
    font-size: variables.scaled(12);
    font-style: italic;
  }
}

.grid-size-container {
  display: flex;
  align-items: center;
  gap: variables.scaled(8);
}

.grid-size-input {
  min-width: variables.scaled(60);
  max-width: variables.scaled(80);
  text-align: center;
}

.grid-separator {
  color: #ddd;
  font-size: variables.scaled(16);
  font-weight: bold;
}

.setting-select {
  cursor: pointer;
}

.rules-container {
  display: flex;
  gap: variables.scaled(20);
  margin-top: variables.scaled(10);
}

.rules-column {
  flex: 1;
  min-height: variables.scaled(150);
}

.rules-column-title {
  margin: 0 0 variables.scaled(10) 0;
  font-size: variables.scaled(14);
  font-weight: bold;
  color: #ccc;
  text-align: center;
  padding-bottom: variables.scaled(5);
  border-bottom: calc(1 * var(--scale)) solid rgba(#666, 0.4);
}

.rules-list {
  border: calc(1 * var(--scale)) solid rgba(#666, 0.6);
  border-radius: calc(4 * var(--scale));
  background: rgba(#333, 0.8);
  height: variables.scaled(200);
  padding: variables.scaled(8);
  display: flex;
  flex-direction: column;
  gap: variables.scaled(6);
  overflow-y: auto;
}

.rule-item {
  padding: variables.scaled(8) variables.scaled(12);
  border-radius: calc(3 * var(--scale));
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: variables.scaled(8);

  &.enabled {
    background: rgba(#555, 0.8);
    border: calc(1 * var(--scale)) solid rgba(#777, 0.6);

    &:hover {
      background: rgba(#666, 0.8);
      border-color: rgba(#888, 0.8);
    }
  }

  &.available {
    background: rgba(#444, 0.6);
    border: calc(1 * var(--scale)) solid rgba(#666, 0.4);

    &:hover {
      background: rgba(#555, 0.8);
      border-color: rgba(#777, 0.6);
    }
  }
}

.rule-code {
  color: #fff;
  font-weight: bold;
  font-size: variables.scaled(12);
}

.rule-name {
  color: #ddd;
  font-size: variables.scaled(13);
  flex: 1;
}

.rule-type {
  color: #aaa;
  font-size: variables.scaled(11);
  font-style: italic;
}

.rules-empty {
  color: #888;
  font-size: variables.scaled(12);
  text-align: center;
  padding: variables.scaled(20);
  font-style: italic;
}

.setting-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #ddd;
  font-size: variables.scaled(14);

  input[type='checkbox'] {
    opacity: 0;
    position: absolute;
    cursor: pointer;
  }

  .checkmark {
    display: inline-block;
    width: variables.scaled(16);
    height: variables.scaled(16);
    background: rgba(#444, 0.8);
    border: calc(1 * var(--scale)) solid rgba(#666, 0.6);
    border-radius: calc(2 * var(--scale));
    margin-right: variables.scaled(8);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      display: none;
      left: variables.scaled(5);
      top: variables.scaled(2);
      width: variables.scaled(4);
      height: variables.scaled(8);
      border: solid white;
      border-width: 0 calc(2 * var(--scale)) calc(2 * var(--scale)) 0;
      transform: rotate(45deg);
    }
  }

  input:checked ~ .checkmark {
    background: rgba(#666, 0.8);
    border-color: rgba(#888, 0.8);

    &::after {
      display: block;
    }
  }

  &:hover .checkmark {
    background: rgba(#555, 0.8);
  }
}


// 游戏模式设置样式
.game-mode-container {
  width: 100%;
}

.game-mode-item {
  border: calc(2 * var(--scale)) solid rgba(#666, 0.4);
  border-radius: variables.scaled(8);
  padding: variables.scaled(12);
  margin-bottom: variables.scaled(12);
  background: rgba(#333, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: rgba(#888, 0.6);
    background: rgba(#444, 0.3);
  }

  &.active {
    border-color: var(--accent-color);
    background: rgba(var(--accent-color-rgb), 0.1);
  }
}

.game-mode-header {
  display: flex;
  align-items: center;
  margin-bottom: variables.scaled(8);
}

.game-mode-radio {
  margin-right: variables.scaled(8);
  width: variables.scaled(16);
  height: variables.scaled(16);
}

.game-mode-title {
  font-size: variables.scaled(16);
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  margin: 0;
}

.game-mode-description {
  font-size: variables.scaled(13);
  color: #ccc;
  line-height: 1.4;
  margin-left: variables.scaled(24);
}

.ultimate-options {
  margin-top: variables.scaled(12);
  padding-top: variables.scaled(12);
  border-top: calc(1 * var(--scale)) solid rgba(#666, 0.3);
  margin-left: variables.scaled(24);
}

.ultimate-option-item {
  margin-bottom: variables.scaled(8);

  &:last-child {
    margin-bottom: 0;
  }
}

.ultimate-checkbox {
  display: flex;
  align-items: flex-start;
  font-size: variables.scaled(12);
  color: #bbb;
  cursor: pointer;

  input[type="checkbox"] {
    margin-right: variables.scaled(6);
    margin-top: variables.scaled(2);
    flex-shrink: 0;
  }

  .checkmark {
    margin-right: variables.scaled(6);
    margin-top: variables.scaled(1);
  }
}

.ultimate-option-symbol {
  font-weight: bold;
  color: var(--accent-color);
  margin-right: variables.scaled(6);
  flex-shrink: 0;
}

.ultimate-option-desc {
  line-height: 1.3;
}

// 快捷键表格样式
.shortcut-table {
  border: calc(1 * var(--scale)) solid rgba(#666, 0.6);
  border-radius: calc(4 * var(--scale));
  background: rgba(#333, 0.8);
  overflow: hidden;
}

.shortcut-body {
  display: flex;
  flex-direction: column;
}

.shortcut-row {
  display: flex;
  border-bottom: calc(1 * var(--scale)) solid rgba(#555, 0.4);

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even) {
    background: rgba(#444, 0.3);
  }

  &:hover {
    background: rgba(#555, 0.5);
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
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: variables.scaled(15);
}

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

.shortcut-actions {
  display: flex;
  gap: variables.scaled(8);
  align-items: center;
}

.shortcut-empty {
  color: #888;
  font-style: italic;
  font-size: variables.scaled(12);
}

.shortcut-editing-tip {
  color: var(--accent-color);
  font-style: italic;
  font-size: variables.scaled(12);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.shortcut-note {
  margin-top: variables.scaled(12);
  padding: variables.scaled(10);
  background: rgba(#333, 0.5);
  border-radius: calc(4 * var(--scale));

  p {
    margin: variables.scaled(4) 0;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  small {
    color: #aaa;
    font-size: variables.scaled(12);
  }
}
</style>
