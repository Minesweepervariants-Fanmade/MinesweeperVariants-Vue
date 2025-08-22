<template>
  <div
    v-if="visible"
    class="loading-spinner"
    :style="{ '--delay': `${delay}s` }"
  />
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean
  delay?: number
}

withDefaults(defineProps<Props>(), {
  visible: false,
  size: 'medium',
  delay: 0
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.loading-spinner {
  position: absolute;
  width: variables.vw-vh-min(3.5, 4.5);
  height: variables.vw-vh-min(3.5, 4.5);
  border-radius: 50%;
  background: conic-gradient(
    transparent 0deg,
    transparent 60deg,
    var(--foreground-color) 120deg,
    var(--foreground-color) 180deg,
    transparent 240deg,
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
