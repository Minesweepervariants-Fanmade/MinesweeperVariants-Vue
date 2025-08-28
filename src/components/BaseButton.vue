<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    :title="tooltip"
    :type="buttonType"
    @click="(event) => { $emit('click', event); showMark(event); }"
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

function showMark(e?: Event) {
  const el = document.createElement('div')
  el.className = 'floating-mark'

  const marks = [
    { char: '❤', color: '#995555' },
    { char: '★', color: '#ffb400' },
    { char: '✦', color: '#66bb6a' },
    { char: '✿', color: '#ea6ea6' },
    { char: '➤', color: '#4da6ff' },
    { char: '⚑', color: '#d95f5f' },
    { char: '☼', color: '#ffd166' },
    { char: '☯', color: '#8e7cc3' },
    { char: '☮', color: '#56c0bf' },
    { char: '☺', color: '#ff8a65' },
    { char: '✪', color: '#f48fb1' },
    { char: '✶', color: '#a3d977' },
    { char: '✺', color: '#6ec6ff' },
    { char: '❄', color: '#9fd3ff' },
    { char: '☁', color: '#b0bec5' },
    { char: '☂', color: '#4db6ac' },
    { char: '☾', color: '#8c9eff' },
    { char: '☀', color: '#ffd54f' },
    { char: '✈', color: '#90caf9' },
    { char: '☘', color: '#66bb6a' }
  ]

  let idx: number
  const today = new Date()
  if (today.getFullYear() === 2025 && today.getMonth() === 7 && today.getDate() === 29 && Math.random() < 0.5) {
    idx = 0
  } else {
    idx = Math.floor(Math.random() * (marks.length))
  }

  const pick = marks[idx]

  el.textContent = pick.char
  el.style.color = pick.color

  let x = window.innerWidth / 2
  let y = window.innerHeight / 2
  const ev = e as MouseEvent
  if (ev && typeof ev.clientX === 'number') {
    x = ev.clientX
    y = ev.clientY
  }

  el.style.left = `${x}px`
  el.style.top = `${y}px`

  document.body.appendChild(el)
  void el.offsetHeight
  el.classList.add('floating-mark--active')

  setTimeout(() => {
    el.remove()
  }, 800)
}
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

  &:hover:not(:disabled):not(:active) {
    background: rgba(#888, 0.8);
  }

  &:active {
    background: rgba(#555, 0.8);
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

<style lang="scss">
@use '@/styles/variables';

.floating-mark {
  position: fixed;
  pointer-events: none;
  font-size: variables.scaled(15);
  opacity: 0;
  transform: translate(-50%, 50%) scale(0.2);
  transition: transform 0.9s cubic-bezier(.22,.9,.23,1), opacity 0.9s ease;
  text-shadow: 0 variables.scaled(2) variables.scaled(6) rgba(0,0,0,0.45);
}

.floating-mark--active {
  opacity: 1;
  transform: translate(-50%, -150%) scale(1.2);
}
</style>
