import { ref, reactive } from 'vue'
import { fetchWithoutValidation, getApiEndpoint } from '@/utils/fetchUtils'
import typia from 'typia'
import { useGameConfig } from '@/composables/useGameConfig'

// 规则类型定义
export type RuleType = 'lRule' | 'mRule' | 'rRule' | 'oRule' | 'dye'

// 规则项类型
export interface RuleItem {
  code: string
  name: string
  desc: string
}

// 规则详细信息类型
export interface RuleDetail {
  code: string
  type: RuleType
  name: string
  description: string
}

// 规则缓存键
export const RULES_STORAGE_KEY = 'minesweeper_rules_cache'

// 规则定义的响应式对象
export const RULE_DEFINITIONS = reactive<Record<string, [RuleType, string, string]>>({})

/**
 * 获取缓存的规则定义
 */
export const getRuleDefinitions = (): Record<string, [RuleType, string, string]> => {
  const cachedRules = localStorage.getItem(RULES_STORAGE_KEY)
  if (cachedRules) {
    try {
      const parsed = JSON.parse(cachedRules)
      if (parsed && typeof parsed === 'object') {
        const definitions: Record<string, [RuleType, string, string]> = {}
        for (const [code, arr] of Object.entries(parsed)) {
          if (Array.isArray(arr) && arr.length >= 3) {
            definitions[code] = arr as [RuleType, string, string]
          }
        }
        return definitions
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return {}
}

/**
 * 应用规则到响应式对象
 */
export function applyRulesToReactive(rules: Record<string, unknown[]>) {
  Object.keys(RULE_DEFINITIONS).forEach(k => delete RULE_DEFINITIONS[k])
  for (const [code, arr] of Object.entries(rules)) {
    if (Array.isArray(arr) && arr.length >= 3) {
      RULE_DEFINITIONS[code] = arr as [RuleType, string, string]
    }
  }
}

type RuleData = { rules?: Record<string, unknown[]>, dye?: Record<string, string> }

function parseRule(rulesData: RuleData): Record<string, unknown[]> {
  const parsed: Record<string, unknown[]> = {}
  if (rulesData.rules) {
    for (const [key, value] of Object.entries(rulesData.rules)) {
      parsed[key] = value
    }
  }
  if (rulesData.dye) {
    for (const [key, value] of Object.entries(rulesData.dye)) {
      parsed[`@${key}`] = [ 'dye', value, value ]
    }
  }
  return parsed
}

/**
 * 从端点获取规则并保存到 localStorage
 */
export const fetchEndpointRules = async (): Promise<void> => {
  try {
    const endpoint = getApiEndpoint('rules')
    const { data, error } = await fetchWithoutValidation(endpoint)
    if (error) {
      throw new Error(`拉取规则失败: ${error}`)
    }
    const rulesData = typia.assert<RuleData>(data)
    const parsedRules = parseRule(rulesData)

    applyRulesToReactive(parsedRules)
    // 保存到 localStorage
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(parsedRules))
  } catch (e) {
    throw new Error(`拉取规则失败: ${e instanceof Error ? e.message : e}`)
  }
}

/**
 * 初始化规则定义（从缓存中加载）
 */
export function initializeRules() {
  const cachedRules = localStorage.getItem(RULES_STORAGE_KEY)
  if (cachedRules) {
    try {
      const parsed = JSON.parse(cachedRules)
      if (parsed && typeof parsed === 'object') {
        applyRulesToReactive(parsed)
      }
    } catch {
      // ignore JSON parse error, fallback to default rules
    }
  }
}

// 全局单例的规则状态
const globalRules = ref<RuleItem[]>([])

// 动态添加规则函数
function addRule(code: string, name: string, desc: string) {
  globalRules.value.push({ code, name, desc })
}

// 处理metadata中的规则
const processMetadataRules = (metadataRules?: string[]) => {
  if (!metadataRules) return

  // 清空现有规则
  globalRules.value.length = 0

  // 获取规则定义
  const ruleDefinitions = getRuleDefinitions()

  // 遍历metadata中的规则列表
  for (const ruleCode of metadataRules) {
    const end = ruleCode.indexOf(':')
    const key = end !== -1 ? ruleCode.slice(0, end) : ruleCode
    const definition = ruleDefinitions[key]


    if (key === 'R') {
      addRule(ruleCode, '总雷数', '')
      return
    }

    if (definition) {
      addRule(ruleCode, definition[1], definition[2])
    } else {
      addRule(ruleCode, '未知规则', '')

    }
  }
}

/**
 * 组合式函数：管理规则状态
 */
export function useRules() {
  return {
    rules: globalRules,
    addRule,
    processMetadataRules
  }
}

// 自动初始化规则
initializeRules()

export function get_name(code: string): string {
  const end = code.indexOf(':')
  const key = end !== -1 ? code.slice(0, end) : code

  if (key === 'R') return '总雷数'
  const def = RULE_DEFINITIONS[key]
  if (def && def.length >= 2) return def[1]
  return '未知规则'
}

export function get_desc(code: string): string {
  const end = code.indexOf(':')
  const key = end !== -1 ? code.slice(0, end) : code

  if (key === 'R') {
    // 使用 game config 中的 metadata 构造描述字符串
    const { metadata } = useGameConfig()
    const known = metadata.value?.count?.known ?? '*'
    const remains = metadata.value?.count?.remains ?? '*'
    const unknown = metadata.value?.count?.unknown ?? '?'
    return `${known} (剩余雷数/格数: ${remains}/${unknown})`
  }

  const def = RULE_DEFINITIONS[key]
  if (def && def.length >= 3) return def[2]
  return ''
}
