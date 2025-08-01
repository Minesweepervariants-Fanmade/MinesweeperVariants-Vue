<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="onBackdropClick">
      <div class="modal-container" @click.stop>
        <button v-if="showCloseButton" class="close-btn" type="button" @click="onClose">×</button>
        <div class="modal-content">
          <slot />
        </div>
        <div v-if="showActions" class="modal-actions">
          <slot name="actions">
            <button v-if="showConfirmButton" class="confirm-btn" type="button" @click="onConfirm">
              {{ confirmText }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean
  confirmText?: string
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
  showConfirmButton?: boolean
  showActions?: boolean
}

interface Emits {
  (_e: 'confirm'): void
  (_e: 'close'): void
  (_e: 'update:visible', _value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  confirmText: '确定',
  closeOnBackdrop: true,
  showCloseButton: true,
  showConfirmButton: true,
  showActions: true,
})

const emit = defineEmits<Emits>()

const onConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
  emit('close')
}

const onClose = () => {
  emit('update:visible', false)
  emit('close')
}

const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    onClose()
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  background: rgba(#333, 0.8);
  border: calc(4 * var(--scale)) solid rgba(#666, 0.8);
  min-width: 80%;
  max-width: 80%;
  width: 80%;
  height: 80%;
  min-height: 80%;
  max-height: 80%;
  color: white;
  position: relative;
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

.modal-content {
  padding: variables.scaled(40) variables.scaled(30) variables.scaled(20);
  height: calc(100% - #{variables.scaled(80)});
  overflow-y: auto;
}

.modal-actions {
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
