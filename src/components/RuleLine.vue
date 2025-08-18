<template>
  <div
    class="rule-line"
    :style="props.lit?.value ? { 'background': `rgb(from var(--hint2-color) r g b / 40%)` } : undefined"
  >
    <u>[{{ ruleCode }}] {{ get_name(props.ruleCode) }}</u>: &nbsp;{{ get_desc(props.ruleCode) }}
    <span class="rule-info">{{ (props.info?.value ?? '') }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { get_name, get_desc } from '@/utils/ruleUtils'

const props = defineProps<{
  ruleCode: string
  lit?: Ref<boolean>
  info?: Ref<string>
}>()

</script>

<style scoped lang="scss">
@use '@/styles/variables';

.rule-line {
  margin-bottom: variables.scaled(5);

  u {
    text-decoration-thickness: 0;
    text-decoration-color: rgb(from var(--primary-color) r g b / 50%);
  }
}

.rule-info {
  color: var(--hint2-color);
  margin-left: variables.scaled(6);
}
</style>
