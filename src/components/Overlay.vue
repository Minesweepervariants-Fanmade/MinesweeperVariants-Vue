<template>
  <div class="game-overlay">
    <!-- 规则信息 -->
    <div class="rules">
      <div class="rule-line mine-count">
        <u><span class="rule-key">[R]</span> 总雷数</u>：{{ mineCount }} / {{ remainingMines }} (剩余雷数/格数)
      </div>
      <template v-for="(rule, _idx) in rules" :key="_idx">
        <div class="rule-line">
          <u><span class="rule-key">[{{ rule.code }}]</span> {{ rule.name }}</u>：{{ rule.desc }}
        </div>
      </template>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <BaseButton variant="square" :active="props.showDrawingToolbar" @click="onBrushClick">
        <template #icon>
          <div ref="brushIcon" class="icon-container" />
        </template>
      </BaseButton>
      <BaseButton variant="square" @click="onHintClick">
        <template #icon>
          <div ref="hintIcon" class="icon-container" />
        </template>
      </BaseButton>
      <BaseButton variant="square" @click="onCheckClick">
        <template #icon>
          <div ref="checkIcon" class="icon-container" />
        </template>
      </BaseButton>
      <BaseButton variant="square" @click="onResetClick">
        <template #icon>
          <div ref="resetIcon" class="icon-container" />
        </template>
      </BaseButton>
      <BaseButton variant="square" @click="onMenuClick">
        <template #icon>
          <div ref="menuIcon" class="icon-container" />
        </template>
      </BaseButton>
    </div>

    <!-- 底部信息 -->
    <div class="bottom-info">
      <div class="star-section">
        <div ref="starIcon" class="icon-container star-icon" />
        <span class="game-info">[Q]5x5-10-9991 (终极模式 +F +A)</span>
      </div>
      <div class="levelCount">{{ levelCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAssets } from '@/composables/useAssets'
import { useGameLogic } from '@/composables/useGameLogic'
import BaseButton from './BaseButton.vue'

// 获取资源管理器
const { cloneAsset } = useAssets()

// 获取游戏逻辑
const { metadata } = useGameLogic()

// 规则类型定义
type RuleType = 'lRule' | 'mRule' | 'rRule' | 'oRule'

// 获取缓存的规则定义
const RULES_STORAGE_KEY = 'minesweeper_rules_cache'
const getRuleDefinitions = (): Record<string, [RuleType, string, string]> => {
  const cachedRules = localStorage.getItem(RULES_STORAGE_KEY)
  if (cachedRules) {
    try {
      const parsed = JSON.parse(cachedRules)
      if (parsed && typeof parsed === 'object') {
        const definitions: Record<string, [RuleType, string, string]> = {}
        for (const [code, arr] of Object.entries(parsed)) {
          if (Array.isArray(arr) && arr.length >= 3) {
            definitions[code] = arr as [RuleType, string, string]
          }
        }
        return definitions
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return {}
}

// 图标容器的引用
const brushIcon = ref<HTMLElement>()
const hintIcon = ref<HTMLElement>()
const checkIcon = ref<HTMLElement>()
const resetIcon = ref<HTMLElement>()
const menuIcon = ref<HTMLElement>()
const starIcon = ref<HTMLElement>()

// 渲染图标
const renderIcon = async (container: HTMLElement | undefined, assetName: 'brush' | 'hint' | 'check' | 'reset' | 'menu' | 'star') => {
  if (!container) return

  const iconSvg = await cloneAsset(assetName)
  if (iconSvg) {
    // 清空容器
    container.innerHTML = ''

    // 设置SVG样式
    iconSvg.style.width = '100%'
    iconSvg.style.height = '100%'
    iconSvg.style.display = 'block'
    iconSvg.style.maxWidth = '100%'
    iconSvg.style.maxHeight = '100%'

    // 设置内部元素颜色
    const innerElements = iconSvg.querySelectorAll('.inner')
    innerElements.forEach(innerElement => {
      (innerElement as HTMLElement).style.fill = 'var(--foreground-color)'
    })

    container.appendChild(iconSvg)
  }
}

// 在组件挂载后渲染所有图标
onMounted(async () => {
  await renderIcon(brushIcon.value, 'brush')
  await renderIcon(hintIcon.value, 'hint')
  await renderIcon(checkIcon.value, 'check')
  await renderIcon(resetIcon.value, 'reset')
  await renderIcon(menuIcon.value, 'menu')
  await renderIcon(starIcon.value, 'star')
})


// 定义 props
interface Props {
  levelCount?: string
  mineCount?: number
  remainingMines?: number
  remainingCells?: number
  showDrawingToolbar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  levelCount: '10/10',
  remainingCells: 21,
  showDrawingToolbar: false,
})

// 规则项类型
interface RuleItem {
  code: string
  name: string
  desc: string
}

// 响应式规则列表
const rules = ref<RuleItem[]>([])

// 动态添加规则函数
function addRule(code: string, name: string, desc: string) {
  rules.value.push({ code, name, desc })
}

// 处理metadata中的规则
const processMetadataRules = () => {
  if (!metadata.value?.rules) return

  // 清空现有规则
  rules.value.length = 0

  // 获取规则定义
  const ruleDefinitions = getRuleDefinitions()

  // 遍历metadata中的规则列表
  for (const ruleCode of metadata.value.rules) {
    const definition = ruleDefinitions[ruleCode]
    if (definition) {
      // definition是[RuleType, string, string]格式，其中第二个是名称，第三个是描述
      addRule(ruleCode, definition[1], definition[2])
    }
  }
}

// 监听metadata变化
watch(metadata, processMetadataRules, { immediate: true })

// 规则项类型
// （已由响应式规则和addRule函数替代，见上方定义）

// 定义 emits
interface Emits {
  brushClick: []
  hintClick: []
  checkClick: []
  resetClick: []
  menuClick: []
}

const emit = defineEmits<Emits>()

// 控制按钮事件处理
const onBrushClick = () => emit('brushClick')
const onHintClick = () => emit('hintClick')
const onCheckClick = () => emit('checkClick')
const onResetClick = () => emit('resetClick')
const onMenuClick = () => emit('menuClick')
</script>

<style lang="scss" scoped>
@use '@/styles/variables';

.game-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

// 顶部规则说明
.rules {
  @include variables.absolute-position(variables.scaled(20), null, null, variables.scaled(20));
  color: var(--foreground-color);
  font-size: variables.scaled(20);

  .rule-line {
    margin-bottom: variables.scaled(5);

    u {
      text-decoration-thickness: variables.scaled(1);
    }

    .rule-key {
      color: var(--foreground-color);
      font-weight: bold;
      font-size: variables.scaled(18);
    }
  }

  .mine-count,
  .remaining {
    color: var(--foreground-color);
    font-weight: bold;
  }
}

// 右侧控制按钮
.controls {
  @include variables.absolute-position(variables.scaled(20), variables.scaled(20));
  display: flex;
  gap: variables.scaled(10);
  align-items: center;

  .icon-container {
    @include variables.svg-icon(variables.vw-vh-min(3, 4));
    @include variables.flex-center;
  }
}

// 底部信息
.bottom-info {
  @include variables.absolute-position(
    null,
    variables.scaled(20),
    variables.scaled(20),
    variables.scaled(20)
  );
  display: flex;
  justify-content: space-between;
  align-items: center;

  .star-section {
    display: flex;
    align-items: center;
    gap: variables.scaled(10);

    .star-icon {
      @include variables.svg-icon(variables.vw-vh-min(3, 4));
      @include variables.flex-center;
    }

    .game-info {
      color: var(--hint2-color);
      font-size: variables.scaled(16);
    }
  }

  .levelCount {
    color: var(--error-color);
    font-size: variables.scaled(18);
    font-weight: bold;
  }
}
</style>
