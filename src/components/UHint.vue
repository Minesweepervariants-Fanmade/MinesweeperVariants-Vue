<template>
  <div class="u-hint">
    <div class="hint-item">
      <div ref="emptyIcon" class="icon empty" />
      <span class="num">{{ metadata?.u_hint?.emptycount ?? '-' }}</span>
    </div>

    <div class="hint-item">
      <div ref="flagIcon" class="icon flag" />
      <span class="num">{{ metadata?.u_hint?.flagcount ?? '-' }}</span>
    </div>

    <div class="hint-item" :style="{ display: showMark ? 'flex' : 'none' }">
      <div ref="markIcon" class="icon mark" />
      <span class="num">{{ metadata?.u_hint?.markcount ?? '-' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { cloneAsset } from '@/composables/useAssets'

import { useGameConfig } from '@/composables/useGameConfig'

const { metadata } = useGameConfig()

const emptyIcon = ref<HTMLElement | null>(null)
const flagIcon = ref<HTMLElement | null>(null)
const markIcon = ref<HTMLElement | null>(null)

const showMark = computed(() => metadata.value?.u_hint?.markcount !== undefined)

const renderIcon = async (
  container: HTMLElement | null | undefined,
  assetName: 'flag' | 'circle' | 'cross'
) => {
  if (!container) return
  const svg = await cloneAsset(assetName)
  if (!svg) return

  const innerEls = svg.querySelectorAll('.inner')
  innerEls.forEach(el => {
    ;(el as HTMLElement).style.fill = 'currentColor'
  })

  container.appendChild(svg)
}

onMounted(async () => {
  emptyIcon.value!.textContent = '?';
  await renderIcon(flagIcon.value, 'flag')
  await renderIcon(markIcon.value, 'circle')
  await renderIcon(markIcon.value, 'cross')
})

</script>

<style scoped lang="scss">
@use '@/styles/variables';

.u-hint {
  display: flex;
  align-items: center;
  color: var(--foreground-color);
  gap: variables.scaled(5);
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 0;
  font-size: variables.scaled(16);
  font-weight: lighter;
  font-family: sans-serif;
}

.hint-item .icon {
  width: variables.scaled(20);
  height: variables.scaled(20);
  display: inline-block;
  color: var(--foreground-color);
  font-size: variables.scaled(15);
  text-align: center;
}

.icon > * {
  display: block;
  justify-self: center;
}

.mark.icon > * {
  max-width: 50%;
  max-height: 50%;
}

.hint-item:nth-child(1) .icon {
  color: var(--foreground-color);
}

.hint-item:nth-child(2) .icon {
  color: var(--foreground-color);
}

.hint-item:nth-child(3) .icon {
  color: var(--foreground-color);
}
</style>
