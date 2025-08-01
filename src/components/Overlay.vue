<template>
  <div class="game-overlay">
    <!-- 规则信息 -->
    <div class="rules">
      <div class="rule-line">
        <u><span class="rule-key">[R]</span> 总雷数</u>：
        <span class="mine-count"> {{ mineCount ?? '*' }} </span>
        (剩余雷数/格数：<span class="remaining">{{ remainingMines ?? '*' }}/{{ remainingCells }}</span>)
      </div>
      <div class="rule-line">
        <u><span class="rule-key">[Q]</span> 无方</u>：每个2x2区域内都至少有一个雷
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <BaseButton variant="square" @click="onBrushClick">
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
import { ref, onMounted } from 'vue'
import { useAssets } from '@/composables/useAssets'
import BaseButton from './BaseButton.vue'

// 获取资源管理器
const { cloneAsset } = useAssets()

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
}

withDefaults(defineProps<Props>(), {
  levelCount: '10/10',
  remainingCells: 21,
})

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
