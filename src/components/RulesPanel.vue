<template>
  <div class="rules">
    <template v-for="item in displayRules" :key="item._idx">
      <RuleLine :ruleCode="item.rule.code" :lit="item.lit" :info="item.info" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import RuleLine from '@/components/RuleLine.vue'
import { useGameConfig } from '@/composables/useGameConfig'
import { useRules } from '@/utils/ruleUtils'

// game config
const { ruleHints } = useGameConfig()

// rules
const { rules } = useRules()

const ruleStates = new Map<string, { lit: Ref<boolean>; info: Ref<string> }>()

const ensureRuleState = (ruleCode: string, idx: number) => {
  const key = `${ruleCode}::${idx}`
  if (!ruleStates.has(key)) {
    ruleStates.set(key, { lit: ref<boolean>(false), info: ref<string>('') })
  }
  return ruleStates.get(key)!
}

const allRules = computed(() => {
  const list: { code: string }[] = []
    list.push({ code: 'R' })

  for (const r of rules.value) {
    list.push({ code: r.code })
  }
  return list
})

const displayRules = computed(() => {
  return allRules.value.map((rule, idx) => {
    if (!ruleHints[rule.code]) {
      ruleHints[rule.code] = { lit: ref<boolean>(false), info: ref<string>('') }
    }

    const shared = ruleHints[rule.code]
    if (shared) {
      return {
        rule,
        lit: shared.lit,
        info: shared.info,
        _idx: idx
      }
    }

    const state = ensureRuleState(rule.code, idx)
    return {
      rule,
      lit: state.lit,
      info: state.info,
      _idx: idx
    }
  })
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.rules {
  @include variables.absolute-position(variables.scaled(20), null, null, variables.scaled(20));
  color: var(--foreground-color);
  font-size: variables.scaled(20);

  .mine-count,
  .remaining {
    color: var(--foreground-color);
    font-weight: bold;
  }
}
</style>
