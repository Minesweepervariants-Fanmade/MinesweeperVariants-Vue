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
      <button class="control-btn" @click="onBrushClick">
        <img :src="svgUrls.brush">
      </button>
      <button class="control-btn" @click="onHintClick">
        <img :src="svgUrls.hint">
      </button>
      <button class="control-btn" @click="onCheckClick">
        <img :src="svgUrls.check">
      </button>
      <button class="control-btn" @click="onResetClick">
        <img :src="svgUrls.reset">
      </button>
      <button class="control-btn" @click="onMenuClick">
        <img :src="svgUrls.menu">
      </button>
    </div>

    <!-- 底部信息 -->
    <div class="bottom-info">
      <div class="star-section">
        <img :src="svgUrls.star" class="star-icon">
        <span class="game-info">[Q]5x5-10-9991 (终极模式 +F +A)</span>
      </div>
      <div class="levelCount">{{ levelCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAssets } from '@/composables/useAssets'
// 获取SVG URLs
const { getSvgUrls } = useAssets()
const svgUrls = getSvgUrls()

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
  z-index: 1000;
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
  @include variables.no-select;

  .control-btn {
    @include variables.square-size(0.5);
    @include variables.button-base;
    @include variables.no-select;

    &:hover {
      background: var(--pointer-color);
    }

    img {
      @include variables.svg-icon(variables.vw-vh-min(3, 4));
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
      @include variables.svg-icon(variables.vw-vh-min(3, 4));
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
