<template>
  <div
    v-if="visible"
    class="loading-spinner"
    :class="{ small: size === 'small', large: size === 'large' }"
    :style="{ '--delay': `${delay}s` }"
  />
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean
  size?: 'small' | 'medium' | 'large'
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
  opacity: 0;
  animation:
    delayed-show 0s linear var(--delay, 0s) forwards,
    spin 1s ease-in-out var(--delay, 0s) infinite;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    height: 70%;
    background: var(--background-color);
    border-radius: 50%;
    box-shadow: 0 0 variables.vw-vh-min(0.5, 0.7) rgba(0, 0, 0, 0.1);
  }

  &.small {
    width: variables.vw-vh-min(2, 2.5);
    height: variables.vw-vh-min(2, 2.5);

    &::before {
      box-shadow: 0 0 variables.vw-vh-min(0.3, 0.4) rgba(0, 0, 0, 0.1);
    }
  }

  &.large {
    width: variables.vw-vh-min(5, 6);
    height: variables.vw-vh-min(5, 6);

    &::before {
      box-shadow: 0 0 variables.vw-vh-min(0.8, 1) rgba(0, 0, 0, 0.1);
    }
  }
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
