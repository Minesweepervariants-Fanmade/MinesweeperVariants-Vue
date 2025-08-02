import type { BoardMetadata } from '@/types/game'
import { getApiEndpoint } from './endpointUtils'
import { fetchWithValidation } from './fetchUtils'

// 创建新游戏的参数接口
export interface CreateGameParams {
  size: string  // 例如 "5x5"
  rules: string // 例如 "V,O"
  mode: string  // 例如 "EXPERT"
}

/**
 * 创建新游戏配置
 * @param params 游戏参数
 * @returns Promise<BoardMetadata> 新游戏的元数据
 */
export async function createNewGame(params: CreateGameParams): Promise<BoardMetadata> {
  try {
    const urlParams = new URLSearchParams({
      size: params.size,
      rules: params.rules,
      mode: params.mode,
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

/**
 * 获取默认游戏参数
 * @returns CreateGameParams 默认参数
 */
export function getDefaultGameParams(): CreateGameParams {
  return {
    size: '5x5',
    rules: 'V,O',
    mode: 'EXPERT'
  }
}
