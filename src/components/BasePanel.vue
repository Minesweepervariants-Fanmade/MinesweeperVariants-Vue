<template>
  <div v-if="visible" class="panel-overlay" @click="onBackdropClick">
    <div
      :class="['panel-container']"
      @click.stop
    >
      <!-- 面板标题 -->
      <div v-if="title || $slots.title" class="panel-header">
        <slot name="title">
          <h3 class="panel-title">{{ title }}</h3>
        </slot>
        <BaseButton
          v-if="showCloseButton"
          variant="square"

          class="close-btn"
          @click="onClose"
        >×</BaseButton>
      </div>

      <!-- 面板内容 -->
      <div class="panel-content">
        <slot />
      </div>

      <!-- 面板操作按钮 -->
      <div v-if="showActions || $slots.actions" class="panel-actions">
        <slot name="actions">
          <BaseButton
            v-if="showCancelButton"
            variant="square"
            @click="onClose"
          >
            {{ cancelText }}
          </BaseButton>
          <BaseButton
            v-if="showConfirmButton"
            variant="square"
            @click="onConfirm"
          >
            {{ confirmText }}
          </BaseButton>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'

interface Props {
  visible: boolean
  title?: string
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
  showActions?: boolean
  showConfirmButton?: boolean
  showCancelButton?: boolean
  confirmText?: string
  cancelText?: string
  maxHeight?: string
  maxWidth?: string
}

interface Emits {
  (_e: 'confirm'): void
  (_e: 'close'): void
  (_e: 'update:visible', _value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  position: 'center',
  size: 'medium',
  transition: 'fade',
  closeOnBackdrop: true,
  showCloseButton: true,
  showActions: true,
  showConfirmButton: false,
  showCancelButton: true,
  confirmText: '确定',
  cancelText: '取消',
  maxHeight: '80vh',
})

const emit = defineEmits<Emits>()

// 事件处理
const onConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const onClose = () => {
  emit('close')
  emit('update:visible', false)
}

const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    onClose()
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  pointer-events: auto;
}

.panel-container {
  background: rgba(0, 0, 0, 0.9);
  border: variables.scaled(2) solid var(--foreground-color);
  border-radius: 0;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  max-height: v-bind(maxHeight);
  overflow: hidden;
}

// 位置样式
.panel-container {
  align-self: center;
  margin-left: auto;
  margin-right: variables.scaled(70);
}


// 面板头部
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: variables.scaled(20) variables.scaled(20) variables.scaled(10) variables.scaled(20);
  border-bottom: variables.scaled(1) solid var(--foreground-color);

  .panel-title {
    color: var(--foreground-color);
    font-size: variables.scaled(18);
    font-weight: bold;
    margin: 0;
  }

  .close-btn {
    margin-left: auto;
  }
}

// 面板内容
.panel-content {
  flex: 1;
  padding: variables.scaled(20);
  overflow-y: auto;
}

// 面板操作按钮
.panel-actions {
  display: flex;
  justify-content: center;
  gap: variables.scaled(12);
  padding: variables.scaled(15) variables.scaled(20) variables.scaled(20) variables.scaled(20);
  border-top: variables.scaled(1) solid var(--foreground-color);
}

</style>
