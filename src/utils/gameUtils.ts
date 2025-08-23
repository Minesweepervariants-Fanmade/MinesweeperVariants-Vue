import { fetchWithoutValidation, getApiEndpoint } from '@/utils/fetchUtils'
import { useSettings } from '@/composables/useSettings'
import typia from 'typia'
import { useGameConfig } from '@/composables/useGameConfig'
import type { BoardMetadata, NewGameResponse } from '@/types/game'

// 创建新游戏的参数接口
export interface CreateGameParams {
  size: string  // 例如 "5x5"
  rules: string // 例如 "V,O"
  mode: string  // 例如 "EXPERT"
  total: string // 总雷数
  u_mode?: string // 可选的终极模式选项
  dye?: string // 可选的染色参数
  mask?: string // 可选的掩码参数
  seed?: string // 可选的种子参数
}

export function generateRandomSeedString(): string {
  return Math.floor(Math.random() * 100000).toString()
}

export async function newGame(params: CreateGameParams): Promise<BoardMetadata | undefined> {
  try {
    const urlParams = new URLSearchParams({
      size: params.size,
      rules: params.rules,
      mode: params.mode,
      total: params.total,
      u_mode: params.u_mode || '',
      dye: params.dye || '',
      mask: params.mask || '',
      seed: params.seed || ''
    })
    const result = await fetchWithoutValidation(
      `${getApiEndpoint('new')}?${urlParams.toString()}`
    )

    if (result.error) {
      throw new Error(`Failed to create new game: ${result.error}`)
    }
    const data = typia.assert<NewGameResponse>(result.data)
    if (!data.success) {
      throw new Error(data.reason || 'Unknown error creating new game')
    }

    if (data.token) {
      window.localStorage.setItem('token', data.token)
      console.log(`Received new token ${data.token}`)
    }

    const { initializeGame } = useGameConfig()
    const { metadata } = await initializeGame() || {}
    return metadata

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error creating new game'
    window.alert(errorMessage)
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

  const rulesArray: string[] = []
  const dyeArray: string[] = []
  const maskArray: string[] = []

  // 构建规则字符串 - 将启用的规则数组转换为逗号分隔的字符串
  for (const rule of settings.value.enabledRules) {
    if (rule.startsWith('@')) {
      dyeArray.push(rule.slice(1))
    } else if (rule.startsWith('&')) {
      maskArray.push(rule.slice(1))
    } else {
      rulesArray.push(rule)
    }
  }
  const rules = rulesArray.join(',')
  const dye = dyeArray.length > 0 ? dyeArray.join(',') : undefined
  const mask = maskArray.length > 0 ? maskArray.join(',') : undefined

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

  let seed = settings.value.seed
  if (!seed) {
    seed = generateRandomSeedString()
  }

  return {
    size,
    rules,
    mode,
    total,
    u_mode,
    dye,
    mask,
    seed
  }
}
