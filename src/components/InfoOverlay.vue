<template>
  <BaseModal
    :visible="visible"
    :confirm-text="confirmText"
    :close-on-backdrop="closeOnBackdrop"
    @confirm="onConfirm"
    @close="onClose"
    @update:visible="$emit('update:visible', $event)"
  >
    <h3 v-if="title" class="info-title">{{ title }}</h3>
    <div class="info-message">
      <slot>{{ message }}</slot>
    </div>
    <template #actions>
      <slot name="actions" />
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'

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

withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  message: '',
  confirmText: '确定',
  closeOnBackdrop: true,
})

const emit = defineEmits<Emits>()

const onConfirm = () => {
  emit('confirm')
}

const onClose = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables';

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
</style>
