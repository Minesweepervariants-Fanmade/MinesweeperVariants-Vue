<template>
  <Teleport to="body">
    <div v-if="visible" class="info-overlay" @click="onBackdropClick">
      <div class="info-container" @click.stop>
        <button class="close-btn" type="button" @click="onConfirm">x</button>
        <div class="info-content">
          <h3 v-if="title" class="info-title">{{ title }}</h3>
          <div class="info-message">
            <slot>{{ message }}</slot>
          </div>
        </div>
        <div class="info-actions">
          <button class="confirm-btn" type="button" @click="onConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean
  title?: string
  message?: string
  confirmText?: string
  closeOnBackdrop?: boolean
}

interface Emits {
  (_e: 'confirm'): void
  (_e: 'close'): void
  (_e: 'update:visible', _value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  message: '',
  confirmText: '确定',
  closeOnBackdrop: true,
})

const emit = defineEmits<Emits>()

const onConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
  emit('close')
}

const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('update:visible', false)
    emit('close')
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.info-container {
  background: rgba(#333, 0.8);
  border: calc(4 * var(--scale)) solid rgba(#666, 0.8);
  min-width: 80%;
  max-width: 80%;
  width: 80%;
  height: 80%;
  min-height: 80%;
  max-height: 80%;
  color: white;
  position: absolute;
}

.close-btn {
  position: absolute;
  top: variables.scaled(8);
  right: variables.scaled(12);
  background: rgba(#666, 0.8);
  color: white;
  border: none;
  font-size: variables.scaled(20);
  font-weight: bold;
  cursor: pointer;
  padding: variables.scaled(4) variables.scaled(8);
  line-height: 1;

  &:hover {
    background: rgba(#888, 0.8);
  }
}

.info-content {
  padding: variables.scaled(40) variables.scaled(30) variables.scaled(20);
}

.info-title {
  margin: 0 0 variables.scaled(15) 0;
  font-size: variables.scaled(20);
  font-weight: bold;
  color: white;
}

.info-message {
  color: #ddd;
  line-height: 1.5;
  font-size: variables.scaled(16);
}

.info-actions {
  position: absolute;
  padding: variables.scaled(15) variables.scaled(30) variables.scaled(25);
  text-align: center;
  right: 0;
  bottom: 0;
}

.confirm-btn {
  color: white;
  background: rgba(#666, 0.8);
  font-weight: bold;
  border: none;
  padding: variables.scaled(10) variables.scaled(24);
  font-size: variables.scaled(16);
  cursor: pointer;
  min-width: variables.scaled(100);

  &:hover {
    background: #666;
    border-color: #888;
  }

  &:active {
    background: #444;
  }
}
</style>
