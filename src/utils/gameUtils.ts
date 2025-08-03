import type { BoardMetadata } from '@/types/game'
import { getApiEndpoint } from './endpointUtils'
import { fetchWithValidation } from './fetchUtils'
import { useSettings } from '@/composables/useSettings'

// 创建新游戏的参数接口
export interface CreateGameParams {
  size: string  // 例如 "5x5"
  rules: string // 例如 "V,O"
  mode: string  // 例如 "EXPERT"
  total: string // 总雷数
  u_mode?: string // 可选的终极模式选项
  dye?: string // 可选的染色参数
}

/**
 * 创建新游戏配置
 * @param params 游戏参数
 * @returns Promise<BoardMetadata> 新游戏的元数据
 */
export async function newGame(params: CreateGameParams): Promise<BoardMetadata> {
  try {
    const urlParams = new URLSearchParams({
      size: params.size,
      rules: params.rules,
      mode: params.mode,
      total: params.total,
      u_mode: params.u_mode || '',
      dye: params.dye || ''
    })
    const result = await fetchWithValidation<BoardMetadata>(
      `${getApiEndpoint('new')}?${urlParams.toString()}`
    )
    if (result.error) {
      throw new Error(`Failed to create new game: ${result.error}`)
    }
    return result.data!
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error creating new game'
    throw new Error(errorMessage)
  }
}


export function getGameParams(): CreateGameParams {
  const { settings } = useSettings()

  // 将游戏模式转换为API需要的大写格式
  const modeMap = {
    'normal': 'NORMAL',
    'expert': 'EXPERT',
    'ultimate': 'ULTIMATE'
  } as const

  // 构建游戏尺寸字符串
  const size = `${settings.value.gridWidth}x${settings.value.gridHeight}`

  // 构建规则字符串 - 将启用的规则数组转换为逗号分隔的字符串
  const rules = settings.value.enabledRules.length > 0
    ? settings.value.enabledRules.join(',')
    : 'V,O' // 默认规则

  // 获取游戏模式
  const mode = modeMap[settings.value.gameMode]

  const total = settings.value.mineCount.toString()

  // 构建终极模式选项字符串
  let u_mode: string | undefined
  if (settings.value.gameMode === 'ultimate') {
    const options: string[] = []
    if (settings.value.ultimateModeOptions.autoHint) options.push('+A')
    if (settings.value.ultimateModeOptions.forceFlag) options.push('+F')
    if (settings.value.ultimateModeOptions.showMineCount) options.push('+R')
    if (settings.value.ultimateModeOptions.forceSide) options.push('+S')
    if (settings.value.ultimateModeOptions.hideRemaining) options.push('+!')

    u_mode = options.length > 0 ? options.join(',') : undefined
  }

  return {
    size,
    rules,
    mode,
    total,
    u_mode
  }
}
