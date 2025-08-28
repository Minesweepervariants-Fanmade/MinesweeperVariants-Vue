<template>
  <div
    class="rule-line"
    :style="props.lit?.value ? { 'background': `rgb(from var(--hint2-color) r g b / 40%)` } : undefined"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <u>[{{ ruleCode }}] {{ get_name(props.ruleCode) }}</u>
    <span
      v-if="props.lit?.value || settings.showDescription || props.ruleCode == 'R' || hovered"
      class="rule-desc"
    >
      : {{ get_desc(props.ruleCode) }}
    </span>
    <span class="rule-info">{{ (props.info?.value ?? '') }}</span>
  </div>
</template>
<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { get_name, get_desc } from '@/utils/ruleUtils'
import { useSettings } from '@/composables/useSettings';

const { settings } = useSettings()
const props = defineProps<{
  ruleCode: string
  lit?: Ref<boolean>
  info?: Ref<string>
}>()

const hovered = ref(false)

</script>

<style scoped lang="scss">
@use '@/styles/variables';

.rule-line {
  margin-bottom: variables.scaled(5);
  width: max-content;

  u {
    text-decoration-thickness: 0;
    text-decoration-color: rgb(from var(--foreground-color) r g b / 50%);
  }
}

.rule-info {
  color: var(--hint2-color);
  margin-left: variables.scaled(6);
}
</style>
