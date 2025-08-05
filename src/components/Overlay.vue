<template>
  <div class="game-overlay">
    <!-- 规则信息 -->
    <div class="rules">
      <div class="rule-line mine-count">
        <u>[R] 总雷数</u>: &nbsp;{{ metadata?.count?.known ?? '*' }} &nbsp; (剩余雷数/格数: {{ metadata?.count?.remains ?? '*' }}/{{ metadata?.count?.unknown ?? '?' }})
      </div>
      <template v-for="(rule, _idx) in rules" :key="_idx">
        <div class="rule-line">
          <u>[{{ rule.code }}] {{ rule.name }}</u>: &nbsp;{{ rule.desc }}
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
          <div class="hint-icon-wrapper">
            <div ref="hintIcon" class="icon-container" :class="{ 'hint-loading': isHintLoading }" />
            <LoadingSpinner :visible="isHintLoading" size="small" :delay="settings.loadingSpinnerDelay / 1000" />
          </div>
        </template>
      </BaseButton>
      <BaseButton variant="square" @click="onCheckClick">
        <template #icon>
          <div class="check-icon-wrapper">
            <div ref="checkIcon" class="icon-container" :class="{ 'check-loading': isCheckLoading }" />
            <LoadingSpinner :visible="isCheckLoading" size="small" :delay="settings.loadingSpinnerDelay / 1000" />
          </div>
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
      <div class="star-section" :style="starSectionStyle">
        <div ref="starIcon" class="icon-container star-icon" />
        <span class="game-info">{{ gameInfoText }}</span>
      </div>
      <div class="levelCount">{{ levelCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { cloneAsset } from '@/composables/useAssets'
import { useGameConfig } from '@/composables/useGameConfig'
import { useSettings } from '@/composables/useSettings'
import { postHint, showNextHint } from '@/utils/hintUtils'
import BaseButton from '@/components/BaseButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useRules } from '@/utils/ruleUtils'

// 获取游戏配置
const { noFail, gameMode, metadata, hints } = useGameConfig()

// 获取设置
const { settings } = useSettings()

// 获取规则
const { rules } = useRules()

// 计算游戏信息字符串
const gameInfoText = computed(() => {
  // 构建规则部分：[Q][V]...
  const gameRules = metadata.value?.rules ?? []
  const rulesText = gameRules.map((rule: string) => `[${rule}]`).join('') || '[Q]'

  // 获取题板大小
  let boardSize = '?x?'
  if (metadata.value?.boards) {
    const boards = Object.values(metadata.value.boards)
    if (boards.length > 0) {
      const [rows, cols] = boards[0].size // 取第一个board的尺寸
      boardSize = `${rows}x${cols}`
    }
  }

  // 获取总雷数
  const totalMines = metadata.value?.count?.total ?? 10

  // 题板ID，暂时设置为默认值114514
  const gameId = '114514'

  // 构建游戏信息：[Q][V]5x5-10-114514
  const basicInfo = `${rulesText}${boardSize}-${totalMines}-${gameId}`

  // 获取游戏模式文本
  let modeText = ''
  if (gameMode.value === 'normal') {
    modeText = '普通模式'
  } else if (gameMode.value === 'expert') {
    modeText = '专家模式'
  } else if (gameMode.value === 'ultimate') {
    modeText = '终极模式'
  }

  // 获取终极模式子选项
  let ultimateModeOptions = ''
  if (gameMode.value === 'ultimate' && settings.value.ultimateModeOptions) {
    const options = []
    if (settings.value.ultimateModeOptions.forceFlag) options.push('+F')
    if (settings.value.ultimateModeOptions.autoHint) options.push('+A')
    if (settings.value.ultimateModeOptions.showMineCount) options.push('+R')
    if (settings.value.ultimateModeOptions.forceSide) options.push('+S')
    if (settings.value.ultimateModeOptions.hideRemaining) options.push('+!')
    ultimateModeOptions = options.length > 0 ? ` ${options.join(' ')}` : ''
  }

  return `${basicInfo} (${modeText}${ultimateModeOptions})`
})

// 计算星星样式
const starSectionStyle = computed(() => {
  let modeColor = 'var(--foreground-color)' // 默认前景色（普通模式）

  if (gameMode.value === 'expert') {
    modeColor = 'var(--flag-color)' // 专家模式对应旗帜颜色
  } else if (gameMode.value === 'ultimate') {
    modeColor = 'var(--error-color)' // 终极模式对应错误颜色
  }

  const starColor = noFail.value ? modeColor : 'transparent'

  return {
    '--mode-color': modeColor,
    '--star': starColor
  }
})

// 图标容器的引用
const brushIcon = ref<HTMLElement>()
const hintIcon = ref<HTMLElement>()
const checkIcon = ref<HTMLElement>()
const resetIcon = ref<HTMLElement>()
const menuIcon = ref<HTMLElement>()
const starIcon = ref<HTMLElement>()

// 加载状态
const isHintLoading = ref(false)
const isCheckLoading = ref(false)

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
  showDrawingToolbar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  levelCount: '10/10',
  showDrawingToolbar: false
})

// 定义 emits
interface Emits {
  brushClick: []
  checkClick: [setLoading: (_loading: boolean) => void]
  resetClick: []
  menuClick: []
}

const emit = defineEmits<Emits>()

// 控制按钮事件处理
const onBrushClick = () => emit('brushClick')
const onHintClick = async () => {
  const setLoading = (loading: boolean) => {
    isHintLoading.value = loading
  }

  // 如果 hints 是空的，就获取新的提示
  if (!hints.value || hints.value.length === 0) {
    await postHint(setLoading)
  } else {
    // 否则显示下一个提示
    showNextHint()
  }
}
const onCheckClick = () => {
  const setLoading = (loading: boolean) => {
    isCheckLoading.value = loading
  }
  emit('checkClick', setLoading)
}
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
      text-decoration-thickness: 0;
      text-decoration-color: rgba(255,255,255, 0.5);
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

  .hint-icon-wrapper {
    position: relative;
    @include variables.svg-icon(variables.vw-vh-min(3, 4));
    @include variables.flex-center;

    .icon-container {
      transition: opacity 0.2s ease;

      &.hint-loading {
        opacity: 0.3;
      }
    }
  }

  .check-icon-wrapper {
    position: relative;
    @include variables.svg-icon(variables.vw-vh-min(3, 4));
    @include variables.flex-center;

    .icon-container {
      transition: opacity 0.2s ease;

      &.check-loading {
        opacity: 0.3;
      }
    }
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
      @include variables.svg-icon(variables.scaled(30));
      @include variables.flex-center;
      overflow: visible;

      > * {
        overflow: visible;

        > * {
          stroke: var(--mode-color);
          stroke-width: variables.scaled(30);
          fill: var(--star) !important;
        }
    }
    }

    .game-info {
      color: var(--mode-color);
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
