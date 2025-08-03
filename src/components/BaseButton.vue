<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    :title="tooltip"
    :type="buttonType"
    @click="$emit('click', $event)"
  >
    <!-- 图标插槽 -->
    <div v-if="$slots.icon || iconSvg" class="button-icon">
      <slot name="icon">
        <svg v-if="iconSvg" viewBox="0 0 24 24" class="svg-icon">
          <path :d="iconSvg" />
        </svg>
      </slot>
    </div>

    <div v-if="$slots.default" class="button-content">
      <slot />
    </div>

    <div v-if="$slots.secondary" class="button-secondary">
      <slot name="secondary" />
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'square' | 'simple' | 'bordered'
type ButtonType = 'button' | 'submit' | 'reset'

interface Props {
  variant?: ButtonVariant
  disabled?: boolean
  active?: boolean
  loading?: boolean
  tooltip?: string
  iconSvg?: string
  buttonType?: ButtonType
}

interface Emits {
  (_e: 'click', _event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bordered',
  disabled: false,
  active: false,
  loading: false,
  buttonType: 'button'
})

defineEmits<Emits>()

// 计算按钮样式类
const buttonClasses = computed(() => {
  const classes = ['base-button']

  // 变体样式
  classes.push(`button-${props.variant}`)

  // 状态样式
  if (props.active) classes.push('active')
  if (props.disabled) classes.push('disabled')
  if (props.loading) classes.push('loading')

  return classes
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.base-button {
  @include variables.button-base;
  display: flex;
  align-items: center;
  gap: variables.scaled(8);
  font-weight: bold;
  text-align: center;
  position: relative;
  overflow: hidden;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.loading {
    opacity: 0.7;
    cursor: wait;
  }
}

// 变体样式
.button-square {
  @include variables.square-size(0.6);
  @include variables.paint(var(--foreground-color), transparent);

  &:hover:not(:disabled) {
    background: var(--pointer-color);
  }

  &.active {
    @include variables.paint(var(--flag-color), transparent);
  }
}

.button-bordered {
  @include variables.paint(var(--foreground-color), transparent);

  &:hover:not(:disabled) {
    background: var(--pointer-color);
  }

  &.active {
    @include variables.paint(var(--flag-color), transparent);
  }
}

.button-simple {
  padding: variables.scaled(8) variables.scaled(16);
  border: none;
  min-width: variables.scaled(80);
  width: auto;
  display: inline-flex;
  justify-content: center;
  font-size: variables.scaled(12);
  @include variables.paint(white, rgba(#666, 0.8));

  &:hover:not(:disabled) {
    background: rgba(#888, 0.8);
  }
}

// 图标样式
.button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.svg-icon {
  @include variables.svg-icon(variables.scaled(20));
  fill: currentColor;
  stroke: currentColor;
}

// 内容样式
.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.button-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85em;
  opacity: 0.8;
}

// 方形按钮特殊样式
.button-square {
  .button-icon {
    width: 100%;
    height: 100%;
  }
}
</style>
