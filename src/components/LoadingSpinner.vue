<template>
  <div
    v-if="visible"
    class="loading-spinner"
    :style="{
      '--delay': `${delay ?? settings.loadingSpinnerDelay / 1000}s`,
      '--progress': progress !== undefined ? progress : 0.33
    }"
  />
</template>

<script setup lang="ts">
import { useSettings } from '@/composables/useSettings'

const { settings } = useSettings()

interface Props {
  visible?: boolean
  delay?: number
  progress?: number
}

withDefaults(defineProps<Props>(), {
  visible: false,
  size: 'medium'
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.loading-spinner {
  position: absolute;
  width: variables.scaled(25);
  height: variables.scaled(25);
  border-radius: 50%;
  background: conic-gradient(
    transparent 0deg,
    var(--foreground-color) 30deg,
    var(--foreground-color) calc(300deg * (var(--progress, 0.33)) + 30deg),
    transparent calc(300deg * (var(--progress, 0.33)) + 60deg),
    transparent 360deg
  );
  mask-image: radial-gradient(circle at center, transparent 45%, black 46%);
  opacity: 0;
  animation:
    delayed-show 0s linear var(--delay, 0s) forwards,
    spin 1s ease-in-out var(--delay, 0s) infinite;

}

@keyframes delayed-show {
  to {
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.1);
  }
  100% {
    transform: rotate(360deg);
    filter: brightness(1);
  }
}
</style>
