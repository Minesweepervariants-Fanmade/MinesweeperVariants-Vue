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
              :min="1"
            >
            <span class="grid-separator">×</span>
            <input
              v-model.number="localSettings.gridHeight"
              type="number"
              class="setting-input grid-size-input"
              :min="1"
            >
          </div>
        </div>
        <div class="setting-item">
          <label class="setting-label">地雷数量：</label>
          <input
            v-model.number="localSettings.mineCount"
            type="number"
            class="setting-input"
            :min="-1"
          >
        </div>
        <div class="setting-item">
          <label class="setting-label">种子：</label>
          <div class="setting-input-wrapper">
            <input
              v-model="localSettings.seed"
              type="text"
              class="setting-input"
              placeholder="任意字符串"
            >
            <BaseButton variant="simple" size="small" @click="generateRandomSeed">随机</BaseButton>
            <BaseButton variant="simple" size="small" @click="clearSeed">清空</BaseButton>
          </div>
        </div>
      </div>


      <div class="setting-section">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 class="section-title" style="margin-bottom: 0;">游戏规则</h4>
          <div class="rule-input">
            <input
              v-model="newRuleInput"
              type="text"
              class="setting-input"
              placeholder="输入规则代码"
              @keyup.enter="handleAddRule"
            >
            <BaseButton variant="simple" size="small" @click="handleAddRule">添加</BaseButton>
            <BaseButton variant="simple" size="small" style="margin-bottom: 0;" @click="handleFetchRules">更新</BaseButton>
          </div>
        </div>
        <div class="rules-container">
          <!-- 启用的规则 -->
          <div class="rules-column">
            <h5 class="rules-column-title">已启用</h5>
            <div class="rules-list">
              <div
                v-for="rule in enabledRules"
                :key="rule.code"
                class="rule-item enabled"
                :title="rule.description"
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
                :title="rule.description"
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
              v-for="mode in (['normal', 'expert', 'ultimate', 'puzzle'] as const)"
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
                  @click.stop
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
            <option
              v-for="opt in themeOptions"
              :key="opt.value"
              :value="opt.value"
            >{{ opt.label }}</option>
          </select>
        </div>
        <div v-if="localSettings.theme === 'custom'" class="setting-item">
          <label class="setting-label">自定义主题：</label>
          <table class="custom-theme-table">
            <tbody>
              <tr>
                <td>背景颜色</td>
                <td><input v-model="localSettings.customTheme.backgroundColor" type="color"></td>
                <td>前景颜色</td>
                <td><input v-model="localSettings.customTheme.foregroundColor" type="color"></td>
              </tr>
              <tr>
                <td>错误颜色</td>
                <td><input v-model="localSettings.customTheme.errorColor" type="color"></td>
                <td>提示颜色</td>
                <td><input v-model="localSettings.customTheme.hintColor" type="color"></td>
              </tr>
              <tr>
                <td>第二提示颜色</td>
                <td><input v-model="localSettings.customTheme.hint2Color" type="color"></td>
                <td>旗帜颜色</td>
                <td><input v-model="localSettings.customTheme.flagColor" type="color"></td>
              </tr>
              <tr>
                <td>指针颜色</td>
                <td><input v-model="localSettings.customTheme.pointerColorBase" type="color"></td>
                <td>指针不透明度</td>
                <td><input
                  v-model.number="localSettings.customTheme.pointerAlpha"
                  class="setting-input"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                ></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="setting-item">
          <label class="setting-label">背景图片：</label>
          <input v-if="!localSettings.backgroundImage" type="file" accept="image/*" class="setting-input" @change="onBackgroundImageChange">
          <div v-if="localSettings.backgroundImage" class="background-image-preview-wrapper" @click="clearBackgroundImage">
            <img :src="localSettings.backgroundImage" class="background-image-preview">
            <span class="background-image-clear">✖</span>
          </div>
        </div>
        <div v-if="localSettings.backgroundImage" class="setting-item">
          <label class="setting-label">背景图片CSS：</label>
          <textarea
            v-model="localSettings.backgroundImageCss"
            class="setting-input"
            placeholder="输入css"
            rows="2"
            style="resize: both;"
          />
          <span class="setting-note" />
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
        <div class="setting-item">
          <label class="setting-checkbox">
            <input v-model="localSettings.showDescription" type="checkbox">
            <span class="checkmark" />
            显示描述
          </label>
          <span class="setting-note">控制规则位置是否显示描述文本</span>
        </div>
        <div class="setting-item">
          <label class="setting-label">加载动画延迟(毫秒)：</label>
          <input
            v-model.number="localSettings.loadingSpinnerDelay"
            type="number"
            class="setting-input"
            :min="0"
            :max="5000"
            :step="50"
          >
          <span class="setting-note">加载动画显示前的延迟时间，延迟大时可调为0</span>
        </div>
      </div>

      <!-- 开发者设置 -->
      <div class="setting-section">
        <h4 class="section-title">开发者设置</h4>
        <div class="setting-item">
          <label class="setting-checkbox">
            <input v-model="localSettings.ignoreVersionErrors" type="checkbox">
            <span class="checkmark" />
            忽略版本错误
          </label>
          <span class="setting-note">启用后会在某些版本检测或兼容性校验中忽略错误提示（仅供开发调试使用）</span>
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
        <ShortcutSettings
          ref="shortcutSettingsRef"
          :keyboard-shortcuts="localSettings.keyboardShortcuts"
          :mouse-shortcuts="localSettings.mouseShortcuts"
          @update:keyboard-shortcuts="(shortcuts) => localSettings.keyboardShortcuts = shortcuts"
          @update:mouse-shortcuts="(shortcuts) => localSettings.mouseShortcuts = shortcuts"
        />
      </div>
    </div>

    <template #actions>
      <BaseButton variant="simple" @click="onReset">重置默认</BaseButton>
      <BaseButton variant="simple" @click="onSave">保存</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import ShortcutSettings from '@/components/ShortcutSettings.vue'
import type { GameSettings, GameMode, UltimateModeOptions } from '@/composables/useSettings'
import { defaultSettings, gameModeDescriptions, ultimateModeOptionDescriptions, useSettings } from '@/composables/useSettings'
import { generateRandomSeedString } from '@/utils/gameUtils'

import { useTheme } from '@/composables/useTheme'
import { RULE_DEFINITIONS, fetchEndpointRules, type RuleType } from '@/utils/ruleUtils'

const { updateSettings } = useSettings()

// 主题管理
const { setTheme, setCustomTheme, themeOptions } = useTheme()

// 快捷键设置组件引用
const shortcutSettingsRef = ref<InstanceType<typeof ShortcutSettings>>()

interface Props {
  visible?: boolean
  settings?: GameSettings
  closeOnBackdrop?: boolean
}

interface Emits {
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
const localSettings = ref({ ...props.settings })

// 背景图片上传处理
function onBackgroundImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    localSettings.value.backgroundImage = reader.result as string
  }
  reader.readAsDataURL(file)
}

function clearBackgroundImage() {
  localSettings.value.backgroundImage = ''
}

// 监听主题变化并应用到系统
watch(
  () => localSettings.value.theme,
  (newTheme) => {
    if (newTheme) {
      setTheme(newTheme)
      // 如果是自定义主题，应用自定义变量
      if (newTheme === 'custom' && localSettings.value.customTheme) {
        setCustomTheme(localSettings.value.customTheme)
      }
    }
  }
)

// 监听自定义主题字段变化，实时更新 CSS 变量
watch(
  () => localSettings.value.customTheme,
  (customTheme) => {
    if (localSettings.value.theme === 'custom' && customTheme) {
      // 自动拼接 pointerColor
      if (customTheme.pointerColorBase && typeof customTheme.pointerAlpha === 'number') {
        // 解析 hex 或 rgb
        let r = 255, g = 255, b = 255;
        const hex = customTheme.pointerColorBase;
        if (/^#([\da-fA-F]{6})$/.test(hex)) {
          r = parseInt(hex.slice(1,3),16);
          g = parseInt(hex.slice(3,5),16);
          b = parseInt(hex.slice(5,7),16);
        }
        customTheme.pointerColor = `rgba(${r},${g},${b},${customTheme.pointerAlpha})`;
      }
      setCustomTheme(customTheme)
    }
  },
  { deep: true }
)


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
    .filter(({ code, type, name, description }) =>
      `${code}, ${type}, ${name}, ${description}`
        .toLowerCase()
        .includes(newRuleInput.value.toLowerCase())
    )
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

// 处理获取规则的错误
const handleFetchRules = async () => {
  try {
    await fetchEndpointRules()
  } catch (e) {
    alert(`拉取规则失败: ${e instanceof Error ? e.message : e}`)
  }
}

// 手动添加/启用规则输入
const newRuleInput = ref('')

const handleAddRule = () => {
  const raw = (newRuleInput.value || '').trim()
  if (!raw) return
  const code = raw

  enableRule(code)
  newRuleInput.value = ''
  return
}

const onSave = () => {
  updateSettings(localSettings.value)
}

const onClose = () => {
  // 恢复到原始设置
  localSettings.value = { ...props.settings }
  emit('close')
}

const selectGameMode = (mode: GameMode) => {
  localSettings.value.gameMode = mode
}

const onReset = () => {
  localSettings.value = defaultSettings
}

// 暴露快捷键设置组件引用和关闭/保存方法，确保父组件通过 ref 访问安全
defineExpose({
  shortcutSettingsRef,
  onSave,
  onClose
})

// 随机种子生成函数
function generateRandomSeed() {
  localSettings.value.seed = generateRandomSeedString()
}

// 清空种子内容
function clearSeed() {
  localSettings.value.seed = ''
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.custom-theme-table {
  border-collapse: separate;
  border-spacing: 0 variables.scaled(6);
  width: auto;
  td {
    padding: 0 variables.scaled(8);
    font-size: variables.scaled(14);
    color: #ddd;
    vertical-align: middle;
    white-space: nowrap;
  }
  td:nth-child(2), td:nth-child(4) {
    min-width: variables.scaled(120);
    width: variables.scaled(160);
    max-width: variables.scaled(200);
  }
  input[type="color"] {
    width: variables.scaled(32);
    height: variables.scaled(32);
    background-color: transparent;
    border: 0;
    inline-size: variables.scaled(32);
    block-size: variables.scaled(32);
  }
  input[type="number"] {
    width: variables.scaled(60);
    min-width: variables.scaled(40);
    max-width: variables.scaled(80);
    text-align: center;
  }
}

.settings-title {
  margin: 0 0 variables.scaled(20) 0;
  font-size: variables.scaled(24);
  font-weight: bold;
  color: white;
  text-align: center;
}

.settings-content {
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
  border-bottom: calc(variables.scaled(1)) solid rgba(#666, 0.6);
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
  border: calc(variables.scaled(1)) solid rgba(#666, 0.6);
  color: white;
  padding: variables.scaled(6) variables.scaled(10);
  font-size: variables.scaled(14);
  border-radius: calc(variables.scaled(2));
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
  color: #aaa;
  font-size: variables.scaled(12);
  font-style: italic;

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

.setting-input-wrapper {
  display: flex;
  align-items: center;
  gap: variables.scaled(6);
}

.setting-unit {
  color: #aaa;
  font-size: variables.scaled(12);
  font-style: italic;
}

.setting-select {
  cursor: pointer;
}

.rule-input {
  min-width: variables.scaled(160);
  display: flex;
  align-items: center;
  gap: variables.scaled(10);
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
  border-bottom: calc(variables.scaled(1)) solid rgba(#666, 0.4);
}

.rules-list {
  border: calc(variables.scaled(1)) solid rgba(#666, 0.6);
  border-radius: calc(variables.scaled(4));
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
  border-radius: calc(variables.scaled(3));
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: variables.scaled(8);

  &.enabled {
    background: rgba(#555, 0.8);
    border: calc(variables.scaled(1)) solid rgba(#777, 0.6);

    &:hover {
      background: rgba(#666, 0.8);
      border-color: rgba(#888, 0.8);
    }
  }

  &.available {
    background: rgba(#444, 0.6);
    border: calc(variables.scaled(1)) solid rgba(#666, 0.4);

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
    border: calc(variables.scaled(1)) solid rgba(#666, 0.6);
    border-radius: calc(variables.scaled(2));
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
      border-width: 0 calc(variables.scaled(2)) calc(variables.scaled(2)) 0;
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
  border: calc(variables.scaled(2)) solid rgba(#666, 0.4);
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
  border-top: calc(variables.scaled(1)) solid rgba(#666, 0.3);
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
  border: calc(variables.scaled(1)) solid rgba(#666, 0.6);
  border-radius: calc(variables.scaled(4));
  background: rgba(#333, 0.8);
  overflow: hidden;
}

.shortcut-body {
  display: flex;
  flex-direction: column;
}

.shortcut-row {
  display: flex;
  border-bottom: calc(variables.scaled(1)) solid rgba(#555, 0.4);

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
  border-right: calc(variables.scaled(1)) solid rgba(#555, 0.4);

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
  border-radius: calc(variables.scaled(4));
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
  border-radius: calc(variables.scaled(4));
  border: calc(variables.scaled(1)) solid transparent;
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
  border: calc(variables.scaled(1)) solid rgba(#777, 0.6);
  border-radius: calc(variables.scaled(3));
  box-shadow: 0 calc(variables.scaled(1)) calc(variables.scaled(2)) rgba(#000, 0.3);
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
  border: calc(variables.scaled(1)) solid rgba(#555, 0.8);
  color: white;
  padding: variables.scaled(6) variables.scaled(10);
  font-size: variables.scaled(12);
  border-radius: calc(variables.scaled(2));
  outline: none;

  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 calc(variables.scaled(4)) rgba(var(--accent-color-rgb), 0.3);
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
  border-radius: calc(variables.scaled(4));

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
.background-image-preview-wrapper {
  display: inline-block;
  position: relative;
  cursor: pointer;

  &:hover .background-image-preview {
    filter: brightness(0.6);
  }

  &:hover .background-image-clear {
    display: block;
  }
}

.background-image-preview {
  max-width: variables.scaled(120);
  max-height: variables.scaled(90);
  object-fit: cover;
  border-radius: variables.scaled(4);
  transition: filter 0.1s;
  display: block;
}

.background-image-clear {
  display: none;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: variables.scaled(32);
  height: variables.scaled(32);
  color: #fff;
  font-size: variables.scaled(20);
  text-shadow: 0 0 variables.scaled(2) #000, 0 0 variables.scaled(4) #000;
  text-align: center;
}

input[type="color"] {
  width: variables.scaled(32);
  height: variables.scaled(32);
  background-color: transparent;
  border: 0;
  inline-size: variables.scaled(32);
  block-size: variables.scaled(32);
}

</style>
